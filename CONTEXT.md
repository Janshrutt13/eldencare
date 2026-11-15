# EldenCare — continuation context and remaining work

Updated: 15 November 2026 (Asia/Calcutta).

## User objective and preferences

Build a functional, deployed elderly healthcare and companionship hackathon prototype. Prioritize implementation, clear code, security, and simplicity over styling. Work directly in this repository. Use fictional data only. Do not stop for trivial architecture questions.

Requested stack: Next.js App Router/TypeScript, Tailwind, Supabase Auth/PostgreSQL/RLS, Gemini, browser Web Speech APIs, Resend, Jitsi links, Vitest, and Vercel. No Prisma, Redux, Docker, microservices, or custom WebSocket server. UI is white/black/grayscale, large accessible controls, simple lists/cards, desktop sidebar and mobile navigation.

The user interrupted the final verification/handoff to request this context file. **The current task is documentation of remaining work, not further feature development.** Resume implementation when requested.

## Workspace and important instructions

- Repository: `C:\Users\lenovo\OneDrive\Desktop\EldenCare`.
- Windows PowerShell, Node 24; use `npm.cmd` because PowerShell may block `npm.ps1`.
- Read `AGENTS.md` before editing. It directs agents to the installed Next.js documentation in `node_modules/next/dist/docs/` for relevant framework conventions.
- Git is initialized, but all project files are currently untracked; no commit/push/deployment was performed. Preserve user changes and do not overwrite `.env.local`.
- `.env.local` exists and is ignored by Git. Do not print its contents or commit secrets.
- No sub-agents were used. Do not delegate unless the user or applicable instructions request it.
- Earlier Sites skill guidance was consulted, but the user's explicit Next.js/Supabase/Vercel stack takes precedence. Do not migrate the project to Sites hosting or another framework.

## Implemented code

All seven planned phases have implementation or deployment preparation in the repository; **external setup and live verification are not complete**.

1. **Accounts/access:** Supabase SSR clients, session verification, signup/sign-in/confirmation/sign-out, stored roles, one elderly profile per elderly account, authorized profile selection. Hashed 256-bit invitation codes, 24-hour expiry, atomic single-use redemption, role matching, revocation and RLS.
2. **Healthcare:** Medication and appointment CRUD, dose occurrence generation and uniqueness, taken/skipped confirmation, derived overdue-unconfirmed state, actual-record seven-day adherence, recent confirmations. Schedule edits preserve historical snapshots and do not create new retrospective doses. Removal archives schedules and preserves history.
3. **Reminders:** Notification table and queue, upcoming/overdue dose and appointment jobs, call request notifications, Resend worker, unique per-recipient event keys, claim leases/tokens, retry limits and stable provider idempotency keys. Protected `GET /api/cron/reminders`; own-account demo reminder button. Missing credentials leave queued records pending.
4. **Companion:** Floating text panel, microphone transcription, optional spoken responses, explicit supported intents. Medical-record answers use authorized database reads. General conversation calls Gemini server-side with validation and persistent quota. No autonomous record mutations; navigation opens the form for user confirmation.
5. **Companion Circle:** Care-linked family/caretakers and fictional demo volunteers, optional preferred call time, request/accept/decline/cancel, randomized Jitsi link on acceptance, history.
6. **Communities:** Opt-in social profiles, rounded fictional coordinates, 5/10 km Haversine discovery, distance-only results, interests, connections, recipient-only acceptance, groups using accepted connections, additional members, messages with timestamp/ID pagination, leave group. Healthcare data remains separate.
7. **Cleanup/deployment preparation:** Feature-based code, shared form feedback, Prettier, SQL integration tests, safe seed CLI, README, environment template and optional cron config.

## Where to look

- `README.md`: setup, environment variables, walkthrough, security notes and deployment instructions.
- `docs/verification.md`: verification summary and limits.
- `src/features/`: feature actions, forms and domain rules.
- `src/components/ai-companion/companion-panel.tsx`: chat/voice UI.
- `src/lib/ai/`: intent selection and Gemini transport.
- `src/lib/email/processor.ts`: server-only worker; `src/lib/email/domain.ts`: notification text/retry helpers.
- `src/lib/supabase/admin.ts`: isolated admin client for worker/seed use only.
- `src/tests/database.test.ts`: embedded PostgreSQL integration tests, including actual RLS and pgcrypto.
- `scripts/seed-demo.mjs`: CLI-only, guarded fictional account seeding.
- `vercel.json`: deployable Next.js config with **no scheduler enabled**.
- `deployment/vercel.cron.example.json`: optional five-minute scheduler for a compatible hosting plan.

