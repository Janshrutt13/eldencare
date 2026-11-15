"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { requestCallSchema } from "@/lib/validations/social";
import type { FormState } from "@/types/forms";
export async function requestCall(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = requestCallSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: "Choose a contact and a valid preferred time." };
  if (
    parsed.data.preferred_time &&
    Date.parse(parsed.data.preferred_time) < Date.now()
  )
    return { error: "Choose a future time." };
  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("request_companion_call", {
    target_user: parsed.data.target_user,
    ...(parsed.data.preferred_time
      ? { preferred_time: parsed.data.preferred_time }
      : {}),
  });
  if (error)
    return {
      error:
        "Could not request a call. The contact may be unavailable or a request is already pending.",
    };
  revalidatePath("/dashboard", "layout");
  return {
    success: "Call requested. A notification was queued for the recipient.",
  };
}
export async function respondCall(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = z
    .object({
      id: z.uuid(),
      decision: z.enum(["accepted", "declined", "cancelled"]),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Invalid call response." };
  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("respond_companion_call", {
    request_id: parsed.data.id,
    decision: parsed.data.decision,
  });
  if (error)
    return { error: "This request is no longer available to respond to." };
  revalidatePath("/dashboard", "layout");
  return { success: `Call ${parsed.data.decision}.` };
}
