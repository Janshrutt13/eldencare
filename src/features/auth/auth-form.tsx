"use client";
import { useActionState, useState } from "react";
import { DEMO_ACCOUNTS } from "@/features/demo/catalog";
import { signIn, signUp } from "./actions";
import { FormFeedback } from "@/components/ui/form-feedback";

export function AuthForm({
  mode,
  demoDomain,
}: {
  mode: "login" | "signup";
  demoDomain?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, action, pending] = useActionState(
    mode === "login" ? signIn : signUp,
    {},
  );
  return (
    <form action={action} className="stack">
      {mode === "login" && demoDomain && (
        <div className="notice stack">
          <label>
            Fictional test account
            <select
              defaultValue=""
              onChange={(event) => {
                if (event.target.value)
                  setEmail(
                    `eldencare-jaipur-${event.target.value}@${demoDomain}`,
                  );
              }}
            >
              <option value="">Choose a seeded demo account</option>
              {DEMO_ACCOUNTS.map((person) => (
                <option key={person.key} value={person.key}>
                  {person.name} · {person.role}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm">
            This only fills the email. Enter the project owner&apos;s demo
            password to sign in through Supabase. It does not bypass
            authentication.
          </p>
        </div>
      )}
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
          value={email}
          onChange={(event) => setEmail(event.target.value)}
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
