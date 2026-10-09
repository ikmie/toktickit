# AI Use Log and Reflection - Lab 04

## 1. AI Tool & Model Overview
- **AI Agent / Assistant**: Antigravity AI Coding Assistant (Google DeepMind)
- **Model Used**: Gemini 3.8 Flash (High)
- **Workflow Methodology**: Spec-Driven Development (SDD), Test-Driven Development (TDD) & Phased Feature Branch Workflow

---

## 2. Key Prompts Table

| Prompt # | Prompt Focus | Prompt Text / Summary | Outcome / Generated Value |
|---|---|---|---|
| **P-01** | Sprint Decomposition & Spec DD | "Analyze Lab 4 handout requirements, extract numbered FRs (FR-01 to FR-19), BRs (BR-01 to BR-20), ACs (AC-01 to AC-16), and define parent-child Actions Taken model, resolution gate, and role dashboard contracts." | Produced comprehensive Sprint 4 engineering contracts in `docs/lab-04/specification.md`, `ui-spec.md`, `api-spec.md`, and `tests.md`. |
| **P-02** | Database Schema & Seed Design | "Evolve Prisma schema to add `ActionTaken` model with indexes on `ticketId`, `performedById`, and `actionDateTime`. Create idempotent seed data with tickets having 0, 1, and multiple actions." | Designed non-destructive migration preserving all Lab 1-3 data while providing realistic test scenarios for the resolution gate. |
| **P-03** | Actions Taken REST API Implementation | "Implement `server/src/routes/actions.ts` supporting `POST /api/tickets/:id/actions`, `GET /api/tickets/:id/actions`, and `PUT /api/tickets/:id/actions/:actionId` with strict role permissions and follow-up note validation." | Established secure backend endpoints for Actions Taken with requester ownership guards and inactive assignee prevention. |
| **P-04** | Resolution Gate Enforcement | "Enforce server-side resolution gate in `server/src/routes/staff.ts` blocking any transition to `RESOLVED` if `actions.length === 0`, returning HTTP 400 with safe error feedback." | Built bulletproof server-side business rule preventing premature ticket closure without recorded technical work. |
| **P-05** | Role Dashboard Aggregation Endpoints | "Implement `/api/dashboards/requester`, `/api/dashboards/staff`, and `/api/dashboards/admin` returning authoritative aggregated counts and recent ticket lists without client-side dumping." | Implemented high-performance, authoritative metrics calculations isolating requester data and summarizing queue workload. |
| **P-06** | Frontend Dashboard Components | "Build `RequesterDashboardPage.tsx` and `StaffDashboardPage.tsx` following Zen Green design language with interactive metric cards, filter drill-downs, and responsive layout." | Created intuitive operational starting points for all roles with zero clipping across desktop, tablet, and mobile. |
| **P-07** | Actions Taken UI & Resolution Warning | "Add `ActionsTakenSection.tsx` to Ticket Detail with audit table, modal form for create/edit, conditional follow-up note validation, and disabled cues for the resolution button when actions are 0." | Delivered complete parent-child work tracking UI while guiding staff to record actions prior to resolution. |
| **P-08** | E2E Testing & Final Regression | "Develop Playwright E2E suites for Actions Taken flow, Resolution Gate blocking, and Dashboard drill-downs; verify full Lab 1-3 regression passes." | Validated complete system integration, hardened error handling, and generated visual proof artifacts. |

---

## 3. My Reflection
In Lab 4, completing the TokTickIT service-desk system highlighted the immense value of Spec-Driven Development (SDD) when managing intricate business invariants. By utilizing the Antigravity AI specification agent to formalize the **Resolution Gate (BR-09)** and the **parent-child Actions Taken model (BR-01, BR-02)** before writing any code, our team eliminated ambiguity regarding role boundaries and state transitions.

The separation between the specification agent and coding agent allowed us to treat the contracts in `docs/lab-04/` as an immutable source of truth. The coding agent could then methodically generate the database schema, backend REST endpoints, and frontend components in structured feature branches, verifying each increment against the predefined Acceptance Criteria.

Furthermore, conducting structured peer reviews with our collaborator **SinghLemonH (Wichitchai Suwanno)** ensured that each increment was thoroughly scrutinized for backward compatibility. As a result, the entire application—from authentication and user management in Lab 3 to Actions Taken and operational dashboards in Lab 4—works as a unified, robust, and accessible enterprise solution under the Zen Green design system.
