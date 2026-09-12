# Lab 03 - GitHub Issues & Kanban Board Guide

This document lists all **Lab 3 Feature Issues** structured according to **Section 11 of the Lab 3 Handout** and links them directly to the **Ready** column of your GitHub Project Kanban board ([https://github.com/users/ikmie/projects/1](https://github.com/users/ikmie/projects/1)).

---

## 1. Quick Automated Setup (Via Script)

If you have a GitHub Personal Access Token (PAT):

```bash
node scripts/create-lab3-issues.mjs <YOUR_GITHUB_PAT>
```

This script will automatically create all 8 issues on `ikmie/toktickit`. Afterwards, in your Project Kanban board, simply click **`+ Add item`** in the **Ready** column and select each issue.

---

## 2. Direct Manual Setup (In GitHub Projects)

In your GitHub Project Kanban board ([https://github.com/users/ikmie/projects/1](https://github.com/users/ikmie/projects/1)):
1. Navigate to the **"Ready"** column.
2. Click **`+ Add item`** at the bottom of the column.
3. Paste each of the following 8 Feature Items:

---

### Issue 1
- **Title**: `[Lab 3] Sprint 3 Engineering Specification & Contracts`
- **Status**: `Ready` (then moves to `In progress` &rarr; `In review` &rarr; `Done`)
- **Scope**:
  - Formalize FR-01 to FR-17 and BR-01 to BR-20
  - Role-Based Authorization Matrix across Requester, IT Staff, and Admin
  - Engineering specifications: `docs/lab-03/specification.md`, `ui-spec.md`, `api-spec.md`, and `tests.md`
  - Branch: `feature/lab3-1-docs-contract` (PR #1)

---

### Issue 2
- **Title**: `[Lab 3] Database Schema Evolution & Seed Migration`
- **Status**: `Ready`
- **Scope**:
  - Evolve Prisma schema to unified User model with roles: `REQUESTER`, `IT_STAFF`, `ADMIN`
  - Add `passwordHash`, `mustChangePassword`, `Comment`, and `InternalNote` models
  - Create idempotent seed data with realistic tickets and active/inactive test accounts
  - Branch: `feature/lab3-2-database-seed` (PR #2)

---

### Issue 3
- **Title**: `[Lab 3] Authentication & Authorization Foundation`
- **Status**: `Ready`
- **Scope**:
  - Implement JWT authentication endpoints: `/api/auth/login`, `/logout`, `/me`, `/change-password`
  - Password complexity validation enforcing BR-03 (8+ chars, upper, lower, number, special)
  - First-login password change barrier middleware enforcing BR-02
  - Server-side role authorization guards (`requireRole`)
  - Branch: `feature/lab3-3-auth-foundation` (PR #3)

---

### Issue 4
- **Title**: `[Lab 3] Requester Regression, Comments & Problem Resolution`
- **Status**: `Ready`
- **Scope**:
  - Seamless migration from simulated `X-Requester-Id` to authenticated identity with zero regression
  - Ticket ownership isolation (BR-04)
  - Public Comments thread on Ticket Detail (FR-06, BR-06)
  - "Problem Appears Resolved" indication flag for Requesters (FR-07)
  - Branch: `feature/lab3-4-requester-regression` (PR #4)

---

### Issue 5
- **Title**: `[Lab 3] IT Staff Ticket Queue & Operational Workflows`
- **Status**: `Ready`
- **Scope**:
  - Shared IT Staff Ticket Queue with search, multi-filter, column sort, and pagination
  - Operational triage controls: Ticket Claim (auto-advances NEW -> OPEN) and Assignee ownership
  - IT Priority selector (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
  - Permitted Status Transition Lifecycle Matrix (BR-14)
  - Confidential Internal Notes with distinct `#FFFBEB` styling, strictly hidden from Requesters (BR-15)
  - Branch: `feature/lab3-5-it-staff-tickets` (PR #5)

---

### Issue 6
- **Title**: `[Lab 3] Administrator User Management & Safety Guards`
- **Status**: `Ready`
- **Scope**:
  - Administrator User Management interface: search, role filter, status filter, and pagination
  - Create user modal with temporary password generation and `mustChangePassword = true` (FR-13)
  - Edit user details and reset temporary password modal (FR-14, FR-16)
  - Self-deactivation prevention safety invariant (BR-17)
  - Last active Administrator removal/demotion protection (BR-18)
  - Branch: `feature/lab3-6-admin-user-management` (PR #6)

---

### Issue 7
- **Title**: `[Lab 3] Multi-role E2E Flow Verification & Deliverable Artifacts`
- **Status**: `Ready`
- **Scope**:
  - Multi-role End-to-End automated integration tests in `e2e/lab-03/`
  - Authentication flow, IT staff triage & notes flow, and user governance flow
  - Verified 101 passing tests across server and client suites
  - Finalized `reviewer.md` records and `ai-use.md` prompt log
  - Branch: `feature/lab3-7-e2e-artifacts` (PR #7)

---

### Issue 8
- **Title**: `[Lab 3] Release Integration: Staging to Main`
- **Status**: `Ready`
- **Scope**:
  - Final staged release merging `lab3-staging` into `main` with zero regression
  - Verification of all 101 automated test cases and production client build
  - PR: `lab3-staging` -> `main` (PR #8)

---

## 3. Kanban Lifecycle for Lab 3 Submission Report

For **Answer Part 1: Git Use with Engineering Workflow**:
1. **Initial State (Sprint Planning Screenshot)**: Show all 8 Lab 3 feature issues in the **`Ready`** column (or in `Backlog` & `Ready`).
2. **Completed State (Sprint Completion Screenshot)**: Move all 8 issues into the **`Done`** column, showing completion of the sprint alongside the merged PRs.
