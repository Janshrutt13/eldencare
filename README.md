# EldenCare

A functional hackathon prototype for elderly healthcare routines and companionship. **Use fictional profiles and healthcare details only.** This is not a medical or emergency service.

## Implemented features

| Area                      | Implementation                                                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Accounts and care sharing | Supabase email/password auth, confirmation, three signup roles, single-use hashed invitations, expiry, revocation, RLS                                                                     |
| Healthcare                | Medication and appointment CRUD, individual scheduled doses, taken/skipped confirmations, overdue-unconfirmed status, seven-day adherence, authorized profile selection                    |
| Reminders                 | Persisted queue, upcoming/unconfirmed dose and appointment reminders, call notifications, Resend delivery, claims and idempotency, protected cron endpoint, self-only demo action          |
| Care companion            | Floating text panel, browser speech recognition and speech synthesis, explicit record/navigation intents, server-side Gemini conversation with usage limits                                |
| Companion Circle          | Family/caretaker contacts from care memberships, fictional demo volunteers, preferred call times, recipient acceptance/decline, random Jitsi links, call history                           |
| Communities               | Opt-in approximate location, 5/10 km Haversine discovery, shared interests, connection requests, accepted-connection groups, additional members, persisted paginated messages, leave group |

There is no simulated authentication, fake email delivery, or invented healthcare data. External services require configuration. UI code and database behavior are implemented; live provider and deployment checks still require your accounts.

## Stack and code organization

Next.js App Router, React, strict TypeScript, Tailwind CSS, Supabase PostgreSQL/Auth/RLS, Zod, Gemini REST API, Resend REST API, browser Web Speech APIs, Jitsi, Vitest, and Vercel. No Prisma, Redux, custom WebSocket server, or video infrastructure.

```text
src/app/                    Routes and server-rendered page composition
src/components/             Shared accessible UI and companion panel
src/features/               Feature actions, forms, display components, domain rules
src/lib/auth/               Server session verification and authorized profile selection
src/lib/supabase/           User-scoped clients and isolated server-only admin client
src/lib/ai/                 Explicit intents and Gemini transport
src/lib/email/              Notification text, retry rules and delivery worker
src/lib/validations/        Zod schemas for untrusted inputs
src/types/                  Database and feature types
src/tests/                  Embedded PostgreSQL authorization/integration tests
supabase/migrations/        Ordered database schema, policies and transactional RPCs
scripts/seed-demo.mjs       Guarded CLI-only fictional account seeding
deployment/                Optional scheduler configuration
```

Form components share a small action/feedback component. Database invariants live in constraints and narrowly scoped functions; server actions validate inputs and authenticate before calling them. SQL functions are used where writes must be atomic, such as invite consumption, schedule edits, connection acceptance, and queue claiming. Formatting is consistent with Prettier.

## Run locally

Use Node 24 and npm. In Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`.

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
# Fill the required variables below, then:
npm.cmd run dev
```

Open http://localhost:3000. Without Supabase configuration the app shows a setup screen. Do not overwrite an existing `.env.local`; merge new variables from the template instead. Secrets are ignored by Git.

## Supabase setup and migrations

1. Create a new Supabase project dedicated to fictional demo data.
2. Run **all SQL files in `supabase/migrations` in filename order**, once each, using SQL Editor. If Phase 1 is already applied, start at `202611150002_healthcare.sql`; do not rerun the first migration.
3. Add the project URL and publishable key from the project's Connect dialog/Settings → API to `.env.local`. A legacy anon key is also accepted in the public-key variable. Never put a secret or service-role key there.
4. Set the Auth Site URL to `http://localhost:3000`; allow `http://localhost:3000/auth/callback` as a redirect. Enable email/password auth and leave confirmation enabled.
5. Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. Restart the server after environment changes.
6. Register through `/signup`, giving a fictional display name and the correct role. Open the confirmation link in the same browser used to register (PKCE). Use inboxes you control for confirmation; configure Supabase Auth SMTP if its default email restrictions affect your demo.

The Auth trigger rejects missing name/role metadata. Existing accounts created before the first migration need intentional migration by the project owner; there is no automatic privilege-granting backfill.

## Environment variables

| Variable                               | Purpose                                                                                                         |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Required project URL                                                                                            |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Required public client key; RLS enforces access                                                                 |
| `NEXT_PUBLIC_SITE_URL`                 | Trusted app origin used in confirmation emails                                                                  |
| `SUPABASE_SERVICE_ROLE_KEY`            | Server-only secret for the reminder worker and local seed CLI; never used for normal healthcare/social requests |
| `GEMINI_API_KEY`, `GEMINI_MODEL`       | Google AI Studio API key and a text model available to your account                                             |
| `RESEND_API_KEY`                       | Resend sending API key                                                                                          |
| `RESEND_FROM_EMAIL`                    | Sender on a domain verified with Resend                                                                         |
| `CRON_SECRET`                          | Random secret of at least 32 characters for the reminder processor                                              |
| `REMINDER_UPCOMING_MINUTES`            | Upcoming medication window; default 30                                                                          |
| `REMINDER_OVERDUE_MINUTES`             | Overdue notification delay; default 60 (dashboard unconfirmed status uses 60 minutes)                           |
| `REMINDER_APPOINTMENT_MINUTES`         | Appointment reminder window; default 1440                                                                       |

