import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

// Real embedded PostgreSQL + pgcrypto; only Supabase's Auth schema/identity is emulated.
const db = new PGlite({ extensions: { pgcrypto } });
const elderUser = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const family = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const outsider = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const volunteer = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
let elder: string;
let medication: string;
let dose: string;
let group: string;
let connection: string;
async function actor(id: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec("set role authenticated");
}
async function scalar<T>(sql: string, args: unknown[] = []): Promise<T> {
  const result = await db.query<Record<string, T>>(sql, args);
  return Object.values(result.rows[0])[0];
}
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; grant usage on schema auth,public to anon,authenticated,service_role;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
  for (const file of (await readdir(resolve("supabase/migrations")))
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    try {
      await db.exec(
        await readFile(resolve("supabase/migrations", file), "utf8"),
      );
    } catch (error) {
      throw new Error(`Migration ${file} failed`, { cause: error });
    }
  }
}, 30000);
afterAll(async () => {
  await db.close();
});
describe.sequential("database authorization and transactions", () => {
  it("runs the original ownership, invitation, and revocation assertions", async () => {
    await db.exec(
      await readFile(resolve("supabase/tests/authorization.sql"), "utf8"),
    );
    await db.exec("reset role");
    for (const [id, name, role] of [
      [elderUser, "Elder Demo", "elderly"],
      [family, "Family Demo", "family"],
      [outsider, "Other Demo", "elderly"],
      [volunteer, "Volunteer Demo", "family"],
    ])
      await db.query(
        "insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)",
        [
          id,
          `${id}@example.test`,
          JSON.stringify({ display_name: name, role }),
        ],
      );
    await db.query("update public.profiles set role='volunteer' where id=$1", [
      volunteer,
    ]);
    elder = await scalar<string>(
      "select id from public.elder_profiles where owner_id=$1",
      [elderUser],
    );
  });
  it("creates unique dose occurrences and denies unrelated healthcare access", async () => {
    await actor(elderUser);
    medication = await scalar<string>("select public.save_medication($1)", [
      JSON.stringify({
        elder_profile_id: elder,
        name: "Fictional tablet",
        dosage: "Demo instructions",
        times: ["08:00", "20:00"],
        start_date: "2020-01-01",
        end_date: "",
        notes: "Fictional",
      }),
    ]);
    await db.exec("reset role");
    await db.query(
      "update public.medications set created_at=now()-interval '2 days',schedule_updated_at=now()-interval '2 days' where id=$1",
      [medication],
    );
    await actor(elderUser);
    await db.query("select public.ensure_doses($1)", [elder]);
    const first = await scalar<number>(
      "select count(*)::int from public.medication_doses",
    );
    await db.query("select public.ensure_doses($1)", [elder]);
    expect(
      await scalar<number>("select count(*)::int from public.medication_doses"),
    ).toBe(first);
    expect(first).toBeGreaterThan(0);
    dose = await scalar<string>(
      "select id from public.medication_doses where scheduled_at<now() order by scheduled_at limit 1",
    );
    await actor(outsider);
    expect(
      await scalar<number>("select count(*)::int from public.medications"),
    ).toBe(0);
    await expect(
      db.query("select public.confirm_dose($1,'taken')", [dose]),
    ).rejects.toThrow();
    await actor(volunteer);
    expect(
      await scalar<number>("select count(*)::int from public.medication_doses"),
    ).toBe(0);
  });
  it("keeps historical confirmations through schedule edits and removal", async () => {
    await actor(elderUser);
    await db.query("select public.confirm_dose($1,'taken')", [dose]);
    const oldCount = await scalar<number>(
      "select count(*)::int from public.medication_doses where scheduled_at<now()",
    );
    await db.query("select public.save_medication($1)", [
      JSON.stringify({
        id: medication,
        elder_profile_id: elder,
        name: "Renamed demo",
        dosage: "Changed demo text",
        times: ["09:11"],
        start_date: "2020-01-01",
        end_date: "",
        notes: "",
      }),
    ]);
    expect(
      await scalar<number>(
        "select count(*)::int from public.medication_doses where scheduled_at<now()",
      ),
    ).toBe(oldCount);
    expect(
      await scalar<string>(
        "select medication_name from public.medication_doses where id=$1",
        [dose],
      ),
    ).toBe("Fictional tablet");
    expect(
      await scalar<string>(
        "select status from public.medication_doses where id=$1",
        [dose],
      ),
    ).toBe("taken");
  });
  it("deduplicates reminders and claims a job only once", async () => {
    await db.exec("reset role");
    await db.query(
      "insert into public.appointments(elder_profile_id,doctor_name,scheduled_at,location) values($1,'Doctor Demo',now()+interval '2 hours','Demo clinic')",
      [elder],
    );
    await db.exec(
      "select public.queue_reminders();select public.queue_reminders();",
    );
    expect(
      await scalar<number>(
        "select count(*)::int from public.notifications where kind='appointment'",
      ),
    ).toBe(1);
    const claimed = await db.query(
      "select * from public.claim_notifications()",
    );
    expect(claimed.rows.length).toBeGreaterThan(0);
    expect(
      (await db.query("select * from public.claim_notifications()")).rows,
    ).toHaveLength(0);
    await actor(outsider);
    expect(
      (await db.query("select * from public.notifications")).rows,
    ).toHaveLength(0);
    await expect(db.query("select public.queue_reminders()")).rejects.toThrow();
  });
  it("requires opt-in discovery and hides coordinates from other users", async () => {
    for (const [id, name, lat] of [
      [elderUser, "Elder Social", 12.97],
      [family, "Family Social", 12.98],
      [outsider, "Far Demo", 20],
    ] as const) {
      await actor(id);
      await db.query("select public.save_social_profile($1)", [
        JSON.stringify({
          display_name: name,
          bio: "Fictional",
          interests: ["Reading"],
          latitude: lat,
          longitude: 77.59,
          discovery_enabled: true,
          available_for_calls: false,
        }),
      ]);
    }
    await actor(elderUser);
    const nearby = await db.query("select * from public.nearby_people(5)");
    expect(nearby.rows).toHaveLength(1);
    expect(nearby.rows[0]).not.toHaveProperty("latitude");
    expect(
      (await db.query("select * from public.social_profiles")).rows,
    ).toHaveLength(1);
    await expect(
      db.query("select public.create_social_group('Invalid group',$1)", [
        family,
      ]),
    ).rejects.toThrow();
    await db.query("select public.request_connection($1)", [family]);
    connection = await scalar<string>(
      "select id from public.connection_requests",
    );
    await expect(
      db.query("select public.respond_connection($1,'accepted')", [connection]),
    ).rejects.toThrow();
    await actor(family);
    await db.query("select public.respond_connection($1,'accepted')", [
      connection,
    ]);
    await expect(
      db.query("select public.respond_connection($1,'accepted')", [connection]),
    ).rejects.toThrow();
  });
  it("enforces group membership and removes access after leaving", async () => {
    await actor(elderUser);
    group = await scalar<string>(
      "select public.create_social_group('Reading Demo',$1)",
      [family],
    );
    await db.query("select public.send_social_message($1,'Hello demo group')", [
      group,
    ]);
    await actor(outsider);
    expect(
      (await db.query("select * from public.social_messages")).rows,
    ).toHaveLength(0);
    await expect(
      db.query("select public.send_social_message($1,'Unauthorized')", [group]),
    ).rejects.toThrow();
    await actor(family);
    expect(
      (await db.query("select * from public.social_messages")).rows,
    ).toHaveLength(1);
    await db.query("select public.leave_social_group($1)", [group]);
    expect(
      (await db.query("select * from public.social_messages")).rows,
    ).toHaveLength(0);
  });
  it("only lets a call recipient accept and generates an unguessable meeting link", async () => {
    await db.exec("reset role");
    await db.query(
      "insert into public.social_profiles(user_id,display_name,latitude,longitude,is_demo,available_for_calls) values($1,'Volunteer Demo',12.97,77.59,true,true)",
      [volunteer],
    );
    await actor(elderUser);
    const call = await scalar<string>(
      "select public.request_companion_call($1)",
      [volunteer],
    );
    await expect(
      db.query("select public.respond_companion_call($1,'accepted')", [call]),
    ).rejects.toThrow();
    await actor(volunteer);
    await db.query("select public.respond_companion_call($1,'accepted')", [
      call,
    ]);
    expect(
      await scalar<string>(
        "select meeting_url from public.companion_call_requests where id=$1",
        [call],
      ),
    ).toMatch(/^https:\/\/meet\.jit\.si\/EldenCare-[a-f0-9]{48}$/);
    expect(
      (await db.query("select * from public.medications")).rows,
    ).toHaveLength(0);
  });
  it("expires invitations and immediately revokes healthcare access", async () => {
    await actor(elderUser);
    const expired = await scalar<string>(
      "select public.create_care_invite($1,'family')",
      [elder],
    );
    await db.exec("reset role");
    await db.query(
      "update public.care_invites set expires_at=now()-interval '1 second' where code_hash=encode(extensions.digest($1,'sha256'),'hex')",
      [expired],
    );
    await actor(family);
    await expect(
      db.query("select public.redeem_care_invite($1)", [expired]),
    ).rejects.toThrow();
    await actor(elderUser);
    const code = await scalar<string>(
      "select public.create_care_invite($1,'family')",
      [elder],
    );
    await actor(family);
    await db.query("select public.redeem_care_invite($1)", [code]);
    expect(
      (await db.query("select * from public.medications")).rows.length,
    ).toBeGreaterThan(0);
    const appointment = await scalar<string>(
      "insert into public.appointments(elder_profile_id,doctor_name,scheduled_at,location) values($1,'Family-entered doctor',now()+interval '1 day','Fictional clinic') returning id",
      [elder],
    );
    await actor(elderUser);
    await db.query(
      "delete from public.care_memberships where elder_profile_id=$1 and member_id=$2",
      [elder, family],
    );
    await actor(family);
    expect(
      (await db.query("select * from public.appointments")).rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query(
          "update public.appointments set location='Unauthorized' where id=$1 returning id",
          [appointment],
        )
      ).rows,
    ).toHaveLength(0);
    await expect(
      db.query("select public.ensure_doses($1)", [elder]),
    ).rejects.toThrow();
  });
  it("cancels rescheduled reminder jobs and quarantines expired ambiguous retries", async () => {
    await db.exec("reset role");
    await db.exec(
      "update public.notifications set status='pending',locked_until=null;update public.appointments set scheduled_at=scheduled_at+interval '1 hour';",
    );
    await db.exec("set role service_role");
    await db.query("select * from public.claim_notifications()");
    expect(
      await scalar<number>(
        "select count(*)::int from public.notifications where kind='appointment' and status='cancelled'",
      ),
    ).toBeGreaterThan(0);
    await db.exec("reset role");
    await db.query(
      "insert into public.notifications(recipient_id,kind,event_key,status,first_attempt_at) values($1,'demo','expired-retry','failed',now()-interval '24 hours')",
      [elderUser],
    );
    await db.exec("set role service_role");
    await db.query("select * from public.claim_notifications()");
    expect(
      await scalar<string>(
        "select status from public.notifications where event_key='expired-retry'",
      ),
    ).toBe("uncertain");
    await db.exec("reset role");
  });
  it("prevents future-dose confirmation and archives schedules without erasing history", async () => {
    await actor(elderUser);
    const future = await scalar<string>(
      "select id from public.medication_doses where scheduled_at>now() limit 1",
    );
    await expect(
      db.query("select public.confirm_dose($1,'taken')", [future]),
    ).rejects.toThrow();
    await db.query("select public.remove_medication($1)", [medication]);
    expect(
      await scalar<string>(
        "select status from public.medication_doses where id=$1",
        [dose],
      ),
    ).toBe("taken");
    expect(
      await scalar<number>(
        "select count(*)::int from public.medication_doses where scheduled_at>now() and medication_id=$1",
        [medication],
      ),
    ).toBe(0);
  });
  it("enforces a persistent AI usage quota", async () => {
    await actor(outsider);
    for (let i = 0; i < 20; i++)
      expect(await scalar<boolean>("select public.consume_usage('ai')")).toBe(
        true,
      );
    expect(await scalar<boolean>("select public.consume_usage('ai')")).toBe(
      false,
    );
  });
});
