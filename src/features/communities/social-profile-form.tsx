import { ActionForm } from "@/components/ui/action-form";
import { saveSocialProfile } from "./actions";
import type { SocialProfile } from "@/types/social";
import { DEMO_CENTER } from "@/features/demo/catalog";
export function SocialProfileForm({
  profile,
  name,
}: {
  profile: SocialProfile | null;
  name: string;
}) {
  return (
    <ActionForm
      action={saveSocialProfile}
      label="Save social preferences"
      buttonClassName="primary w-fit"
    >
      <label>
        Social display name
        <input
          name="display_name"
          required
          minLength={2}
          maxLength={80}
          defaultValue={profile?.display_name ?? name}
        />
      </label>
      <label>
        About you
        <textarea name="bio" maxLength={500} defaultValue={profile?.bio} />
      </label>
      <label>
        Interests (separate with commas)
        <input
          name="interests"
          defaultValue={profile?.interests.join(", ")}
          placeholder="Reading, gardening, walking"
        />
      </label>
      <p className="muted">
        Use a fictional neighborhood location, never a home address. Coordinates
        are rounded to two decimal places; other users see only approximate
        distance. The default is a fictional Jaipur neighborhood, not your
        location.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          Approximate latitude
          <input
            type="number"
            name="latitude"
            required
            step="0.01"
            min={-90}
            max={90}
            defaultValue={
              profile?.latitude ?? Number(DEMO_CENTER.latitude.toFixed(2))
            }
          />
        </label>
        <label>
          Approximate longitude
          <input
            type="number"
            name="longitude"
            required
            step="0.01"
            min={-180}
            max={180}
            defaultValue={
              profile?.longitude ?? Number(DEMO_CENTER.longitude.toFixed(2))
            }
          />
        </label>
      </div>
      <label className="!flex items-center gap-3">
        <input
          className="!w-6"
          type="checkbox"
          name="discovery_enabled"
          defaultChecked={profile?.discovery_enabled}
        />
        Let nearby people discover my social profile
      </label>
      <label className="!flex items-center gap-3">
        <input
          className="!w-6"
          type="checkbox"
          name="available_for_calls"
          defaultChecked={profile?.available_for_calls}
        />
        Available for companion calls (demo volunteers)
      </label>
    </ActionForm>
  );
}
