import { describe, it, expect } from "vitest";
import { adherence, doseStatus } from "./domain";
const now = Date.parse("2026-11-15T10:00:00Z");
describe("dose status and adherence", () => {
  it("distinguishes unconfirmed from skipped", () => {
    expect(
      doseStatus(
        { scheduled_at: "2026-11-15T09:00:00Z", status: "pending" },
        now,
      ),
    ).toBe("unconfirmed");
    expect(
      doseStatus(
        { scheduled_at: "2026-11-15T09:00:01Z", status: "pending" },
        now,
      ),
    ).toBe("pending");
    expect(
      doseStatus(
        { scheduled_at: "2026-11-14T09:00:00Z", status: "skipped" },
        now,
      ),
    ).toBe("skipped");
  });
  it("excludes future doses from the denominator", () => {
    expect(
      adherence(
        [
          { scheduled_at: "2026-11-15T09:00:00Z", status: "taken" },
          { scheduled_at: "2026-11-15T08:00:00Z", status: "pending" },
          { scheduled_at: "2026-11-16T10:00:00Z", status: "pending" },
        ],
        now,
      ),
    ).toEqual({ due: 2, taken: 1, percent: 50, unconfirmed: 1 });
    expect(adherence([], now).percent).toBeNull();
  });
});
