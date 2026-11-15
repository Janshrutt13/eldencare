import type { FormState } from "@/types/forms";

export function FormFeedback({ state }: { state: FormState }) {
  if (!state.error && !state.success) return null;
  return (
    <div aria-live="polite" aria-atomic="true">
      {state.error && (
        <div role="alert" className="flex items-start gap-2 notice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm"><strong>Please check:</strong> {state.error}</p>
        </div>
      )}
      {state.success && (
        <div className="flex items-start gap-2 notice" style={{ background: "#f0faf0", borderColor: "#b8e0be" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a6b2a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0 mt-0.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p className="text-sm text-green-800">{state.success}</p>
        </div>
      )}
    </div>
  );
}
