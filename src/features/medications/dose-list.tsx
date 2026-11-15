import type { Dose } from "@/types/healthcare";
import { doseStatus } from "./domain";
import { formatDateTime } from "@/lib/dates";
import { ActionForm } from "@/components/ui/action-form";
import { confirmDose } from "./actions";

const statusLabel: Record<string, string> = {
  taken: "Taken",
  skipped: "Not taken",
  pending: "Pending",
  unconfirmed: "Overdue — unconfirmed",
};

const statusBadge: Record<string, string> = {
  taken: "badge-taken",
  skipped: "badge-skipped",
  pending: "badge-pending",
  unconfirmed: "badge-unconfirmed",
};

export function DoseList({ doses, now }: { doses: Dose[]; now: number }) {
  if (!doses.length)
    return (
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
          <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" />
        </svg>
        <p className="text-sm text-neutral-500">No scheduled doses for this period.</p>
      </div>
    );
  return (
    <ul className="stack" style={{ gap: "0" }}>
      {doses.map((dose, i) => {
        const status = doseStatus(dose, now);
        const isDue = Date.parse(dose.scheduled_at) <= now;
        return (
          <li
            key={dose.id}
            className={`stack py-4 ${i > 0 ? "border-t border-neutral-100" : ""}`}
            style={{ gap: "0.65rem" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="stack" style={{ gap: "0.2rem" }}>
                <h3 className="text-base font-semibold text-neutral-900">
                  {dose.medication_name}
                </h3>
                <p className="text-sm text-neutral-500">{dose.dosage}</p>
                <p className="text-sm text-neutral-400">
                  {formatDateTime(dose.scheduled_at)}
                </p>
              </div>
              <span
                className={`badge ${statusBadge[status] ?? "badge-pending"} flex-shrink-0 mt-0.5`}
              >
                {statusLabel[status] ?? status}
              </span>
            </div>

            {isDue && (
              <div className="flex flex-wrap gap-2">
                {(["taken", "skipped"] as const)
                  .filter((s) => s !== dose.status)
                  .map((s) => (
                    <ActionForm
                      action={confirmDose}
                      label={s === "taken" ? "Mark as taken" : "Mark as not taken"}
                      key={s}
                      confirm={
                        s === "skipped"
                          ? "Record that this dose was not taken?"
                          : undefined
                      }
                      className=""
                      buttonClassName={s === "taken" ? "primary" : ""}
                    >
                      <input type="hidden" name="id" value={dose.id} />
                      <input type="hidden" name="status" value={s} />
                    </ActionForm>
                  ))}
              </div>
            )}

            {dose.confirmed_at && (
              <p className="text-xs text-neutral-400">
                Recorded {formatDateTime(dose.confirmed_at)}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
