import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/features/auth/auth-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function SignupPage() {
  if (!isSupabaseConfigured()) redirect("/setup");
  return (
    <main id="main" className="min-h-screen bg-[#f8f8f8] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md stack">
        <div className="text-center">
          <Link href="/" className="inline-block text-xl font-bold tracking-tight text-neutral-900 mb-1">
            Elden<span className="text-neutral-400">Care</span>
          </Link>
          <h1 className="text-2xl font-bold mt-3">Care starts here</h1>
          <p className="text-neutral-500 mt-1 text-base">
            Create your account. Connect with your care team afterward.
          </p>
        </div>

        <div className="card">
          <AuthForm mode="signup" />
        </div>

        <p className="text-center text-sm text-neutral-500">
          Already registered?{" "}
          <Link className="text-link font-semibold text-neutral-900" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
