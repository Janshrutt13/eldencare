export default function Loading() {
  return (
    <div className="stack !gap-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="stack" style={{ gap: "0.4rem" }}>
        <div className="skeleton h-4 w-40 rounded" />
        <div className="skeleton h-9 w-64 rounded" />
        <div className="skeleton h-5 w-80 rounded" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card stack" style={{ gap: "0.5rem" }}>
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-8 w-16 rounded" />
            <div className="skeleton h-4 w-32 rounded" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="card stack">
            <div className="skeleton h-5 w-40 rounded" />
            <div className="skeleton h-px w-full rounded" />
            {[0, 1, 2].map((j) => (
              <div key={j} className="skeleton h-14 w-full rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
