"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { processNotifications } from "@/lib/email/processor";
import type { FormState } from "@/types/forms";
export async function sendDemoReminder(): Promise<FormState> {
  const { supabase, user } = await requireSession();
  const { error } = await supabase.rpc("queue_demo_notification", {});
  if (error) return { error: "Could not queue the test reminder." };
  try {
    const result = await processNotifications(user.id);
    revalidatePath("/dashboard/notifications");
    return {
      success:
        result.message + " One test reminder is allowed per account per day.",
    };
  } catch {
    return {
      error:
        "The test record was queued, but processing failed. Check the notification list and server configuration.",
    };
  }
}
