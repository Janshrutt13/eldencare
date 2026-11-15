import { ActionForm } from "@/components/ui/action-form";
import { saveAppointment } from "./actions";
import { dateTimeInput } from "@/lib/dates";
import type { Appointment } from "@/types/healthcare";
export function AppointmentForm({
  elderId,
  appointment,
}: {
  elderId: string;
  appointment?: Appointment;
}) {
  return (
    <ActionForm
      action={saveAppointment}
      label={appointment ? "Save changes" : "Add appointment"}
    >
      <input type="hidden" name="id" value={appointment?.id ?? ""} />
      <input type="hidden" name="elder_profile_id" value={elderId} />
      <label>
        Doctor name
        <input
          name="doctor_name"
          required
          maxLength={120}
          defaultValue={appointment?.doctor_name}
        />
      </label>
      <label>
        Specialization
        <input
          name="specialization"
          maxLength={120}
          defaultValue={appointment?.specialization}
        />
      </label>
      <label>
        Date and time (Asia/Kolkata)
        <input
          type="datetime-local"
          name="scheduled_at"
          required
          defaultValue={
            appointment ? dateTimeInput(appointment.scheduled_at) : ""
          }
        />
      </label>
      <label>
        Location or meeting details
        <input
          name="location"
          required
          maxLength={500}
          defaultValue={appointment?.location}
        />
      </label>
      <label>
        Notes
        <textarea
          name="notes"
          maxLength={2000}
          defaultValue={appointment?.notes}
        />
      </label>
    </ActionForm>
  );
}
