import Link from "next/link";
import { UpcomingCalls } from "@/features/companion-circle/upcoming-calls";
import { getCareContext } from "@/lib/auth/elder";
import { ProfilePicker } from "@/components/dashboard/profile-picker";
import { DoseList } from "@/features/medications/dose-list";
import { localDate, formatDateTime } from "@/lib/dates";
import { requestTime } from "@/lib/request-time";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ elder?: string }>;
}) {
  const { elder, elders, supabase, profile, user } = await getCareContext(
    (await searchParams).elder,
  );
  const now = requestTime();
  const today = localDate(new Date(now));
  const start = new Date(`${today}T00:00:00+05:30`);
  const end = new Date(start.getTime() + 86400000);

  const { count: pendingCalls, error: callError } = await supabase
    .from("companion_call_requests")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .eq("status", "pending");
  if (callError) throw new Error("Could not load pending calls.");

  let healthcare: React.ReactNode;
  if (elder) {
    const generated = await supabase.rpc("ensure_doses", {
      target_elder: elder.id,
    });
    if (generated.error)
      throw new Error("Could not prepare your daily schedule.");

    const [doses, appointments, summary, activity] = await Promise.all([
      supabase
        .from("medication_doses")
        .select("*")
        .eq("elder_profile_id", elder.id)
        .gte("scheduled_at", start.toISOString())
        .lt("scheduled_at", end.toISOString())
        .order("scheduled_at")
        .limit(200),
      supabase
        .from("appointments")
        .select("*")
        .eq("elder_profile_id", elder.id)
        .gte("scheduled_at", new Date(now).toISOString())
        .order("scheduled_at")
        .limit(5),
      supabase.rpc("care_summary", { target_elder: elder.id }),
      supabase
        .from("medication_doses")
        .select("*")
        .eq("elder_profile_id", elder.id)
        .not("confirmed_at", "is", null)
        .order("confirmed_at", { ascending: false })
        .limit(5),
    ]);
    if (doses.error || appointments.error || summary.error || activity.error)
      throw new Error("Could not load healthcare records.");

    const due = Number(summary.data[0].due);
    const taken = Number(summary.data[0].taken);
    const skipped = Number(summary.data[0].skipped);
    const unconfirmed = Number(summary.data[0].unconfirmed);

    healthcare = (
      <>
        {/* Adherence stats */}
        <section
          className="grid gap-3 sm:grid-cols-3"
          aria-label="Last seven days adherence"
        >
          <div className="card flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Adherence · 7 days
            </p>
            <p className="text-3xl font-bold tracking-tight text-neutral-900">
              {due ? `${Math.round((taken / due) * 100)}%` : "—"}
            </p>
            <p className="text-sm text-neutral-500">
              {taken} of {due} doses confirmed
            </p>
          </div>
          <div className="card flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Unconfirmed
            </p>
            <p className="text-3xl font-bold tracking-tight text-neutral-900">
              {unconfirmed}
            </p>
            <p className="text-sm text-neutral-500">
              Overdue · no confirmation after 60 min
            </p>
          </div>
          <div className="card flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Not taken
            </p>
            <p className="text-3xl font-bold tracking-tight text-neutral-900">
              {skipped}
            </p>
            <p className="text-sm text-neutral-500">Recorded as skipped</p>
          </div>
        </section>

        {/* Medicines + Appointments */}
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="card stack content-start">
            <div className="flex items-center justify-between gap-3">
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
                  <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" />
                </svg>
                <h2>Today&apos;s medicines</h2>
              </div>
              <Link
                className="button text-sm"
                href={`/dashboard/medications?elder=${elder.id}`}
              >
                Manage
              </Link>
            </div>
            <hr className="divider" />
            <DoseList doses={doses.data} now={now} />
          </section>

          <section className="card stack content-start">
            <div className="flex items-center justify-between gap-3">
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
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <h2>Upcoming appointments</h2>
              </div>
              <Link
                className="button text-sm"
                href={`/dashboard/appointments?elder=${elder.id}`}
              >
                Manage
              </Link>
            </div>
            <hr className="divider" />
            {!appointments.data.length && (
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
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <p className="text-sm text-neutral-500">
                  No upcoming appointments.
                </p>
              </div>
            )}
            <ul className="stack" style={{ gap: "0" }}>
              {appointments.data.map((a, i) => (
                <li
                  key={a.id}
                  className={`stack py-4 ${i > 0 ? "border-t border-neutral-100" : ""}`}
                  style={{ gap: "0.25rem" }}
                >
                  <h3 className="font-semibold text-neutral-900">
                    {a.doctor_name}
                  </h3>
                  {a.specialization && (
                    <p className="text-sm text-neutral-500">
                      {a.specialization}
                    </p>
                  )}
                  <p className="text-sm font-medium text-neutral-800">
                    {formatDateTime(a.scheduled_at)}
                  </p>
                  <p className="text-sm text-neutral-500 break-words">
                    {a.location}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Recent activity */}
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
            <h2>Recent activity</h2>
          </div>
          <hr className="divider" />
          {!activity.data.length && (
            <p className="text-sm text-neutral-500">
              No dose confirmations recorded yet.
            </p>
          )}
          <ul className="stack" style={{ gap: "0" }}>
            {activity.data.map((d, i) => (
              <li
                key={d.id}
                className={`flex items-center justify-between gap-3 py-3 text-sm ${i > 0 ? "border-t border-neutral-100" : ""}`}
              >
                <span className="font-medium text-neutral-800">
                  {d.medication_name}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`badge ${d.status === "taken" ? "badge-taken" : "badge-skipped"}`}
                  >
                    {d.status}
                  </span>
                  <span className="text-neutral-400 text-xs">
                    {formatDateTime(d.confirmed_at!)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </>
    );
  }

  return (
    <div className="stack !gap-6">
      {/* Greeting */}
      <div className="card">
        <p className="text-sm text-neutral-400 mb-1">
          {new Intl.DateTimeFormat("en-IN", {
            dateStyle: "full",
            timeZone: profile.timezone,
          }).format(new Date(now))}
        </p>
        <h1>Hello, {profile.display_name}.</h1>
        <p className="text-neutral-500 mt-2 text-base">
          Your daily care and the people who support you, in one place.
        </p>
      </div>

      {profile.role !== "volunteer" && (
        <ProfilePicker elders={elders} selected={elder?.id} path="/dashboard" />
      )}

      {healthcare}
      <UpcomingCalls />

      {/* Stay connected */}
      <section className="card stack">
        <div className="flex items-center justify-between gap-3">
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
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <h2>Stay connected</h2>
          </div>
          {(pendingCalls ?? 0) > 0 && (
            <span className="badge badge-unconfirmed">
              {pendingCalls} pending call{pendingCalls !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <hr className="divider" />
        <div className="flex flex-wrap gap-3">
          <Link className="button primary" href="/dashboard/circle">
            Companion Circle
          </Link>
          <Link className="button" href="/dashboard/communities">
            Nearby communities
          </Link>
        </div>
      </section>
    </div>
  );
}
