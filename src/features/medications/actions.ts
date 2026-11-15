"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { medicationSchema } from "@/lib/validations/healthcare";
import type { FormState } from "@/types/forms";

export async function saveMedication(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = medicationSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("save_medication", {
    payload: parsed.data,
  });
  if (error)
    return {
      error:
        "Medication could not be saved. Check your access and entered values.",
    };
  revalidatePath("/dashboard", "layout");
  return { success: "Medication schedule saved." };
}
export async function removeMedication(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) return { error: "Invalid medication." };
  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("remove_medication", {
    target_medication: id.data,
  });
  if (error) return { error: "Medication could not be removed." };
  revalidatePath("/dashboard", "layout");
  return { success: "Schedule removed. Past dose records have been kept." };
}
export async function confirmDose(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = z
    .object({ id: z.uuid(), status: z.enum(["taken", "skipped"]) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Invalid dose confirmation." };
  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("confirm_dose", {
    target_dose: parsed.data.id,
    new_status: parsed.data.status,
  });
  if (error)
    return {
      error:
        "Could not update this dose. It may not be due yet, or access may have changed.",
    };
  revalidatePath("/dashboard", "layout");
  return { success: "Dose record updated." };
}
