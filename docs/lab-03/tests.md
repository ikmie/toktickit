# TokTickIT Test Plan & Results - Lab 03

## 1. Testing Strategy
Sprint 3 follows a multi-tiered testing strategy rooted in Spec-Driven Development (SDD) and Test-Driven Development (TDD):
- **Server API & Security Tests**: Vitest + Supertest testing authentication flows, token expiration, first-login password barriers, cross-role security boundaries, comments/notes visibility, status transitions, and administrator safety invariants.
- **Client UI Tests**: Vitest + React Testing Library testing form inputs, busy states, password validation rules, queue interactions, role navigation rendering, and dialog safety prompts.
- **End-to-End Tests**: Full multi-role simulated workflows validating end-to-end user journeys from login to ticket resolution and account management.
- **Regression Suite**: Automated execution of all Lab 1 and Lab 2 tests ensuring zero feature regression.

---

## 2. Planned Tests Matrix

| Test ID | Type | Req / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---|---|---|---|---|---|---|
| **API-01** | API | AC-01, BR-01 | Valid user login | 200 OK; returns JWT token and safe user payload | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-02** | API | AC-05, BR-01 | Inactive user login attempt | 403 Forbidden; "Account is inactive" | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-03** | API | AC-01 | Invalid credentials login | 401 Unauthorized; generic invalid credentials message | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-04** | API | AC-02, BR-02 | First-login password change flag | Returns `mustChangePassword: true` on initial login | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-05** | API | AC-02, BR-03 | Password change validation rules | Rejects weak passwords; updates hash on valid input | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-06** | API | AC-18 | Logout / Token invalidation | Token rejection upon logout | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-07** | API | AC-03, BR-04 | Requester ticket ownership isolation | 403 Forbidden when Requester accesses another's ticket | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| **API-08** | API | AC-04, BR-07 | Requester requests Internal Notes | 403 Forbidden; no note content leaked | `server/tests/lab-03/comments-notes.api.test.ts` | Pass |
| **API-09** | API | AC-10, BR-06 | Post & retrieve Public Comments | 201 Created; comment visible to Requester & Staff | `server/tests/lab-03/comments-notes.api.test.ts` | Pass |
| **API-10** | API | AC-11, BR-07 | Post & retrieve Internal Notes | 201 Created; visible only to IT Staff & Admin | `server/tests/lab-03/comments-notes.api.test.ts` | Pass |
| **API-11** | API | AC-06, FR-09 | IT Staff queue search & filters | Returns filtered tickets with pagination metadata | `server/tests/lab-03/staff-queue.api.test.ts` | Pass |
| **API-12** | API | AC-07, BR-11 | IT Staff claims unassigned ticket | Sets ticket `ownerId` to authenticated staff user | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| **API-13** | API | AC-08, BR-12 | IT Staff updates IT Priority | 200 OK; updates `itPriority` field | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| **API-14** | API | AC-09, BR-14 | Permitted status transition lifecycle | Accepts valid transitions; rejects invalid with 400 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| **API-15** | API | AC-12, BR-15 | Requester indicates problem resolved | 200 OK; sets `problemResolvedIndicated = true` | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| **API-16** | API | AC-13, FR-15 | Admin creates new user account | 201 Created with `mustChangePassword = true` | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-17** | API | AC-16, BR-16 | Admin duplicate email rejection | 409 Conflict when creating existing email | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-18** | API | AC-14, BR-17 | Admin self-deactivation prevention | 400 Bad Request when admin deactivates own ID | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-19** | API | AC-15, BR-18 | Protection of last active Admin | 400 Bad Request if deactivating last remaining admin | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-20** | API | AC-17 | Non-admin access to user admin API | 403 Forbidden for Requester or IT Staff | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **UI-01** | UI | AC-01, AC-05 | Login form validation & busy state | Displays error alerts and disables button while submitting | `client/src/tests/lab-03/Login.test.tsx` | Pass |
| **UI-02** | UI | AC-02, BR-03 | Mandatory Change Password modal | Live rule checklist, validation, and submission | `client/src/tests/lab-03/ChangePassword.test.tsx` | Pass |
| **UI-03** | UI | AC-06 | Staff Ticket Queue filter & sort | Interactively updates table rows upon filter selection | `client/src/tests/lab-03/StaffTicketQueue.test.tsx` | Pass |
| **UI-04** | UI | AC-07..AC-11 | Staff Ticket Detail controls | Claim button, priority selector, comments/notes tabs | `client/src/tests/lab-03/StaffTicketDetail.test.tsx` | Pass |
| **UI-05** | UI | AC-13..AC-16 | Admin User Management screen | User list table, search, role filter, create user dialog | `client/src/tests/lab-03/UserManagement.test.tsx` | Pass |
| **E2E-01** | E2E | AC-01..AC-05 | Authentication & first login E2E | Login with temp password -> Forced reset -> Normal app | `e2e/lab-03/authentication.spec.ts` | Pass |
| **E2E-02** | E2E | AC-06..AC-12 | IT Staff queue & detail flow E2E | Filter queue -> Open ticket -> Claim -> Add note -> Resolve | `e2e/lab-03/staff-ticket-flow.spec.ts` | Pass |
| **E2E-03** | E2E | AC-13..AC-19 | Admin user administration E2E | Create user -> Reset password -> Self-deactivation block | `e2e/lab-03/user-administration.spec.ts` | Pass |

