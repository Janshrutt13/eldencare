"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { socialProfileSchema } from "@/lib/validations/social";
import type { FormState } from "@/types/forms";
function saved(message: string): FormState {
  revalidatePath("/dashboard/communities", "layout");
  return { success: message };
}
export async function saveSocialProfile(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = socialProfileSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("save_social_profile", {
    payload: parsed.data,
  });
  return error
    ? { error: "Could not save your social profile." }
    : saved("Social preferences saved.");
}
export async function requestConnection(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const id = z.uuid().safeParse(form.get("target_user"));
  if (!id.success) return { error: "Invalid person." };
  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("request_connection", {
    target_user: id.data,
  });
  return error
    ? {
        error:
          "Could not request a connection. A request may already exist, or discovery is no longer enabled.",
      }
    : saved("Connection request sent.");
}
export async function removeConnection(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) return { error: "Invalid connection." };
  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("remove_connection", {
    request_id: id.data,
  });
  return error
    ? { error: "This connection is unavailable or belongs to another account." }
    : saved(
        "Connection removed. Shared groups remain separate; leave any group you no longer want to join.",
      );
}
export async function respondConnection(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = z
    .object({ id: z.uuid(), decision: z.enum(["accepted", "declined"]) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Invalid response." };
  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("respond_connection", {
    request_id: parsed.data.id,
    decision: parsed.data.decision,
  });
  return error
    ? { error: "Only the recipient can respond to a pending request." }
    : saved(`Connection ${parsed.data.decision}.`);
}
export async function createGroup(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = z
    .object({ name: z.string().trim().min(2).max(80), member: z.uuid() })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: "Enter a group name and choose an accepted connection." };
  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("create_social_group", {
    group_name: parsed.data.name,
    initial_member: parsed.data.member,
  });
  return error
    ? { error: "Could not create this group." }
    : saved("Group created with your accepted connection.");
}
export async function inviteGroupMember(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = z
    .object({ group: z.uuid(), member: z.uuid() })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: "Choose a group and accepted connection." };
  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("invite_group_member", {
    target_group: parsed.data.group,
    target_user: parsed.data.member,
  });
  return error
    ? { error: "Could not add this connection." }
    : saved("Connection added to the group.");
}
export async function leaveGroup(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const id = z.uuid().safeParse(form.get("group"));
  if (!id.success) return { error: "Invalid group." };
  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("leave_social_group", {
    target_group: id.data,
  });
  return error
    ? { error: "Could not leave this group." }
    : saved(
        "You left the group. Your previous messages remain visible to its members.",
      );
}
export async function sendMessage(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = z
    .object({ group: z.uuid(), body: z.string().trim().min(1).max(2000) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: "Write a message of 1–2000 characters." };
  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("send_social_message", {
    target_group: parsed.data.group,
    message_body: parsed.data.body,
  });
  return error
    ? { error: "Message was not sent. Check your group membership." }
    : saved("Message saved.");
}
