import catalog from "@/features/demo/catalog.json";
import { Initials } from "@/components/ui/initials";
export function ContactPreview({ roles }: { roles: string[] }) {
  return (
    <div className="stack">
      <p className="muted">
        No authorized contacts available in this category. These fictional
        examples become interactive after seeding and signing in as the
        appropriate demo account.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {catalog.people
          .filter((p) => roles.includes(p.role) && p.role !== "elderly")
          .map((person) => (
            <article
              key={person.key}
              className="rounded-lg border border-neutral-200 p-4 stack"
            >
              <div className="flex gap-3 items-center">
                <Initials name={person.name} />
                <div>
                  <h3>{person.name}</h3>
                  <p>{person.category}</p>
                </div>
              </div>
              <p className="muted text-sm">
                Demo preview only · {person.availability}
              </p>
              <p>{person.bio}</p>
              <p className="muted text-sm">
                Fictional contact: {person.key}@example.invalid
              </p>
            </article>
          ))}
      </div>
    </div>
  );
}
