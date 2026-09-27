# TokTickIT Test Plan & Traceability Matrix - Lab 04

## 1. Testing Strategy

TokTickIT Sprint 4 strictly adheres to Spec-Driven Development (SDD) and Test-Driven Development (TDD) across the complete service-desk product increment:
- **Server API & Workflow Tests**: Vitest + Supertest testing Actions Taken creation, editing, authorization boundaries, conditional validation (follow-up note), resolution gate enforcement (zero-action blocking), and authoritative dashboard metric aggregations.
- **Client UI Component Tests**: Vitest + React Testing Library testing Requester Dashboard rendering, Staff Dashboard metric cards and interactive drill-downs, Actions Taken table and modal form validations, and ticket resolution gate user cues.
- **End-to-End Tests**: Playwright automated E2E tests validating the full browser user journey for creating actions, attempting invalid resolutions, successfully resolving tickets, and interacting with role dashboards.
- **Regression Suite**: Automated execution of all Lab 1, Lab 2, and Lab 3 tests (authentication, comments, notes, file attachments, and user administration) to verify zero feature regression.

---

## 2. Planned Tests Matrix

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---|---|---|---|---|---|---|
| **API-01** | API | AC-01, BR-01 | Create valid Action Taken by IT Staff | 201 Created; action linked to target ticket and actor | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-02** | API | AC-08, BR-05 | Create Action Taken with Follow-Up missing note | 400 Bad Request; validation error requiring follow-up note | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-03** | API | AC-09, BR-03 | Requester attempts to create Action Taken | 403 Forbidden; requester cannot record actions | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-04** | API | AC-10, BR-03 | Requester views Actions Taken on owned ticket | 200 OK; returns list of actions for owned ticket | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-05** | API | AC-09 | Requester views Actions Taken on unowned ticket | 403 Forbidden; cannot view actions on others' tickets | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-06** | API | AC-11, BR-02 | IT Staff updates an existing Action Taken | 200 OK; action updated and timestamp refreshed | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-07** | API | AC-14, BR-04 | Assign Action Taken to inactive user | 400 Bad Request; inactive assignee rejected | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-08** | API | AC-05, BR-09 | Resolve ticket with 0 Actions Taken (Resolution Gate) | 400 Bad Request; ResolutionGateBlocked error | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **API-09** | API | AC-06, BR-09 | Resolve ticket with >=1 Action Taken | 200 OK; status transitions to RESOLVED | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **API-10** | API | AC-07, BR-11 | Requester indicates problem resolved | 200 OK; flag set to true, status unchanged | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **API-11** | API | BR-12 | Invalid ticket status transition (e.g. NEW -> RESOLVED) | 400 Bad Request; transition rejected | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **API-12** | API | AC-15, BR-14 | Stale status update concurrency conflict | 409 Conflict; prevents overwriting concurrent change | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **API-13** | API | AC-02, BR-16 | Requester Dashboard authoritative metrics | 200 OK; returns accurate isolated requester metrics | `server/tests/lab-04/requester-dashboard.api.test.ts` | Pass |
| **API-14** | API | AC-02 | Non-requester access to Requester Dashboard | 403 Forbidden | `server/tests/lab-04/requester-dashboard.api.test.ts` | Pass |
| **API-15** | API | AC-03, BR-17 | IT Staff Dashboard operational queue metrics | 200 OK; returns system unassigned, assigned, breakdown | `server/tests/lab-04/staff-dashboard.api.test.ts` | Pass |
| **API-16** | API | AC-03 | Requester access to IT Staff Dashboard | 403 Forbidden | `server/tests/lab-04/staff-dashboard.api.test.ts` | Pass |
| **API-17** | API | AC-04, BR-18 | Administrator Dashboard metrics & user stats | 200 OK; returns operational + user distribution metrics | `server/tests/lab-04/staff-dashboard.api.test.ts` | Pass |
| **UI-01** | UI | AC-02, BR-19 | Requester Dashboard metric cards & recent list | Renders Open, In Progress, Resolved counts and ticket list | `client/src/tests/lab-04/RequesterDashboard.test.tsx` | Pass |
| **UI-02** | UI | AC-03, AC-12 | IT Staff Dashboard metric cards & drill-downs | Renders cards; clicking unassigned card navigates with filter | `client/src/tests/lab-04/StaffDashboard.test.tsx` | Pass |
| **UI-03** | UI | AC-01, AC-10 | Actions Taken list & read-only mode for Requester | Displays action rows; hides action buttons for Requester | `client/src/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| **UI-04** | UI | AC-01, AC-08 | Actions Taken create modal & validation | Live validation of follow-up note when checkbox checked | `client/src/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| **UI-05** | UI | AC-05, AC-06 | Ticket Detail Resolution Gate UI warning | Disables resolve option or warns when actions count is 0 | `client/src/tests/lab-04/TicketWorkflow.test.tsx` | Pass |
| **E2E-01** | E2E | AC-01, AC-10 | Actions Taken full lifecycle E2E | Staff creates action -> Requester logs in -> Views audit row | `e2e/lab-04/actions-taken-flow.spec.ts` | Pass |
| **E2E-02** | E2E | AC-05, AC-06 | Ticket Resolution Gate flow E2E | Block resolve with 0 actions -> Add action -> Resolve succeeds | `e2e/lab-04/ticket-resolution.spec.ts` | Pass |
| **E2E-03** | E2E | AC-02, AC-03 | Role Dashboards & drill-down navigation E2E | Login as Staff & Requester -> Check counts -> Click card drill-down | `e2e/lab-04/dashboards.spec.ts` | Pass |

