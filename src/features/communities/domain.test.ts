import { describe, it, expect } from "vitest";
import { haversineKm, withinRadius, canRespondToConnection } from "./domain";
describe("nearby discovery", () => {
  it("computes known distances and radius boundaries", () => {
    expect(
      haversineKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }),
    ).toBeCloseTo(111.195, 2);
    expect(
      haversineKm(
        { latitude: 12.97, longitude: 77.59 },
        { latitude: 12.97, longitude: 77.59 },
      ),
    ).toBe(0);
    expect(withinRadius(5, 5)).toBe(true);
    expect(withinRadius(5.01, 5)).toBe(false);
    expect(withinRadius(5.01, 10)).toBe(true);
    expect(withinRadius(NaN, 10)).toBe(false);
  });
  it("only allows a recipient to answer a pending connection", () => {
    expect(
      canRespondToConnection({ recipient_id: "b", status: "pending" }, "a"),
    ).toBe(false);
    expect(
      canRespondToConnection({ recipient_id: "b", status: "accepted" }, "b"),
    ).toBe(false);
    expect(
      canRespondToConnection({ recipient_id: "b", status: "pending" }, "b"),
    ).toBe(true);
  });
});
