# Lab 3 Sprint Engineering Specification

## 1. Sprint Goal
Deliver an enterprise-grade role-based IT ticketing product increment for TokTickIT. Replace the temporary Lab 2 Development Requester selector with secure authentication and first-login password enforcement. Introduce a shared IT Staff Ticket Queue with ownership assignment, operational prioritization, status lifecycle management, and clear separation between Public Comments and private Internal Notes. Provide a minimalist Administrator User Management interface with safety guards preventing self-deactivation and orphan system states, while preserving all existing Requester workflows and ticket ownership.

---

## 2. Stakeholder Request Interpretation
The IT stakeholder requires real authentication with password security to replace the development selector. The application must support three distinct roles:
1. **Requester**: Creates and manages their own tickets, uploads attachments, posts Public Comments, and signals when a reported issue appears resolved.
2. **IT Staff**: Accesses a professional Ticket Queue to locate and prioritize work, claims or reassigns tickets, adjusts IT Priority, updates ticket statuses through permitted lifecycles, communicates via Public Comments, and records confidential operational Internal Notes.
3. **Administrator**: Manages user accounts (list, search, role filter, create, edit, activate/deactivate, reset initial passwords) while prevented from self-deactivation or locking out the system.

Server-side enforcement is mandatory: hiding a button is not security. All screens must strictly adhere to the established Zen Green design system across desktop, tablet, and mobile.

---

## 3. Scope

### Included in Lab 3
- **Authentication & Authorization**:
  - Secure credential authentication (email & hashed password).
  - Inactive account rejection.
  - Mandatory password change on first login / after admin reset before application entry.
  - Role-based navigation and server-side API authorization for Requester, IT Staff, and Administrator.
  - Session / token invalidation on logout.
- **Requester Continuity & Communication**:
  - Preserved ticket creation, ticket listing, ticket detail, and attachment management from Lab 2.
  - Ticket ownership bound to authenticated user identity.
  - Public Comment creation and retrieval on owned tickets.
  - "Problem Appears Resolved" indication by Requester.
- **IT Staff Queue & Operational Workflows**:
  - Shared IT Ticket Queue supporting search, multi-filters (Category, Priority, Status, Ownership), sorting, and pagination.
  - Ticket ownership assignment (claim to self or reassign to active IT Staff/Admin).
  - IT Priority update (LOW, MEDIUM, HIGH, URGENT).
  - Permitted status transition workflow (NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CLOSED, REOPENED, CANCELLED).
  - Append-only Public Comments (shared with Requester).
  - Append-only Internal Notes (strictly forbidden to Requester).
- **Administrator User Management**:
  - Minimalist user list with search (name, email) and role filtering.
  - User creation with single assigned role, active state, and initial password.
  - User account editing (name, email, role, activation state).
  - Initial password reset forcing password change on next login.
  - Safety constraints: self-deactivation blocked; removing/deactivating last active Administrator blocked; duplicate emails rejected.
- **Database Increment & Migration**:
  - Evolution of SQLite/Prisma schema to unified `User` model, `Comment`, and `InternalNote` models.
  - Ticket owner relation and IT Priority operational fields.
  - Idempotent seed data with at least 4 active Requesters, 1 inactive Requester, 3 active IT Staff, 1 inactive IT Staff, and 1 active Administrator.

### Explicitly Excluded from Lab 3
- Email invitations, password-reset email delivery, MFA, social login, and SSO.
- Self-registration and public sign-up.
- "Actions Taken by IT Staff" (deferred to Lab 4).
- Formal SLA calculations, escalation rules, and push notifications.
- Multi-tenant organizations, departments, profile photos, and role history audit logs.
- Hard user deletion, bulk user operations, import/export.
- Multiple roles assigned to one user.

---

## 4. Functional Requirements

### Authentication & Account Security
- **FR-01**: The system shall authenticate users using email and password against server-side hashed credentials.
- **FR-02**: The system shall reject authentication attempts for inactive user accounts with a safe error message.
- **FR-03**: The system shall intercept any user flagged with `mustChangePassword = true` upon login and mandate a password update before allowing access to any application features.
- **FR-04**: The system shall provide a Logout action that terminates authenticated access and clears client credentials.
- **FR-05**: The system shall expose a `/api/auth/me` endpoint returning the currently authenticated user profile and assigned role.

