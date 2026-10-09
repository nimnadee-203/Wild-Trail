# Assignment 02 testing report — Wild-Trail

Results recorded from executed Jest output. Runtime date: 9 October 2026 (Asia/Colombo).

## Project inspection and framework

This repository contains one Expo Router application targeting mobile and web, with ranger, manager, liaison and community workflows. There is no separate dashboard package. Source is TypeScript/TSX; React 19.2.3, React Native 0.86.3 and Expo SDK 57 are installed. Firestore/Firebase Authentication, AsyncStorage, Expo Location, Expo Image Picker, Expo FileSystem and Cloudinary implement external boundaries. Routes live in src/app; services, hooks, storage, types and components live outside it.

No Jest/Vitest configuration existed. scripts/test-community-reports.cjs was the existing standalone Node/TypeScript VM regression test. It is retained and passes separately; overlapping community parser/retry assertions are deliberately included in Jest so they receive independent test names and instrumented coverage. Its assertions are not counted as additional Jest tests.

Jest 29.7 with jest-expo 57 and React Native Testing Library 14 tests the actual production modules and location hook. SDK-compatible packages were installed through Expo CLI. Reference: [Expo unit testing](https://docs.expo.dev/develop/unit-testing/) and [SDK 57](https://docs.expo.dev/versions/v57.0.0/).

## Commands and verification

Run from the repository root (use npm.cmd/npx.cmd in Windows PowerShell if execution policy blocks .ps1 shims):

~~~sh
npm test
npm run test:coverage
npm run test:coverage -- --json --outputFile=test-results.json
node scripts/testing-report.cjs
npm run test:community:legacy
npx expo lint
npx tsc --noEmit
~~~

Jest: **279 passed, 0 failed**, 0 pending; 20 passed suites, 0 failed suites. Legacy community script passed. Typecheck passed. Lint passed with 0 errors and 28 existing production warnings. Production functionality, UI and navigation were not modified. No commit or push was performed.

## Actual coverage

Numbers below always use the order **statements / branches / functions / lines**. Aggregates are weighted covered/total counts, not averages of file percentages.

- Relevant service, storage and hook logic: **98.88% / 94.37% / 97.16% / 99.09%**.
- Full configured use-case scope, including screen handlers and manager views: **97.04% / 89.17% / 92.77% / 97.52%**.

The full configured use-case scope now exceeds 80% on every metric. Jest enforces a global 80% threshold for statements, branches, functions and lines across the unchanged collection scope. These numbers describe this configured use-case scope, not every file in the application or a guarantee of university marks. No screen was removed from coverage. The previous run had 178 passing tests and 40.19% statement coverage; the increase comes from executing existing screen behavior with interaction tests.

| Member | Use Case | Tests Passed | Tests Failed | Coverage | Test Types |
| --- | --- | ---: | ---: | --- | --- |
| Yasanga A K D S (IT23731264) | UC1 | 66 | 0 | Service/hook: 100.00% / 93.89% / 100.00% / 100.00%<br>Full UC: 96.97% / 86.66% / 93.62% / 97.46% | Positive, negative, edge, error |
| Mabula N I D (IT23624108) | UC2 | 36 | 0 | Service/hook: 100.00% / 98.28% / 100.00% / 100.00%<br>Full UC: 99.01% / 96.86% / 96.77% / 98.95% | Positive, negative, edge, error |
| Akash G L M (IT23589254) | UC3 | 43 | 0 | Service/hook: 100.00% / 100.00% / 100.00% / 100.00%<br>Full UC: 96.10% / 94.77% / 89.71% / 95.83% | Positive, negative, edge, error |
| Kaushallya G K Y (IT23765092) | UC4 | 88 | 0 | Service/hook: 96.90% / 91.28% / 92.16% / 97.21%<br>Full UC: 96.72% / 87.64% / 91.30% / 97.66% | Positive, negative, edge, error |

Member rows count dedicated suites only. Shared location (8 tests), upload (11), photo adapters (17), and storage/client (10) tests are counted once in the overall total, not duplicated per member. UC1's offline queue is shared with UC2. Each coverage cell distinguishes the existing service/hook mapping from that same mapping plus its ranger/community/manager screens. The exact source mapping is in scripts/testing-report.cjs; shared dependencies can appear in multiple scopes. Global coverage includes shared client logic. Zero-executable-line re-export wrappers remain configured; their displayed 0% does not add uncovered executable lines.

## Added screen-level coverage

All 178 original tests are retained. New suites use React Native Testing Library to render real screens and exercise their handlers. No production source, UI, navigation or business behavior was modified.

| Use case | Previously untested behavior now exercised |
| --- | --- |
| UC1 | Start/stop and timer cleanup; deterministic GPS breadcrumbs; restored sessions; GPS fallback; manual waypoint category/notes; observation validation/type; offline queue and connectivity restoration; completion summary/navigation; manager required fields, route/checkpoint validation, ranger availability, date/time selection, create/edit/unassign/delete, error feedback and map undo/clear. |
| UC2 | Category mapping/custom category; priority/location/description; review/back navigation; required-field errors; camera/gallery cancellation/failure and attachment/discard/removal; pending submission disables repeat presses; success/photo warnings and retry; manager location fallbacks, search, filters and details. |
| UC3 | Ranger severity filters, details/map navigation and browser/native dispatch; loading and missing documents; response acknowledgement/completion status writes and navigation; manager filtering, selected detail resolution, pending state/errors and local demo behavior; monitoring preview controls. |
| UC4 | Sequential validation, all categories, custom village/boundary, manual/GPS landmarks, invalid date, review/save/receipt/reset, photos, pending state and failures; urgent GPS/animal/direction validation and submission; per-record/global sync and statuses; operations loading/search, acceptance/response/errors, demo owner display, SMS simulation and route wrappers. |

Controlled child doubles exercise parent callback contracts for maps, location, village/boundary, date and dynamic-description fields; their own picker UI is not covered by these screen tests. The alert detail side box is a callback-preserving double while the manager screen's real resolution handler runs. Manager shell, camera preview and decorative icons/images are mocked. Backend, camera selection and location are mocked; there is no real network. Pending state tests use deferred dependencies to verify that controls stay disabled before completion. RNTL 14 awaits asynchronous fireEvent handlers, so the local beginPress helper uses its installed event-handler resolver to observe pending state; a library major upgrade may require updating this test-only helper.

## Use cases and meaningful cases

### UC1 — Conduct and track ranger patrol

Source: services/api/patrols.ts, services/api/offlineSync.ts, services/scheduledPatrols.ts, hooks/useLocation.ts and storage/asyncStorage.ts. Screen: app/(ranger)/patrol.tsx; manager planning: app/(manager)/patrols.tsx.

Positive: session start persists initial path and ranger state; GPS points/manual waypoints/observations append; completion stores history and clears active state; manager assignments normalize and persist fields. Negative: recording without an active session returns null. Edges: legacy absent arrays, empty/single/repeated route, zero/negative/overplanned distance, default status. Errors: remote failures retain local workflows; GPS denial/unavailable device service; corrupt storage; manager timeout. The current 4.8 km route fallback and 1% minimum completion are characterized as existing behavior, not endorsed calculations.

### UC2 — Report wildlife / poaching incident

Source: services/api/incidents.ts, services/incidentReporter.ts, services/cloudinary.ts, incidentPhoto.ts/.native.ts; shared location, queue and client. Screen: app/(ranger)/report-incident.tsx; manager listing: app/(manager)/incidents.tsx.

Positive: trimmed pending incident, category/location preservation, anonymous reporter metadata, photo links, history sorting. Negative: blank description, empty/oversized files and invalid upload URL. Edges: zero coordinates, exactly 10 MB, missing timestamps, partially successful uploads, shared concurrent sign-in. Errors: authentication/database denial, upload timeout, photo-link failure, network errors. Assertions inspect actual payloads, stored queues, warnings and control flow rather than merely repeating mocked results.

### UC3 — Monitor tracked wildlife and respond to risk alerts

Source: services/managerAlerts.ts, services/api/alerts.ts; ranger acknowledgement/dispatch handlers in app/(ranger)/alerts/index.tsx. Other screens: app/(ranger)/alerts/[id].tsx and confirm.tsx, app/(manager)/alerts.tsx and monitoring.tsx.

Positive: Firestore subscription maps supplied wildlife metadata, resolves the selected ID, ranger acknowledges and confirms dispatch. Negative: already acknowledged button prevents duplicate acknowledgement; database failures surface feedback. Edges: missing metadata, unknown severity/status, zero coordinates, empty snapshots, string/Firestore timestamps. Errors: subscription callback forwarding and rejected resolution. Subscription cleanup is asserted. Mocked readings are existing alert documents, not simulated risk detection.

### UC4 — Report human-wildlife conflict

Source: services/communityReports.ts and communityPhoto.ts/.native.ts; routes app/community-report.tsx, app/community-operations.tsx and app/(manager)/community-reports.tsx; components/CommunityOperationsScreen.tsx.

Positive: all six categories/SMS keywords, durable local report, manual landmark address and optional urgent GPS, sync confirmation, ranger/liaison acceptance and response. Negative: missing fields/date/category, malformed SMS, anonymous/disallowed roles, wrong owner, unavailable operation. Edges: concurrent saves/sync, existing server ID, duplicate acceptance, zero coordinates, retry without duplicate upload, demo responses remain local. Errors: retention/upload/link/transaction failures leave recoverable queue state. Existing staff status is preserved during photo retry.

## Isolation and limitations

External Firebase, device storage, native file APIs, camera selection, location and uploads are mocked. Real source services/hooks and screen state/handlers execute; storage/transaction test doubles preserve state to verify writes, retries and ownership. Global fetch fails unless explicitly mocked, so no real network is needed. Timers are controlled for upload/scheduling/location and patrol tracking tests, and patrol movement uses a fixed random value. Tests reset state, mocks and listeners, and use synthetic identities/photos. These unit tests do not verify Firestore security rules, physical GPS, real camera permissions, actual Cloudinary credentials, browser rendering or device end-to-end behavior.

## Implementation and remaining coverage gaps

- UC1 service does not enforce start/stop state transitions, prevent concurrent active patrols, or validate waypoint coordinate ranges. No invented rejection test was added. Scheduled-point mapping only filters nonfinite values, not geographic ranges.
- The generic offline queue marks failed Firestore writes SUBMITTED and counts them as synchronized. PATROL_POINT has no remote writer but is also marked submitted. Dedicated characterization tests expose these defects; passing tests do not mean synchronization is reliable. The sync method itself does not gate on its simulated connectivity flag.
- UC2 service requires description but does not enforce title/category/GPS validity. Screen validation, hook-reported camera cancellation/failure, attachment flow and submission disabling are now tested. Native permission dialogs and the camera hook itself are outside these screen tests. Direct createIncident is not itself an offline queue or duplicate-prevention mechanism.
- UC3 has no implemented collar ingestion, risk-zone geometry/detection, risk-alert generation or deduplication engine. Do not claim tests for entering/outside zones, invalid collar readings or alert escalation. Manager service displays existing alerts; resolution writes RESPONDED without validating a prior state. Time ordering currently compares displayed strings rather than chronological timestamp values.
- UC3 detail and confirmation loading states remain indefinitely for missing IDs/documents. The detail fetch has no catch for database rejection. Existing response and completion handlers catch remote status-write failures but still update ranger status and navigate; dedicated tests characterize this behavior rather than claiming reliable remote acknowledgement. The manager alert list falls back to mock rows when the live list is empty. No production changes were made to these paths.
- UC4 validation does not validate urgent GPS ranges, phone format or future event dates. Browser online events, legacy collection migration, some demo overlay paths and uncommon ownership/name fallbacks remain partially uncovered. Form confirmation, photos, GPS failures and queue controls are now exercised; native picker implementations are isolated behind controlled child doubles. Client-side respondToCommunityReport delegates production authorization to Firestore rules; mocked tests cannot establish backend access security.
- Remaining screen gaps include some icon-only back/close handlers, calendar month navigation, uncommon empty/default summary fallbacks, modal dismissal callbacks, and route layout rendering. The per-file coverage table and HTML report expose the exact uncovered lines and branches. No production refactor was needed.

## Per-file coverage and tested source

Nonzero values identify executed source. Zero-covered files are deliberately included in the denominator.

| Source file | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| src/app/community-operations.tsx | 0% | 0% | 0% | 0% |
| src/app/community-report.tsx | 97.41% | 84.94% | 91.07% | 97.29% |
| src/app/(manager)/alerts.tsx | 97.77% | 97.61% | 94.73% | 97.61% |
| src/app/(manager)/community-reports.tsx | 100% | 100% | 100% | 100% |
| src/app/(manager)/incidents.tsx | 100% | 100% | 100% | 100% |
| src/app/(manager)/monitoring.tsx | 100% | 90% | 100% | 100% |
| src/app/(manager)/patrols.tsx | 94.58% | 84.73% | 93.75% | 95.62% |
| src/app/(ranger)/patrol.tsx | 95.38% | 83.14% | 85.71% | 95.69% |
| src/app/(ranger)/report-incident.tsx | 97.72% | 95.45% | 93.1% | 97.64% |
| src/app/(ranger)/alerts/[id].tsx | 91.66% | 75% | 66.66% | 91.3% |
| src/app/(ranger)/alerts/_layout.tsx | 0% | 100% | 0% | 0% |
| src/app/(ranger)/alerts/confirm.tsx | 92.5% | 86.36% | 80% | 92.3% |
| src/app/(ranger)/alerts/index.tsx | 98.21% | 97.36% | 94.44% | 98.14% |
| src/components/CommunityOperationsScreen.tsx | 94.38% | 87.25% | 90% | 100% |
| src/hooks/useLocation.ts | 100% | 100% | 100% | 100% |
| src/services/cloudinary.ts | 100% | 100% | 100% | 100% |
| src/services/communityPhoto.native.ts | 100% | 100% | 100% | 100% |
| src/services/communityPhoto.ts | 100% | 100% | 100% | 100% |
| src/services/communityReports.ts | 96.55% | 90.37% | 91.3% | 96.91% |
| src/services/incidentPhoto.native.ts | 100% | 100% | 100% | 100% |
| src/services/incidentPhoto.ts | 100% | 100% | 100% | 100% |
| src/services/incidentReporter.ts | 100% | 100% | 100% | 100% |
| src/services/managerAlerts.ts | 100% | 100% | 100% | 100% |
| src/services/scheduledPatrols.ts | 100% | 100% | 100% | 100% |
| src/services/api/alerts.ts | 100% | 100% | 100% | 100% |
| src/services/api/client.ts | 100% | 100% | 100% | 100% |
| src/services/api/incidents.ts | 100% | 96.15% | 100% | 100% |
| src/services/api/offlineSync.ts | 100% | 100% | 100% | 100% |
| src/services/api/patrols.ts | 100% | 89.42% | 100% | 100% |
| src/storage/asyncStorage.ts | 100% | 100% | 100% | 100% |

## Screenshot evidence for the Assignment 02 PDF

1. Run npm test -- --verbose and capture terminal sections with descriptive cases and the final passed/failed totals. Use Windows Snipping Tool (Win+Shift+S); include the command and totals in the image.
2. Run npm run test:coverage without --json to display the coverage table and enforce all four 80% global thresholds. Capture the table and suite totals. If the terminal is too narrow, maximize it or reduce font size; do not crop away the full-scope total.
3. Open coverage/index.html in a browser. Capture the overall summary and relevant service pages for each member; click a file to show covered/uncovered branches and lines.
4. Capture lint/typecheck completion separately. Include captions distinguishing service coverage from full use-case coverage. Generated coverage and test-results.json are ignored by Git; this Markdown and tests are reviewable source artifacts.

## Executed case inventory

### uc3-feed-interactions.test.js

- passed: UC3 ranger filters risk levels, opens selected alert and map
- passed: UC3 native dispatch failure reports error without success feedback
- passed: UC3 browser dispatch confirmation=false controls remote write
- passed: UC3 browser dispatch confirmation=true controls remote write
- passed: UC3 browser acknowledgement and dispatch failures show feedback

### uc4-report-screen.test.js

- passed: UC4 review validates village, boundary, location and description sequentially
- passed: UC4 screen selects category elephant_sighting, reviews and saves offline with manual location
- passed: UC4 screen selects category crop_raiding, reviews and saves offline with manual location
- passed: UC4 screen selects category livestock_attack, reviews and saves offline with manual location
- passed: UC4 screen selects category property_damage, reviews and saves offline with manual location
- passed: UC4 screen selects category human_injury, reviews and saves offline with manual location
- passed: UC4 screen selects category other_wildlife_conflict, reviews and saves offline with manual location
- passed: UC4 custom village/boundary and GPS are composed into submitted landmark
- passed: UC4 invalid date blocks review and GPS alone supplies optional landmark
- passed: UC4 save error remains visible and form supports retry 0
- passed: UC4 save error remains visible and form supports retry 1
- passed: UC4 save loading state prevents repeat submission and triggers online delivery
- passed: UC4 photo capture/gallery selection can be removed and optional attachment reaches queue
- passed: UC4 photo cancellation/error leaves report editable 0
- passed: UC4 photo cancellation/error leaves report editable 1
- passed: UC4 photo cancellation/error leaves report editable 2
- passed: UC4 saved queue failure displays recovery message and subscription cleans up
- passed: UC4 urgent alert requires direction and GPS, then submits actual captured coordinates
- passed: UC4 urgent GPS handles denied and can refresh
- passed: UC4 urgent GPS handles error and can refresh
- passed: UC4 urgent GPS handles unknown and can refresh
- passed: UC4 urgent other animal validates name and shows save errors 0
- passed: UC4 urgent other animal validates name and shows save errors 1
- passed: UC4 waiting report sync action targets one record and refreshes success status
- passed: UC4 failed report sync action targets one record and refreshes success status
- passed: UC4 global sync failure shows error and restores controls 0
- passed: UC4 global sync failure shows error and restores controls 1
- passed: UC4 network toggle and subscription update online state; queue status/photos display real fallbacks

### uc2-incident-screen.test.js

- passed: UC2 screen submits Snare with mapped category and selected priority
- passed: UC2 screen submits Carcass with mapped category and selected priority
- passed: UC2 screen submits Illegal Campsite with mapped category and selected priority
- passed: UC2 screen submits Wildlife Sighting with mapped category and selected priority
- passed: UC2 screen requires description and location before contacting backend
- passed: UC2 custom category requires text and supports editing type from details
- passed: UC2 submission disables repeat presses while pending and displays photo warning
- passed: UC2 submission failure preserves review and permits retry 0
- passed: UC2 submission failure preserves review and permits retry 1
- passed: UC2 photo preview must be attached or discarded before review; gallery attachment can be removed
- passed: UC2 camera cancellation/failure leaves form usable 0
- passed: UC2 camera cancellation/failure leaves form usable 1
- passed: UC2 camera cancellation/failure leaves form usable 2
- passed: UC2 back navigation returns from details to category then dashboard

### uc1-manager-screen.test.js

- passed: UC1 manager validates required fields, route and checkpoints before scheduling
- passed: UC1 manager schedules ranger, route, checkpoint, end time and instructions
- passed: UC1 manager edits and unassigns ranger while preserving status
- passed: UC1 manager save failure shows error and restores controls
- passed: UC1 manager unassign failure shows error and restores controls
- passed: UC1 manager delete failure shows error and restores controls
- passed: UC1 manager delete waits for confirmation and removes selected assignment
- passed: UC1 manager prevents selecting busy ranger; supports undo/clear map and time cancellation
- passed: UC1 manager assignment filters distinguish unassigned, active and completed teams
- passed: UC1 manager ranger loading errors and subscription errors surface 0
- passed: UC1 manager ranger loading errors and subscription errors surface 1

### uc1-patrol-screen.test.js

- passed: UC1 screen starts tracking, records deterministic GPS breadcrumbs, stops and navigates after completion
- passed: UC1 loads saved path, waypoints and observations and includes them in assigned patrol summary
- passed: UC1 invalid/empty route parameter uses existing fallback 0
- passed: UC1 invalid/empty route parameter uses existing fallback 1
- passed: UC1 invalid/empty route parameter uses existing fallback 2
- passed: UC1 waypoint captures GPS with selected category and trimmed notes
- passed: UC1 offline waypoint/observation use last path when GPS unavailable and sync when restored
- passed: UC1 observation validates description and records selected type
- passed: UC1 offline completion queues the patrol summary and connectivity toggle updates state
- passed: UC1 cancel waypoint/observation leaves records untouched and refresh requests device GPS
- passed: UC1 displays location loading state and clears tracking interval on unmount

### uc4-operations-screen.test.js

- passed: UC4 operations subscription shows loading then filters searches and reports
- passed: UC4 ranger opens response, accepts and saves chosen status/notes
- passed: UC4 liaison opens response, accepts and saves chosen status/notes
- passed: UC4 operations acceptance and response errors stay in details 0
- passed: UC4 operations acceptance and response errors stay in details 1
- passed: UC4 accepted demo report exposes owner without another accept button
- passed: UC4 operations subscription errors show failure and no reports
- passed: UC4 SMS simulation uses edited input and gives explicit prototype receipt
- passed: UC4 SMS invalid input prevents queueing 0
- passed: UC4 SMS invalid input prevents queueing 1
- passed: UC4 manager and community route wrappers render actual operations content

### uc3-manager-screen.test.js

- passed: UC3 manager filters active/severity/resolved alerts and opens/closes selected details
- passed: UC3 manager resolves route-selected alert and displays pending state
- passed: UC3 manager resolution failure restores controls with feedback 0
- passed: UC3 manager resolution failure restores controls with feedback 1
- passed: UC3 manager subscription error and empty filter display recovery message
- passed: UC3 mock alert resolution stays local without backend mutation
- passed: UC3 monitoring selects camera and toggles preview pause

### uc3-response-screens.test.js

- passed: UC3 details displays loading before alert document resolves
- passed: UC3 acknowledgement/respond navigation after write failure=false characterizes existing behavior
- passed: UC3 acknowledgement/respond navigation after write failure=true characterizes existing behavior
- passed: UC3 missing id/document leaves details loading 0
- passed: UC3 missing id/document leaves details loading 1
- passed: UC3 confirmation completes response even if remote resolution fails=false
- passed: UC3 confirmation completes response even if remote resolution fails=true
- passed: UC3 confirmation fallback metadata and return-to-alerts route
- passed: UC3 confirmation handles missing document by retaining loading state
- passed: UC3 confirmation handles denied document by retaining loading state
- passed: UC3 confirmation handles absent document by retaining loading state

### uc3-alert-screen.test.js

- passed: UC3 ranger acknowledges pending alert and unsubscribes on unmount
- passed: UC3 acknowledgement failure shows error feedback
- passed: UC3 already acknowledged alert prevents duplicate acknowledgement
- passed: UC3 dispatch confirmation resolves selected alert

### uc2-manager-screen.test.js

- passed: UC2 manager maps location fallbacks, filters and searches incidents and opens details
- passed: UC2 manager fetch error shows feedback 0
- passed: UC2 manager fetch error shows feedback 1

### uc4-community.test.js

- passed: UC4 accepts category elephant_sighting and parses its SMS keyword
- passed: UC4 accepts category crop_raiding and parses its SMS keyword
- passed: UC4 accepts category livestock_attack and parses its SMS keyword
- passed: UC4 accepts category property_damage and parses its SMS keyword
- passed: UC4 accepts category human_injury and parses its SMS keyword
- passed: UC4 accepts category other_wildlife_conflict and parses its SMS keyword
- passed: UC4 rejects blank required field village
- passed: UC4 rejects blank required field boundarySection
- passed: UC4 rejects blank required field landmark
- passed: UC4 rejects blank required field description
- passed: UC4 rejects invalid category/date 0
- passed: UC4 rejects invalid category/date 1
- passed: UC4 rejects malformed SMS BAD | Village | East | Gate | Damage
- passed: UC4 rejects malformed SMS CROP | incomplete
- passed: UC4 rejects malformed SMS CROP | V | E | G | D | extra
- passed: UC4 rejects malformed SMS CROP |  | E | G | D
- passed: UC4 saves durable photos locally and confirms waiting status without remote write
- passed: UC4 photo retention failure never queues incomplete report
- passed: UC4 concurrent local submissions preserve both reports
- passed: UC4 offline report remains waiting until connectivity returns
- passed: UC4 sync uses stable ID, manual landmark address and optional GPS; avoids duplicates
- passed: UC4 failed upload retries without recreating report or overwriting staff response
- passed: UC4 failed link update retries without uploading retained photo again
- passed: UC4 transaction failure records error and can retry
- passed: UC4 existing server document is not overwritten
- passed: UC4 sync filters by target and owner
- passed: UC4 reports sync status 0
- passed: UC4 reports sync status 1
- passed: UC4 reports sync status 2
- passed: UC4 reports sync status 3
- passed: UC4 reports sync status 4
- passed: UC4 reports sync status 5
- passed: UC4 network subscriptions unsubscribe and isolate failing listeners
- passed: UC4 anonymous users cannot accept operations 0
- passed: UC4 anonymous users cannot accept operations 1
- passed: UC4 role manager cannot accept ranger operations
- passed: UC4 role community cannot accept ranger operations
- passed: UC4 role admin cannot accept ranger operations
- passed: UC4 active ranger accepts pending operation
- passed: UC4 active liaison accepts pending operation
- passed: UC4 rejects missing or unavailable operation 0
- passed: UC4 rejects missing or unavailable operation 1
- passed: UC4 rejects missing or unavailable operation 2
- passed: UC4 response propagates database error
- passed: UC4 demo officer accepts locally, rejects duplicates, and saves trimmed response
- passed: UC4 demo acceptance validates availability 0
- passed: UC4 demo acceptance validates availability 1
- passed: UC4 demo acceptance validates availability 2
- passed: UC4 report subscription converts dates, sorts and cleans up

### location.test.js

- passed: UC1/UC2 GPS success on ios maps device coordinates
- passed: UC1/UC2 GPS success on android maps device coordinates
- passed: UC1/UC2 GPS success on web maps device coordinates
- passed: UC1/UC2 permission denial on ios
- passed: UC1/UC2 permission denial on web
- passed: UC1/UC2 GPS failure 0
- passed: UC1/UC2 GPS failure 1
- passed: UC1/UC2 GPS failure 2

### uc1-patrol.test.js

- passed: UC1 starts a session with initial route point and persists ranger status
- passed: UC1 starts locally when remote update fails and route is empty
- passed: UC1 addActualPathPoint refuses to record without active session
- passed: UC1 addMarkedWaypoint refuses to record without active session
- passed: UC1 addPatrolObservation refuses to record without active session
- passed: UC1 appends GPS points, manual waypoints and observations without losing existing data
- passed: UC1 addActualPathPoint supports legacy sessions without arrays
- passed: UC1 addMarkedWaypoint supports legacy sessions without arrays
- passed: UC1 addPatrolObservation supports legacy sessions without arrays
- passed: UC1 status falls back from stored status to session then AVAILABLE
- passed: UC1 status can be saved without a session
- passed: UC1 completion clamps distance 0 to percentage 1
- passed: UC1 completion clamps distance 2.4 to percentage 50
- passed: UC1 completion clamps distance 9.6 to percentage 100
- passed: UC1 completion clamps distance -1 to percentage 1
- passed: UC1 end still clears local session when Firestore fails
- passed: UC1 route distance handles boundary route 0
- passed: UC1 route distance handles boundary route 1
- passed: UC1 route distance handles boundary route 2
- passed: UC1 route distance handles boundary route 3
- passed: UC1 maps scheduled status scheduled
- passed: UC1 maps scheduled status on patrol
- passed: UC1 maps scheduled status completed
- passed: UC1 maps scheduled status cancelled
- passed: UC1 assigned patrols merge completion history and survive database failure
- passed: UC1 maps Firestore assignments and completion history
- passed: UC1/UC2 offline queue processes WAYPOINT (PATROL_POINT has no remote writer)
- passed: UC1/UC2 offline queue processes OBSERVATION (PATROL_POINT has no remote writer)
- passed: UC1/UC2 offline queue processes PATROL_SUMMARY (PATROL_POINT has no remote writer)
- passed: UC1/UC2 offline queue processes INCIDENT (PATROL_POINT has no remote writer)
- passed: UC1/UC2 offline queue processes PATROL_POINT (PATROL_POINT has no remote writer)
- passed: UC1/UC2 exposes current sync failure defect: failed writes are marked submitted
- passed: UC1 queue skips submitted items, uses simulated connectivity and clears
- passed: UC1 legacy patrol API sends start, point and end payloads

### photo-adapters.test.js

- passed: UC2 native photo reader returns file and content type image/png
- passed: UC2 native photo reader returns file and content type 
- passed: UC2 native reader rejects missing or oversized file 0
- passed: UC2 native reader rejects missing or oversized file 1
- passed: UC4 native retention copies to durable document folder .png
- passed: UC4 native retention copies to durable document folder 
- passed: UC4 native retention rejects unreadable or oversized photo 0
- passed: UC4 native retention rejects unreadable or oversized photo 1
- passed: UC4 native retention rejects unreadable or oversized photo 2
- passed: UC2 browser reader returns blob and content type image/png
- passed: UC2 browser reader returns blob and content type 
- passed: UC2 browser reader rejects failed local fetch
- passed: UC4 browser retention rejects photo size 0
- passed: UC4 browser retention rejects photo size 10485760
- passed: UC4 browser retention rejects local fetch failure
- passed: UC4 browser FileReader completion/error false
- passed: UC4 browser FileReader completion/error true

### photo-upload.test.js

- passed: UC2/UC4 uploads photo and accepts HTTPS URL
- passed: UC2/UC4 rejects photo size 0 before upload
- passed: UC2/UC4 rejects photo size 10485760 before upload
- passed: UC2/UC4 rejects photo size 10485761 before upload
- passed: UC2/UC4 rejects invalid storage URL 0
- passed: UC2/UC4 rejects invalid storage URL 1
- passed: UC2/UC4 rejects invalid storage URL 2
- passed: UC2/UC4 returns upload server error 0
- passed: UC2/UC4 returns upload server error 1
- passed: UC2/UC4 timeout aborts upload and clears timer
- passed: UC2/UC4 read failure propagates without upload

### uc2-incidents.test.js

- passed: UC2 creates trimmed pending incident preserving category and GPS
- passed: UC2 rejects empty description 0 before contacting database
- passed: UC2 rejects empty description 1 before contacting database
- passed: UC2 rejects empty description 2 before contacting database
- passed: UC2 anonymous identity adds demo reporter details and respects severity
- passed: UC2 attaches successfully uploaded photos
- passed: UC2 keeps incident and successful photos when one upload fails 0
- passed: UC2 keeps incident and successful photos when one upload fails 1
- passed: UC2 reports link persistence failure without claiming uploaded photos were attached
- passed: UC2 propagates identity failure
- passed: UC2 propagates database failure
- passed: UC2 personal history converts dates and sorts newest first
- passed: UC2 manager query never substitutes personal history on permission failure
- passed: UC2 manager query maps timestamps
- passed: UC2 legacy API sends incident/conflict payloads and history filter

### uc3-alerts.test.js

- passed: UC3 normalizes severity HIGH
- passed: UC3 normalizes severity medium
- passed: UC3 normalizes severity null
- passed: UC3 normalizes severity unknown
- passed: UC3 maps alert status RESPONDED
- passed: UC3 maps alert status RESOLVED
- passed: UC3 maps alert status ACKNOWLEDGED
- passed: UC3 maps alert status ASSIGNED
- passed: UC3 maps alert status PENDING
- passed: UC3 maps alert status null
- passed: UC3 missing collar metadata uses display fallbacks without fabricating coordinates
- passed: UC3 preserves supplied metadata and zero coordinates; sorts displayed times
- passed: UC3 formats Firestore time and handles empty snapshots
- passed: UC3 subscription forwards errors and supports cleanup
- passed: UC3 resolves the selected alert and propagates database failure
- passed: UC3 active-alert API preserves shared client error handling

### uc1-scheduling.test.js

- passed: UC1 manager creates normalized assignment
- passed: UC1 manager updates assignment with optional fields and deletes it
- passed: UC1 manager write times out after 15 seconds
- passed: UC1 explains Firestore error permission-denied
- passed: UC1 explains Firestore error failed-precondition
- passed: UC1 explains Firestore error not-found
- passed: UC1 explains Firestore error unavailable
- passed: UC1 explains Firestore error other
- passed: UC1 explains non-Firebase errors
- passed: UC1 assignment subscription normalizes points and rejects nonfinite coordinates

### reporter.test.js

- passed: UC2 returns existing identity without anonymous sign-in
- passed: UC2 concurrent reporter requests share anonymous sign-in
- passed: UC2 reporter error is actionable and next request retries 0
- passed: UC2 reporter error is actionable and next request retries 1

### storage-client.test.js

- passed: shared storage reads missing and serialized values
- passed: shared storage handles corrupt JSON and read errors
- passed: shared storage setItem returns true on success and false on device error
- passed: shared storage removeItem returns true on success and false on device error
- passed: shared storage clearAll returns true on success and false on device error
- passed: shared API merges headers and auth token
- passed: shared API handles unsuccessful HTTP response 0
- passed: shared API handles unsuccessful HTTP response 1
- passed: shared API handles network errors 0
- passed: shared API handles network errors 1
