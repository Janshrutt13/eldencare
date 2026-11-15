import { describe, expect, it } from "vitest";
import {
  credentialsSchema,
  inviteSchema,
  safeNextPath,
  signupSchema,
} from "./auth";

describe("account input boundaries", () => {
  const valid = {
    email: "mira@example.test",
    password: "fictional-password",
    displayName: "Mira Demo",
    role: "elderly",
  };
  it("accepts each supported registration role", () => {
    for (const role of ["elderly", "family", "caretaker"])
      expect(signupSchema.safeParse({ ...valid, role }).success).toBe(true);
  });
  it("rejects self-registration as a volunteer or administrator", () => {
    for (const role of ["volunteer", "admin", "owner", ""])
      expect(signupSchema.safeParse({ ...valid, role }).success).toBe(false);
  });
  it("rejects blank display names and oversized passwords", () => {
    expect(
      signupSchema.safeParse({ ...valid, displayName: "   " }).success,
    ).toBe(false);
    expect(
      credentialsSchema.safeParse({ ...valid, password: "x".repeat(129) })
        .success,
    ).toBe(false);
  });
  it("rejects malformed emails and short passwords", () => {
    expect(
      credentialsSchema.safeParse({ email: "invalid", password: "12345678" })
        .success,
    ).toBe(false);
    expect(
      credentialsSchema.safeParse({ ...valid, password: "short" }).success,
    ).toBe(false);
  });
});
describe("invitation validation", () => {
  it("accepts the full high-entropy token and trims copied whitespace", () => {
    expect(inviteSchema.parse({ code: ` ${"ab".repeat(32)} ` }).code).toBe(
      "ab".repeat(32),
    );
  });
  it("rejects short, malformed, and oversized codes", () => {
    for (const code of [
      "123456",
      "g".repeat(64),
      "a".repeat(65),
      "",
      "'; drop table profiles;",
    ])
      expect(inviteSchema.safeParse({ code }).success).toBe(false);
  });
});
describe("confirmation redirect allowlist", () => {
  it("allows the care-team screen", () =>
    expect(safeNextPath("/dashboard/access")).toBe("/dashboard/access"));
  it.each([
    null,
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/dashboard/../admin",
    "/dashboard?next=https://evil.test",
  ])("rejects arbitrary destinations: %s", (value) => {
    expect(safeNextPath(value)).toBe("/dashboard");
  });
});