### Requester Operations
- **FR-06**: The system shall bind all Requester ticket operations (create, view owned list, view detail, upload attachment, soft-remove attachment) strictly to the authenticated user ID.
- **FR-07**: The system shall allow Requesters to post and view Public Comments on tickets they own.
- **FR-08**: The system shall provide a "Problem Appears Resolved" action on Ticket Detail for the owning Requester to signal resolution without directly setting the ticket to Resolved or Closed.

### IT Staff Workflows
- **FR-09**: The system shall provide IT Staff with a shared Ticket Queue featuring text search (Ticket Number, Summary), multi-attribute filtering (Category, IT Priority, Status, Ownership), column sorting, and pagination.
- **FR-10**: The system shall allow IT Staff to claim an unassigned ticket (assign to self) or reassign ticket ownership to another active IT Staff or Administrator.
- **FR-11**: The system shall allow IT Staff to update the ticket's IT Priority independently of the Requester's requested priority.
- **FR-12**: The system shall enforce permitted ticket status transitions according to the status transition lifecycle.
- **FR-13**: The system shall allow IT Staff to create and view confidential Internal Notes on tickets.

### Administrator User Management
- **FR-14**: The system shall display a User Management interface for Administrators listing user Name, Email, Role, Status, and Edit action, with search and role filter.
- **FR-15**: The system shall allow Administrators to create new user accounts with one role, active status, and an initial password marked for first-login reset.
- **FR-16**: The system shall allow Administrators to edit user account details (name, email, role, activation state).
- **FR-17**: The system shall allow Administrators to issue a new initial password for a user, flagging the account for mandatory password change at next login.

---

## 5. Business Rules

### Authentication & Account Business Rules
- **BR-01**: Only an active user (`isActive = true`) with valid credentials may authenticate. Inactive users receive HTTP 403 / "Account is inactive. Please contact support."
- **BR-02**: A user marked as requiring a password change (`mustChangePassword = true`) cannot enter the normal application until a new valid password meeting security criteria is saved.
- **BR-03**: Passwords must be at least 8 characters long, include both uppercase and lowercase letters, and contain at least one number and one special character.
- **BR-04**: The authenticated user identity, not a client-supplied parameter or header, determines ownership of all Requester operations.
- **BR-05**: Each user in the system has exactly one assigned role: `REQUESTER`, `IT_STAFF`, or `ADMIN`.

### Comments & Internal Notes Business Rules
- **BR-06**: Public Comments are visible to the ticket's Requester, IT Staff, and Administrator.
- **BR-07**: Internal Notes are strictly confidential and visible ONLY to IT Staff and Administrator. Any attempt by a Requester to fetch or post Internal Notes returns HTTP 403 without leaking note existence or content.
- **BR-08**: Public Comments and Internal Notes are append-only. No user role may edit or delete existing comments or notes.
- **BR-09**: Each Comment and Internal Note automatically records its author (`authorId`) and creation timestamp (`createdAt`) from the backend authenticated context.
- **BR-10**: Empty or whitespace-only comments/notes are rejected with HTTP 400. Text length must be between 1 and 2000 characters.

