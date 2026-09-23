# TokTickIT - Enterprise IT Service Desk Application

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React%2019-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Tests Passing](https://img.shields.io/badge/Tests-139%20Passing-brightgreen?style=flat-square)]()

**TokTickIT** is a full-stack IT Service Desk & Incident Management application designed for organizational issue tracking, triage, ticket lifecycle operations, and role-based user management.

Developed for **CPE 334 Software Engineering**, following **Spec-Driven Development (SDD)**, **Test-Driven Development (TDD)**, and continuous peer-reviewed release staging.

---

## 🚀 Sprint Milestones & Feature Overview

### 📦 Lab 1: Full-Stack Architecture Starter
- Established Express + TypeScript API server & React + Vite frontend foundation.
- Configured Prisma ORM with relational schema, migration pipeline, and database seeding.
- Category listing API (`GET /api/categories`) and server health check endpoint (`GET /api/health`).

### 📦 Lab 2: Requester Portal & Ticketing Workflow
- **Ticket Creation**: Form with category selection, sequential Ticket IDs (`TICK-YYYYMMDD-XXXX`), and automatic priority calculation based on Impact × Urgency matrix.
- **Attachment Management**: Multi-file upload with MIME validation (PDF, PNG, JPEG), size constraints, file streaming download, and soft deletion.
- **My Tickets Dashboard**: Search by ticket number or summary, status and priority filtering, and ticket detail view.
- **Zen Green UI**: Modern, accessible interface with consistent component styles and responsive layouts.

### 📦 Lab 3: Users, RBAC, IT Staff Queue & Admin Management
- **Role-Based Access Control (RBAC)**: Secure JWT authentication + `bcryptjs` hashing for three distinct roles: `REQUESTER`, `IT_STAFF`, and `ADMIN`.
- **First-Login Security (BR-02, BR-03)**: Mandatory password change enforcement with strict complexity rules (minimum 8 characters, uppercase, lowercase, number, and special character).
- **Requester Enhancements**: Authenticated ticket ownership isolation, public comment thread with IT Staff, and "Problem Appears Resolved" indication (FR-07, FR-10).
- **IT Staff Operational Queue**: Multi-filtering (All, Unassigned, Assigned to Me, Category, Priority, Status), sorting, text search, and pagination.
- **IT Staff Triage & Actions**: Self-claim ticket, assignee reassignment, priority escalation, and strict lifecycle status transition matrix (BR-14).
- **Confidential Internal Notes (BR-15)**: Warm amber `#FFFBEB` notes strictly visible to IT Staff and Admins (`403 Forbidden` to Requesters).
- **Admin User Management**: Full user administration table, temporary password generation, user creation/editing, self-deactivation guard (BR-17), and last active admin protection (BR-18).

### 📦 Lab 4: Actions Taken, Dashboards, and Final Regression
- **Parent-Child Actions Taken (FR-01..05, BR-01..08)**: Structured technical intervention log under each Ticket. Each action records Action Date/Time, Description, Result, Performed by (auto-populated with authenticated actor), Follow-Up Required toggle, Follow-up Note (conditionally required), and Attachment Notes.
- **Resolution Gate Invariant (BR-09)**: Strict backend enforcement preventing any ticket from moving to `RESOLVED` status without at least one recorded Action Taken (HTTP 400 `ResolutionGateBlocked`). Requester problem resolution indication is treated as advisory and does not bypass this rule.
- **Optimistic Concurrency & Safe Updates (BR-10)**: Prevents accidental overwrites using `expectedUpdatedAt` verification on status transitions and edits.
- **Authoritative Role Dashboards (FR-08..12, BR-11..15)**:
  - **Requester Dashboard**: Total open tickets, tickets in progress, resolved, and closed counts, with recent tickets list and interactive drill-downs.
  - **IT Staff Dashboard**: Operational workload metrics (New, Open, In Progress, Waiting for Requester, My Assigned, Unassigned, Urgent), recent activity, and one-click queue filtering.
  - **Administrator Dashboard**: Inherits staff metrics and provides summary user statistics.
- **Full Regression Hardening**: Preserves 100% compatibility across all Labs 1–3 features and passes all unit, API, component, and E2E suites.

---

## 👥 Pre-Seeded Demo Accounts

The database comes pre-seeded with realistic test accounts for all roles:

| Role | Email | Password | Mandatory Pwd Change | Description |
|:---|:---|:---|:---:|:---|
| **Administrator** | `admin@toktickit.local` | `Admin@1234` | No | System administrator with full management rights |
| **IT Staff 1** | `staff1@toktickit.local` | `Staff@1234` | No | Senior IT Support Specialist |
| **IT Staff 2** | `staff2@toktickit.local` | `Staff@1234` | No | Hardware & Network Technician |
| **Requester 1** | `requester1@toktickit.local` | `Requester@1234` | No | Engineering Department Requester |
| **Requester 2** | `requester2@toktickit.local` | `Requester@1234` | No | Marketing Department Requester |
| **New User** | `newuser@toktickit.local` | `Temp@1234` | **Yes** | Demonstrates mandatory first-login password change |
| **Inactive User** | `inactive@toktickit.local` | `Inactive@1234` | No | Deactivated account (login blocked by BR-01) |

---

## 🏛️ Repository Architecture

```
toktickit/
├── client/                     # React + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── components/         # Header, Navigation, Ticket Modals, ActionsTakenSection
│   │   ├── context/            # AuthContext (JWT session management)
│   │   ├── pages/              # Login, RequesterDashboard, StaffDashboard, StaffQueue, UserManagement
│   │   └── tests/              # Client Vitest component & screen suites (Labs 1-4)
│   ├── package.json
│   └── vite.config.ts
├── server/                     # Express + TypeScript + Prisma Backend
│   ├── prisma/
│   │   ├── schema.prisma       # Relational schema (User, Ticket, ActionTaken, Comment, InternalNote)
│   │   └── seed.ts             # Idempotent realistic seed data with 0-action and multi-action tickets
│   ├── src/
│   │   ├── middleware/         # JWT verification, Role authorization, Multer uploads
│   │   ├── routes/             # /auth, /tickets, /actions, /dashboards, /staff, /admin, /categories
│   │   └── utils/              # Auth tokens, Password complexity, Ticket number sequence
│   ├── tests/                  # Backend Supertest API test suites (Labs 1, 2, 3, 4)
│   └── package.json
├── docs/                       # Specifications, contracts, and review logs
│   ├── lab-01/                 # Lab 1 submission docs & AI reflections
│   ├── lab-02/                 # Lab 2 specs, test matrices, and reviewer records
│   ├── lab-03/                 # Lab 3 specs, test matrices, and reviewer records
│   └── lab-04/                 # Lab 4 engineering specification, UI spec, API contract, test matrix, reviewer records, AI reflections
├── e2e/                        # Playwright multi-role end-to-end integration tests (Labs 3, 4)
├── artifacts/                  # Visual evidence & responsive screenshots
│   └── lab-04/screenshots/     # Staff dashboard, Requester dashboard, Actions Taken (desktop, tablet, mobile)
├── scripts/                    # Automation scripts (screenshot capture, kanban setup)
├── .gitignore
└── README.md
```

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher

### 1. Backend Server Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Generate Prisma client and seed database
npx prisma db push
npx prisma db seed

# Start server in development mode (Runs on http://localhost:5001)
npm run dev
```

### 2. Frontend Client Setup
```bash
# In a new terminal, navigate to client directory
cd client

# Install dependencies
npm install

# Start Vite dev server (Runs on http://localhost:5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to access TokTickIT.

---

## 🧪 Testing & Quality Assurance

TokTickIT features **139 automated unit, component, and integration tests** passing with a 100% pass rate.

### Run All Automated Tests
```bash
# Run server test suite (98 tests across 23 test files)
npm --prefix server test

# Run client component suite (41 tests across 14 test files)
npm --prefix client test
```

### Run Backend API Tests (98 Tests)
```bash
cd server
npm test
```
Covers authentication, authorization guards, Actions Taken CRUD, Resolution Gate invariant, dashboard queries, comments, internal notes, staff triage queue, ticket lifecycle transitions, admin safety rules (BR-17/18), and regressions.

### Run Frontend Component Tests (41 Tests)
```bash
cd client
npm test
```
Covers Login screen, Password Change barrier, Requester Dashboard, Staff Dashboard, Actions Taken Section (modal, validation, follow-up), Resolution Gate warning banner, Ticket Detail, Staff Queue filters, and Admin User Management.

### Run End-to-End Tests
```bash
npx playwright test
```

---

## 📖 Documentation & Verification Artifacts

Detailed engineering documentation is available under [`docs/`](./docs/):
- **Sprint 4 Engineering Specification**: [`docs/lab-04/specification.md`](./docs/lab-04/specification.md)
- **Sprint 4 UI / UX Specification**: [`docs/lab-04/ui-spec.md`](./docs/lab-04/ui-spec.md)
- **Sprint 4 REST API Contract**: [`docs/lab-04/api-spec.md`](./docs/lab-04/api-spec.md)
- **Sprint 4 Test Strategy & Matrix**: [`docs/lab-04/tests.md`](./docs/lab-04/tests.md)
- **Sprint 4 Peer Review Records**: [`docs/lab-04/reviewer.md`](./docs/lab-04/reviewer.md)
- **Sprint 4 AI Coding Agent Reflections**: [`docs/lab-04/ai-use.md`](./docs/lab-04/ai-use.md)

---

## 👥 Contributors

- **Lead Developer**: `ikmie` — Student ID: `67070503441`
- **Peer Reviewer & Collaborator**: Wichitchai Suwanno ([`SinghLemonH`](https://github.com/SinghLemonH)) — Student ID: `67070503439`

---

*Developed for CPE 334 Software Engineering Laboratory.*
