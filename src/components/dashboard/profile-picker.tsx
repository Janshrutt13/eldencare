import Link from "next/link";
import type { ElderProfile } from "@/types/database";

export function ProfilePicker({
  elders,
  selected,
  path,
}: {
  elders: ElderProfile[];
  selected?: string;
  path: string;
}) {
  return (
    <section className="card stack" style={{ gap: "0.75rem" }}>
      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
        <h2>Healthcare profile</h2>
      </div>
      <p className="text-sm text-neutral-500">
        Select a profile to view care records.
      </p>
      {!elders.length ? (
        <p className="text-sm text-neutral-500">
          No linked healthcare profile.{" "}
          <Link className="text-link" href="/dashboard/access">
            Enter an invitation code
          </Link>
          .
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {elders.map((elder) => (
            <Link
              className={`button ${selected === elder.id ? "primary" : ""}`}
              key={elder.id}
              href={`${path}?elder=${elder.id}`}
            >
              {elder.display_name}
            </Link>
          ))}
        </div>
      )}
      {elders.length > 0 && !selected && (
        <p role="alert" className="text-sm text-neutral-500">
          That profile is unavailable. Choose an authorized profile.
        </p>
      )}
    </section>
  );
}