### Ticket Ownership, Priority & Lifecycle Rules
- **BR-11**: Each Ticket may have zero or one primary Ticket Owner. The owner must be an active user with role `IT_STAFF` or `ADMIN`.
- **BR-12**: Requested Priority is submitted by the Requester and remains immutable. IT Priority initially defaults to the Requested Priority value and may subsequently be altered only by IT Staff or Administrator.
- **BR-13**: Permitted Ticket Statuses are: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, and `CANCELLED`.
- **BR-14**: Status Transition Lifecycle:
  - `NEW` $\to$ `OPEN`, `IN_PROGRESS`, `CANCELLED`
  - `OPEN` $\to$ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
  - `IN_PROGRESS` $\to$ `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
  - `WAITING_FOR_REQUESTER` $\to$ `IN_PROGRESS`, `RESOLVED`, `CANCELLED`
  - `RESOLVED` $\to$ `CLOSED`, `REOPENED`
  - `CLOSED` $\to$ `REOPENED`
  - `REOPENED` $\to$ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
  - `CANCELLED` $\to$ `REOPENED` (Admin/Staff override)
- **BR-15**: A Requester cannot formally set a ticket to `RESOLVED` or `CLOSED`. A Requester may only invoke "Problem Appears Resolved", which flags `problemResolvedIndicated = true` and leaves formal closing to IT Staff.

### Administrator Safety Rules
- **BR-16**: Email addresses must be globally unique across all users. Duplicate email creation or update returns HTTP 409 Conflict.
- **BR-17**: An Administrator cannot deactivate their own account (`id === req.user.id`). Any such attempt is rejected with HTTP 400.
- **BR-18**: The system must never be left without an active Administrator. Deactivating or demoting the sole remaining active Administrator is rejected with HTTP 400.
- **BR-19**: User deletion is forbidden. User termination is handled exclusively via deactivation (`isActive = false`).
- **BR-20**: Setting a new initial password by an Administrator automatically sets `mustChangePassword = true` for that user.

---

## 6. Role-Based Authorization Matrix

| Endpoint / Action | Requester | IT Staff | Administrator | Unauthenticated |
|---|:---:|:---:|:---:|:---:|
| `POST /api/auth/login` | Allow | Allow | Allow | Allow |
| `POST /api/auth/logout` | Allow | Allow | Allow | Reject (401) |
| `GET /api/auth/me` | Allow | Allow | Allow | Reject (401) |
| `POST /api/auth/change-password` | Allow | Allow | Allow | Reject (401) |
| `POST /api/tickets` (Create) | Allow (Own) | Forbidden (403) | Forbidden (403) | Reject (401) |
| `GET /api/tickets` (My Tickets) | Allow (Own) | Forbidden (403) | Forbidden (403) | Reject (401) |
| `GET /api/tickets/:id` (Detail) | Allow (Own) | Forbidden (403)* | Forbidden (403)* | Reject (401) |
| `POST /api/tickets/:id/resolve-indication` | Allow (Own) | Forbidden (403) | Forbidden (403) | Reject (401) |
| `GET /api/tickets/:id/comments` | Allow (Own) | Allow (All) | Allow (All) | Reject (401) |
| `POST /api/tickets/:id/comments` | Allow (Own) | Allow (All) | Allow (All) | Reject (401) |
| `GET /api/tickets/:id/notes` | **Forbidden (403)** | Allow (All) | Allow (All) | Reject (401) |
| `POST /api/tickets/:id/notes` | **Forbidden (403)** | Allow (All) | Allow (All) | Reject (401) |
| `GET /api/staff/tickets` (Queue) | Forbidden (403) | Allow | Allow | Reject (401) |
| `GET /api/staff/tickets/:id` (Detail) | Forbidden (403) | Allow | Allow | Reject (401) |
| `PATCH /api/staff/tickets/:id/assign` | Forbidden (403) | Allow | Allow | Reject (401) |
| `PATCH /api/staff/tickets/:id/priority` | Forbidden (403) | Allow | Allow | Reject (401) |
| `PATCH /api/staff/tickets/:id/status` | Forbidden (403) | Allow | Allow | Reject (401) |
| `GET /api/admin/users` (List) | Forbidden (403) | Forbidden (403) | Allow | Reject (401) |
| `POST /api/admin/users` (Create) | Forbidden (403) | Forbidden (403) | Allow | Reject (401) |
| `PUT /api/admin/users/:id` (Edit) | Forbidden (403) | Forbidden (403) | Allow | Reject (401) |
| `POST /api/admin/users/:id/reset-password` | Forbidden (403) | Forbidden (403) | Allow | Reject (401) |

*\* Note: IT Staff and Administrators access ticket operational details via the dedicated `/api/staff/tickets/:id` endpoint.*

---

## 7. UI Specification Summary
- **Visual Design**: Strict reuse of the Zen Green design system (`#006B3C` primary green, `#0B7A46` hover/active, `#EAF6EF` light accents, `#F5F7F6` surface background, `#B91C1C` error red).
- **Navigation Shell**:
  - Shows authenticated user name and badge with assigned role (`Requester`, `IT Staff`, `Admin`).
  - Requester: "My Tickets" and "Create Ticket" links.
  - IT Staff: "Ticket Queue" link.
  - Administrator: "User Management" link.
  - Logout button accessible from user profile area in top header.
- **Login & Password Change**: Clean centered card, clear validation errors, loading state, and modal or dedicated view for mandatory first password change.
- **Public Comments vs Internal Notes**:
  - Public Comments: Styled in clean neutral cards with author name, role badge, timestamp, and green accent.
  - Internal Notes: Distinct pale amber/warm background (`#FFFBEB` with `#D97706` left border or clear "INTERNAL NOTE - STAFF ONLY" banner) to prevent accidental public disclosure.
- **Responsive Viewports**: Tested at 1200px (Desktop), 768px (Tablet), and 375px (Mobile).

---

## 8. Data Changes & Migration
- **User Model**:
  - Fields: `id`, `name`, `email` (unique), `passwordHash`, `role` (`REQUESTER`, `IT_STAFF`, `ADMIN`), `isActive`, `mustChangePassword`, `department`, `createdAt`, `updatedAt`.
