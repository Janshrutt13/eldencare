import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="min-h-screen bg-[#f8f8f8] flex items-center justify-center px-4">
      <div className="text-center stack" style={{ gap: "1.25rem" }}>
        <p className="text-6xl font-bold text-neutral-200">404</p>
        <div>
          <h1 className="text-2xl font-bold">Page not found</h1>
          <p className="text-neutral-500 mt-1">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
        <Link className="button primary w-fit mx-auto" href="/dashboard">
          Go to your dashboard
        </Link>
      </div>
    </main>
  );
}
