import { z } from "zod";
const date = z.iso.date();
export const medicationSchema = z
  .object({
    id: z.union([z.uuid(), z.literal("")]),
    elder_profile_id: z.uuid(),
    name: z.string().trim().min(1).max(120),
    dosage: z.string().trim().min(1).max(300),
    times: z
      .string()
      .transform((value) => [...new Set(value.split(",").map((t) => t.trim()))])
      .pipe(
        z
          .array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/))
          .min(1)
          .max(12),
      ),
    start_date: date,
    end_date: z.union([date, z.literal("")]),
    notes: z.string().trim().max(2000),
  })
  .refine(
    (value) => !value.end_date || value.end_date >= value.start_date,
    "End date cannot be before start date.",
  );
export const appointmentSchema = z.object({
  id: z.union([z.uuid(), z.literal("")]),
  elder_profile_id: z.uuid(),
  doctor_name: z.string().trim().min(1).max(120),
  specialization: z.string().trim().max(120),
  scheduled_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    .transform((value) => `${value}:00+05:30`)
    .pipe(z.iso.datetime({ offset: true })),
  location: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(2000),
});
