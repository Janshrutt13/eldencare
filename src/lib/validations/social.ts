import { z } from "zod";
export const socialProfileSchema = z.object({
  display_name: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(500),
  interests: z
    .string()
    .transform((value) =>
      value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().max(40)).max(10)),
  latitude: z.coerce
    .number()
    .min(-90)
    .max(90)
    .transform((n) => Math.round(n * 100) / 100),
  longitude: z.coerce
    .number()
    .min(-180)
    .max(180)
    .transform((n) => Math.round(n * 100) / 100),
  discovery_enabled: z.preprocess((value) => value === "on", z.boolean()),
  available_for_calls: z.preprocess((value) => value === "on", z.boolean()),
});
export const requestCallSchema = z.object({
  target_user: z.uuid(),
  preferred_time: z.union([
    z.literal(""),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
      .transform((value) => `${value}:00+05:30`)
      .pipe(z.iso.datetime({ offset: true })),
  ]),
});
