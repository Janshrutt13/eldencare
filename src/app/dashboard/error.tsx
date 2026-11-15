"use client";
export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <section className="card stack max-w-lg" role="alert">
      <div className="flex items-start gap-3">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div className="stack" style={{ gap: "0.4rem" }}>
          <h2>Something went wrong</h2>
          <p className="text-sm text-neutral-500">
            We couldn&apos;t load your dashboard. Please try again. If this
            keeps happening, check the Supabase connection and database
            migration.
          </p>
        </div>
      </div>
      <button className="button w-fit" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
