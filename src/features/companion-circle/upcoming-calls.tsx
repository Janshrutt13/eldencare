import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/dates";
export async function UpcomingCalls() {
  const { supabase } = await requireSession();
  const { data, error } = await supabase
    .from("companion_call_requests")
    .select("*")
    .eq("status", "accepted")
    .or(`preferred_at.gte.${new Date().toISOString()},preferred_at.is.null`)
    .order("preferred_at", { ascending: true, nullsFirst: false })
    .limit(5);
  if (error) throw new Error("Could not load accepted calls.");
  return (
    <section className="card stack">
      <h2>Upcoming companion calls</h2>
      {!data.length && (
        <p className="muted">
          No accepted upcoming calls. Request one in Companion Circle.
        </p>
      )}
      {data.map((call) => (
        <article
          key={call.id}
          className="border-t border-neutral-200 pt-3 stack"
        >
          <h3>
            {call.requester_name} → {call.recipient_name}
          </h3>
          <p>
            {call.preferred_at
              ? formatDateTime(call.preferred_at)
              : "Accepted — agree a time with your companion"}
          </p>
          {call.meeting_url && (
            <a
              className="button w-fit"
              href={call.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join accepted call
            </a>
          )}
        </article>
      ))}
      <Link className="text-link w-fit" href="/dashboard/circle">
        View requests and call history
      </Link>
    </section>
  );
}
