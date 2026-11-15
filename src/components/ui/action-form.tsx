"use client";
import { useActionState } from "react";
import type { FormState } from "@/types/forms";
import { FormFeedback } from "./form-feedback";

export function ActionForm({
  action,
  children,
  label,
  className = "stack",
  confirm,
  buttonClassName = "",
}: {
  action: (state: FormState, data: FormData) => Promise<FormState>;
  children?: React.ReactNode;
  label: string;
  className?: string;
  confirm?: string;
  buttonClassName?: string;
}) {
  const [state, submit, pending] = useActionState(action, {});
  return (
    <form
      action={submit}
      className={className}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {children}
      <button className={`button ${buttonClassName}`} disabled={pending}>
        {pending ? (
          <span className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" className="animate-spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Please wait…
          </span>
        ) : (
          label
        )}
      </button>
      <FormFeedback state={state} />
    </form>
  );
}
