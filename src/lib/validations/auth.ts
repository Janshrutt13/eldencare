import { z } from "zod";

export const roleSchema = z.enum(["elderly", "family", "caretaker"]);
export const credentialsSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(8, "Use at least 8 characters.").max(128),
});
export const signupSchema = credentialsSchema.extend({
  displayName: z.string().trim().min(2).max(80),
  role: roleSchema,
});
export const inviteSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{64}$/, "Enter the complete invitation code."),
});
export const uuidSchema = z.uuid();

export function safeNextPath(value: string | null): string {
  // Only known internal destinations can follow an authentication callback.
  return value === "/dashboard/access" ? value : "/dashboard";
}