---

## 3. Acceptance Criteria Traceability

| Acceptance Criterion | Planned Test ID(s) | Primary Automated Test File |
|---|---|---|
| **AC-01** (Action Taken created under correct ticket/actor) | API-01, UI-03, E2E-01 | `server/tests/lab-04/actions-taken.api.test.ts` |
| **AC-02** (Requester Dashboard isolated metrics & list) | API-13, UI-01, E2E-03 | `server/tests/lab-04/requester-dashboard.api.test.ts` |
| **AC-03** (IT Staff Dashboard operational queue metrics) | API-15, UI-02, E2E-03 | `server/tests/lab-04/staff-dashboard.api.test.ts` |
| **AC-04** (Administrator Dashboard with user account stats) | API-17, UI-02 | `server/tests/lab-04/staff-dashboard.api.test.ts` |
| **AC-05** (Resolution Gate blocks resolve with 0 actions) | API-08, UI-05, E2E-02 | `server/tests/lab-04/ticket-workflow.api.test.ts` |
| **AC-06** (Resolution succeeds with >=1 actions) | API-09, UI-05, E2E-02 | `server/tests/lab-04/ticket-workflow.api.test.ts` |
| **AC-07** (Requester resolution indication remains advisory) | API-10, UI-05 | `server/tests/lab-04/ticket-workflow.api.test.ts` |
| **AC-08** (Validation of follow-up note when required) | API-02, UI-04 | `server/tests/lab-04/actions-taken.api.test.ts` |
| **AC-09** (Requester forbidden from creating/editing actions) | API-03, API-05, UI-03 | `server/tests/lab-04/actions-taken.api.test.ts` |
| **AC-10** (Requester view of actions on owned ticket) | API-04, UI-03, E2E-01 | `server/tests/lab-04/actions-taken.api.test.ts` |
| **AC-11** (IT Staff edits existing Action Taken) | API-06, UI-03 | `server/tests/lab-04/actions-taken.api.test.ts` |
| **AC-12** (Staff Dashboard drill-down to filtered queue) | UI-02, E2E-03 | `client/src/tests/lab-04/StaffDashboard.test.tsx` |
| **AC-13** (Staff Dashboard status card drill-down) | UI-02, E2E-03 | `client/src/tests/lab-04/StaffDashboard.test.tsx` |
| **AC-14** (Reject inactive user assignment) | API-07 | `server/tests/lab-04/actions-taken.api.test.ts` |
| **AC-15** (Stale update concurrency conflict detection) | API-12 | `server/tests/lab-04/ticket-workflow.api.test.ts` |
| **AC-16** (Zero regression across Labs 1-3 test suites) | Full Regression | All Lab 1-3 test files |
