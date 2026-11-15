export type Intent =
  | "medicines"
  | "appointment"
  | "schedule"
  | "talk"
  | "communities"
  | "medical"
  | "chat";
export function detectIntent(text: string): Intent {
  const value = text.toLowerCase();
  if (
    /\b(diagnos\w*|prescrib\w*|overdose|extra dose|double dose|late dose|should i take|change.*dosage|symptoms?|chest pain|cannot breathe)\b/.test(
      value,
    )
  )
    return "medical";
  if (/\b(schedule|book|add)\b.*\bappointment\b/.test(value)) return "schedule";
  if (
    /\b(lonely|loneliness|talk to someone|call someone|human support|assistance)\b/.test(
      value,
    )
  )
    return "talk";
  if (/\b(communit\w*|nearby|social group)\b/.test(value)) return "communities";
  if (/\b(medicines?|medications?|doses?)\b/.test(value)) return "medicines";
  if (/\b(appointment|doctor visit)\b/.test(value)) return "appointment";
  return "chat";
}
export type CompanionReply = {
  text: string;
  href?: string;
  label?: string;
  unavailable?: boolean;
};
