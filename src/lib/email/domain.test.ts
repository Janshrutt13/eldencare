import { expect, it } from "vitest";
import { notificationKey, canRetryDelivery } from "./domain";
it("keeps retry keys stable and stops before the provider deduplication window expires", () => {
  expect(notificationKey("a")).toBe(notificationKey("a"));
  expect(notificationKey("a")).not.toBe(notificationKey("b"));
  const start = "2026-11-15T00:00:00Z";
  expect(canRetryDelivery(start, Date.parse(start) + 22 * 3600000)).toBe(true);
  expect(canRetryDelivery(start, Date.parse(start) + 23 * 3600000)).toBe(false);
});
