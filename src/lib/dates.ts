export const CARE_TIMEZONE = "Asia/Kolkata";
export function localDate(date = new Date(), timezone = CARE_TIMEZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function formatDateTime(value: string, timezone = CARE_TIMEZONE) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(value));
}
export function dateTimeInput(value: string) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: CARE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
  return parts.replace(" ", "T");
}
