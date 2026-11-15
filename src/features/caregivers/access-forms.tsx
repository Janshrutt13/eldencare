"use client";
import { useActionState } from "react";
import { createInvite, redeemInvite, revokeAccess } from "./actions";
import { FormFeedback } from "@/components/ui/form-feedback";

export function CreateInviteForm({ elderId }: { elderId: string }) {
  const [state, action, pending] = useActionState(createInvite, {});
  return (
    <form action={action} className="stack">
      <input type="hidden" name="elderId" value={elderId} />
      <label>
        Invite a
        <select name="role">
          <option value="family">Family member</option>
          <option value="caretaker">Caretaker</option>
        </select>
      </label>
      <button className="button primary" disabled={pending}>
        {pending ? "Creating…" : "Create invitation code"}
      </button>
      <FormFeedback state={state} />
      {state.code && (
        <label>
          Your one-time invitation code
          <textarea
            readOnly
            rows={3}
            value={state.code}
            className="font-mono"
            onFocus={(event) => event.target.select()}
          />
          <span className="muted text-base">
            Copy now. The code cannot be retrieved after leaving this page.
          </span>
        </label>
      )}
    </form>
  );
}
export function RedeemInviteForm() {
  const [state, action, pending] = useActionState(redeemInvite, {});
  return (
    <form action={action} className="stack">
      <label>
        Invitation code
        <textarea
          name="code"
          rows={3}
          required
          maxLength={64}
          minLength={64}
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      <button className="button primary" disabled={pending}>
        {pending ? "Checking…" : "Link healthcare profile"}
      </button>
      <FormFeedback state={state} />
    </form>
  );
}
export function RevokeForm({
  id,
  kind,
}: {
  id: string;
  kind: "member" | "invite";
}) {
  const [state, action, pending] = useActionState(revokeAccess, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="kind" value={kind} />
      <button className="button" disabled={pending}>
        {pending
          ? "Revoking…"
          : kind === "member"
            ? "Revoke access"
            : "Revoke invitation"}
      </button>
      <FormFeedback state={state} />
    </form>
  );
}
