import { requireSession } from "@/lib/auth/session";
import { ActionForm } from "@/components/ui/action-form";
import { respondCall } from "@/features/companion-circle/actions";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { ContactCard } from "@/features/companion-circle/contact-card";
import { ContactPreview } from "@/features/companion-circle/contact-preview";
import { DemoAccountHelp } from "@/features/demo/account-help";
import { formatDateTime } from "@/lib/dates";

const callStatusBadge: Record<string, string> = {
  pending: "badge-pending",
  accepted: "badge-taken",
  declined: "badge-skipped",
  cancelled: "badge-skipped",
};

export default async function CirclePage() {
  const { supabase, user } = await requireSession();
  const [contacts, calls, directory] = await Promise.all([
    supabase.rpc("companion_contacts", {}),
    supabase
      .from("companion_call_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("demo_people").select("*").limit(30),
  ]);
  if (contacts.error || calls.error || directory.error)
    throw new Error("Could not load Companion Circle.");
  return (
    <div className="stack !gap-6">
      <div>
        <h1>Companion Circle</h1>
        <p className="text-neutral-500 mt-2 text-base">
          Find someone to talk to, or respond to a call request.
        </p>
      </div>
      <p className="notice">
        Volunteers are fictional demo accounts, not a verified support
        organization or an emergency service. Jitsi opens an external meeting; a
        host may need to sign in.
      </p>
      <Link className="button primary w-fit" href="/dashboard/communities">
        <MapPin size={20} aria-hidden="true" />
        Explore nearby companions on the Jaipur map
      </Link>
      <DemoAccountHelp />
      {(
        [
          ["Family", ["family", "elderly"]],
          ["Caretakers", ["caretaker"]],
          ["Demo volunteers", ["volunteer"]],
        ] as [string, string[]][]
      ).map(([title, roles]) => {
        const group = contacts.data.filter((c) => roles.includes(c.role));
        return (
          <section className="card stack" key={title}>
            <h2>{title}</h2>
            {group.length === 0 && <ContactPreview roles={roles} />}
            <ul className="grid gap-4 md:grid-cols-2">
              {group.map((contact, i) => (
                <li
                  key={contact.user_id}
                  className={`${i > 0 ? "border-t border-neutral-100" : ""}`}
                >
                  <ContactCard
                    contact={contact}
                    demo={directory.data.find(
                      (person) => person.user_id === contact.user_id,
                    )}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <section className="card stack">
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#888"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <h2>Requests and call history</h2>
        </div>
        <hr className="divider" />
        {!calls.data.length && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ccc"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <p className="text-sm text-neutral-500">No calls requested yet.</p>
          </div>
        )}
        <ul className="stack" style={{ gap: "0" }}>
          {calls.data.map((call, i) => (
            <li
              key={call.id}
              className={`stack py-4 ${i > 0 ? "border-t border-neutral-100" : ""}`}
              style={{ gap: "0.5rem" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    {call.requester_name} → {call.recipient_name}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {call.preferred_at
                      ? formatDateTime(call.preferred_at)
                      : "No preferred time"}
                  </p>
                </div>
                <span
                  className={`badge flex-shrink-0 ${callStatusBadge[call.status] ?? "badge-pending"}`}
                >
                  {call.status}
                </span>
              </div>
              {call.status === "pending" && (
                <div className="flex flex-wrap gap-3">
                  {(call.recipient_id === user.id
                    ? ["accepted", "declined"]
                    : ["cancelled"]
                  ).map((decision) => (
                    <ActionForm
                      key={decision}
                      action={respondCall}
                      label={
                        decision === "accepted"
                          ? "Accept call"
                          : decision === "declined"
                            ? "Decline call"
                            : "Cancel request"
                      }
                      buttonClassName={decision === "accepted" ? "primary" : ""}
                    >
                      <input type="hidden" name="id" value={call.id} />
                      <input type="hidden" name="decision" value={decision} />
                    </ActionForm>
                  ))}
                </div>
              )}
              {call.status === "accepted" && call.meeting_url && (
                <a
                  className="button primary w-fit"
                  href={call.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                  Join Jitsi call
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
