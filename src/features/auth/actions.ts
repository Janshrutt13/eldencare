"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { credentialsSchema, signupSchema } from "@/lib/validations/auth";
import type { FormState } from "@/types/forms";

export async function signIn(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = credentialsSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error: "Enter a valid email and a password of at least 8 characters.",
    };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error)
    return {
      error:
        "Could not sign in. Check your email and password, and confirm your email first.",
    };
  redirect("/dashboard");
}

export async function signUp(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const origin = process.env.NEXT_PUBLIC_SITE_URL;
  if (!origin)
    return {
      error:
        "The app's confirmation URL has not been configured. Contact the project owner.",
    };
  const { email, password, displayName, role } = parsed.data;
  const supabase = await createClient();
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName, role },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error)
    return {
      error:
        "Unable to create an account. Try again later or sign in if you already registered.",
    };
  if (data.session) redirect("/dashboard");
  return {
    success:
      "Check your email for a confirmation link. If you already have an account, sign in.",
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Could not sign out. Please try again.");
  redirect("/login");
}
