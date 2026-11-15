import { requireSession } from "@/lib/auth/session";
import {
  CreateInviteForm,
  RedeemInviteForm,
  RevokeForm,
} from "@/features/caregivers/access-forms";

export default async function AccessPage() {
  const { profile, supabase } = await requireSession();
  if (profile.role !== "elderly")
    return (
      <div className="stack max-w-2xl !gap-6">
        <div>
          <h1>Care team &amp; access</h1>
          <p className="text-neutral-500 mt-2 text-base">
            Manage who can view and support your care.
          </p>
        </div>
        {profile.role === "volunteer" ? (
          <p className="notice">Volunteer accounts cannot access healthcare profiles.</p>
        ) : (
          <>
            <p className="muted">
              Enter the private code shared by an elderly person. The invitation
              must match your account role.
            </p>
            <section className="card">
              <RedeemInviteForm />
            </section>
          </>
        )}
      </div>
    );
  const { data: elder, error } = await supabase
    .from("elder_profiles")
    .select("id")
    .eq("owner_id", profile.id)
    .single();
  if (error || !elder)
    throw new Error("Your healthcare profile could not be loaded.");
  const [teamResult, inviteResult] = await Promise.all([
    supabase.rpc("care_team", { target_elder: elder.id }),
    supabase
      .from("care_invites")
      .select("id, role, expires_at")
      .eq("elder_profile_id", elder.id)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);
  if (teamResult.error || inviteResult.error)
    throw new Error("Care connections could not be loaded.");
  return (
    <div className="stack !gap-6">
      <div>
        <h1>Care team &amp; access</h1>
        <p className="text-neutral-500 mt-2 text-base">
          You control who can view and manage your care. Only share invitations
          with people you trust.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card stack">
          <h2>Invite someone to your care team</h2>
          <p className="muted">
            They need their own signed-in account. Codes expire after 24 hours.
          </p>
          <CreateInviteForm elderId={elder.id} />
        </section>
        <section className="card stack content-start">
          <h2>People with access</h2>
          {!teamResult.data.length && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p className="text-sm text-neutral-500">No one else has access yet.</p>
            </div>
          )}
          <ul className="stack" style={{ gap: "0" }}>
            {teamResult.data.map((member, i) => (
              <li
                key={member.id}
                className={`flex items-center justify-between gap-4 py-4 ${i > 0 ? "border-t border-neutral-100" : ""}`}
              >
                <div>
                  <h3 className="font-semibold">{member.display_name}</h3>
                  <p className="muted capitalize text-sm">{member.role}</p>
                </div>
                <RevokeForm id={member.id} kind="member" />
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="card stack">
        <h2>Active invitations</h2>
        {!inviteResult.data.length && (
          <p className="muted">No active invitations.</p>
        )}
        <ul className="stack" style={{ gap: "0" }}>
          {inviteResult.data.map((invite, i) => (
            <li
              key={invite.id}
              className={`flex flex-wrap items-center justify-between gap-4 py-4 ${i > 0 ? "border-t border-neutral-100" : ""}`}
            >
              <div>
                <p className="capitalize font-semibold">
                  {invite.role} invitation
                </p>
                <p className="muted text-sm">
                  Expires{" "}
                  {new Intl.DateTimeFormat("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: profile.timezone,
                  }).format(new Date(invite.expires_at))}
                </p>
              </div>
              <RevokeForm id={invite.id} kind="invite" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
