# Lab 4 Sprint Engineering Specification: Actions Taken, Dashboards, and Final Regression

## 1. Sprint Goal
Complete the core TokTickIT service-desk workflow by introducing a parent-child Actions Taken work-tracking structure under Tickets, enforcing a strict server-side resolution gate requiring at least one recorded action prior to ticket resolution, delivering role-appropriate operational dashboards for Requesters, IT Staff, and Administrators with responsive drill-down capabilities, and performing comprehensive hardening to ensure zero regression across all Lab 1 to 3 capabilities under the Zen Green design system.

---

## 2. Stakeholder Request Interpretation
The IT stakeholder highlighted that while TokTickIT currently enables ticket intake, triage, prioritization, and requester-staff dialogue, it lacks an auditable mechanism for planning and tracking concrete technical interventions performed on tickets.

To fulfill this need, the stakeholder requested:
1. **Actions Taken Tracking**: Under each ticket, authorized staff must be able to record structured actions including Action Date/Time, Action Description, Result, Performed By (auto-populated with authenticated user), Follow-Up Required?, Follow-Up Note (mandatory when follow-up is required), and Attachment Notes (file/image references).
2. **Clear Ownership vs. Action Flexibility**: The primary Ticket Owner coordinates overall ticket resolution, but any active IT Staff member can perform and record discrete actions on the ticket.
3. **Formal Resolution Gate**: Requesters may indicate that an issue appears resolved, but formal ticket resolution requires staff review and cannot occur without at least one recorded Action Taken.
4. **Role-Appropriate Dashboards**: Requesters and IT Staff need concise, authoritative dashboards summarizing key metrics and recent work, linked directly to detailed queues and ticket views via interactive drill-downs.
5. **System Hardening & Cohesion**: The entire platform built across Labs 1 to 3 must be hardened, accessible, responsive across desktop, tablet, and mobile, free of console errors, and unified under the Zen Green design language.

---

## 3. Scope

### Included in Lab 4
- **Actions Taken Domain & Workflow**:
  - Model `ActionTaken` related to `Ticket` (parent-child 1:N relationship) and `User` (`performedBy`).
  - Read access for owning Requesters, all IT Staff, and Administrators.
  - Create and edit capabilities strictly restricted to active IT Staff and Administrators.
  - Validation: mandatory action date/time, description, result, and conditional follow-up note.
  - Auditability: append-only creation, traceable author/timestamp, non-deletable action history.
- **Ticket Status & Resolution Gate**:
  - Full enforcement of the 8 ticket statuses: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, and `CANCELLED`.
  - Backend enforcement of the **Resolution Gate**: rejecting transitions to `RESOLVED` if `actions.length === 0`.
  - Advisory nature of Requester "Problem Appears Resolved" flag (`problemResolvedIndicated = true`) maintained without premature status change.
  - Concurrency & stale update protection (version/timestamp collision detection).
