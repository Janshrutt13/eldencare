"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { inviteSchema, uuidSchema } from "@/lib/validations/auth";
import type { FormState } from "@/types/forms";

export async function createInvite(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const { supabase, profile } = await requireSession();
  const elder = uuidSchema.safeParse(form.get("elderId"));
  const role = form.get("role");
  if (
    profile.role !== "elderly" ||
    !elder.success ||
    (role !== "family" && role !== "caretaker")
  )
    return { error: "This invitation cannot be created." };
  const { data, error } = await supabase.rpc("create_care_invite", {
    target_elder: elder.data,
    invited_role: role,
  });
  if (error)
    return {
      error:
        "Could not create an invitation. You can have up to 10 active invitations; revoke an old one if needed.",
    };
  revalidatePath("/dashboard/access");
  return {
    code: data,
    success:
      "Invitation created. Share this code privately. It expires in 24 hours and can be used once.",
  };
}

export async function redeemInvite(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const { supabase, profile } = await requireSession();
  if (profile.role !== "family" && profile.role !== "caretaker")
    return {
      error: "Only family members and caretakers can use care invitations.",
    };
  const parsed = inviteSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await supabase.rpc("redeem_care_invite", {
    invitation_code: parsed.data.code,
  });
  if (error)
    return {
      error:
        "This invitation is expired, already used, revoked, or intended for a different account role.",
    };
  revalidatePath("/dashboard", "layout");
  return {
    success:
      "You are now linked to this healthcare profile. Open Overview to view it.",
  };
}

export async function revokeAccess(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const { supabase, profile } = await requireSession();
  const parsed = uuidSchema.safeParse(form.get("id"));
  const kind = form.get("kind");
  if (
    profile.role !== "elderly" ||
    !parsed.success ||
    (kind !== "member" && kind !== "invite")
  )
    return { error: "You cannot revoke this access." };
  const table = kind === "member" ? "care_memberships" : "care_invites";
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq("id", parsed.data)
    .select("id");
  if (error || !data?.length)
    return { error: "Nothing was revoked. Refresh the page and try again." };
  revalidatePath("/dashboard", "layout");
  return {
    success: kind === "member" ? "Access revoked." : "Invitation revoked.",
  };
}
