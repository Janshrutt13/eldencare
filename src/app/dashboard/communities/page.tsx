import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { RefreshButton } from "@/components/ui/refresh-button";
import { SocialProfileForm } from "@/features/communities/social-profile-form";
import { NearbyPeople } from "@/features/communities/nearby-people";
import { ConnectionList } from "@/features/communities/connection-list";
import { GroupList } from "@/features/communities/group-list";
import { GroupPanel } from "@/features/communities/group-panel";

type Query = {
  radius?: string;
  group?: string;
  before?: string;
  cursor?: string;
};
export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const params = await searchParams;
  const radius = params.radius === "10" ? 10 : 5;
  const { supabase, user, profile } = await requireSession();
  const [social, nearby, connections, groups] = await Promise.all([
    supabase
      .from("social_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.rpc("nearby_people", { radius_km: radius }),
    supabase
      .from("connection_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("social_groups")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  if (social.error || nearby.error || connections.error || groups.error)
    throw new Error("Could not load communities.");
  const accepted = connections.data
    .filter((c) => c.status === "accepted")
    .map((c) => ({
      id: c.requester_id === user.id ? c.recipient_id : c.requester_id,
      name: c.requester_id === user.id ? c.recipient_name : c.requester_name,
    }));
  const group = params.group
    ? groups.data.find((g) => g.id === params.group)
    : groups.data[0];
  let groupView: React.ReactNode;
  if (group) {
    let query = supabase
      .from("social_messages")
      .select("*")
      .eq("group_id", group.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(50);
    const cursor = z
      .object({ before: z.iso.datetime({ offset: true }), cursor: z.uuid() })
      .safeParse(params);
    // Both cursor fields are validated before composing a PostgREST filter.
    if (cursor.success)
      query = query.or(
        `created_at.lt.${cursor.data.before},and(created_at.eq.${cursor.data.before},id.lt.${cursor.data.cursor})`,
      );
    const [messages, members] = await Promise.all([
      query,
      supabase
        .from("social_group_members")
        .select("*")
        .eq("group_id", group.id),
    ]);
    if (messages.error || members.error)
      throw new Error("Could not load this group.");
    groupView = (
      <GroupPanel
        group={group}
        members={members.data}
        messages={messages.data}
        contacts={accepted}
        radius={radius}
        hasCursor={cursor.success}
      />
    );
  }
  return (
    <div className="stack !gap-6">
      <h1>Nearby communities</h1>
      <p>
        Meet people with shared interests. Social connections never grant access
        to healthcare records.
      </p>
      <RefreshButton />
      <details className="card" open={!social.data}>
        <summary>Your social profile and discovery preferences</summary>
        <div className="mt-4">
          <SocialProfileForm
            profile={social.data}
            name={profile.display_name}
          />
        </div>
      </details>
      <NearbyPeople
        profile={social.data}
        people={nearby.data}
        connections={connections.data}
        radius={radius}
      />
      <ConnectionList connections={connections.data} userId={user.id} />
      <GroupList
        groups={groups.data}
        contacts={accepted}
        selected={group?.id}
        radius={radius}
      />
      {params.group && !group && (
        <p role="alert">This group is unavailable or you have left it.</p>
      )}
      {groupView}
    </div>
  );
}
