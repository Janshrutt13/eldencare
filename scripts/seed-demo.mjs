import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";

const catalog = JSON.parse(
  await readFile(
    new URL("../src/features/demo/catalog.json", import.meta.url),
    "utf8",
  ),
);
const groups = JSON.parse(
  await readFile(
    new URL("../src/features/demo/groups.json", import.meta.url),
    "utf8",
  ),
);
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
)
  throw new Error(
    "Use a dedicated demo project. Set the Supabase URL/service key, matching DEMO_PROJECT_REF, and DEMO_ACCOUNT_PASSWORD (16+ characters); pass --fictional-data.",
  );
const domain = process.env.DEMO_EMAIL_DOMAIN || "eldencare.invalid";
if (!/^[a-zA-Z0-9.-]+$/.test(domain))
  throw new Error("Invalid DEMO_EMAIL_DOMAIN.");
const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const emailFor = (person) => `eldencare-jaipur-${person.key}@${domain}`;
const existing = new Map();
for (let page = 1; ; page++) {
  const { data, error } = await admin.auth.admin.listUsers({
    page,
    perPage: 1000,
  });
  if (error) throw new Error("Could not inspect existing accounts.");
  for (const user of data.users) existing.set(user.email, user);
  if (data.users.length < 1000) break;
}
// Trusted app_metadata is set by admin only; user-editable metadata is never proof of seed ownership.
for (const person of catalog.people) {
  const user = existing.get(emailFor(person));
  if (
    user &&
    (user.app_metadata?.eldencare_seed !== catalog.version ||
      user.app_metadata?.demo_key !== person.key)
  )
    throw new Error(
      `Account collision for ${person.key}. No existing account will be overwritten.`,
    );
}
for (const person of catalog.people) {
  let user = existing.get(emailFor(person));
  if (!user) {
    const result = await admin.auth.admin.createUser({
      email: emailFor(person),
      password,
      email_confirm: true,
      user_metadata: {
        display_name: person.name,
        role: person.role === "volunteer" ? "family" : person.role,
      },
      app_metadata: { eldencare_seed: catalog.version, demo_key: person.key },
    });
    if (result.error || !result.data.user)
      throw new Error(
        `Could not create ${person.key}. Re-run safely after fixing configuration.`,
      );
    user = result.data.user;
  }
  const directory = await admin
    .from("demo_people")
    .select("user_id")
    .eq("demo_key", person.key)
    .maybeSingle();
  if (directory.error)
    throw new Error("Apply migrations 008 and 009 before seeding.");
  if (directory.data) {
    if (directory.data.user_id !== user.id)
      throw new Error(`Demo directory collision for ${person.key}`);
    console.log(`Preserved ${person.name}`);
    continue;
  }
  if (person.role === "volunteer") {
    const result = await admin
      .from("profiles")
      .update({ role: "volunteer" })
      .eq("id", user.id)
      .eq("role", "family");
    if (result.error)
      throw new Error("Could not assign new demo volunteer role.");
  }
  const social = await admin.from("social_profiles").upsert(
    {
      user_id: user.id,
      display_name: person.name,
      bio: person.bio,
      interests: person.interests,
      latitude: person.latitude,
      longitude: person.longitude,
      discovery_enabled: true,
      available_for_calls: true,
      is_demo: true,
    },
    { onConflict: "user_id", ignoreDuplicates: true },
  );
  if (social.error)
    throw new Error(`Could not seed social profile for ${person.key}`);
  const row = {
    demo_key: person.key,
    user_id: user.id,
    display_name: person.name,
    age: person.age,
    role: person.role,
    category: person.category,
    bio: person.bio,
    interests: person.interests,
    latitude: person.latitude,
    longitude: person.longitude,
    availability: person.availability,
    contact_label: `${person.key}@example.invalid`,
  };
  const inserted = await admin.from("demo_people").insert(row);
  if (inserted.error)
    throw new Error(
      `Could not register demo profile ${person.key}. Re-run to recover safely.`,
    );
  console.log(`Ready ${person.name}: ${emailFor(person)}`);
}
const result = await admin.rpc("seed_jaipur_graph", {
  group_data: groups,
});
if (result.error)
  throw new Error(`Could not initialize demo groups: ${result.error.message}`);
console.log(
  result.data
    ? "Created fictional groups, messages, connections and Meera's demo care team."
    : "Preserved existing demo relationships and messages; seed was already completed.",
);
console.log(
  "Use normal Supabase sign-in with DEMO_ACCOUNT_PASSWORD. No passwords were changed. No medical records were seeded. Set DEMO_ACCOUNT_PICKER_ENABLED=true to show the sign-in account picker.",
);
