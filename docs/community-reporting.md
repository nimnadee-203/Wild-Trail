# Community reporting

The login screen offers **Community: Report Wildlife Incident** without a staff account. Types include elephant sighting, crop raiding, livestock attack, property damage, human injury and other wildlife conflict. Residents enter a village, boundary section, landmark, event time and description; contact phone and camera/gallery photos are optional. Review and confirm to save locally before delivery.

Reports and retained photos survive an app restart. Delivery retries when the app opens, returns to the foreground, or every 30 seconds while active. The device list distinguishes waiting delivery, received with photos pending, and fully received. Keep the app open when connectivity returns; this is not background delivery. Web photo persistence is subject to browser storage limits. Reports already bound to a Firebase account are delivered only while that account is signed in.

New reports use the dedicated Firestore `communityReports` collection in project `wildtrail-a7918`. Firestore creates it automatically on the first successful delivery. Existing reports in `incidents` are not migrated or included in the new feed; partially delivered legacy reports finish their photo uploads in `incidents`. Ranger, liaison and manager dashboards link to **Community Operations**, where staff can view photos and save status/response notes. A logged-in ranger or liaison can press **Accept Operation** on an unassigned pending report. Acceptance records their Firebase UID and display name and changes the status to investigating; an already accepted report cannot be claimed again. Publish the updated rules to enable this action. Boundary/month counts exclude simulated SMS reports. Push notifications and map heatmaps are not implemented.

## Firebase activation

The built-in demo ranger (`nimal@wildguard.org`) and liaison (`liaison@wildguard.org`) accounts can accept accessible reports and record responses locally when Firebase is signed out or anonymous. These labelled demo acceptances persist on the device and do not write shared Firestore assignments. Another device will not see them. A report already assigned by real staff takes precedence over a local demo acceptance. Real signed-in staff use the normal protected Firestore transaction.

1. Run `npx firebase-tools deploy --only firestore:rules --project wildtrail-a7918` (requires Firebase CLI login), or publish the repository's `firestore.rules` using the Firebase console or your normal deployment workflow. The app cannot deploy rules itself.
2. Enable Firebase Authentication **Anonymous** sign-in for community users without accounts.
3. Staff must sign in with real Firebase accounts. Provision `users/{firebase-auth-uid}` through trusted administration with `role` set to `ranger`, `liaison`, `manager`, or `admin`, and `accountStatus: "ACTIVE"`. Alternatively use trusted role custom claims. A local mock login does not grant Firestore access. Community users cannot assign themselves a staff role.
4. Keep the existing Cloudinary unsigned preset `wildtrail_incidents` in cloud `effmagck` enabled. Photos must be smaller than 10 MB.

## SMS prototype

Community Operations includes an explicitly labelled **SMS simulator**, available to authenticated staff. Try:

`ELEPHANT | Village name | East boundary | Near the gate | 3 elephants`

or replace `ELEPHANT` with `CROP`, `LIVESTOCK`, `PROPERTY`, `INJURY` or `OTHER`. This creates a simulated report in the same dashboard; it does not receive or send SMS, allocate a short code, or reach basic phones. For production, connect an SMS provider webhook to a trusted backend, verify provider signatures, parse and validate messages, deduplicate using the provider message ID, then write reports with a separate real-SMS source. Do not put provider secrets in the mobile app. SMS requires cellular coverage, even though mobile data is unnecessary.

## Manual device checks

- In airplane mode, submit a report with a photo. Confirm it appears as saved locally, restart the app and confirm it remains.
- Restore connectivity with the app open. Check the same reference reaches the staff dashboard with its photo. Retry delivery and verify no duplicate document appears.
- Interrupt photo upload after the report arrives. Set its status to investigating in the staff dashboard, then retry photo delivery. Confirm the status and response notes remain intact.
- Simulate an SMS as staff and check its visible label and exclusion from boundary counts.
- As a community account, verify the staff query and response edits are rejected by Firestore.

Run `node scripts/test-community-reports.cjs` for isolated queue/parser/retry checks. These mocks do not verify deployed Firebase rules or device file APIs.
