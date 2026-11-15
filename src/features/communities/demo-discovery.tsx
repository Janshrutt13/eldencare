"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MapPin } from "lucide-react";
import {
  DEMO_CENTER,
  RADII,
  filterDemoPeople,
  previewCompanions,
} from "@/features/demo/catalog";
import { Initials } from "@/components/ui/initials";
import { ActionForm } from "@/components/ui/action-form";
import { requestConnection } from "./actions";
import type { DemoPerson, Connection } from "@/types/social";

const CompanionMap = dynamic(() => import("./companion-map"), {
  ssr: false,
  loading: () => (
    <p className="notice" role="status">
      Loading the demo map…
    </p>
  ),
});
export function DemoDiscovery({
  people,
  connections,
  radius,
  canConnect,
  seeded,
}: {
  people: DemoPerson[];
  connections: Connection[];
  radius: number;
  canConnect: boolean;
  seeded: boolean;
}) {
  const params = useSearchParams();
  const visible = filterDemoPeople(
    seeded ? people : previewCompanions(),
    radius,
  );
  function viewProfile(key: string) {
    const card = document.getElementById(`demo-person-${key}`);
    card?.scrollIntoView({ behavior: "instant", block: "center" });
    card?.focus({ preventScroll: true });
  }
  return (
    <section className="card stack" aria-labelledby="demo-discovery-title">
      <h2 id="demo-discovery-title" className="flex items-center gap-2">
        <MapPin size={22} aria-hidden="true" />
        Nearby companions in Jaipur
      </h2>
      <p className="notice">
        Fictional demo locations only. Distances are measured from the Jaipur
        demo center, not your location. No GPS is requested. Availability is
        sample data, not a live presence indicator.
      </p>
      {!seeded && (
        <p role="status">
          Preview only: run the demo seed to create authenticated accounts and
          enable connection requests.
        </p>
      )}
      <nav className="flex flex-wrap gap-2" aria-label="Demo discovery radius">
        {RADII.map((km) => {
          const query = new URLSearchParams(params.toString());
          query.set("radius", String(km));
          return (
            <Link
              key={km}
              href={`/dashboard/communities?${query}`}
              scroll={false}
              className={`button ${radius === km ? "primary" : ""}`}
              aria-current={radius === km ? "true" : undefined}
            >
              {km} km
            </Link>
          );
        })}
      </nav>
      <p className="muted">
        {DEMO_CENTER.label} · {visible.length} companions within {radius} km
      </p>
      <CompanionMap people={visible} radius={radius} onView={viewProfile} />
      {!visible.length && (
        <p>
          No discoverable demo companions in this radius. Try a larger radius.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((person) => {
          const connection = connections.find(
            (c) =>
              c.requester_id === person.user_id ||
              c.recipient_id === person.user_id,
          );
          return (
            <article
              tabIndex={-1}
              id={`demo-person-${person.demo_key}`}
              className="rounded-xl border border-neutral-200 p-4 stack"
              key={person.demo_key}
            >
              <div className="flex items-center gap-3">
                <Initials name={person.display_name} />
                <div>
                  <h3>
                    {person.display_name}, {person.age}
                  </h3>
                  <p className="muted text-sm">
                    Fictional demo · {person.distance_km.toFixed(1)} km away
                  </p>
                </div>
              </div>
              <p>{person.bio}</p>
              <p className="text-base">{person.interests.join(" · ")}</p>
              <p className="muted text-base">
                Demo availability: {person.availability}
              </p>
              {connection ? (
                <p className="badge w-fit">Connection: {connection.status}</p>
              ) : person.user_id && canConnect ? (
                <ActionForm
                  action={requestConnection}
                  label="Connect"
                  confirm={`Send a connection request to ${person.display_name}?`}
                >
                  <input
                    type="hidden"
                    name="target_user"
                    value={person.user_id}
                  />
                </ActionForm>
              ) : (
                <p className="muted text-sm">
                  {person.user_id
                    ? "Enable discovery in your social preferences to connect."
                    : "Seed this demo account to connect."}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
