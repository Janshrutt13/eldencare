import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { createGroup } from "./actions";
import type { SocialGroup, GroupSummary } from "@/types/social";
import { Initials } from "@/components/ui/initials";
import demoGroups from "@/features/demo/groups.json";
export type AcceptedContact = { id: string; name: string };
export function GroupList({
  groups,
  contacts,
  selected,
  radius,
  summaries,
}: {
  groups: SocialGroup[];
  contacts: AcceptedContact[];
  selected?: string;
  radius: number;
  summaries: GroupSummary[];
}) {
  return (
    <section className="card stack" id="my-groups">
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
      {!groups.length && (
        <div className="stack">
          <p>
            No groups joined yet. Create one from an accepted connection, or
            sign in as seeded Meera to try these fictional groups:
          </p>
          {demoGroups.map((group) => (
            <div key={group.key} className="rounded-lg bg-neutral-50 p-3">
              <h3>{group.name}</h3>
              <p>{group.description}</p>
              <p className="muted text-sm">
                Demo preview · membership required to read messages
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {groups.map((group) => {
          const summary = summaries.find((s) => s.id === group.id);
          return (
            <article
              className="rounded-xl border border-neutral-200 p-4 stack"
              key={group.id}
            >
              <Link
                key={group.id}
                className={`button ${group.id === selected ? "primary" : ""}`}
                href={`/dashboard/communities?radius=${radius}&group=${group.id}#group-chat`}
              >
                {group.name}
              </Link>
              <p>{group.description || "A group for friendly conversation."}</p>
              {group.demo_key && (
                <p className="muted text-sm">Fictional demo group</p>
              )}
              <p className="text-base">{group.interests.join(" · ")}</p>
              <p>{summary?.member_count ?? 0} members</p>
              <div className="flex flex-wrap gap-2">
                {summary?.member_names.slice(0, 6).map((name) => (
                  <span key={name} title={name}>
                    <Initials name={name} />
                  </span>
                ))}
              </div>
              <p className="muted text-base line-clamp-2">
                {summary?.recent_message ||
                  "No messages yet. Start a conversation."}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
