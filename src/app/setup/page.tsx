import Link from "next/link";
export default function SetupPage() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-12 stack">
      <p className="font-bold tracking-tight">EldenCare</p>
      <h1>A little setup before we begin.</h1>
      <p className="muted">
        Your care dashboard needs a Supabase connection. Sign-in and private
        profiles become available once the project is configured.
      </p>
      <section className="card stack">
        <h2>Connect your development project</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li>
            Create a Supabase project dedicated to fictional hackathon data.
          </li>
          <li>
            Run all unapplied SQL migrations in <code>supabase/migrations</code>{" "}
            in filename order using the Supabase SQL editor.
          </li>
          <li>
            Copy <code>.env.example</code> to <code>.env.local</code>. Add your
            project URL and publishable key.
          </li>
          <li>
            Set the Auth Site URL to <code>http://localhost:3000</code> and
            allow <code>http://localhost:3000/auth/callback</code>.
          </li>
          <li>Restart the development server and create your first account.</li>
        </ol>
        <Link href="/login" className="button primary">
          Continue to sign in
        </Link>
      </section>
      <p className="muted text-base">
        Hackathon prototype · Use fictional details only. Full setup and
        verification steps are in README.md.
      </p>
    </main>
  );
}
