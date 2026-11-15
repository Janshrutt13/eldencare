import type { DoseState } from "@/features/medications/domain";
export type Medication = {
  id: string;
  elder_profile_id: string;
  name: string;
  dosage: string;
  times: string[];
  start_date: string;
  end_date: string | null;
  notes: string;
  active: boolean;
  schedule_updated_at: string;
  created_at: string;
};
export type Dose = {
  id: string;
  medication_id: string;
  elder_profile_id: string;
  medication_name: string;
  dosage: string;
  scheduled_at: string;
  status: DoseState;
  confirmed_at: string | null;
  confirmed_by: string | null;
};
export type Appointment = {
  id: string;
  elder_profile_id: string;
  doctor_name: string;
  specialization: string;
  scheduled_at: string;
  location: string;
  notes: string;
  created_at: string;
};
