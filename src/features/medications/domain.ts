export type DoseState = "pending" | "taken" | "skipped";
export type DoseRecord = { scheduled_at: string; status: DoseState };
export function doseStatus(
  dose: DoseRecord,
  now = Date.now(),
  graceMinutes = 60,
) {
  if (dose.status !== "pending") return dose.status;
  return now >= Date.parse(dose.scheduled_at) + graceMinutes * 60_000
    ? "unconfirmed"
    : "pending";
}
export function adherence(doses: DoseRecord[], now = Date.now()) {
  const due = doses.filter((dose) => Date.parse(dose.scheduled_at) <= now);
  const taken = due.filter((dose) => dose.status === "taken").length;
  return {
    due: due.length,
    taken,
    percent: due.length ? Math.round((taken / due.length) * 100) : null,
    unconfirmed: due.filter((dose) => doseStatus(dose, now) === "unconfirmed")
      .length,
  };
}
