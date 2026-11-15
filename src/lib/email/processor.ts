import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificationKey, notificationText } from "./domain";

function windowMinutes(
  value: string | undefined,
  fallback: number,
  max: number,
) {
  const parsed = z.coerce.number().int().min(1).max(max).safeParse(value);
  return parsed.success ? parsed.data : fallback;
}
export async function processNotifications(onlyRecipient?: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return {
      sent: 0,
      failed: 0,
      pending: true,
      message: "Delivery is not configured; queued records remain pending.",
    };
  const admin = createAdminClient();
  if (!onlyRecipient) {
    const { error } = await admin.rpc("queue_reminders", {
      upcoming_minutes: windowMinutes(
        process.env.REMINDER_UPCOMING_MINUTES,
        30,
        1440,
      ),
      overdue_minutes: windowMinutes(
        process.env.REMINDER_OVERDUE_MINUTES,
        60,
        1440,
      ),
      appointment_minutes: windowMinutes(
        process.env.REMINDER_APPOINTMENT_MINUTES,
        1440,
        10080,
      ),
    });
    if (error) throw new Error("Could not queue reminders.");
  }
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL)
    return {
      sent: 0,
      failed: 0,
      pending: true,
      message: "Resend is not configured; queued records remain pending.",
    };
  const { data: jobs, error } = await admin.rpc(
    "claim_notifications",
    onlyRecipient ? { only_recipient: onlyRecipient } : {},
  );
  if (error) throw new Error("Could not claim reminders.");
  let sent = 0,
    failed = 0;
  for (const job of jobs) {
    try {
      const { data, error: userError } = await admin.auth.admin.getUserById(
        job.recipient_id,
      );
      if (userError || !data.user?.email || !data.user.email_confirmed_at)
        throw new Error("Recipient email unavailable or unconfirmed.");
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        signal: AbortSignal.timeout(10000),
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": notificationKey(job.id),
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL,
          to: [data.user.email],
          subject: "EldenCare reminder",
          text: notificationText[job.kind],
        }),
      });
      if (!response.ok)
        throw new Error(`Email provider returned ${response.status}.`);
      const payload = z.object({ id: z.string() }).parse(await response.json());
      const result = await admin
        .from("notifications")
        .update({
          status: "sent",
          provider_id: payload.id,
          sent_at: new Date().toISOString(),
          locked_until: null,
          last_error: null,
        })
        .eq("id", job.id)
        .eq("claim_token", job.claim_token!);
      if (result.error)
        throw new Error(
          "Provider accepted email but delivery record update failed.",
        );
      sent++;
    } catch (error) {
      failed++;
      // Keep the same idempotency key on retries, including timeout/unknown responses.
      await admin
        .from("notifications")
        .update({
          status: "failed",
          last_error:
            error instanceof Error ? error.message : "Delivery failed",
          locked_until: new Date(Date.now() + 300000).toISOString(),
        })
        .eq("id", job.id)
        .eq("claim_token", job.claim_token!);
    }
  }
  return {
    sent,
    failed,
    pending: false,
    message: `${sent} accepted by the email provider; ${failed} failed. Provider acceptance is not confirmation of inbox delivery.`,
  };
}
