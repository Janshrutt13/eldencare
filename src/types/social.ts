export type SocialProfile = {
  user_id: string;
  display_name: string;
  bio: string;
  interests: string[];
  latitude: number;
  longitude: number;
  discovery_enabled: boolean;
  available_for_calls: boolean;
  is_demo: boolean;
};
export type NearbyPerson = Pick<
  SocialProfile,
  "user_id" | "display_name" | "bio" | "interests" | "is_demo"
> & { distance_km: number };
export type Contact = {
  user_id: string;
  display_name: string;
  role: string;
  is_demo: boolean;
};
export type CallRequest = {
  id: string;
  requester_id: string;
  recipient_id: string;
  requester_name: string;
  recipient_name: string;
  preferred_at: string | null;
  status: "pending" | "accepted" | "declined" | "cancelled";
  meeting_url: string | null;
  created_at: string;
};
export type Connection = {
  id: string;
  requester_id: string;
  recipient_id: string;
  requester_name: string;
  recipient_name: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
};
export type SocialGroup = {
  description: string;
  interests: string[];
  demo_key: string | null;
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
};
export type GroupMember = {
  group_id: string;
  user_id: string;
  display_name: string;
  joined_at: string;
};
export type SocialMessage = {
  demo_key: string | null;
  id: string;
  group_id: string;
  sender_id: string | null;
  sender_name: string;
  body: string;
  created_at: string;
};
export type DemoPerson = {
  demo_key: string;
  user_id: string | null;
  display_name: string;
  age: number;
  role: string;
  category: string;
  bio: string;
  interests: string[];
  latitude: number;
  longitude: number;
  availability: string;
  contact_label: string;
};
export type GroupSummary = Pick<
  SocialGroup,
  "id" | "name" | "description" | "interests" | "demo_key"
> & {
  member_count: number | string;
  member_names: string[];
  recent_message: string | null;
};
