import { ActionForm } from "@/components/ui/action-form";
import { respondConnection } from "./actions";
import { canRespondToConnection } from "./domain";
import type { Connection } from "@/types/social";

export function ConnectionList({
  connections,
  userId,
}: {
  connections: Connection[];
  userId: string;
}) {
  return (
    <section className="card stack">
      <h2>Connection requests</h2>
      {!connections.length && (
        <p className="muted">No requests yet.</p>
      )}
      <ul className="stack" style={{ gap: "0" }}>
        {connections.map((connection, i) => (
          <li
            key={connection.id}
            className={`stack py-3 ${i > 0 ? "border-t border-neutral-100" : ""}`}
            style={{ gap: "0.5rem" }}
          >
            <p className="font-medium text-neutral-800">
              {connection.requester_name} → {connection.recipient_name}{" "}
              <span className="badge badge-pending ml-1">{connection.status}</span>
            </p>
            {canRespondToConnection(connection, userId) && (
              <div className="flex gap-3">
                {["accepted", "declined"].map((decision) => (
                  <ActionForm
                    key={decision}
                    action={respondConnection}
                    label={
                      decision === "accepted"
                        ? "Accept connection"
                        : "Decline connection"
                    }
                    buttonClassName={decision === "accepted" ? "primary" : ""}
                  >
                    <input type="hidden" name="id" value={connection.id} />
                    <input type="hidden" name="decision" value={decision} />
                  </ActionForm>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
