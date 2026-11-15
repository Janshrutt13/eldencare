import { getCareContext } from "@/lib/auth/elder";
import { ProfilePicker } from "@/components/dashboard/profile-picker";
import { MedicationForm } from "@/features/medications/medication-form";
import { DoseList } from "@/features/medications/dose-list";
import { ActionForm } from "@/components/ui/action-form";
import { removeMedication } from "@/features/medications/actions";
import { requestTime } from "@/lib/request-time";

export default async function MedicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ elder?: string }>;
}) {
  const { elder, elders, supabase } = await getCareContext(
    (await searchParams).elder,
  );
  if (!elder)
    return (
      <div className="stack !gap-6">
        <h1>Medicines</h1>
        <ProfilePicker elders={elders} path="/dashboard/medications" />
      </div>
    );
  const now = requestTime();
  const generated = await supabase.rpc("ensure_doses", {
    target_elder: elder.id,
  });
  if (generated.error) throw new Error("Could not prepare scheduled doses.");
  const [medications, doses] = await Promise.all([
    supabase
      .from("medications")
      .select("*")
      .eq("elder_profile_id", elder.id)
      .eq("active", true)
      .order("created_at"),
    supabase
      .from("medication_doses")
      .select("*")
      .eq("elder_profile_id", elder.id)
      .gte("scheduled_at", new Date(now - 7 * 86400000).toISOString())
      .lte("scheduled_at", new Date(now + 86400000).toISOString())
      .order("scheduled_at", { ascending: false })
      .limit(300),
  ]);
  if (medications.error || doses.error)
    throw new Error("Could not load medications.");
  return (
    <div className="stack !gap-6">
      <h1>Medicines</h1>
      <ProfilePicker
        elders={elders}
        selected={elder.id}
        path="/dashboard/medications"
      />
      <p className="notice">
        An unconfirmed dose does not mean it was not taken. Follow your
        prescribed instructions; this app does not recommend late or extra
        doses.
      </p>
      <details className="card">
        <summary>Add a medication schedule</summary>
        <div className="mt-4">
          <MedicationForm elderId={elder.id} />
        </div>
      </details>
      <section className="card stack">
        <h2>Active schedules</h2>
        {!medications.data.length && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" />
            </svg>
            <p className="text-neutral-500">No medications added yet.</p>
            <p className="text-sm text-neutral-400">Use the form above to add your first medication schedule.</p>
          </div>
        )}
        <ul className="stack" style={{ gap: "0" }}>
          {medications.data.map((medication, i) => (
            <li
              key={medication.id}
              className={`${i > 0 ? "border-t border-neutral-100" : ""}`}
            >
              <details className="py-4">
                <summary>
                  {medication.name} ·{" "}
                  {medication.times.map((t) => t.slice(0, 5)).join(", ")}
                </summary>
                <div className="stack mt-4">
                  <MedicationForm elderId={elder.id} medication={medication} />
                  <ActionForm
                    action={removeMedication}
                    label="Remove schedule"
                    confirm="Remove this schedule and its future pending doses? Past records will be kept."
                  >
                    <input type="hidden" name="id" value={medication.id} />
                  </ActionForm>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </section>
      <section className="card stack">
        <h2>Recent and upcoming doses</h2>
        <p className="muted">
          Last 7 days and next 24 hours, up to 300 records.
        </p>
        <DoseList doses={doses.data} now={now} />
      </section>
    </div>
  );
}