- **Role-Appropriate Dashboards**:
  - **Requester Dashboard** (`/dashboard`): Total Open Tickets, Tickets Waiting for Requester, Recently Resolved Tickets, and Total Closed Tickets; concise list of recent tickets with direct navigation.
  - **IT Staff Dashboard** (`/dashboard`): Unassigned Tickets, My Assigned Tickets, Status Breakdown (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`), High/Urgent Priority counts, and recent operational tickets with interactive filter drill-downs into the Ticket Queue.
  - **Administrator Dashboard** (`/dashboard`): Reuses IT Staff operational metrics and adds concise user account metrics (Total Users, Active Users, Role Distribution).
- **Final Hardening & Regression**:
  - Full backward compatibility for Lab 1, Lab 2, and Lab 3 features (Authentication, First-login Password Reset, Ticket Creation, File Attachments, IT Queue, Public Comments, Confidential Internal Notes, and User Administration).
  - Responsive layout validation across Desktop (1280px+), Tablet (768px), and Mobile (375px).
  - High-contrast accessibility compliance, semantic HTML, visible keyboard focus indicators, and safe failure feedback.

### Explicitly Excluded from Lab 4
- Automatic SLA countdown timers, auto-escalation engines, and breach alert dispatchers.
- External notifications (email SMTP, SMS, LINE, Webhook, push notifications).
- Inventory consumption, spare-parts billing, and labor payroll calculations.
- Multi-level organizational approvals and digital cryptographic signatures.
- Custom report builders, SQL query exports, and OLAP data warehousing.
- Multi-tenant cloud tenant isolation.

---

## 4. Functional Requirements

### Actions Taken Management
- **FR-01**: The system shall allow authenticated IT Staff and Administrators to record an Action Taken on any accessible ticket.
- **FR-02**: The system shall capture for each Action Taken: Action Date/Time, Action Description, Result, Performed By (User ID/Name), Follow-Up Required (Boolean), Follow-Up Note (conditional string), and Attachment Notes (optional string).
- **FR-03**: The system shall auto-populate the `performedBy` field with the authenticated user while permitting assignment to another active IT Staff member or Administrator.
- **FR-04**: The system shall enforce that when `followUpRequired` is marked true, a non-empty `followUpNote` must be provided.
- **FR-05**: The system shall allow authenticated IT Staff and Administrators to edit existing Action Taken records on accessible tickets.
- **FR-06**: The system shall allow Requesters to view all Action Taken entries on tickets they own in read-only mode.
- **FR-07**: The system shall forbid Requesters from creating, modifying, or deleting Action Taken records.

### Ticket Status Lifecycle & Resolution Gate
- **FR-08**: The system shall enforce the approved ticket status lifecycle across all 8 statuses: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, and `CANCELLED`.
- **FR-09**: The system shall strictly prevent transitioning a ticket to `RESOLVED` status unless at least one valid Action Taken has been recorded under that ticket.
- **FR-10**: The system shall provide informative, safe error feedback when an authorized user attempts to resolve a ticket without recorded actions.
- **FR-11**: The system shall maintain the Requester "Problem Appears Resolved" indication as an advisory flag that does not trigger automatic resolution.
- **FR-12**: The system shall detect and reject stale concurrent updates when updating ticket status or assignments.

### Role-Appropriate Dashboards
- **FR-13**: The system shall provide an authoritative Requester Dashboard displaying open tickets count, waiting-for-requester count, recently resolved tickets count, and recently updated tickets owned by the authenticated requester.
- **FR-14**: The system shall provide an authoritative IT Staff Dashboard displaying unassigned tickets count, my assigned tickets count, status breakdown counts, high/urgent priority counts, and recent ticket activity.
- **FR-15**: The system shall provide clickable metric cards on the IT Staff Dashboard that navigate to the Ticket Queue with corresponding filters automatically applied.
- **FR-16**: The system shall provide an Administrator Dashboard combining operational IT metrics with user account distribution metrics.
- **FR-17**: The system shall make `/dashboard` the default post-login landing view for all authenticated roles.

### Hardening & Regression
- **FR-18**: The system shall preserve all Lab 1, Lab 2, and Lab 3 functionality with zero regressions.
- **FR-19**: The system shall enforce consistent Zen Green design tokens, responsive breakpoints, accessible focus states, and safe error handling across all views.

---

## 5. Business Rules

### Actions Taken Rules
- **BR-01**: An Action Taken belongs to exactly one Ticket.
- **BR-02**: The Ticket Owner coordinates the Ticket, but an Action Taken may be performed and recorded by any active IT Staff member or Administrator.
- **BR-03**: Requesters may view Actions Taken on their owned tickets, but cannot create, modify, or delete Actions Taken records (HTTP 403 Forbidden).
- **BR-04**: Only active IT Staff and Administrators (`isActive = true`) can create or update Action Taken records.
- **BR-05**: When `followUpRequired = true`, `followUpNote` is mandatory and must contain between 1 and 2000 non-whitespace characters. If `followUpRequired = false`, `followUpNote` is cleared or optional.
- **BR-06**: `description` and `result` are mandatory fields, each containing between 1 and 2000 non-whitespace characters.
- **BR-07**: `actionDateTime` defaults to the current timestamp if omitted, but may be specified as a valid ISO-8601 date-time not exceeding 24 hours into the future.
- **BR-08**: Action Taken records are auditable and cannot be deleted by any user role.

### Ticket Status & Resolution Gate Rules
- **BR-09**: A Ticket CANNOT transition to `RESOLVED` status unless it contains at least one recorded Action Taken (`ticket.actions.length >= 1`).
- **BR-10**: The backend must enforce the resolution gate on all update paths (`PATCH /api/staff/tickets/:id/status`, `PUT /api/staff/tickets/:id`, etc.). Client-side bypasses must be rejected with HTTP 400 Bad Request.
- **BR-11**: The Requester "Problem Appears Resolved" flag (`problemResolvedIndicated = true`) is advisory only and must not automatically update the Ticket status to `RESOLVED`.
- **BR-12**: Permitted Ticket Status Transition Matrix:
  - `NEW` $\to$ `OPEN`, `IN_PROGRESS`, `CANCELLED`
  - `OPEN` $\to$ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED` *(Gate BR-09 applies)*, `CANCELLED`
  - `IN_PROGRESS` $\to$ `WAITING_FOR_REQUESTER`, `RESOLVED` *(Gate BR-09 applies)*, `CANCELLED`
  - `WAITING_FOR_REQUESTER` $\to$ `IN_PROGRESS`, `RESOLVED` *(Gate BR-09 applies)*, `CANCELLED`
  - `RESOLVED` $\to$ `CLOSED`, `REOPENED`
  - `CLOSED` $\to$ `REOPENED`
  - `REOPENED` $\to$ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED` *(Gate BR-09 applies)*, `CANCELLED`
  - `CANCELLED` $\to$ `REOPENED` (Staff/Admin override)
- **BR-13**: Only IT Staff and Administrators may alter Ticket status, except that a Requester may cancel their own ticket if it is currently in `NEW` or `OPEN` status and has no recorded actions.
- **BR-14**: Stale updates are detected by comparing the client's `updatedAt` with the database timestamp; mismatched timestamps return HTTP 409 Conflict.

### Dashboard Calculation Rules
- **BR-15**: Dashboard metrics must be computed authoritatively on the backend via dedicated aggregated database queries.
- **BR-16**: Requester Dashboard metrics strictly isolate tickets where `requesterId === req.user.id`:
  - `totalOpenTickets`: count of owned tickets with status in `['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER']`.
  - `waitingForRequester`: count of owned tickets with status `'WAITING_FOR_REQUESTER'`.
  - `recentlyResolved`: count of owned tickets with status `'RESOLVED'`.
  - `totalClosed`: count of owned tickets with status `'CLOSED'`.
  - `recentTickets`: 5 most recently updated owned tickets.
- **BR-17**: IT Staff Dashboard metrics aggregate across all system tickets:
  - `unassignedTickets`: count of active tickets where `ownerId === null` and status not in `['RESOLVED', 'CLOSED', 'CANCELLED']`.
  - `myAssignedTickets`: count of active tickets where `ownerId === req.user.id` and status not in `['RESOLVED', 'CLOSED', 'CANCELLED']`.
  - `ticketsByStatus`: record mapping each status to its active count.
  - `urgentHighTickets`: count of active tickets with `itPriority` in `['HIGH', 'URGENT']` and status not in `['RESOLVED', 'CLOSED', 'CANCELLED']`.
  - `recentTickets`: 5 most recently updated tickets across the queue.
- **BR-18**: Administrator Dashboard inherits all IT Staff metrics and appends user account counts:
  - `totalUsers`: total count of registered users.
  - `activeUsers`: count where `isActive = true`.
  - `usersByRole`: counts partitioned by `REQUESTER`, `IT_STAFF`, and `ADMIN`.
- **BR-19**: When no records match a metric, the metric value must return `0` (not `null` or undefined), and list widgets must render clear empty state placeholders.
- **BR-20**: All dashboard date comparisons use the server's authoritative system clock.

---

## 6. Role-Based Authorization Matrix

| Endpoint / Operation | Requester | IT Staff | Administrator | Unauthenticated |
|---|:---:|:---:|:---:|:---:|
| `GET /api/dashboards/requester` | **Allow (Own)** | Forbidden (403) | Forbidden (403) | Reject (401) |
| `GET /api/dashboards/staff` | Forbidden (403) | **Allow** | **Allow** | Reject (401) |
| `GET /api/dashboards/admin` | Forbidden (403) | Forbidden (403) | **Allow** | Reject (401) |
| `GET /api/tickets/:id/actions` | **Allow (Own)** | **Allow (All)** | **Allow (All)** | Reject (401) |
| `POST /api/tickets/:id/actions` | Forbidden (403) | **Allow** | **Allow** | Reject (401) |
| `PUT /api/tickets/:id/actions/:actionId` | Forbidden (403) | **Allow** | **Allow** | Reject (401) |
| `PATCH /api/staff/tickets/:id/status` (to `RESOLVED`) | Forbidden (403) | **Allow (Gate BR-09)** | **Allow (Gate BR-09)** | Reject (401) |
| `GET /api/tickets` (My Tickets) | Allow (Own) | Forbidden (403) | Forbidden (403) | Reject (401) |
| `GET /api/staff/tickets` (Queue) | Forbidden (403) | Allow | Allow | Reject (401) |
| `GET /api/admin/users` (Users) | Forbidden (403) | Forbidden (403) | Allow | Reject (401) |

---

## 7. UI Specification Summary
Refer to [ui-spec.md](file:///d:/CPE/3-1/Software%20En/Lab%201/docs/lab-04/ui-spec.md) for full design token details, layout wireframes, and the visual/accessibility checklist.

### Navigation Shell & Landing
- Role-based navigation adds **Dashboard** as the leftmost primary navigation item.
- Default post-login route for all users is `/dashboard`, rendering the role-tailored view:
  - `REQUESTER` &rarr; Requester Dashboard.
  - `IT_STAFF` &rarr; IT Staff Dashboard.
  - `ADMIN` &rarr; Administrator Dashboard (with User Accounts tab/card).
- Active navigation tab styled with `#0B7A46` / `#EAF6EF` pill styling.

### IT Staff Dashboard Layout
- **Header**: "Welcome back, {Name}!" with subtitle and manual Refresh button.
- **Top Metrics Row**: 5 concise metric cards:
  - *New*, *Open*, *In Progress*, *Waiting for Requester*, *My Assigned*.
  - Each card displays large bold count, status color accent bar, and interactive hover state.
  - Clicking a card navigates to `/staff/queue` with the corresponding status or ownership filter pre-selected.
- **Secondary Grid**:
  - Left Column (60%): "Recent Tickets" table showing Ticket #, Summary, Status Badge, and Updated Time.
  - Right Column (40%): "Quick Actions" card with buttons to Create Ticket, Search Tickets, and My Queue.

### Requester Dashboard Layout
- **Header**: "Welcome, {Name}!" with greeting and status summary.
- **Top Metrics Row**: 4 cards:
  - *My Open Tickets*, *In Progress*, *Resolved*, *Closed*.
  - "View all" link on each card leading to `/requester/tickets` filtered by that status.
- **Secondary Grid**:
  - Left Column (60%): "My Recent Tickets" list with Ticket #, Summary, Status Badge, and Updated Time.
  - Right Column (40%): "Quick Actions" card with "Create Ticket" and "View My Tickets" links.

### Actions Taken Section on Ticket Detail
- Placed directly within the Ticket Detail screen between the Ticket Information header and Communications tab.
- **List / Table Mode**:
  - Columns: Action Date/Time, Description, Result, Performed By, Follow-Up, Attachment Notes, Actions (Edit button for Staff/Admin).
  - Follow-up displayed with an amber indicator badge if `followUpRequired = true` along with the note.
  - For Requesters: rendered as a clean, read-only audit table.
- **Create / Edit Modal Dialog**:
  - Modal title: "Record Action Taken" or "Edit Action Taken".
  - Action Date/Time input (`datetime-local`, default now).
  - Performed By select (defaults to current user, displays active IT Staff/Admin).
  - Description textarea (required, character counter).
  - Result input/select (required, e.g. "Workaround applied", "Hardware replaced", "Pending vendor").
  - "Follow-Up Required?" switch/checkbox.
  - Follow-Up Note textarea (conditionally visible and required when switch is true).
  - Attachment Notes input (optional, e.g. "Refer to diagnostic_log.png").
  - Save & Cancel buttons with loading state.

### Resolution Gate UI Feedback
- On IT Staff Ticket Detail:
  - If a ticket has `0` Actions Taken, the "Resolve Ticket" button or `RESOLVED` status option shows a warning tooltip: *"At least one Action Taken is required to resolve this ticket."*
  - If the user attempts to select `RESOLVED`, an inline warning banner appears or the action is disabled until an action is recorded.
  - If bypassed, a high-contrast danger alert banner displays: *"Cannot resolve ticket: At least one Action Taken must be recorded before resolution."*

---

## 8. Data Changes & Migration Decisions

### 8.1 Prisma Schema Increment
```prisma
model ActionTaken {
  id               Int      @id @default(autoincrement())
  ticketId         Int
  ticket           Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  actionDateTime   DateTime @default(now())
  description      String
  result           String
  performedById    Int
  performedBy      User     @relation("ActionsPerformed", fields: [performedById], references: [id])
  followUpRequired Boolean  @default(false)
  followUpNote     String?
  attachmentNotes  String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([ticketId])
  @@index([performedById])
  @@index([actionDateTime])
}
```

### 8.2 Database Design Decisions Justification (Required by Section 5.1)
1. **Decision 1: Schema Consistency & Indexing Strategy**:
   - `ActionTaken` uses an autoincrement integer primary key (`Int @id @default(autoincrement())`) and integer foreign keys (`ticketId Int`, `performedById Int`) matching the existing `Ticket`, `User`, `Comment`, and `InternalNote` tables.
   - Non-clustered secondary indexes are established on `ticketId` (to ensure high-performance $O(1)$ relational lookups on Ticket Detail views), `performedById` (for fast author aggregation), and `actionDateTime` (for dashboard timeline querying).
2. **Decision 2: Foreign Key Relation & Assignee Independence**:
   - `performedById` references `User(id)` with a dedicated relation `"ActionsPerformed"`, decoupling the person executing a technical action from the primary ticket coordinator (`ticket.ownerId`). This enforces `BR-02` at the database level while guaranteeing referential integrity.
   - Deletion of an active staff member is forbidden (Lab 3 `isActive` invariant); thus action history is preserved immutably.
3. **Decision 3: Non-destructive Migration & Backfill**:
   - Migration adds the `ActionTaken` table without modifying or dropping any existing tables (`User`, `Ticket`, `Attachment`, `Comment`, `InternalNote`).
   - Legacy tickets created in Labs 1-3 remain valid with zero actions taken. Their statuses remain intact. Any future transition of these legacy tickets to `RESOLVED` will gracefully trigger the resolution gate, requiring staff to log an action before closing out the work.

### 8.3 Idempotent Seed Data
- Realistic tickets covering all 8 statuses (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`).
- Tickets with zero actions (to test resolution gate blocking).
- Tickets with single and multiple actions taken by both the ticket owner and other staff members.
- Non-zero and zero dashboard metrics to test active counters and empty states.

---

## 9. Acceptance Criteria

- **AC-01**: Given an active IT Staff or Administrator user and valid data, when creating an Action Taken, then the record is persisted under the target Ticket with authenticated creator and timestamp, returning HTTP 201.
- **AC-02**: Given an authenticated Requester, when dashboard data is retrieved via `GET /api/dashboards/requester`, then only metrics and recent tickets owned by that Requester are returned.
- **AC-03**: Given an authenticated IT Staff user, when dashboard data is retrieved via `GET /api/dashboards/staff`, then system-wide unassigned counts, user-assigned counts, status breakdowns, and urgent/high counts are returned.
- **AC-04**: Given an authenticated Administrator, when dashboard data is retrieved via `GET /api/dashboards/admin`, then combined IT operational metrics and user account metrics are returned.
- **AC-05**: Given a ticket with zero recorded Actions Taken, when IT Staff attempts to change status to `RESOLVED`, then the backend rejects the request with HTTP 400 and an error message specifying that at least one Action Taken is required.
- **AC-06**: Given a ticket with at least one recorded Action Taken, when IT Staff changes status to `RESOLVED`, then the update succeeds and the ticket status transitions to `RESOLVED`.
- **AC-07**: Given a ticket with `problemResolvedIndicated = true`, when checked by staff, then the ticket status remains in its previous state until formally transitioned by staff.
- **AC-08**: Given an Action Taken creation request with `followUpRequired = true` and an empty `followUpNote`, then the backend rejects the request with HTTP 400 Bad Request.
- **AC-09**: Given an authenticated Requester, when attempting to create, edit, or delete an Action Taken via API, then the backend rejects the request with HTTP 403 Forbidden.
- **AC-10**: Given an authenticated Requester viewing their owned ticket, then all recorded Actions Taken for that ticket are visible in read-only format.
- **AC-11**: Given an Action Taken record, when an IT Staff member edits the description, result, or follow-up status, then the changes are updated with updated timestamp and reflected on the ticket.
- **AC-12**: Given an IT Staff user clicking the "Unassigned Tickets" card on the Staff Dashboard, then the user is navigated to the Ticket Queue with ownership filter set to `unassigned`.
- **AC-13**: Given an IT Staff user clicking an "In Progress" status card on the Staff Dashboard, then the user is navigated to the Ticket Queue with status filter set to `IN_PROGRESS`.
- **AC-14**: Given an Action Taken request assigning `performedById` to an inactive user or requester, then the backend rejects the request with HTTP 400 Bad Request.
- **AC-15**: Given concurrent updates with mismatched `updatedAt`, then the backend rejects the stale update with HTTP 409 Conflict.
- **AC-16**: Given all test suites from Lab 1, Lab 2, and Lab 3, when executed on the Lab 4 codebase, all tests pass with zero regressions.

---

## 10. Definition of Done

- [ ] Prisma schema updated with `ActionTaken` model, indexes, and relations; migration executed cleanly without data loss.
- [ ] Database seed updated with idempotent, realistic tickets and action records covering all test scenarios.
- [ ] REST API endpoints for Actions Taken (`POST /api/tickets/:id/actions`, `GET /api/tickets/:id/actions`, `PUT /api/tickets/:id/actions/:actionId`) implemented and secured.
- [ ] REST API endpoints for Dashboards (`GET /api/dashboards/requester`, `GET /api/dashboards/staff`, `GET /api/dashboards/admin`) implemented with authoritative DB queries.
- [ ] Ticket status resolution gate strictly enforced on backend with safe error feedback.
- [ ] Frontend Requester Dashboard and IT Staff/Admin Dashboard components built and wired to navigation.
- [ ] Ticket Detail screen updated with Actions Taken list, create/edit modal dialog, and resolution gate visual cues.
- [ ] Visual inspection checklist completed in `ui-spec.md` with zero clipping, overflow, or contrast defects across Desktop, Tablet, and Mobile viewports.
- [ ] Test suites passing: Lab 1–3 regressions, Lab 4 backend API tests, Lab 4 UI component tests, and Lab 4 Playwright E2E tests.
- [ ] Peer reviewer records updated in `docs/lab-04/reviewer.md` with reviewer approvals from `SinghLemonH`.
- [ ] AI prompt log and reflection documented in `docs/lab-04/ai-use.md`.
- [ ] Feature branches merged into `lab4-staging` and final release PR merged into `main`.

---

## 11. Assumptions and Decisions

- **Decision 1: Primary Owner vs. Action Performer**:
  `Ticket.ownerId` represents overall case management accountability, while `ActionTaken.performedById` tracks the technical resource who performed the specific intervention. This allows collaborative troubleshooting while maintaining ownership clarity.
- **Decision 2: Append-Only History**:
  Action Taken records cannot be deleted. Corrections must be performed via inline edits, which update `updatedAt` for full audit traceability.
- **Decision 3: Default Dashboard Route**:
  The application shell routes authenticated users to `/dashboard` upon initial load or login. Navigation tabs allow seamless movement between Dashboard, Ticket Queue / My Tickets, and User Management.
- **Decision 4: Soft Resolution Validation**:
  The client triage UI preemptively disables the "Resolve" button when actions count is zero and shows an informative tooltip, preventing frustrating failed network round-trips while the backend remains the ultimate gatekeeper.