- **Ticket Model**:
  - Add `ownerId` (nullable, foreign key to `User`).
  - Add `itPriority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`, default copied from requested priority).
  - Add `problemResolvedIndicated` (Boolean, default `false`).
  - Add `resolutionSummary` (Optional String).
  - Relations: `requester` (`User`), `owner` (`User`, optional), `comments` (`Comment[]`), `notes` (`InternalNote[]`).
- **Comment Model**:
  - `id`, `ticketId` (FK Ticket), `authorId` (FK User), `content`, `createdAt`.
- **InternalNote Model**:
  - `id`, `ticketId` (FK Ticket), `authorId` (FK User), `content`, `createdAt`.

---

## 9. Acceptance Criteria
- **AC-01**: Given an active user with valid credentials, when the user logs in, then the backend establishes authenticated access and returns the user identity and role.
- **AC-02**: Given a user with `mustChangePassword = true`, when login succeeds, then normal application screens remain unavailable until a new valid password is saved.
- **AC-03**: Given an authenticated Requester, when accessing ticket endpoints, then the backend enforces ownership against the authenticated identity and rejects requests for unowned tickets with HTTP 403.
- **AC-04**: Given a Requester account, when an Internal Note endpoint is requested, then the request is rejected with HTTP 403 without leaking note data.
- **AC-05**: Given an inactive user account, when login is attempted with correct password, then access is denied with HTTP 403 and message indicating account inactivity.
- **AC-06**: Given an authenticated IT Staff user, when accessing the Ticket Queue, then tickets across all Requesters are returned with search, filtering, sorting, and pagination metadata.
- **AC-07**: Given an open ticket, when IT Staff claims the ticket, then `ownerId` is updated to the staff user's ID.
- **AC-08**: Given an open ticket, when IT Staff updates IT Priority from MEDIUM to URGENT, then the updated priority is persisted and visible in queue and detail.
- **AC-09**: Given a ticket in status `NEW`, when IT Staff updates status to `OPEN`, then the status transition succeeds; an invalid transition returns HTTP 400.
- **AC-10**: Given a ticket, when any permitted user posts a Public Comment, then the comment is saved and displayed in the conversation thread.
- **AC-11**: Given a ticket, when IT Staff posts an Internal Note, then the note is persisted and visible only to IT Staff and Admin.
- **AC-12**: Given an owned ticket, when the Requester clicks "Problem Appears Resolved", then `problemResolvedIndicated` is set to `true` on the ticket.
- **AC-13**: Given an Administrator, when creating a new user, then the user is persisted with `mustChangePassword = true` and can authenticate.
- **AC-14**: Given an Administrator attempting to deactivate their own account, then the operation is rejected with HTTP 400.
- **AC-15**: Given a single active Administrator in the system, when deactivating or changing their role, then the operation is rejected with HTTP 400.
- **AC-16**: Given a duplicate email address on user creation, then the operation is rejected with HTTP 409 Conflict.
- **AC-17**: Given a non-Administrator attempting to access `/api/admin/users`, then the request is rejected with HTTP 403 Forbidden.
- **AC-18**: Given an authenticated user, when clicking Logout, then the session/token is invalidated and subsequent requests return HTTP 401.

---

## 10. Definition of Done
- [ ] All functional requirements (FR-01 to FR-17) and business rules (BR-01 to BR-20) implemented.
- [ ] All acceptance criteria (AC-01 to AC-18) covered by passing automated tests.
- [ ] All feature branches reviewed and merged into `lab3-staging` through pull requests.
- [ ] Reviewer record completed in `docs/lab-03/reviewer.md`.
- [ ] AI prompt log and reflection documented in `docs/lab-03/ai-use.md`.
- [ ] Full regression test suite passing (Lab 1 + Lab 2 + Lab 3).
- [ ] Responsive desktop, tablet, and mobile screenshot evidence generated.
- [ ] Staging merged into `main` and release tagged.

---

## 11. Assumptions and Decisions
- **Decision 1**: Token-based authentication (JWT stored in `localStorage` and sent via `Authorization: Bearer <token>` header) is selected for clean decoupled API and E2E testing without cookie configuration complexities.
- **Decision 2**: Passwords are encrypted with standard `bcryptjs` (salt rounds = 10).
- **Decision 3**: Lab 2 requesters are migrated into the unified `User` model with default role `REQUESTER` and default password `Password123!`, retaining existing ticket foreign keys.
