import { ActionForm } from "@/components/ui/action-form";
import { saveMedication } from "./actions";
import { localDate } from "@/lib/dates";
import type { Medication } from "@/types/healthcare";
export function MedicationForm({
  elderId,
  medication,
}: {
  elderId: string;
  medication?: Medication;
}) {
  return (
    <ActionForm
      action={saveMedication}
      label={medication ? "Save changes" : "Add medication"}
    >
      <input type="hidden" name="id" value={medication?.id ?? ""} />
      <input type="hidden" name="elder_profile_id" value={elderId} />
      <label>
        Medication name
        <input
          name="name"
          required
          maxLength={120}
          defaultValue={medication?.name}
        />
      </label>
      <label>
        Dosage instructions
        <input
          name="dosage"
          required
          maxLength={300}
          defaultValue={medication?.dosage}
          placeholder="Enter the instructions provided to you"
        />
      </label>
      <label>
        Daily times (24-hour, Asia/Kolkata)
        <input
          name="times"
          required
          defaultValue={medication?.times.map((t) => t.slice(0, 5)).join(", ")}
          placeholder="08:00, 20:00"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          Start date
          <input
            type="date"
            name="start_date"
            required
            defaultValue={medication?.start_date ?? localDate()}
          />
        </label>
        <label>
          End date (optional)
          <input
            type="date"
            name="end_date"
            defaultValue={medication?.end_date ?? ""}
          />
        </label>
      </div>
      <label>
        Notes
        <textarea
          name="notes"
          maxLength={2000}
          defaultValue={medication?.notes}
        />
      </label>
    </ActionForm>
  );
}
