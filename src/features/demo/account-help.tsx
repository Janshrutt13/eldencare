import Link from "next/link";
export function DemoAccountHelp() {
  return (
    <details className="rounded-lg border border-neutral-200 p-4">
      <summary>Test both sides with demo accounts</summary>
      <div className="stack mt-3">
        <p>
          Use a separate browser profile or private window to sign in as the
          recipient. Requests are accepted by that authenticated account; no
          responses are simulated.
        </p>
        <p>
          Seeded sign-ins use <code>eldencare-jaipur-NAME@DOMAIN</code> and the
          demo password configured by the project owner. Meera uses NAME{" "}
          <code>meera</code>; Rajesh uses <code>rajesh</code>. Never use real
          patient data.
        </p>
        <Link className="button w-fit" href="/login">
          Open normal sign-in / account picker
        </Link>
        <p className="muted text-sm">
          Signing in to another account in this browser changes the active
          session.
        </p>
      </div>
    </details>
  );
}
