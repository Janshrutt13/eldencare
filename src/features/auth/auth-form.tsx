"use client";
import { useActionState } from "react";
import { signIn, signUp } from "./actions";
import { FormFeedback } from "@/components/ui/form-feedback";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, action, pending] = useActionState(
    mode === "login" ? signIn : signUp,
    {},
  );
  return (
    <form action={action} className="stack">
      {mode === "signup" && (
        <>
          <label>
            Your name
            <input
              name="displayName"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
              placeholder="e.g. Mira Demo"
            />
          </label>
          <label>
            I am a
            <select name="role" defaultValue="elderly">
              <option value="elderly">Elderly user</option>
              <option value="family">Family member</option>
              <option value="caretaker">Caretaker</option>
            </select>
          </label>
          <p className="muted text-base">
            Family members and caretakers need an invitation to access
            someone&apos;s healthcare profile.
          </p>
        </>
      )}
      <label>
        Email address
        <input
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={8}
          maxLength={128}
          required
        />
      </label>
      {mode === "signup" && (
        <p className="muted text-base">
          Use at least 8 characters. Use fictional profile details for this
          prototype.
        </p>
      )}
      <FormFeedback state={state} />
      <button className="button primary" disabled={pending}>
        {pending
          ? "Please wait…"
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </button>
    </form>
  );
}
