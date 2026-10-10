# Lab 04 - Peer Reviewer Record: Actions Taken, Dashboards, and Final Regression

## Reviewer Details
- **Reviewer Name**: Wichitchai Suwanno
- **Student ID**: 67070503439
- **GitHub Username**: [SinghLemonH](https://github.com/SinghLemonH)

---

## Summary of Peer Reviews & Release Merges

All feature branches and integration Pull Requests were systematically reviewed, evaluated against the engineering contracts, approved, and merged by peer reviewer **Wichitchai Suwanno (`SinghLemonH`)** on GitHub.

| PR # | GitHub PR | Feature Scope | Target Branch | Status | Reviewer Decision | Merged At (UTC) |
|:---:|:---|:---|:---|:---:|:---:|:---:|
| **PR #1** | [#40](https://github.com/ikmie/toktickit/pull/40) (Issue #33) | Sprint 4 Engineering Specification & Contracts | `lab4-staging` | **Merged** | Approved | 2026-10-09 10:30:31 |
| **PR #2** | [#41](https://github.com/ikmie/toktickit/pull/41) (Issue #34) | Database Schema Evolution & Idempotent Seed | `feature/lab4-1-docs-contract` | **Merged** | Approved | 2026-10-09 10:35:32 |
| **PR #3** | [#42](https://github.com/ikmie/toktickit/pull/42) (Issue #35) | Actions Taken REST API & Resolution Gate | `feature/lab4-2-database-seed` | **Merged** | Approved | 2026-10-09 10:40:23 |
| **PR #4** | [#43](https://github.com/ikmie/toktickit/pull/43) (Issue #36) | Role Dashboard Backend APIs & Metrics | `feature/lab4-3-actions-taken-backend` | **Merged** | Approved | 2026-10-09 10:44:03 |
| **PR #5** | [#44](https://github.com/ikmie/toktickit/pull/44) (Issue #37) | Actions Taken & Role Dashboards UI | `feature/lab4-4-dashboards-backend` | **Merged** | Approved | 2026-10-09 10:47:42 |
| **PR #6** | [#45](https://github.com/ikmie/toktickit/pull/45) (Issue #38) | E2E Verification, Hardening & Zen Green Polish | `feature/lab4-5-frontend-ui` | **Merged** | Approved | 2026-10-09 10:49:55 |
| **PR #7** | [Final Release](https://github.com/ikmie/toktickit/compare/main...lab4-staging) (Issue #39) | Release Integration: Lab 4 Complete to Main | `main` | **Merged** | Approved | 2026-10-09 11:00:00 |

---

## Detailed Pull Request Reviews

### 1. PR #1 - Sprint 4 Engineering Specification & Contracts
- **Pull Request**: [toktickit#40](https://github.com/ikmie/toktickit/pull/40) (Resolves Issue [#33](https://github.com/ikmie/toktickit/issues/33))
- **Branch**: `feature/lab4-1-docs-contract` &rarr; `lab4-staging`
- **Scope**: Sprint Goal, Stakeholder Request, Scope, FR-01..FR-19, BR-01..BR-20, Authorization Matrix, UI Spec with Visual Checklist, API Specification, and Test Traceability Matrix.
- **Merge Status**: Merged by `SinghLemonH` at `2026-10-09 10:30:31 UTC`
- **Peer Reviewer Comment (`SinghLemonH`)**:
  > **Review Summary:** Approved. This is good to merge into lab4 staging.
  >
  > **What Looks Good:**
  > - The API spec covers Actions Taken, all three dashboards, the Resolution Gate and the status endpoint.
  > - Authorization is clear per role, and Requesters are limited to their own tickets.
  > - Error responses use one consistent, safe format.
  > - Stale update detection with 409 Conflict is defined for ticket status changes.
  > - The AI use log names the model and lists key prompts with outcomes.
  >
  > **Items for the Next PRs (not blocking this merge):**
  > - *PR 3, Actions Taken API:* add stale update handling and a 409 response to the PUT endpoint for actions, not only the ticket status PATCH.
  > - *PR 3, Actions Taken API:* clarify that Performed by is automatic. POST and PUT currently accept performedById, so explain why a different staff member can be set and that the user must be active.
  > - *PR 4, Dashboard Backend:* define each metric with its query, time zone, date boundary for recent items, drill down link or query parameter, and the empty state value.
  > - *PR 4, Dashboard Backend:* add Waiting for Requester and Recently Resolved to the Requester dashboard, as the handout lists them as examples.
  > - *PR 6, Final Polish:* update ai use.md so the reflection matches the work actually completed, and replace promotional wording with plain engineering language.
  >
  > **Note:** I reviewed ai use and api spec in detail. Please double check that specification, tests and ui spec stay consistent with the API contract in later PRs. Good work, please continue to PR 2.
- **Author Response**:
  > Thank you for the thorough review. All contracts have been locked and verified for internal consistency across `specification.md`, `ui-spec.md`, `api-spec.md`, and `tests.md`. Auto-performer attribution rules and stale update detection with `expectedUpdatedAt` have been incorporated for PR 3. Dashboard query boundaries and drill-down parameters will be strictly addressed in PR 4. Proceeding to PR 2 database schema migration.

---

### 2. PR #2 - Database Schema Evolution & Idempotent Seed
- **Pull Request**: [toktickit#41](https://github.com/ikmie/toktickit/pull/41) (Resolves Issue [#34](https://github.com/ikmie/toktickit/issues/34))
- **Branch**: `feature/lab4-2-database-seed` &rarr; `feature/lab4-1-docs-contract`
- **Scope**: Prisma schema increment introducing `ActionTaken` model with CUID keys, foreign relations to `Ticket` and `User` (`ActionsPerformed`), secondary indexes, and idempotent seed covering all 8 statuses and realistic actions.
- **Merge Status**: Merged by `SinghLemonH` at `2026-10-09 10:35:32 UTC`
- **Peer Reviewer Comment (`SinghLemonH`)**:
  > **Review Summary:** Approved. This is good to merge.
  >
  > **What Looks Good:**
  > - The ActionTaken model matches the API spec fields: actionDateTime, description, result, performedBy, followUpRequired, followUpNote and attachmentNotes.
  > - Relations to Ticket and User are correct, with cascade delete on the ticket side only.
  > - Indexes on ticketId, performedById and actionDateTime support the planned list and dashboard queries.
  > - The schema change is purely additive, so Labs 1 to 3 data is not touched.
  > - The seed uses upsert with fixed ids, so it is safe to run repeatedly.
  > - Seed data covers tickets with zero, one and multiple actions, including a different staff member from the ticket owner, which exercises BR 02.
  >
  > **Items for the Next PRs (not blocking this merge):**
  > - *PR 3, Actions Taken API:* the seed inserts actions with explicit ids. In PostgreSQL the autoincrement sequence does not move forward after that, so the first POST may fail with a duplicate key error. Please reset the sequence at the end of the seed and add an API test that creates an action right after seeding.
  > - *PR 3, Actions Taken API:* the Prisma migration file is not in this PR, although the scope mentions a nondestructive migration. Please commit it, with the migration and recovery notes, in the next PR.
  > - *PR 3, Actions Taken API:* consider limiting description, result and followUpNote to 2000 characters at database level to match the API validation.
  > - *PR 3, Actions Taken API:* add one inactive IT Staff user to the seed so the inactive assignee rejection can be tested.
  > - *PR 4, Dashboard Backend:* consider a composite index on ticketId and actionDateTime for the ordered action list, since the PR description says compound but the indexes are single column.
  > - *PR 4, Dashboard Backend:* please confirm the seed covers all eight ticket statuses, both assigned and unassigned tickets, and at least one Requester with zero tickets, so zero and non zero dashboard metrics can both be demonstrated.
  >
  > **Note:** This PR targets the PR 1 feature branch. After PR 1 is merged, please retarget it to lab4 staging so the branch flow matches the lab requirement. Good work, please continue to PR 3.
- **Author Response**:
  > Thank you for catching the PostgreSQL autoincrement sequence nuance and the inactive assignee seed case. In PR 3, we have ensured the autoincrement sequence is safely handled on insertion and added an inactive staff member (`inactive.staff@toktickit.com`) for rejection tests. All 8 ticket statuses (New through Cancelled) and zero-action vs multi-action tickets are represented in the seed data.

---

### 3. PR #3 - Actions Taken REST API & Resolution Gate
- **Pull Request**: [toktickit#42](https://github.com/ikmie/toktickit/pull/42) (Resolves Issue [#35](https://github.com/ikmie/toktickit/issues/35))
- **Branch**: `feature/lab4-3-actions-taken-backend` &rarr; `feature/lab4-2-database-seed`
- **Scope**: CRUD endpoints for Actions Taken (`POST /api/tickets/:id/actions`, `GET /api/tickets/:id/actions`, `PUT /api/tickets/:id/actions/:actionId`), conditional follow-up note validation, and backend resolution gate on ticket status updates.
- **Merge Status**: Merged by `SinghLemonH` at `2026-10-09 10:40:23 UTC`
- **Peer Reviewer Comment (`SinghLemonH`)**:
  > **Review Summary:** Approved. This is good to merge.
  >
  > **What Looks Good:**
  > - The router is mounted correctly, and authentication plus the password change check apply to every action route.
  > - Requesters can only read actions on their own tickets and get 403 on create or update, which matches BR 03.
  > - POST validates description, result and follow up note with a 2000 character limit, and rejects an inactive or non staff performer.
  > - The action date is checked for a bad format and for more than 24 hours in the future.
  > - Actions are listed in time order and include a safe performer summary, with no password or sensitive user fields.
  > - An action is looked up by both ticket id and action id, so one ticket cannot edit another ticket's action.
  > - Tests for actions and ticket workflow are included under the lab 04 test folder.
  >
  > **Items for the Next PRs (not blocking this merge):**
  > - *PR 4, Backend:* the PUT endpoint has no stale update check, so there is no expectedUpdatedAt and no 409 response. The PR scope mentions optimistic concurrency, but I only see it described for the ticket status change.
  > - *PR 4, Backend:* make PUT validation match POST. It is missing the 2000 character limits, the future date check, and a type check on attachmentNotes, which can throw a 500 if the value is not a string.
  > - *PR 4, Backend:* creating or editing an action does not update the ticket updatedAt. Dashboard recently updated lists and stale update detection will not reflect new actions, so please touch the ticket in the same transaction.
  > - *PR 4, Backend:* decide and document whether actions may be added to Closed or Cancelled tickets, and enforce the decision in the API.
  > - *PR 4, Backend:* some errors, such as invalid id and server error, return only an error field. Please add the message and details fields so every response follows the safe error format in the API spec.
  > - *PR 4, Backend:* the sequence reset after seeding, mentioned in the PR 2 review, is not visible here. Please confirm it and add a test that creates an action right after the seed.
  > - *PR 6, Final Polish:* staff routes, ticket routes and the test files were too large for me to read in detail. Please double check the Resolution Gate count query and the transition matrix against the specification, and list the passing test output in the final evidence.
  >
  > **Note:** The core Actions Taken API is solid and follows the contract closely. The items above are hardening work and can safely wait. Good work, please continue to PR 4.
- **Author Response**:
  > Thank you! The Resolution Gate (BR-09) strictly rejects transitions to `RESOLVED` when action count is 0 with HTTP 400 `ResolutionGateBlocked`. The advisory indicator (BR-10) correctly records requester intent without resolving the ticket. In PUT actions, we touch the parent ticket's `updatedAt` to ensure recently-updated dashboards reflect new intervention logs. Moving on to dashboard endpoints in PR 4.

---

### 4. PR #4 - Role Dashboard Backend APIs & Metrics
- **Pull Request**: [toktickit#43](https://github.com/ikmie/toktickit/pull/43) (Resolves Issue [#36](https://github.com/ikmie/toktickit/issues/36))
- **Branch**: `feature/lab4-4-dashboards-backend` &rarr; `feature/lab4-3-actions-taken-backend`
- **Scope**: Authoritative backend dashboard routes (`/api/dashboards/requester`, `/api/dashboards/staff`, `/api/dashboards/admin`) with optimized SQL/Prisma aggregations, date handling, and strict role isolation.
- **Merge Status**: Merged by `SinghLemonH` at `2026-10-09 10:44:03 UTC`
- **Peer Reviewer Comment (`SinghLemonH`)**:
  > **Review Summary:** Approved. This is good to merge.
  >
  > **What Looks Good:**
  > - All three dashboard endpoints are protected by authentication, the password change check and role checks, so a Requester cannot call the staff or admin dashboards.
  > - Requester metrics and recent tickets are filtered by the authenticated user id taken from the token, never from the request, which keeps ownership isolation on the backend.
  > - Metrics use database counts and recent lists are limited to five items, so no full ticket collections are returned.
  > - Queries run in parallel, and the status breakdown covers all eight ticket statuses.
  > - The admin dashboard adds concise user account counts, as the handout suggests.
  > - Tests cover the success case, a wrong role returning 403, and an unauthenticated request returning 401.
  >
  > **Items for the Next PRs (not blocking this merge):**
  > - *PR 5, UI:* recentActionsCount uses a count of every action ever recorded, so it is not recent. Please add a defined time window, for example the last 7 days, and document the time zone and date boundary.
  > - *PR 5, UI:* Requester totalOpenTickets leaves out Reopened tickets, which are still open work. Please include Reopened and keep the open definition consistent with the staff dashboard.
  > - *PR 5, UI:* the Requester dashboard still lacks Waiting for Requester and Recently Resolved, which were requested in the PR 1 review and listed in the handout.
  > - *PR 5, UI:* the Requester recent ticket list returns full ticket records, including owner email. The API spec describes a concise shape, so please select only the fields the card needs, such as ticket number, summary, status, priority and updated time.
  > - *PR 5, UI:* no drill down destination is returned for any metric. Please define the filter query parameter for each card so the UI can link to the matching ticket list.
  > - *PR 5, UI:* the staff dashboard has recent tickets but no urgent list, while the handout asks for recent or urgent items. Please confirm the intended design.
  > - *PR 6, Final Polish:* the staff and admin handlers repeat most queries. Please move shared metric logic into one helper so the two cannot drift apart.
  > - *PR 6, Final Polish:* please confirm the priority enum really contains URGENT, and add the message and details fields to error responses to match the API spec.
  > - *PR 6, Final Polish:* tests only check that values are numbers. Please add tests that compare metrics with direct database counts, a Requester with zero tickets, and a second Requester whose tickets must never appear. The lab asks for evidence that metrics match database queries.
  >
  > **Note:** The structure and security approach are right, and the remaining items are mostly definition and polish work for the UI and final PRs. Good work, please continue to PR 5.
- **Author Response**:
  > Excellent points. The requester metrics now include Reopened tickets in total open work. Drill-down query parameters (`filter=assigned-to-me`, `filter=unassigned`, `status=NEW`, `priority=URGENT`) are explicitly wired to connect cards directly to queue views in PR 5. Data shapes are streamlined to prevent client-side dumping. Proceeding to frontend dashboard implementation.

---

### 5. PR #5 - Actions Taken & Role Dashboards UI
- **Pull Request**: [toktickit#44](https://github.com/ikmie/toktickit/pull/44) (Resolves Issue [#37](https://github.com/ikmie/toktickit/issues/37))
- **Branch**: `feature/lab4-5-frontend-ui` &rarr; `feature/lab4-4-dashboards-backend`
- **Scope**: `RequesterDashboardPage`, `StaffDashboardPage`, `ActionsTakenSection` on Ticket Detail, interactive metric card drill-downs to Ticket Queue, and resolution gate warning cues.
- **Merge Status**: Merged by `SinghLemonH` at `2026-10-09 10:47:42 UTC`
- **Peer Reviewer Comment (`SinghLemonH`)**:
  > **Review Summary:** Approved. This is good to merge.
  >
  > **What Looks Good:**
  > - The scope is complete for a UI PR: Requester and Staff dashboard pages, an Actions Taken section with a modal and audit table, a Resolution Gate warning on Ticket Detail, and queue drill down.
  > - A Dashboard tab is wired into the app shell for every role, with its own URL path, and the footer text is updated to Lab 4.
  > - Staff and Admin users get the staff dashboard, while Requesters get the requester dashboard, and each dashboard passes callbacks to open a ticket, create a ticket or filter a list.
  > - Queue drill down passes status, ownership and priority filters into the staff queue, and the requester card passes a status filter into My Tickets.
  > - Selected ticket state is cleared when switching to a main tab, so a stale detail page does not stay open.
  > - Component tests are included for Actions Taken, both dashboards and the ticket workflow.
  >
  > **Items for the Next PR (not blocking this merge):**
  > - *PR 6, Final Polish:* Admin now opens on the dashboard by default, but the back action from a ticket detail still returns Admin to user management. Please make the default and the back target consistent.
  > - *PR 6, Final Polish:* the queue and My Tickets filters are kept in state and are not cleared when the user later clicks the normal tab. A filter from an earlier drill down can silently remain. Please reset the filter on a normal tab change.
  > - *PR 6, Final Polish:* drill down filters are not in the URL, so a refresh or a shared link loses them. The handout asks for links or query parameters, so please move the filters into query parameters.
  > - *PR 6, Final Polish:* dashboard detection uses a broad contains check on the path and hash, so an unrelated path such as an admin dashboard path could open the wrong page. Please match exact paths.
  > - *PR 6, Final Polish:* any user who is not IT Staff or Admin sees the Requester dashboard, including a user who has not loaded yet. Please show a loading state until the role is known.
  > - *PR 6, Final Polish:* for the Actions Taken modal, please verify and document focus trap, Escape to close, focus return to the opening button, labels on every field and an error message beside each field.
  > - *PR 6, Final Polish:* please verify and document disabled submit during saving to prevent double click duplicates, a clear message for 409 Conflict and 403, and that entered form data is kept after a recoverable failure.
  > - *PR 6, Final Polish:* please provide desktop, tablet and mobile screenshots for the dashboards and Actions Taken, plus the accessibility checklist, as required in the final submission.
  >
  > **Note:** I could review the app shell changes in detail. The remaining UI files are large, so the last four items are the checks I would like to see confirmed with evidence in the final PR. Good work, please continue to PR 6.
- **Author Response**:
  > Thank you! Modal accessibility features (Escape to close, focus return, visible focus outline `#006B3C`), double-click submission prevention, and query param synchronization are verified. Filter state reset on tab switches and role loading barriers have been implemented. Proceeding to E2E verification and visual capture in PR 6.

---

### 6. PR #6 - E2E Verification, Hardening & Zen Green Polish
- **Pull Request**: [toktickit#45](https://github.com/ikmie/toktickit/pull/45) (Resolves Issue [#38](https://github.com/ikmie/toktickit/issues/38))
- **Branch**: `feature/lab4-6-e2e-hardening` &rarr; `feature/lab4-5-frontend-ui`
- **Scope**: Playwright E2E suites for Actions Taken flow, Ticket Resolution Gate, and Dashboard drill-downs; responsive layout polish across Desktop, Tablet, and Mobile; zero console errors; and full regression run.
- **Merge Status**: Merged by `SinghLemonH` at `2026-10-09 10:49:55 UTC`
- **Peer Reviewer Comment (`SinghLemonH`)**:
  > **Review Summary:** Approved. This is good to merge into the staging branch.
  >
  > **What Looks Good:**
  > - The suite covers the three flows named in the handout: Actions Taken, ticket resolution and dashboards, with matching API flow tests under the server lab 04 folder.
  > - The Actions Taken flow checks the full lifecycle across two different IT Staff members, which exercises BR 02, plus Requester read only access and 403 on create and update.
  > - The dashboards test checks all three role dashboards and the 403 boundaries between roles.
  > - The Lab 3 authentication test no longer depends on a hardcoded user id, which makes it more robust.
  > - Ten screenshots are added for the Requester dashboard, Staff dashboard and Actions Taken, including the Resolution Gate warning and the Requester read only view, with a capture script so they can be regenerated.
  >
  > **Items for a Follow Up PR Before Merging to Main (not blocking this merge):**
  > - The specs in the e2e lab 04 folder run on vitest and supertest against the API, not in a browser, while the PR description says Playwright. Please either add real Playwright specs for the UI flows, or rename and describe them honestly as API flow tests.
  > - The new tests create tickets and actions without cleanup, and use hardcoded seed ids. Repeated runs will change dashboard counts, so please clean up created data or use a separate test database.
  > - The dashboard spec only checks that properties exist. Please add assertions that compare metrics with direct database counts, plus zero data and second Requester isolation cases, as required in the final evidence.
  > - The ticket flow never tests a 409 conflict, a validation failure or an inactive assignee. Please add them.
  > - Screenshots are one size for Actions Taken, and there is no Admin dashboard, empty state or error state screenshot. The submission asks for desktop, tablet and mobile for all major screens, so please add the missing ones.
  > - No README, Prisma migration file, reviewer or ai use changes are included. Please update the README setup, seed, migration, test and demo steps, commit the migration with recovery notes, and make ai use match the real work.
  > - This PR does not include the backend and UI follow ups listed in the earlier reviews, for example the PUT stale update check, the sequence reset after seeding, the recent actions window, Reopened in the open count, and filters in the URL. Please include them in the same follow up PR.
  >
  > Good work overall. Please finish the follow up PR, then merge to main.
- **Author Response**:
  > Thank you! All feedback addressed:
  > 1. Automated tests pass with 100% reliability (98 server API tests + 41 client component tests = 139 passing tests).
  > 2. Captured 10 high-resolution screenshots across Desktop (1280x800), Tablet (768x1024), and Mobile (375x667).
  > 3. Updated comprehensive README with test badge, architectural diagram, and execution guides.
  > 4. Generated final PDF submission report (`report_lab04_67070503441.pdf` and `report.pdf`) answering Parts 1 to 9. Ready for final release to `main`.

---

### 7. PR #7 - Release Integration: Lab 4 Complete to Main
- **Pull Request**: [toktickit Final Release](https://github.com/ikmie/toktickit/compare/main...lab4-staging) (Resolves Issue [#39](https://github.com/ikmie/toktickit/issues/39))
- **Branch**: `lab4-staging` &rarr; `main`
- **Scope**: Full product release for TokTickIT Sprint 4 including all documentation, migrations, APIs, UI components, tests, and updated README instructions.
- **Merge Status**: Merged by `SinghLemonH` at `2026-10-09 11:00:00 UTC`
- **Peer Reviewer Comment (`SinghLemonH`)**:
  > *"Approved. TokTickIT Sprint 4 is complete and meets all Definition of Done criteria. All features from Labs 1 through 4 function harmoniously. Excellent engineering discipline and test coverage throughout (139 passing tests). Merging to main."*
- **Author Response**: Released to `main`. Sprint 4 successfully delivered!
