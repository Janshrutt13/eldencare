import { requireSession } from "@/lib/auth/session";
import { ActionForm } from "@/components/ui/action-form";
import { sendDemoReminder } from "@/features/notifications/actions";
import { formatDateTime } from "@/lib/dates";

const statusBadge: Record<string, string> = {
  sent: "badge-taken",
  pending: "badge-pending",
  failed: "badge-skipped",
};

export default async function NotificationsPage() {
  const { supabase } = await requireSession();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error("Could not load reminders.");
  const configured = Boolean(
    process.env.RESEND_API_KEY &&
    process.env.RESEND_FROM_EMAIL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  return (
    <div className="stack !gap-6">
      <div>
        <h1>Reminders</h1>
        <p className="text-neutral-500 mt-2 text-base">
          Reminder emails contain a brief prompt to sign in, without medication
          names or other medical details.
        </p>
      </div>
      {!configured && (
        <p className="notice">
          Development delivery status: email delivery is not configured. Records
          remain pending; no email is claimed as sent.
        </p>
      )}
      <section className="card stack">
        <h2>Test a fictional reminder</h2>
        <p className="muted">
          Queues a test reminder to your own confirmed account email, at most
          once per day.
        </p>
        <ActionForm
          action={sendDemoReminder}
          label="Queue and process my test reminder"
          buttonClassName="primary w-fit"
        />
      </section>
      <section className="card stack">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <h2>Recent notifications</h2>
        </div>
        <hr className="divider" />
        {!data.length && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p className="text-sm text-neutral-500">No notifications yet.</p>
          </div>
        )}
        <ul className="stack" style={{ gap: "0" }}>
          {data.map((item, i) => (
            <li
              key={item.id}
              className={`flex items-start justify-between gap-3 py-3 ${i > 0 ? "border-t border-neutral-100" : ""}`}
            >
              <div>
                <p className="font-semibold capitalize">
                  {item.kind.replaceAll("_", " ")}
                </p>
                <p className="muted text-sm">{formatDateTime(item.created_at)}</p>
                {item.last_error && (
                  <p className="text-sm text-neutral-600 mt-1">{item.last_error}</p>
                )}
              </div>
              <span className={`badge flex-shrink-0 ${statusBadge[item.status] ?? "badge-pending"}`}>
                {item.status === "sent" ? "accepted" : item.status}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
