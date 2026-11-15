import "server-only";
import { requireSession } from "./session";
export async function getCareContext(requestedId?: string) {
  const session = await requireSession();
  const { data: elders, error } = await session.supabase
    .from("elder_profiles")
    .select("*")
    .order("created_at");
  if (error) throw new Error("Could not load healthcare profiles.");
  const elder = requestedId
    ? elders.find((item) => item.id === requestedId)
    : elders[0];
  return { ...session, elders, elder };
}