## Database migration state

The agent has **not applied migrations to hosted Supabase**. Do not assume which ones the user has applied; inspect migration state or ask when needed. All migrations execute successfully in the local embedded test database.

Run unapplied files once each in this order:

1. `supabase/migrations/202611150001_initial_auth_and_care.sql`
2. `supabase/migrations/202611150002_healthcare.sql`
3. `supabase/migrations/202611150003_notifications.sql`
4. `supabase/migrations/202611150004_companionship.sql`
5. `supabase/migrations/202611150005_usage_limits.sql`
6. `supabase/migrations/202611150006_dashboard_summary.sql`
7. `supabase/migrations/202611150007_service_permissions.sql`

If Phase 1 is already installed, begin with `002`, not `001`. These are ordered migrations, not rerunnable seed scripts. For an already-applied schema, make subsequent changes through new migrations rather than silently editing applied files.

## Verified at handoff

- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed.
- `npm.cmd test`: **30 tests passed across six files**.
- `npm.cmd run build`: passed, including the final build whose output was collected after the interruption.
- `npm.cmd run format:check`: passed after the final build.
- `npm.cmd audit --omit=dev`: zero reported production vulnerabilities.
- Seven moderate development-only ESLint/minimatch findings remain. A compatible audit fix did not resolve them; no forced upgrade/override was applied.
- HTTP smoke checks: `/login` and `/signup` return 200. Unauthenticated `/dashboard`, `/dashboard/medications`, `/dashboard/appointments`, `/dashboard/circle`, `/dashboard/communities` redirect to `/login`. Unauthenticated cron returns 401.
- Git confirms `.env.local` is ignored.

Integration tests run real embedded PostgreSQL with pgcrypto; only Supabase Auth identity/schema is emulated. Tests include invitations/expiry/revocation, unauthorized medical access, dose duplication/history, future-dose rejection, notification deduplication/claims/stale-job cancellation, discovery privacy, connection/group authorization, recipient-only calls and usage quotas.

No hosted Auth/email/AI/video flow was validated. No live messages, emails, calls or social requests were sent. Test data is isolated in memory. Browser inventory returned no available browsers/apps, so visual and interactive QA remain outstanding. The agent-owned temporary production server on port 3100 was stopped; do not stop any user-owned development server.

## Environment state last checked

Present locally (values were not printed):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

Missing at the last check:

- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CRON_SECRET`

Check presence again when resuming; the user may have configured more since then. Normal healthcare/social functionality uses the public key plus the signed-in user and does not require the service-role key.

## Completed since last context update

- `middleware.ts` created at project root — wires `src/proxy.ts` as Next.js middleware so Supabase session cookies are refreshed on every matched request. Previously the proxy existed but was never loaded.
- `care_summary` RPC return type corrected in `src/types/database.ts` — PostgreSQL `count()` returns `bigint`, which PostgREST serialises as a JSON string. The type was `number`; changed to `string` to match the wire format.
- Dashboard `src/app/dashboard/page.tsx` — coerces `care_summary` bigint strings to `Number()` before arithmetic and rendering, preventing `NaN` in the adherence percentage display.
- Medications and appointments pages — early-return path when no elder profile is selected now wraps the `ProfilePicker` in a `<div>` with an `<h1>` heading for accessibility.

## Remaining work, in priority order

### 1. Apply hosted database changes and verify core workflows

- Determine which migrations are already applied, then apply the remaining ones to the dedicated demo Supabase project.
- Confirm Auth Site URL/redirects and email provider setup. Create fictional accounts using controlled inboxes, or run the optional seed script after its required configuration.
- Exercise sign-up/confirmation/login/logout, care invitations and immediate revocation using separate sessions.
- Exercise medication creation/edit/archive, due-dose confirmation, adherence summaries and appointment CRUD through the app against hosted Supabase/PostgREST.
- Validate unrelated accounts and volunteers cannot read or mutate medical records. Validate group read/write access disappears after leaving.
- Fix observed bugs; do not equate a successful build with successful hosted integration.

### 2. Configure and test external integrations

- Add the server-only Supabase worker key, Resend key/verified sender and a random cron secret of 32+ characters. Merge variables from `.env.example`; never overwrite existing configuration.
- Test the self-only fictional reminder with an actual controlled recipient. Check both persisted status and provider logs. Provider acceptance is not proof of inbox delivery.
- Test cron authorization, queueing, repeat invocations, retries and suppression of stale/resolved notifications. Keep uncertain deliveries for manual review rather than blindly resending.
- Set a Google AI Studio key and supported text model ID. Test general chat, provider failure and hourly limits; verify deterministic medicine/appointment/navigation intents continue to work without Gemini.
- Test browser microphone permissions, unsupported-browser fallback, transcription review, speech output and stop/close behavior.
- Accept a call in the recipient session and verify Jitsi hosting/joining. The public Jitsi host may need to sign in.

### 3. Seed and demonstrate social flows

- Optional seed requires matching `DEMO_PROJECT_REF`, `DEMO_ACCOUNT_PASSWORD` (16+ characters) and the server-only key. Run `npm.cmd run seed:demo` only in a dedicated fictional-data project.
- Seed script creates four new demo accounts/social profiles; it refuses existing demo emails and never overwrites/deletes accounts. Default `.invalid` emails cannot receive notifications.
- Verify discovery opt-in/out, 5/10 km filtering, common interests, request acceptance/decline, group creation/additional members, message pagination, refresh and leaving.
- Verify both sides of these flows using separate sessions; no simulated success states should be introduced.

### 4. Browser/accessibility QA and final checks

- Once browser access is available, check desktop/mobile navigation, overflow, large controls, keyboard focus, details/forms, empty/error/loading states and the floating companion.
- Verify companion profile selection matches the currently selected authorized profile.
- Re-run the relevant tests after fixes, then typecheck, lint, production build and format check.
- Investigate development dependency advisories with compatible upgrades if available; do not suppress errors or force incompatible major versions just to clear audit output.

### 5. Deploy to Vercel

- Commit/push to the user's selected repository when requested/authorized; there is no existing pushed application or deployment URL in this session.
- Import with Next.js/Node 24, add environment variables, and configure exact HTTPS Auth callback URLs.
- Keep the default scheduler-free `vercel.json` for Hobby unless a supported external scheduler is configured. Vercel Hobby's daily cron is insufficient for medication windows.
- For a plan supporting frequent cron, copy the optional cron template over `vercel.json` and deploy. It invokes the protected endpoint every five minutes.
- Run the walkthrough on the deployed app and verify cron access protection. Report the actual URL only after a verified deployment.

## Known prototype limits / possible follow-up implementation

- Medication/appointment forms assume Asia/Kolkata; no timezone editor, recurring appointments, or complex medication recurrence.
- Dashboard unconfirmed threshold is fixed at 60 minutes, whereas email overdue delay is configurable. If a unified configurable threshold is desired, update SQL summary, rendered dose statuses and tests together.
- Generation catches up seven days and prepares two future days. Extended worker downtime can leave historical gaps; this is documented, not silently reconstructed.
- Some lists have explicit prototype limits (see README); adherence is an aggregate over all actual due records, not only displayed rows.
- Chat refresh is manual. No realtime, moderation, reporting, blocking, or social connection removal UI.
- Group additions give an accepted connection immediate group/history access; adding users is explained and confirmed in the UI. Leaving does not delete previous messages.
- General AI safety relies partly on model instructions; not a clinical safety guarantee. No diagnostic/treatment features are intended.
- No password-reset UI, MFA, production audit trail, clinical consent management, or public administrative retry endpoint.
- Usage counters are persistent; long-term housekeeping/retention is not implemented.
- Seed script does not populate medicines/appointments; use fictional entries through the actual CRUD UI.

## Suggested resume instruction

“Read CONTEXT.md and README.md. Continue from the hosted migration and end-to-end verification checklist, preserving the current implementation. Inspect current configuration without printing secrets. Focus on fixing demonstrated implementation gaps and deployment, not redesigning or rebuilding the app.”
