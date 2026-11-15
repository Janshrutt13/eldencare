import { getCareContext } from "@/lib/auth/elder";
import { ProfilePicker } from "@/components/dashboard/profile-picker";
import { AppointmentForm } from "@/features/appointments/appointment-form";
import { ActionForm } from "@/components/ui/action-form";
import { deleteAppointment } from "@/features/appointments/actions";
import { formatDateTime } from "@/lib/dates";

export default async function AppointmentsPage({
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
        <h1>Appointments</h1>
        <ProfilePicker elders={elders} path="/dashboard/appointments" />
      </div>
    );
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("elder_profile_id", elder.id)
    .order("scheduled_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Could not load appointments.");
  return (
    <div className="stack !gap-6">
      <h1>Appointments</h1>
      <ProfilePicker
        elders={elders}
        selected={elder.id}
        path="/dashboard/appointments"
      />
      <details className="card">
        <summary>Add an appointment</summary>
        <div className="mt-4">
          <AppointmentForm elderId={elder.id} />
        </div>
      </details>
      <section className="card stack">
        <h2>Your appointments</h2>
        {!data.length && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p className="text-neutral-500">No appointments yet.</p>
            <p className="text-sm text-neutral-400">Use the form above to add your first appointment.</p>
          </div>
        )}
        <ul className="stack" style={{ gap: "0" }}>
          {data.map((appointment, i) => (
            <li
              key={appointment.id}
              className={`${i > 0 ? "border-t border-neutral-100" : ""}`}
            >
              <details className="py-4">
                <summary className="!font-semibold">
                  {appointment.doctor_name} ·{" "}
                  {formatDateTime(appointment.scheduled_at)}
                </summary>
                <div className="stack mt-4">
                  {appointment.location && (
                    <p className="text-neutral-600">{appointment.location}</p>
                  )}
                  <AppointmentForm elderId={elder.id} appointment={appointment} />
                  <ActionForm
                    action={deleteAppointment}
                    label="Delete appointment"
                    confirm="Delete this appointment?"
                  >
                    <input type="hidden" name="id" value={appointment.id} />
                  </ActionForm>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
