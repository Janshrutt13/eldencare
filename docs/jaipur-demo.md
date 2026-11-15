# Jaipur companionship demo

This extends the existing app and preserves Supabase sign-in, RLS, and medical workflows. There are no unauthenticated seed endpoints, auto-login secrets, simulated acceptances, typing indicators, or automated replies.

## Install and prepare

1. Run `npm.cmd ci`.
2. Apply `202611150008_social_demo.sql`, then `202611150009_demo_seed_graph.sql` in your dedicated demo Supabase project's SQL editor. Apply migrations 001–007 first if not already installed. Do not rerun older applied migrations.
3. In `.env.local`, set the existing Supabase URL and server-only service-role key, `DEMO_PROJECT_REF` matching that URL, and `DEMO_ACCOUNT_PASSWORD` (at least 16 characters).
4. Keep `DEMO_EMAIL_DOMAIN=eldencare.invalid` for fictional accounts, or use a domain you control for delivery testing. Never send to a domain you do not control. Displayed contact addresses always use `example.invalid` and are not actual contact channels.
5. Run `npm.cmd run seed:demo`. This creates 16 fictional accounts: Meera, eight elderly companions, two family members, two caretakers and three volunteers. It also creates four groups and seven sample messages. No medical records are seeded.
6. Optionally set `DEMO_ACCOUNT_PICKER_ENABLED=true` and restart the app. The login form can fill a selected demo email. It never fills or exposes a password; ordinary Supabase authentication is still required.

## Accounts and recipient-side testing

The email pattern is `eldencare-jaipur-KEY@DOMAIN`. Keys are listed in `src/features/demo/catalog.json`: `meera`, `rajesh`, `sunita`, `mohan`, `kamla`, `ramesh`, `asha`, `vijay`, `neelam`, `ananya`, `amit`, `rahul`, `priya`, `sneha`, `arjun`, `kavita`.

Sign in as Meera with your configured demo password. Use a different browser profile/private window for the other account. Signing in as another user within the same browser replaces its session. No app button impersonates another account.

Meera's seeded family/caretakers have care memberships. Nearby companions and volunteers do not. Existing authenticated users are not given Meera's care access or group membership.

## Repeatability and safety

- The CLI requires the matching project reference and `--fictional-data` flag (included in the npm command).
- Only accounts marked by trusted **app metadata** with this seed version/key are reused. An email belonging to an unrelated account aborts seeding. Existing passwords and profile values are not overwritten.
- Earlier Bengaluru demo accounts use different emails and remain untouched.
- The new `demo_people` table contains public **fictional** display data and map coordinates. Authenticated users can read it but cannot insert/change it. It never receives patient location input.
- The initial relationship/group/message graph is inserted in one transaction, with an advisory lock and completion marker in `demo_seed_runs`. Re-running does not duplicate records or restore removed connections, revoked medical access or departed group members. Messages sent after seeding are preserved.
- If account creation is interrupted, rerunning reuses correctly tagged accounts and completes missing rows. A graph error rolls back the entire graph, not the already created Auth accounts. Do not delete real data to repair a seed collision.
- To reset the scenario, use a new dedicated demo project. The script intentionally does not reset a completed demo.

## What is demo-only

- The map is centered at 26.9124, 75.7873 in Jaipur. All marker coordinates are fictional fixtures; no GPS is requested. Distances are calculated by Haversine, never entered separately.
- The 5, 7.5 and 10 km selectors drive the **same filtered collection** for markers and cards. Eight companion fixtures lie roughly 2–10 km from the center. Meera's fixture is at the center and may appear when viewing from another account.
- Map marker previews open on hover or click/tap. “View profile” moves focus to the matching card. Keyboard users can also browse the cards directly.
- Availability is explicitly labeled sample demo availability, not a claim that someone is online.
- Before seeding, static previews are labeled preview-only and cannot send requests. Once seeded, requests, acceptances, messages and call responses use actual authenticated database operations.
- Demo map discovery is independent of the viewer's social coordinates. Connecting requires opt-in on both social profiles. Real nearby profiles retain the existing distance-based authorization and never appear as coordinate-bearing markers. Opting out hides seeded accounts from the live demo discovery results, while their explicitly fictional directory card remains readable.
- The seeded initial accepted connections/group messages are scenario fixtures, not claims that real people responded. New requests must be answered by the recipient account.

## Walkthrough and checks

1. As Meera, open Companion Circle and follow the Jaipur map link. Choose 5, 7.5 and 10 km: the eight companion fixtures yield 3, 6 and 8 profiles respectively. Hover/tap a marker and use View profile.
2. Meera already has some seeded connections. To test a new request, connect to **Ramesh Gupta** from the 7.5/10 km view. Sign in as `ramesh` in a second browser. Accept or decline the incoming request. Refresh Meera's view to see the updated status.
3. Remove an accepted connection. Confirm another account cannot remove it. Shared group membership intentionally remains independent; use Leave group if desired.
4. Open Morning Walkers Circle. Confirm the four seeded messages appear chronologically. Send a message as Meera, then view it as Rajesh/Sunita/Mohan. Your own messages are visually distinct. Initial loading is limited to 50 messages; older pages use timestamp + ID cursors.
5. The chat composer stays within the panel, retains text on failure and clears after a successful save. Blank/overlength messages are rejected in both app and database. Visible latest-message pages refresh every 15 seconds; hidden pages and older-history pages do not poll. No Realtime server or publication changes are needed.
6. Verify Ananya/Amit and Rahul/Priya appear in Meera's Companion Circle with fictional contact details and request/schedule actions. Try an unrelated account: it must not receive authorized call controls for Meera's care team.
7. Request a scheduled call with Sneha. Sign in as `sneha`, accept it, and confirm the Jitsi link appears for both participants and on the relevant dashboards. Jitsi may require the host to sign in. Volunteers are fictional, not verified or emergency services.
8. Run the seed again. Verify the new message remains, no duplicate groups/messages appear, and removed/revoked relationships are not restored.
9. Recheck medicines, appointments, sharing/revocation and unrelated-user/group access. Check desktop/mobile layout and keyboard navigation in a connected browser.

## Validation and remaining external checks

Run `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, and `npm.cmd run build`.

The embedded PostgreSQL suite executes the migrations and tests graph idempotency, group history, nonmember isolation, request authorization, connection removal, map fixture privacy and existing healthcare boundaries. Unit tests verify coordinate-derived distances and radius counts.

Hosted migrations and seeding require project credentials and have not been applied automatically. Live multi-account Auth/PostgREST, tile loading, hover/touch behavior, chat refresh, responsive rendering and Jitsi need browser verification. OpenStreetMap tiles require network access; a visible tile-error message and working list remain if tiles fail. No paid map key is needed. Attribution stays visible, and no tile prefetch/offline download is implemented.

References: [React Leaflet](https://react-leaflet.js.org/docs/start-installation/), [OpenStreetMap tile policy](https://operations.osmfoundation.org/policies/tiles/).
