# Lab 03 - Peer Reviewer Record

## Reviewer Details
- **Reviewer Name**: Wichitchai Suwanno
- **Student ID**: 67070503439
- **GitHub Username**: SinghLemonH

---

## Pull Request Reviews

### Feature Branch PRs

#### 1. PR #1 - Sprint 3 Engineering Specification & Contracts
- **Branch**: `feature/lab3-1-docs-contract` -> `lab3-staging`
- **Scope**: FR-01 to FR-17, BR-01 to BR-20, UI Spec, API contract, and test matrix.
- **Peer Reviewer Comment**: Specs, UI design guidelines, authentication state machines, and acceptance criteria are thoroughly detailed and structured. Approved to proceed.
- **Author Response**: Merged into `lab3-staging`.

#### 2. PR #2 - Database Schema Evolution & Seed Migration
- **Branch**: `feature/lab3-2-database-seed` -> `lab3-staging`
- **Scope**: Prisma schema evolution for User with roles, bcrypt passwordHash, mustChangePassword, Comment, and InternalNote models with idempotent realistic seed.
- **Peer Reviewer Comment**: Unified User model and relationship definitions for comments and internal notes are verified. Idempotent seed executes cleanly.
- **Author Response**: Merged into `lab3-staging`.

#### 3. PR #3 - Authentication & Authorization Foundation
- **Branch**: `feature/lab3-3-auth-foundation` -> `lab3-staging`
- **Scope**: JWT + bcrypt authentication endpoints (`/api/auth/login`, `/logout`, `/me`, `/change-password`), role authorization middlewares, and password complexity validation.
- **Peer Reviewer Comment**: Role-based access control and first-login password barrier properly block access. All 19 security API tests pass.
- **Author Response**: Merged into `lab3-staging`.

#### 4. PR #4 - Requester Regression, Comments & Problem Resolution
- **Branch**: `feature/lab3-4-requester-regression` -> `lab3-staging`
- **Scope**: Authenticated requester ticket ownership isolation, public comment thread, and "Problem Appears Resolved" indication.
- **Peer Reviewer Comment**: Full backwards compatibility with Lab 2 tickets maintained. Public comments and resolution signal verified.
- **Author Response**: Merged into `lab3-staging`.

#### 5. PR #5 - IT Staff Ticket Queue & Operational Workflows
- **Branch**: `feature/lab3-5-it-staff-tickets` -> `lab3-staging`
- **Scope**: Operational ticket queue with multi-filtering, sorting, pagination, ticket claim, priority update, status transitions, and confidential #FFFBEB internal notes.
- **Peer Reviewer Comment**: Triage controls and permitted status transitions work as specified. Private internal notes are strictly hidden from requesters.
- **Author Response**: Merged into `lab3-staging`.

#### 6. PR #6 - Administrator User Management & Safety Guards
- **Branch**: `feature/lab3-6-admin-user-management` -> `lab3-staging`
- **Scope**: User account administration, search/filter, role assignments, temporary password generation, self-deactivation guard, and last admin protection.
- **Peer Reviewer Comment**: Safety invariants BR-17 (no self-deactivation) and BR-18 (last admin protection) successfully enforced on server and client.
- **Author Response**: Merged into `lab3-staging`.

#### 7. PR #7 - E2E Verification, Screenshots & Deliverable Artifacts
- **Branch**: `feature/lab3-7-e2e-artifacts` -> `lab3-staging`
- **Scope**: Comprehensive multi-role E2E tests, responsive screens, and documentation deliverables.
- **Peer Reviewer Comment**: End-to-end user workflows tested and passing. All 104 combined test cases pass. Ready for release integration.
- **Author Response**: Merged into `lab3-staging`.

---

### Release Integration PR

#### 8. PR #8 - Release Integration: Lab 3 Staging to Main
- **Branch**: `lab3-staging` -> `main`
- **Scope**: Final integration of all Lab 3 capabilities into `main` branch with zero regression.
- **Peer Reviewer Comment**: Full test suite passes cleanly. Approved for release.
- **Author Response**: Merged into `main`.

