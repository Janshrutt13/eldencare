import type { Notification } from "@/types/notifications";
export function notificationKey(id: string) {
  return `eldencare/${id}`;
}
export function canRetryDelivery(
  firstAttempt: string | null,
  now = Date.now(),
) {
  return firstAttempt === null || now - Date.parse(firstAttempt) < 23 * 3600000;
}
export const notificationText: Record<Notification["kind"], string> = {
  dose_upcoming:
    "A scheduled medication dose is coming up. Sign in to EldenCare to view the schedule.",
  dose_unconfirmed:
    "A scheduled dose has not been confirmed. This does not mean it was not taken. Sign in to review the record; do not take a late or extra dose based on this message.",
  appointment:
    "A doctor appointment is coming up. Sign in to EldenCare to review the details.",
  call_request:
    "You have a new companion call request. Sign in to EldenCare to accept or decline.",
  demo: "This is a fictional EldenCare test reminder. No healthcare action is required.",
};
