import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const requireSession = cache(async () => {
  if (!isSupabaseConfigured()) redirect("/setup");
  const supabase = await createClient();
  // Verify with the Auth server, including invalidated/deleted users.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (profileError || !profile)
    throw new Error(
      "Account profile unavailable. Apply the database migration before signing up.",
    );
  return { supabase, user, profile };
});
