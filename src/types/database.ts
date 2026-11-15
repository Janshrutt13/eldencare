import type { Medication, Dose, Appointment } from "./healthcare";
import type { Notification } from "./notifications";
import type {
  SocialProfile,
  NearbyPerson,
  Contact,
  CallRequest,
  Connection,
  SocialGroup,
  GroupMember,
  SocialMessage,
} from "./social";
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
export type Role = "elderly" | "family" | "caretaker" | "volunteer";
export type Profile = {
  id: string;
  display_name: string;
  role: Role;
  timezone: string;
  created_at: string;
};
export type ElderProfile = {
  id: string;
  owner_id: string;
  display_name: string;
  created_at: string;
};
export type Membership = {
  id: string;
  elder_profile_id: string;
  member_id: string;
  role: "family" | "caretaker";
  created_at: string;
};
export type Invite = {
  id: string;
  elder_profile_id: string;
  code_hash: string;
  role: "family" | "caretaker";
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
};
type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};
export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      elder_profiles: Table<ElderProfile>;
      care_memberships: Table<Membership>;
      care_invites: Table<Invite>;
      medications: Table<Medication>;
      medication_doses: Table<Dose>;
      appointments: Table<Appointment>;
      notifications: Table<Notification>;
      social_profiles: Table<SocialProfile>;
      companion_call_requests: Table<CallRequest>;
      connection_requests: Table<Connection>;
      social_groups: Table<SocialGroup>;
      social_group_members: Table<GroupMember>;
      social_messages: Table<SocialMessage>;
    };
    Views: { [_ in never]: never };
    Functions: {
      care_summary: {
        Args: { target_elder: string };
        // PostgreSQL count() returns bigint; PostgREST serialises it as string.
        Returns: {
          due: string;
          taken: string;
          skipped: string;
          unconfirmed: string;
        }[];
      };
      consume_usage: { Args: { usage_purpose: string }; Returns: boolean };
      save_social_profile: { Args: { payload: Json }; Returns: undefined };
      nearby_people: { Args: { radius_km: number }; Returns: NearbyPerson[] };
      request_connection: { Args: { target_user: string }; Returns: undefined };
      respond_connection: {
        Args: { request_id: string; decision: string };
        Returns: undefined;
      };
      create_social_group: {
        Args: { group_name: string; initial_member: string };
        Returns: string;
      };
      invite_group_member: {
        Args: { target_group: string; target_user: string };
        Returns: undefined;
      };
      leave_social_group: {
        Args: { target_group: string };
        Returns: undefined;
      };
      send_social_message: {
        Args: { target_group: string; message_body: string };
        Returns: undefined;
      };
      companion_contacts: { Args: Record<string, never>; Returns: Contact[] };
      request_companion_call: {
        Args: { target_user: string; preferred_time?: string };
        Returns: string;
      };
      respond_companion_call: {
        Args: { request_id: string; decision: string };
        Returns: undefined;
      };
      queue_reminders: {
        Args: {
          upcoming_minutes: number;
          overdue_minutes: number;
          appointment_minutes: number;
        };
        Returns: undefined;
      };
      claim_notifications: {
        Args: { only_recipient?: string };
        Returns: Notification[];
      };
      queue_demo_notification: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      ensure_doses: { Args: { target_elder: string }; Returns: undefined };
      save_medication: { Args: { payload: Json }; Returns: string };
      remove_medication: {
        Args: { target_medication: string };
        Returns: undefined;
      };
      confirm_dose: {
        Args: { target_dose: string; new_status: string };
        Returns: undefined;
      };
      create_care_invite: {
        Args: { target_elder: string; invited_role: "family" | "caretaker" };
        Returns: string;
      };
      redeem_care_invite: {
        Args: { invitation_code: string };
        Returns: string;
      };
      care_team: {
        Args: { target_elder: string };
        Returns: {
          id: string;
          display_name: string;
          role: string;
          created_at: string;
        }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
