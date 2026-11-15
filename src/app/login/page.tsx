import Link from "next/link";
import { AuthForm } from "@/features/auth/auth-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmation?: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/setup");
  const { confirmation } = await searchParams;
  return (
    <main
      id="main"
      className="min-h-screen bg-[#f8f8f8] flex items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-md stack">
        <div className="text-center">
          <Link
            href="/"
            className="inline-block text-xl font-bold tracking-tight text-neutral-900 mb-1"
          >
            Elden<span className="text-neutral-400">Care</span>
          </Link>
          <h1 className="text-2xl font-bold mt-3">Welcome back</h1>
          <p className="text-neutral-500 mt-1 text-base">
            Sign in to your care dashboard.
          </p>
        </div>

        {confirmation === "failed" && (
          <div className="notice" role="alert">
            This confirmation link could not be verified. Open the latest email
            in the same browser where you signed up, or try signing in.
          </div>
        )}

        <div className="card">
          <AuthForm
            mode="login"
            demoDomain={
              process.env.DEMO_ACCOUNT_PICKER_ENABLED === "true"
                ? process.env.DEMO_EMAIL_DOMAIN || "eldencare.invalid"
                : undefined
            }
          />
        </div>

        <p className="text-center text-sm text-neutral-500">
          New to EldenCare?{" "}
          <Link
            className="text-link font-semibold text-neutral-900"
            href="/signup"
          >
            Create an account
          </Link>
        </p>
        <p className="text-center text-xs text-neutral-400">
          Hackathon prototype · Use fictional profile details only.
        </p>
      </div>
    </main>
  );
}
