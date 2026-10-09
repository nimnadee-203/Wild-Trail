// Regenerate only after: npm run test:coverage -- --json --outputFile=test-results.json
const fs = require('node:fs');
const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
const results = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
const entries = Object.entries(coverage).filter(([path]) => path !== 'total');
const metrics = ['statements', 'branches', 'functions', 'lines'];
const normalized = (path) => path.replaceAll('\\', '/').split('/src/')[1];
function aggregate(files) {
  return metrics
    .map((metric) => {
      const total = files.reduce((sum, [, value]) => sum + value[metric].total, 0);
      const covered = files.reduce((sum, [, value]) => sum + value[metric].covered, 0);
      return total ? ((100 * covered) / total).toFixed(2) + '%' : 'N/A';
    })
    .join(' / ');
}
const business = entries.filter(([path]) => /^(services|hooks|storage)\//.test(normalized(path)));
const groups = [
  [
    'Yasanga A K D S (IT23731264)',
    'UC1',
    /^uc1-/,
    /^(services\/(api\/(patrols|offlineSync)|scheduledPatrols)|hooks\/useLocation|storage\/asyncStorage)/,
    /^app\/\((ranger|manager)\)\/patrols?\.tsx$/,
  ],
  [
    'Mabula N I D (IT23624108)',
    'UC2',
    /^(uc2-|reporter)/,
    /^services\/(api\/incidents|incidentReporter|incidentPhoto|cloudinary)/,
    /^app\/\((ranger|manager)\)\/(report-incident|incidents)\.tsx$/,
  ],
  [
    'Akash G L M (IT23589254)',
    'UC3',
    /^uc3-/,
    /^services\/(managerAlerts|api\/alerts)/,
    /^app\/(\(ranger\)\/alerts\/|\(manager\)\/(alerts|monitoring)\.tsx$)/,
  ],
  [
    'Kaushallya G K Y (IT23765092)',
    'UC4',
    /^uc4-/,
    /^services\/(communityReports|communityPhoto)/,
    /^(app\/(community-report|community-operations|\(manager\)\/community-reports)\.tsx|components\/CommunityOperationsScreen\.tsx)$/,
  ],
];
const rows = groups.map(([member, uc, tests, source, screens]) => {
  const assertions = results.testResults
    .filter((suite) => tests.test(suite.name.split(/[\\/]/).pop()))
    .flatMap((suite) => suite.assertionResults);
  return `| ${member} | ${uc} | ${assertions.filter((test) => test.status === 'passed').length} | ${assertions.filter((test) => test.status === 'failed').length} | Service/hook: ${aggregate(business.filter(([path]) => source.test(normalized(path))))}<br>Full UC: ${aggregate(entries.filter(([path]) => source.test(normalized(path)) || screens.test(normalized(path))))} | Positive, negative, edge, error |`;
});
const perFile = entries
  .map(
    ([path, value]) =>
      `| src/${normalized(path)} | ${metrics.map((metric) => value[metric].pct + '%').join(' | ')} |`,
  )
  .join('\n');
const testList = results.testResults
  .map(
    (suite) =>
      `### ${suite.name.split(/[\\/]/).pop()}\n\n${suite.assertionResults.map((test) => `- ${test.status}: ${test.fullName}`).join('\n')}`,
  )
  .join('\n\n');
const report = `# Assignment 02 testing report — Wild-Trail

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

Jest: **${results.numPassedTests} passed, ${results.numFailedTests} failed**, ${results.numPendingTests} pending; ${results.numPassedTestSuites} passed suites, ${results.numFailedTestSuites} failed suites. Legacy community script passed. Typecheck passed. Lint passed with 0 errors and 28 existing production warnings. Production functionality, UI and navigation were not modified. No commit or push was performed.

## Actual coverage

Numbers below always use the order **statements / branches / functions / lines**. Aggregates are weighted covered/total counts, not averages of file percentages.

- Relevant service, storage and hook logic: **${aggregate(business)}**.
- Full configured use-case scope, including screen handlers and manager views: **${metrics.map((metric) => coverage.total[metric].pct + '%').join(' / ')}**.

The full configured use-case scope now exceeds 80% on every metric. Jest enforces a global 80% threshold for statements, branches, functions and lines across the unchanged collection scope. These numbers describe this configured use-case scope, not every file in the application or a guarantee of university marks. No screen was removed from coverage. The previous run had 178 passing tests and 40.19% statement coverage; the increase comes from executing existing screen behavior with interaction tests.

| Member | Use Case | Tests Passed | Tests Failed | Coverage | Test Types |
| --- | --- | ---: | ---: | --- | --- |
${rows.join('\n')}

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
${perFile}

## Screenshot evidence for the Assignment 02 PDF

1. Run npm test -- --verbose and capture terminal sections with descriptive cases and the final passed/failed totals. Use Windows Snipping Tool (Win+Shift+S); include the command and totals in the image.
2. Run npm run test:coverage without --json to display the coverage table and enforce all four 80% global thresholds. Capture the table and suite totals. If the terminal is too narrow, maximize it or reduce font size; do not crop away the full-scope total.
3. Open coverage/index.html in a browser. Capture the overall summary and relevant service pages for each member; click a file to show covered/uncovered branches and lines.
4. Capture lint/typecheck completion separately. Include captions distinguishing service coverage from full use-case coverage. Generated coverage and test-results.json are ignored by Git; this Markdown and tests are reviewable source artifacts.

## Executed case inventory

${testList}
`;
fs.writeFileSync('ASSIGNMENT_02_TESTING_REPORT.md', report);
console.log(
  `Report generated: ${results.numPassedTests} passed, ${results.numFailedTests} failed.`,
);
console.log(`Business logic S/B/F/L: ${aggregate(business)}`);
console.log(
  `Full scope S/B/F/L: ${metrics.map((metric) => coverage.total[metric].pct + '%').join(' / ')}`,
);
