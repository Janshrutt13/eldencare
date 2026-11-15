import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { requestConnection } from "./actions";
import type { SocialProfile, NearbyPerson, Connection } from "@/types/social";
export function NearbyPeople({
  profile,
  people,
  connections,
  radius,
}: {
  profile: SocialProfile | null;
  people: NearbyPerson[];
  connections: Connection[];
  radius: number;
}) {
  return (
    <section className="card stack">
      <h2>People nearby</h2>
      <div className="flex gap-3">
        {[5, 10].map((km) => (
          <Link
            className={`button ${radius === km ? "primary" : ""}`}
            href={`/dashboard/communities?radius=${km}`}
            key={km}
          >
            {km} km
          </Link>
        ))}
      </div>
      {!profile?.discovery_enabled && (
        <p>
          Enable nearby discovery to see and be seen by other opted-in profiles.
        </p>
      )}
      {profile?.discovery_enabled && !people.length && (
        <p>
          No opted-in profiles in this radius. Add fictional demo profiles using
          the seed instructions.
        </p>
      )}
      {people.map((person) => {
        const connection = connections.find(
          (c) =>
            c.requester_id === person.user_id ||
            c.recipient_id === person.user_id,
        );
        const shared = person.interests.filter((i) =>
          profile?.interests.some((m) => m.toLowerCase() === i.toLowerCase()),
        );
        return (
          <article
            className="stack border-t border-neutral-200 pt-4"
            key={person.user_id}
          >
            <h3>
              {person.display_name}
              {person.is_demo ? " · Fictional demo" : ""}
            </h3>
            <p>{person.bio}</p>
            <p className="muted">
              About {person.distance_km} km away ·{" "}
              {person.interests.join(", ") || "No interests listed"}
            </p>
            <p className="text-base">
              Shared interests: {shared.join(", ") || "None listed yet"}
            </p>
            {connection ? (
              <p className="muted">Connection status: {connection.status}</p>
            ) : (
              <ActionForm
                action={requestConnection}
                label="Request connection"
                confirm={`Send a social connection request to ${person.display_name}?`}
              >
                <input
                  type="hidden"
                  name="target_user"
                  value={person.user_id}
                />
              </ActionForm>
            )}
          </article>
        );
      })}
    </section>
  );
}
