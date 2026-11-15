import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { inviteGroupMember, leaveGroup, sendMessage } from "./actions";
import { formatDateTime } from "@/lib/dates";
import type { SocialGroup, GroupMember, SocialMessage } from "@/types/social";
import type { AcceptedContact } from "./group-list";
export function GroupPanel({
  group,
  members,
  messages,
  contacts,
  radius,
  hasCursor,
}: {
  group: SocialGroup;
  members: GroupMember[];
  messages: SocialMessage[];
  contacts: AcceptedContact[];
  radius: number;
  hasCursor: boolean;
}) {
  const memberIds = new Set(members.map((member) => member.user_id));
  const available = contacts.filter((contact) => !memberIds.has(contact.id));
  const href = `/dashboard/communities?radius=${radius}&group=${group.id}`;
  return (
    <section className="card stack">
      <h2>{group.name}</h2>
      <p className="muted">
        Members: {members.map((member) => member.display_name).join(", ")}
      </p>
      {available.length > 0 && (
        <details>
          <summary>Add an accepted connection</summary>
          <div className="mt-3">
            <ActionForm
              action={inviteGroupMember}
              label="Add to group"
              confirm="Give this connection access to the group's existing and future messages?"
            >
              <input type="hidden" name="group" value={group.id} />
              <label>
                Connection
                <select name="member">
                  {available.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                    </option>
                  ))}
                </select>
              </label>
            </ActionForm>
          </div>
        </details>
      )}
      <div className="stack" aria-label="Group messages">
        {!messages.length && <p>No messages in this page.</p>}
        {[...messages].reverse().map((message) => (
          <article key={message.id} className="rounded-lg bg-neutral-50 p-3">
            <p className="font-semibold">{message.sender_name}</p>
            <p className="whitespace-pre-wrap break-words">{message.body}</p>
            <p className="muted text-sm">
              {formatDateTime(message.created_at)}
            </p>
          </article>
        ))}
      </div>
      {messages.length === 50 && (
        <Link
          className="text-link"
          href={`${href}&before=${encodeURIComponent(messages[49].created_at)}&cursor=${messages[49].id}`}
        >
          Older messages
        </Link>
      )}
      {hasCursor && (
        <Link className="text-link" href={href}>
          Latest messages
        </Link>
      )}
      <ActionForm action={sendMessage} label="Send message" buttonClassName="primary">
        <input type="hidden" name="group" value={group.id} />
        <label>
          Your message
          <textarea name="body" required maxLength={2000} rows={3} />
        </label>
      </ActionForm>
      <ActionForm
        action={leaveGroup}
        label="Leave group"
        confirm="Leave this group? Your existing messages will remain visible to its members."
      >
        <input type="hidden" name="group" value={group.id} />
      </ActionForm>
    </section>
  );
}