---

## 3. Acceptance Criteria Traceability

| Acceptance Criterion | Planned Test ID(s) | Primary Automated Test File |
|---|---|---|
| **AC-01** (Valid credentials login) | API-01, UI-01, E2E-01 | `server/tests/lab-03/auth.api.test.ts` |
| **AC-02** (Mandatory first-login password change) | API-04, API-05, UI-02, E2E-01 | `server/tests/lab-03/auth.api.test.ts` |
| **AC-03** (Requester ticket ownership isolation) | API-07 | `server/tests/lab-03/authorization.api.test.ts` |
| **AC-04** (Requester forbidden from Internal Notes) | API-08 | `server/tests/lab-03/comments-notes.api.test.ts` |
| **AC-05** (Inactive user denied authentication) | API-02, UI-01 | `server/tests/lab-03/auth.api.test.ts` |
| **AC-06** (IT Staff Ticket Queue queries) | API-11, UI-03, E2E-02 | `server/tests/lab-03/staff-queue.api.test.ts` |
| **AC-07** (IT Staff claims ticket ownership) | API-12, UI-04, E2E-02 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` |
| **AC-08** (IT Staff updates operational IT Priority) | API-13, UI-04 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` |
| **AC-09** (Permitted ticket status transition rules) | API-14, UI-04, E2E-02 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` |
| **AC-10** (Public Comments posted and visible) | API-09, UI-04 | `server/tests/lab-03/comments-notes.api.test.ts` |
| **AC-11** (Internal Notes posted and staff-restricted) | API-10, UI-04, E2E-02 | `server/tests/lab-03/comments-notes.api.test.ts` |
| **AC-12** (Requester indicates problem resolved) | API-15, UI-04 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` |
| **AC-13** (Admin creates user with initial password) | API-16, UI-05, E2E-03 | `server/tests/lab-03/users-admin.api.test.ts` |
| **AC-14** (Admin self-deactivation blocked) | API-18, UI-05, E2E-03 | `server/tests/lab-03/users-admin.api.test.ts` |
| **AC-15** (Last active Administrator protected) | API-19, UI-05 | `server/tests/lab-03/users-admin.api.test.ts` |
| **AC-16** (Duplicate email address rejected) | API-17, UI-05 | `server/tests/lab-03/users-admin.api.test.ts` |
| **AC-17** (Non-Admin forbidden from Admin API) | API-20 | `server/tests/lab-03/users-admin.api.test.ts` |
| **AC-18** (Logout clears access session) | API-06, E2E-01 | `server/tests/lab-03/auth.api.test.ts` |

---

## 4. Visual & Responsive Checklist

- [ ] Header renders authenticated user's name and role badge (`Requester`, `IT Staff`, `Admin`).
- [ ] Login card centered with high-contrast text and `#006B3C` primary action button.
- [ ] Mandatory password change interface presents clear live criteria checkmarks.
- [ ] IT Staff Ticket Queue renders full multi-column table on desktop (>=992px) and card list on mobile (<768px).
- [ ] Public Comments styled with neutral green accents; Internal Notes prominently styled in amber/yellow (`#FFFBEB`).
- [ ] Admin User Management displays active/inactive badge pills and accessible Edit button.
- [ ] No horizontal overflow or content clipping across desktop (1200px), tablet (768px), and mobile (375px).

---

## 5. Test Execution Commands

```bash
# Run server test suite
cd server
npm test

# Run client test suite
cd ../client
npm test

# Run all end-to-end tests
cd ../
npx vitest run e2e/lab-03
```
