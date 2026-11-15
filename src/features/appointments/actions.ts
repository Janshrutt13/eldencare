"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { appointmentSchema } from "@/lib/validations/healthcare";
import type { FormState } from "@/types/forms";
export async function saveAppointment(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = appointmentSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { supabase } = await requireSession();
  const { id, ...values } = parsed.data;
  const result = id
    ? await supabase
        .from("appointments")
        .update(values)
        .eq("id", id)
        .eq("elder_profile_id", values.elder_profile_id)
        .select("id")
    : await supabase.from("appointments").insert(values).select("id");
  if (result.error || !result.data?.length)
    return {
      error:
        "Appointment could not be saved. Check your access and the entered details.",
    };
  revalidatePath("/dashboard", "layout");
  return { success: "Appointment saved." };
}
export async function deleteAppointment(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) return { error: "Invalid appointment." };
  const { supabase } = await requireSession();
  const { data, error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id.data)
    .select("id");
  if (error || !data?.length)
    return { error: "Appointment could not be deleted." };
  revalidatePath("/dashboard", "layout");
  return { success: "Appointment deleted." };
}
