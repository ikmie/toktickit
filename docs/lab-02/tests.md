# Lab 02 Test Plan and Results

## 1. Test Strategy
The test strategy for Sprint 2 combines multi-layered automated testing (Unit, API, UI Component, E2E) with visual inspection checklists. Tests enforce Spec-Driven Development and TDD: failing tests are designed from specifications before code implementation. Requesters are tested under strict ownership boundaries to prevent unauthorized ticket or attachment access.

---

## 2. Planned Tests Table

| Test ID | Type | Req / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---|---|---|---|---|---|---|
| **UNIT-01** | Unit | BR-01, FR-05 | Ticket Number generator output | Returns `TKT-YYYY-XXXXXX` format with 6 padded digits | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| **UNIT-02** | Unit | BR-06, BR-07 | File validation logic | Rejects non-allowed MIME types and files > 5MB | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| **API-01** | API | AC-01, FR-05 | Ticket creation endpoint | 201 Created; returns ticket with generated number | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| **API-02** | API | AC-08, FR-09 | Ticket list search & filters | Returns only matching tickets owned by requester | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| **API-03** | API | AC-03, BR-04 | Ticket ownership enforcement | Returns 403/404 when requester requests another's ticket | `server/tests/lab-02/ticket-detail.api.test.ts` | Pass |
| **API-04** | API | AC-04, AC-05, AC-06 | Attachment upload constraints | Rejects invalid file types, >5MB size, >5 attachment limit | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| **API-05** | API | AC-07, BR-09 | Soft-removal of attachment | Sets `isRemoved = true`, logs timestamp & reason | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| **API-06** | API | BR-10 | Block download of removed file | Returns 404/403 when downloading soft-removed file | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| **UI-01** | UI | AC-10, FR-04 | Form validation messages | Shows red field messages when summary/description invalid | `client/src/tests/lab-02/CreateTicket.test.tsx` | Pass |
| **UI-02** | UI | AC-01 | Submit button busy state | Button disabled and displays loading indicator while posting | `client/src/tests/lab-02/CreateTicket.test.tsx` | Pass |
| **UI-03** | UI | AC-08, FR-14 | Search, filter, clear filters | Interactively updates ticket list & empty state | `client/src/tests/lab-02/MyTickets.test.tsx` | Pass |
| **UI-04** | UI | AC-07 | Soft-removal modal workflow | Prompts for removal reason and updates list view | `client/src/tests/lab-02/AttachmentSection.test.tsx` | Pass |
| **E2E-01** | E2E | AC-01..AC-09 | Full Requester journey | Select user -> Create ticket -> View My Tickets -> Detail -> Attachment -> Switch user isolation | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |

---

## 3. Acceptance-Criterion Traceability

| Acceptance Criterion | Planned Test ID(s) | Test File Path |
|---|---|---|
| **AC-01** (Valid ticket submission & generated number) | API-01, UI-02, E2E-01 | `server/tests/lab-02/create-ticket.api.test.ts`, `e2e/lab-02/requester-ticket-flow.spec.ts` |
| **AC-02** (Requester selection prompt when unselected) | E2E-01 | `e2e/lab-02/requester-ticket-flow.spec.ts` |
| **AC-03** (Cross-requester access forbidden) | API-03, E2E-01 | `server/tests/lab-02/ticket-detail.api.test.ts` |
| **AC-04** (Invalid file type rejected) | API-04 | `server/tests/lab-02/attachments.api.test.ts` |
| **AC-05** (Oversized file rejected) | API-04 | `server/tests/lab-02/attachments.api.test.ts` |
| **AC-06** (Max 5 active attachments limit) | API-04 | `server/tests/lab-02/attachments.api.test.ts` |
| **AC-07** (Soft-removal with reason & disabled download) | API-05, API-06, UI-04 | `server/tests/lab-02/attachments.api.test.ts`, `client/src/tests/lab-02/AttachmentSection.test.tsx` |
| **AC-08** (Search and filter ticket list) | API-02, UI-03 | `server/tests/lab-02/my-tickets.api.test.ts`, `client/src/tests/lab-02/MyTickets.test.tsx` |
| **AC-09** (Requester switching reloads state) | E2E-01 | `e2e/lab-02/requester-ticket-flow.spec.ts` |
| **AC-10** (Field validation errors) | UI-01 | `client/src/tests/lab-02/CreateTicket.test.tsx` |

---

## 4. Responsive and Visual Checklist
- [x] Header bar `#006B3C` styling consistent on Desktop (1200px), Tablet (768px), and Mobile (375px).
- [x] Create Ticket inputs stack vertically on Mobile without horizontal scrolling.
- [x] Read-only fields rendered with `#F0F4F1` background.
- [x] Field validation error messages rendered immediately below inputs in dark red text `#B91C1C`.
- [x] Priority & Status badges visible and distinct across all screen viewports.
- [x] Attachment upload and soft-remove controls accessible on touch devices.

---

## 5. Test Commands
```bash
# Server API & Unit Tests
cd server
npm test

# Client UI Component Tests
cd client
npm test

# End-to-End Tests
npm run test:e2e
```

---

## 6. Final Results
- Server Tests: All suites passing.
- Client Tests: All component suites passing.
- E2E Tests: All scenario flows passing.

---

## 7. Known Limitations or Deferred Tests
- None. All Lab 02 scope items are covered with passing automated tests.
