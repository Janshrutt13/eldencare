"use server";
import { z } from "zod";
import { getCareContext } from "@/lib/auth/elder";
import { detectIntent, type CompanionReply } from "@/lib/ai/intents";
import { companionConversation } from "@/lib/ai/gemini";
import { localDate, formatDateTime } from "@/lib/dates";
export async function askCompanion(input: unknown): Promise<CompanionReply> {
  const parsed = z
    .object({
      message: z.string().trim().min(1).max(1000),
      elderId: z.uuid().optional(),
    })
    .safeParse(input);
  if (!parsed.success)
    return {
      text: "Please enter a message of 1–1000 characters.",
      unavailable: true,
    };
  const { supabase, elder } = await getCareContext(parsed.data.elderId);
  const intent = detectIntent(parsed.data.message);
  if (intent === "medical")
    return {
      text: "I cannot diagnose symptoms or advise on doses or treatment. Please contact your clinician. If you may be in immediate danger, contact local emergency services or someone nearby.",
      href: "/dashboard/circle",
      label: "Open human support",
    };
  if (intent === "talk")
    return {
      text: "I’m here to listen. You can also ask someone in your Companion Circle for a call. Would you like to open it?",
      href: "/dashboard/circle",
      label: "Open Companion Circle",
    };
  if (intent === "communities")
    return {
      text: "You can explore nearby people who have opted in to discovery. Would you like to open communities?",
      href: "/dashboard/communities",
      label: "Open communities",
    };
  const suffix = elder ? `?elder=${elder.id}` : "";
  if (intent === "schedule")
    return {
      text: "Open the appointment form, enter the details, and confirm with Add appointment. I have not changed any records.",
      href: `/dashboard/appointments${suffix}`,
      label: "Open appointment form",
    };
  if (intent === "medicines" || intent === "appointment") {
    if (!elder)
      return {
        text: "Choose a healthcare profile you are authorized to view first.",
        href: "/dashboard",
        label: "Choose profile",
      };
    if (intent === "medicines") {
      const generated = await supabase.rpc("ensure_doses", {
        target_elder: elder.id,
      });
      if (generated.error)
        return {
          text: "I could not load your schedule. Please try the medicines page.",
          unavailable: true,
        };
      const today = localDate();
      const start = new Date(`${today}T00:00:00+05:30`);
      const end = new Date(start.getTime() + 86400000);
      const { data, error } = await supabase
        .from("medication_doses")
        .select("*")
        .eq("elder_profile_id", elder.id)
        .gte("scheduled_at", start.toISOString())
        .lt("scheduled_at", end.toISOString())
        .order("scheduled_at")
        .limit(50);
      if (error)
        return {
          text: "Your medication records could not be loaded.",
          unavailable: true,
        };
      return {
        text: data.length
          ? `${elder.display_name}'s scheduled doses today:\n${data.map((d) => `${d.medication_name} — ${formatDateTime(d.scheduled_at)}; ${d.status}`).join("\n")}\nThese are stored records, not instructions to take a late or extra dose.`
          : "No scheduled doses are recorded for today.",
        href: `/dashboard/medications${suffix}`,
        label: "Review medicines",
      };
    }
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("elder_profile_id", elder.id)
      .gt("scheduled_at", new Date().toISOString())
      .order("scheduled_at")
      .limit(1);
    if (error)
      return {
        text: "Your appointments could not be loaded.",
        unavailable: true,
      };
    return {
      text: data[0]
        ? `The next recorded appointment is with ${data[0].doctor_name} on ${formatDateTime(data[0].scheduled_at)}, at ${data[0].location}.`
        : "There are no upcoming appointments recorded.",
      href: `/dashboard/appointments${suffix}`,
      label: "Review appointments",
    };
  }
  const usage = await supabase.rpc("consume_usage", { usage_purpose: "ai" });
  if (usage.error || !usage.data)
    return {
      text: "Conversation is temporarily unavailable or the 20-message hourly limit has been reached. Schedule and navigation shortcuts still work.",
      unavailable: true,
    };
  try {
    return { text: await companionConversation(parsed.data.message) };
  } catch {
    return {
      text: "AI conversation is unavailable. You can still check medicines, appointments, or open your Companion Circle using the shortcuts.",
      unavailable: true,
    };
  }
}
