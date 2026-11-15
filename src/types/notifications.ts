export type Notification = {
  id: string;
  recipient_id: string;
  elder_profile_id: string | null;
  dose_id: string | null;
  appointment_id: string | null;
  kind:
    | "dose_upcoming"
    | "dose_unconfirmed"
    | "appointment"
    | "call_request"
    | "demo";
  event_key: string;
  status:
    "pending" | "processing" | "sent" | "failed" | "cancelled" | "uncertain";
  attempts: number;
  first_attempt_at: string | null;
  locked_until: string | null;
  claim_token: string | null;
  provider_id: string | null;
  last_error: string | null;
  sent_at: string | null;
  created_at: string;
};
