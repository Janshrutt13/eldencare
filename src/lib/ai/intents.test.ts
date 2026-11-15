import { expect, it } from "vitest";
import { detectIntent } from "./intents";
it("routes explicit supported actions without AI writes", () => {
  expect(detectIntent("Schedule an appointment.")).toBe("schedule");
  expect(detectIntent("What medicines do I have today?")).toBe("medicines");
  expect(detectIntent("Should I take an extra dose?")).toBe("medical");
  expect(detectIntent("I am lonely")).toBe("talk");
  expect(detectIntent("Show nearby communities")).toBe("communities");
});