Generate a cron secret locally using `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and store it in the environment. Do not paste secrets into source files or chat.

## Fictional demo accounts and seed safety

The repeatable Jaipur seed creates **Meera, eight elderly companions, two family members, two caretakers and three volunteers**, plus four demo groups and seven sample messages. Family/caretaker access is linked only to seeded Meera. No medical records are seeded. See [Jaipur demo setup and walkthrough](docs/jaipur-demo.md) for the map, account switching and security details.

1. Use a dedicated demo Supabase project with all migrations applied.
2. Set `SUPABASE_SERVICE_ROLE_KEY`, `DEMO_PROJECT_REF` (the reference in your project URL), and `DEMO_ACCOUNT_PASSWORD` (16+ characters) in `.env.local`.
3. Leave `DEMO_EMAIL_DOMAIN=eldencare.invalid` for accounts that cannot receive email, or set a domain you control when testing delivery. Emails use `eldencare-jaipur-KEY@DOMAIN`, for example `eldencare-jaipur-meera@eldencare.invalid`. Keys are in `src/features/demo/catalog.json`.
4. Run `npm.cmd run seed:demo`. Sign in with those emails and your configured demo password. Admin-created demo emails are marked confirmed; this is a local CLI workflow, not a public auth bypass.

The script checks the project reference and requires the explicit `--fictional-data` flag (included in the npm script). Existing accounts are reused only when trusted admin-set metadata identifies the same fixture. Other email collisions abort. Existing passwords/profiles are not overwritten. The transactional graph seeds only once; reruns preserve removed connections, revoked care access, departed group members and new messages. Earlier Bengaluru fixtures remain untouched. Set `DEMO_ACCOUNT_PICKER_ENABLED=true` to enable an email-only picker on normal sign-in; the password is still required and never sent to the browser by the server.

## Demo walkthrough

1. Sign in as Meera. Her seeded care team includes Ananya/Amit and Rahul/Priya. Test the invitation flow with a separately registered fictional family account so the existing one-time-code behavior is exercised as well.
2. Add a fictional medication schedule and appointment. Times use **Asia/Kolkata**. Choose a future dose a few minutes away; once due, mark it taken or not taken. Confirm summaries and activity update.
3. Edit a medication: past doses retain their original name/instructions and confirmations; only future pending doses are replaced. Removing a schedule archives it and keeps past dose records.
4. Open **Reminders** and queue a fictional test reminder to your own account. Without credentials it remains pending. With a verified sender and a real controlled recipient it is submitted to Resend. “Accepted by email provider” does not claim inbox delivery.
5. Ask the companion about today's medicines or the next appointment. These answers come directly from authorized records even without Gemini. Use a general greeting to test Gemini; enable voice only in a supporting browser. Review microphone transcription before sending.
6. Request a call with the demo volunteer. In the volunteer session accept it, then join using the Jitsi link. The public Jitsi service may require the host to sign in; no verified volunteer service is implied.
7. In **Nearby communities**, discover seeded users, send a connection request, and accept it in the recipient session. Create a group, add another accepted connection, send messages, refresh the other session, and leave the group. Leaving removes future read/write access.
8. Revoke Ananya's care membership as Meera. Reload Ananya's view and confirm medical access disappears while unrelated social relationships remain separate. Rerunning the seed must not restore this access.

## Reminder worker and scheduling

`GET /api/cron/reminders` requires `Authorization: Bearer CRON_SECRET`; an absent/short secret or mismatch returns 401. The worker generates doses, queues eligible notifications, and claims at most ten jobs per invocation. No provider credentials means the queued records remain pending.

The database has a unique `(recipient_id, event_key)` constraint. Workers claim rows using `FOR UPDATE SKIP LOCKED`, a lease, and a claim token. Resend receives a stable idempotency key per notification. Retries stop after three attempts; ambiguous attempts older than 23 hours become `uncertain` for manual review, rather than risking a duplicate after the provider's 24-hour window. Revoked care memberships, resolved doses, deleted records and rescheduled appointments are checked before claim. Emails contain generic prompts, not medical details. Missing/changed configuration and delivery failures are visible in the notification list.

`vercel.json` intentionally deploys without a scheduler until your hosting plan is known. For a Vercel plan supporting frequent cron runs, copy `deployment/vercel.cron.example.json` over `vercel.json` and redeploy; it runs every five minutes. Vercel Hobby permits only daily cron jobs, which is insufficient for timely medication reminders. On Hobby, retain the default config and use an authorized external scheduler every five minutes, or trigger the protected endpoint for a demo. The self-only demo button works without waiting for cron, once per account per day.

To test locally without exposing the secret in a URL, set a session environment variable and call:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/cron/reminders -Headers @{ Authorization = "Bearer $env:CRON_SECRET" }
```

