# TokTickIT - Enterprise IT Service Desk Application

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React%2019-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Tests Passing](https://img.shields.io/badge/Tests-101%20Passing-brightgreen?style=flat-square)]()

**TokTickIT** is a full-stack IT Service Desk & Incident Management application designed for organizational issue tracking, triage, ticket lifecycle operations, and role-based user management.

Developed for **CPE 334 Software Engineering**, following **Spec-Driven Development (SDD)**, **Test-Driven Development (TDD)**, and continuous peer-reviewed release staging.

---

## 🌟 Sprint Milestones & Feature Overview

### 🏷️ Lab 1: Full-Stack Architecture Starter
- Established Express + TypeScript API server & React + Vite frontend foundation.
- Configured Prisma ORM with relational schema, migration pipeline, and database seeding.
- Category listing API (`GET /api/categories`) and server health check endpoint (`GET /api/health`).

### 🎫 Lab 2: Requester Portal & Ticketing Workflow
- **Ticket Creation**: Form with category selection, sequential Ticket IDs (`TICK-YYYYMMDD-XXXX`), and automatic priority calculation based on Impact × Urgency matrix.
- **Attachment Management**: Multi-file upload with MIME validation (PDF, PNG, JPEG), size constraints, file streaming download, and soft deletion.
- **My Tickets Dashboard**: Search by ticket number or summary, status and priority filtering, and ticket detail view.
- **Zen Green UI**: Modern, accessible interface with consistent component styles and responsive layouts.

### 🛡️ Lab 3: Users, RBAC, IT Staff Queue & Admin Management
- **Role-Based Access Control (RBAC)**: Secure JWT authentication + `bcryptjs` hashing for three distinct roles: `REQUESTER`, `IT_STAFF`, and `ADMIN`.
- **First-Login Security (BR-02, BR-03)**: Mandatory password change enforcement with strict complexity rules (minimum 8 characters, uppercase, lowercase, number, and special character).
- **Requester Enhancements**: Authenticated ticket ownership isolation, public comment thread with IT Staff, and "Problem Appears Resolved" indication (FR-07, FR-10).
- **IT Staff Operational Queue**: Multi-filtering (All, Unassigned, Assigned to Me, Category, Priority, Status), sorting, text search, and pagination.
- **IT Staff Triage & Actions**: Self-claim ticket, assignee reassignment, priority escalation, and strict lifecycle status transition matrix (BR-14).
- **Confidential Internal Notes (BR-15)**: Warm amber `#FFFBEB` notes strictly visible to IT Staff and Admins (`403 Forbidden` to Requesters).
- **Admin User Management**: Full user administration table, temporary password generation, user creation/editing, self-deactivation guard (BR-17), and last active admin protection (BR-18).

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

## 🏗️ Repository Architecture

```
toktickit/
├── client/                     # React + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── components/         # Header, Navigation, Ticket Modals, Attachments
│   │   ├── context/            # AuthContext (JWT session management)
│   │   ├── pages/              # Login, ChangePassword, MyTickets, StaffQueue, UserManagement
│   │   └── tests/              # Client Vitest component & screen suites
│   ├── package.json
│   └── vite.config.ts
├── server/                     # Express + TypeScript + Prisma Backend
│   ├── prisma/
│   │   ├── schema.prisma       # Relational schema (User, Ticket, Comment, InternalNote)
│   │   └── seed.ts             # Idempotent realistic seed data
│   ├── src/
│   │   ├── middleware/         # JWT verification, Role authorization, Multer uploads
│   │   ├── routes/             # /auth, /tickets, /staff, /admin, /categories, /requesters
│   │   └── utils/              # Auth tokens, Password complexity, Ticket number sequence
│   ├── tests/                  # Backend Supertest API test suites (Lab 1, 2, 3)
│   └── package.json
├── docs/                       # Specifications, contracts, and review logs
│   ├── lab-01/                 # Lab 1 submission docs & AI reflections
│   ├── lab-02/                 # Lab 2 specs, test matrices, and reviewer records
│   └── lab-03/                 # Lab 3 engineering specification, UI spec, API contract
├── e2e/                        # Playwright multi-role end-to-end integration tests
├── scripts/                    # Automation scripts (push branches, kanban setup)
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

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

# Start server in development mode (Runs on http://localhost:5000)
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

TokTickIT features **101 automated unit, component, and integration tests** passing with a 100% pass rate.

### Run Backend API Tests (75 Tests)
```bash
cd server
npm run test:run
```
Covers authentication, authorization guards, comments, internal notes, staff triage queue, ticket lifecycle transitions, admin safety rules (BR-17/18), and regressions.

### Run Frontend Component Tests (26 Tests)
```bash
cd client
npm run test:run
```
Covers Login screen, Password Change barrier, Ticket Detail comments, Staff Queue filters, and Admin User Management.

### Run End-to-End Tests
```bash
npx playwright test
```

---

## 📖 Documentation & Verification Artifacts

Detailed engineering documentation is available under [`docs/`](./docs/):
- **Engineering Specification**: [`docs/lab-03/specification.md`](./docs/lab-03/specification.md)
- **UI / UX Specification**: [`docs/lab-03/ui-spec.md`](./docs/lab-03/ui-spec.md)
- **REST API Contract**: [`docs/lab-03/api-spec.md`](./docs/lab-03/api-spec.md)
- **Test Strategy & Matrix**: [`docs/lab-03/tests.md`](./docs/lab-03/tests.md)
- **Peer Review Records**: [`docs/lab-03/reviewer.md`](./docs/lab-03/reviewer.md)
- **AI Coding Agent Reflections**: [`docs/lab-03/ai-use.md`](./docs/lab-03/ai-use.md)

---

## 👥 Contributors

- **Lead Developer**: `ikmie`
- **Peer Reviewer & Collaborator**: Wichitchai Suwanno ([`SinghLemonH`](https://github.com/SinghLemonH)) — Student ID: `67070503439`

---

*Developed for CPE 334 Software Engineering Laboratory.*
