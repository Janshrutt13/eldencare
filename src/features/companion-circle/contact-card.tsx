import { Phone, CalendarDays, UserRound } from "lucide-react";
import { Initials } from "@/components/ui/initials";
import { ActionForm } from "@/components/ui/action-form";
import { requestCall } from "./actions";
import type { Contact, DemoPerson } from "@/types/social";
export function ContactCard({
  contact,
  demo,
}: {
  contact: Contact;
  demo?: DemoPerson;
}) {
  return (
    <article className="rounded-xl border border-neutral-200 p-4 stack">
      <div className="flex items-center gap-3">
        <Initials name={contact.display_name} />
        <div>
          <h3>{contact.display_name}</h3>
          <p className="muted text-base">{demo?.category || contact.role}</p>
        </div>
      </div>
      {contact.is_demo && (
        <span className="badge w-fit">Fictional demo account</span>
      )}
      <p className="text-base">
        {demo
          ? `Demo availability: ${demo.availability}`
          : "Authorized care connection"}
      </p>
      {demo && (
        <p className="muted text-base break-all">
          Fictional contact: {demo.contact_label}
        </p>
      )}
      <details>
        <summary className="flex items-center gap-2">
          <UserRound size={18} aria-hidden="true" />
          View profile
        </summary>
        <div className="mt-2 stack">
          <p>
            {demo?.bio ||
              "This contact is linked through your authorized care team."}
          </p>
          {demo && (
            <p>
              {demo.age} years · {demo.interests.join(" · ")}
            </p>
          )}
          <p className="muted text-sm">
            Social and volunteer profiles do not expose healthcare records.
          </p>
        </div>
      </details>
      <details>
        <summary className="flex items-center gap-2">
          <Phone size={18} aria-hidden="true" />
          Request or schedule a call
        </summary>
        <div className="mt-3">
          <ActionForm
            action={requestCall}
            label="Send call request"
            confirm={`Request a call with ${contact.display_name}?`}
            buttonClassName="primary"
          >
            <input type="hidden" name="target_user" value={contact.user_id} />
            <label>
              <span className="flex gap-2 items-center">
                <CalendarDays size={18} aria-hidden="true" />
                Preferred time (optional, Asia/Kolkata)
              </span>
              <input name="preferred_time" type="datetime-local" />
            </label>
          </ActionForm>
        </div>
      </details>
    </article>
  );
}