PowerShell does not automatically import `.env.local`; set `$env:CRON_SECRET` privately in your terminal or secret manager. Do not put the real value in documentation, screenshots, or source control.

## Tests and checks

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run format:check
```

Vitest covers dose status/adherence, overdue boundaries, notification retry keys, Haversine filtering, connection response rules, AI intents, and auth input boundaries. The integration suite runs every migration in real embedded PostgreSQL (PGlite with pgcrypto), emulating only the Supabase Auth identity tables/functions. It exercises RLS, privileges, invitation redemption/revocation, dose deduplication/history, notification queue claims, social isolation, group membership, recipient-only call acceptance, and persistent AI quotas.

For an additional hosted-database check, run `supabase/tests/authorization.sql` in a disposable Supabase SQL Editor. Its fixtures are transactional and rolled back. Hosted Auth, email delivery, Gemini, microphone permissions, Jitsi and Vercel still require manual end-to-end checks. No connected browser was available in the implementation environment for visual QA.

## Security and prototype limits

- Ordinary reads and mutations use the signed-in user's Supabase client. Every table has RLS. Medical access is owner-or-membership only; social connections and volunteers grant no medical access. Sensitive mutation RPCs have fixed search paths and explicit grants.
- Account roles are stored in immutable-to-client profile rows, not trusted from editable Auth metadata. Codes use 256 random bits, SHA-256 storage, 24-hour expiry and atomic one-time consumption.
- No AI writes or tool execution. Supported record queries are deterministic; general conversation sends only the submitted message to Google, not medical records. User input and AI output are bounded. General AI messages are limited to 20/hour/account in PostgreSQL. Model instructions are a prototype guardrail, not a clinical safety guarantee.
- Social locations are rounded to two decimal places; discovery returns distance, never coordinates or home addresses. Names/bios/interests are intentionally shared with other opted-in users. Group members see group history; leaving does not erase past messages. No reporting/moderation or blocking tools are included.
- Messages are fetched 50 at a time with a timestamp/ID cursor. The latest chat page refreshes every 15 seconds while visible; older history and hidden pages do not poll. Manual refresh remains available. There is no realtime server. Calls are limited to 20/day, connection requests to 30/day, and messages to 30/minute/account at the database boundary.
- Daily medication schedules only; app forms use Asia/Kolkata. No recurring appointment rules or timezone editor. New schedules do not generate retrospective doses. Generation covers a seven-day catch-up window and two future days; keep the worker running to avoid gaps during extended downtime.
- Display limits: 200 doses on today's dashboard, 300 recent medication records, 100 appointments, 200 connection requests, 50 groups/calls/notifications. Adherence aggregates all actual due records in the last seven days rather than a truncated list.
- No password-reset UI, MFA, production audit trail, consent management, calendar integration, or clinical decision support. Provider acceptance is not inbox delivery. Repeated failed/uncertain emails need owner investigation; there is no public admin retry endpoint.
- Final production dependency audit reports zero known vulnerabilities. Seven moderate development-only ESLint/minimatch findings remained after a compatible update; no forced major override was applied.

## Deploy on Vercel

1. Push the repository to your Git provider. Check `.env.local` is ignored.
2. Import it into Vercel using the Next.js preset and Node 24. Install with `npm ci`; build with `npm run build`.
3. Add the required Supabase/site variables. Add server-only Gemini/Resend/worker secrets only for integrations you want to enable. Never add seed passwords or seed project settings to Vercel.
4. Run all unapplied migrations against the selected demo Supabase project.
5. Set `NEXT_PUBLIC_SITE_URL` and the Supabase Auth Site URL to your exact HTTPS deployment URL. Allow `https://YOUR-DOMAIN/auth/callback`; add only known preview URLs if needed.
6. Enable the optional scheduler as described above if your plan supports it. Vercel supplies the configured `CRON_SECRET` as the cron authorization header.
7. Deploy/redeploy after environment changes. Repeat the walkthrough with fictional accounts. Verify unauthenticated cron requests return 401 and unrelated users cannot read healthcare/group records.

No hosted deployment is claimed until these account-dependent steps are completed.

References: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Gemini generateContent](https://ai.google.dev/api/generate-content), [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys), [Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).
