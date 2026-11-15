import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { inviteGroupMember, leaveGroup } from "./actions";
import { ChatMessages } from "./chat-messages";
import { Initials } from "@/components/ui/initials";
import type { SocialGroup, GroupMember, SocialMessage } from "@/types/social";
import type { AcceptedContact } from "./group-list";
export function GroupPanel({
  group,
  members,
  messages,
  contacts,
  radius,
  hasCursor,
  userId,
}: {
  group: SocialGroup;
  members: GroupMember[];
  messages: SocialMessage[];
  contacts: AcceptedContact[];
  radius: number;
  hasCursor: boolean;
  userId: string;
}) {
  const memberIds = new Set(members.map((member) => member.user_id));
  const available = contacts.filter((contact) => !memberIds.has(contact.id));
  const href = `/dashboard/communities?radius=${radius}&group=${group.id}`;
  return (
    <section className="card stack" id="group-chat">
      <Link
        className="text-link w-fit"
        href={`/dashboard/communities?radius=${radius}#my-groups`}
      >
        Back to groups
      </Link>
      <h2>{group.name}</h2>
      <p>{group.description}</p>
      {group.demo_key && (
        <p className="muted text-sm">
          Fictional demo group · new messages are persisted, not simulated
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {members.map((member) => (
          <span key={member.user_id} title={member.display_name}>
            <Initials name={member.display_name} />
          </span>
        ))}
      </div>
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
      <ChatMessages
        key={group.id}
        groupId={group.id}
        userId={userId}
        messages={messages}
        hasCursor={hasCursor}
      />
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
