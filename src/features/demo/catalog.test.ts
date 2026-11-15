import { describe, it, expect } from "vitest";
import {
  DEMO_CENTER,
  filterDemoPeople,
  previewCompanions,
  parseRadius,
  demoDistance,
} from "./catalog";
import { haversineKm } from "@/features/communities/domain";
describe("Jaipur map and list dataset", () => {
  it("uses coordinates for all distances and keeps eight companions within 2–10 km", () => {
    const people = previewCompanions();
    expect(people).toHaveLength(8);
    for (const person of people) {
      expect(demoDistance(person)).toBe(haversineKm(DEMO_CENTER, person));
      expect(demoDistance(person)).toBeGreaterThan(2);
      expect(demoDistance(person)).toBeLessThan(10);
      expect(person.user_id).toBeNull();
    }
  });
  it("filters the same ordered dataset for markers and cards at each supported radius", () => {
    const people = previewCompanions();
    expect(filterDemoPeople(people, 5)).toHaveLength(3);
    expect(filterDemoPeople(people, 7.5)).toHaveLength(6);
    expect(filterDemoPeople(people, 10)).toHaveLength(8);
    expect(parseRadius("7.5")).toBe(7.5);
    expect(parseRadius("25")).toBe(5);
  });
});
