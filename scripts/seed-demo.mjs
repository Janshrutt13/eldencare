import { createClient } from "@supabase/supabase-js";

// CLI only. This script never deletes, upserts, or changes existing accounts.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.DEMO_ACCOUNT_PASSWORD;
const projectRef = process.env.DEMO_PROJECT_REF;
if (
  !url ||
  !key ||
  !password ||
  password.length < 16 ||
  !projectRef ||
  new URL(url).hostname.split(".")[0] !== projectRef ||
  !process.argv.includes("--fictional-data")
) {
  throw new Error(
    "Set the Supabase URL/service key, matching DEMO_PROJECT_REF, and DEMO_ACCOUNT_PASSWORD (16+ characters), then pass --fictional-data. Use a dedicated demo project.",
  );
}
const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const domain = process.env.DEMO_EMAIL_DOMAIN || "eldencare.invalid";
if (!/^[a-zA-Z0-9.-]+$/.test(domain))
  throw new Error("Invalid DEMO_EMAIL_DOMAIN.");
const people = [
  {
    slug: "mira",
    name: "Mira Demo",
    role: "elderly",
    lat: 12.97,
    lon: 77.59,
    interests: ["Reading", "Gardening"],
  },
  {
    slug: "arun",
    name: "Arun Demo",
    role: "family",
    lat: 12.98,
    lon: 77.59,
    interests: ["Reading", "Walking"],
  },
  {
    slug: "leela",
    name: "Leela Demo",
    role: "caretaker",
    lat: 12.99,
    lon: 77.6,
    interests: ["Gardening", "Music"],
  },
  {
    slug: "dev",
    name: "Dev Demo Volunteer",
    role: "volunteer",
    lat: 12.96,
    lon: 77.58,
    interests: ["Music", "Reading"],
  },
];
// Fail before creating anything if any planned email already exists.
const emails = new Set(people.map((p) => `eldencare-demo-${p.slug}@${domain}`));
for (let page = 1; ; page++) {
  const { data, error } = await admin.auth.admin.listUsers({
    page,
    perPage: 1000,
  });
  if (error) throw new Error("Could not check existing accounts.");
  if (data.users.some((user) => emails.has(user.email)))
    throw new Error(
      "A demo email already exists. No existing accounts will be overwritten. Use a fresh project or different demo domain.",
    );
  if (data.users.length < 1000) break;
}
for (const person of people) {
  const email = `eldencare-demo-${person.slug}@${domain}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: person.name,
      role: person.role === "volunteer" ? "family" : person.role,
    },
  });
  if (error || !data.user)
    throw new Error(
      `Creation failed for ${person.name}. Earlier newly created accounts were retained; nothing was overwritten.`,
    );
  if (person.role === "volunteer") {
    const result = await admin
      .from("profiles")
      .update({ role: "volunteer" })
      .eq("id", data.user.id);
    if (result.error)
      throw new Error("Could not assign the new demo volunteer role.");
  }
  const social = await admin.from("social_profiles").insert({
    user_id: data.user.id,
    display_name: person.name,
    bio: "Fictional hackathon profile. Enjoys friendly conversation.",
    interests: person.interests,
    latitude: person.lat,
    longitude: person.lon,
    discovery_enabled: true,
    available_for_calls: true,
    is_demo: true,
  });
  if (social.error)
    throw new Error(
      `Social profile failed for ${person.name}. Apply all migrations first.`,
    );
  console.log(`Created ${person.name}: ${email}`);
}
console.log(
  "Done. Sign in with DEMO_ACCOUNT_PASSWORD. Connect care members through the invitation UI. No medical records were seeded; use fictional values in the forms.",
);
