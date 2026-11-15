import catalog from "./catalog.json";
import { haversineKm } from "@/features/communities/domain";
import type { DemoPerson } from "@/types/social";
export const DEMO_CENTER = catalog.center;
export const DEMO_ACCOUNTS = catalog.people.map(({ key, name, role }) => ({
  key,
  name,
  role,
}));
export const RADII = [5, 7.5, 10] as const;
export type DiscoveryRadius = (typeof RADII)[number];
export function parseRadius(value?: string): DiscoveryRadius {
  return value === "7.5" ? 7.5 : value === "10" ? 10 : 5;
}
export function demoDistance(person: { latitude: number; longitude: number }) {
  return haversineKm(DEMO_CENTER, person);
}
export function filterDemoPeople<
  T extends { latitude: number; longitude: number },
>(people: T[], radius: number) {
  return people
    .map((person) => ({ ...person, distance_km: demoDistance(person) }))
    .filter((person) => person.distance_km <= radius)
    .sort((a, b) => a.distance_km - b.distance_km);
}
export function previewCompanions(): DemoPerson[] {
  return catalog.people
    .filter((p) => p.role === "elderly" && p.key !== "meera")
    .map((p) => ({
      demo_key: p.key,
      user_id: null,
      display_name: p.name,
      age: p.age,
      role: p.role,
      category: p.category,
      bio: p.bio,
      interests: p.interests,
      latitude: p.latitude,
      longitude: p.longitude,
      availability: p.availability,
      contact_label: `${p.key}@example.invalid`,
    }));
}
