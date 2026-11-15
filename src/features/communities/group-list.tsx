import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { createGroup } from "./actions";
import type { SocialGroup } from "@/types/social";
export type AcceptedContact = { id: string; name: string };
export function GroupList({
  groups,
  contacts,
  selected,
  radius,
}: {
  groups: SocialGroup[];
  contacts: AcceptedContact[];
  selected?: string;
  radius: number;
}) {
  return (
    <section className="card stack">
      <h2>Your groups</h2>
      <p className="muted">
        Groups contain accepted connections. Adding a connection gives them
        access to the group&apos;s message history. Members can leave at any
        time.
      </p>
      {contacts.length > 0 ? (
        <details>
          <summary>Create a group</summary>
          <div className="mt-3">
            <ActionForm action={createGroup} label="Create group">
              <label>
                Group name
                <input name="name" required minLength={2} maxLength={80} />
              </label>
              <label>
                First connection
                <select name="member">
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </ActionForm>
          </div>
        </details>
      ) : (
        <p>Accept a connection before creating a group.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {groups.map((group) => (
          <Link
            key={group.id}
            className={`button ${group.id === selected ? "primary" : ""}`}
            href={`/dashboard/communities?radius=${radius}&group=${group.id}`}
          >
            {group.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
