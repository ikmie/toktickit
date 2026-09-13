# AI Use Log and Reflection - Lab 03

## 1. AI Tool & Model Overview
- **AI Agent / Assistant**: Antigravity AI Coding Assistant (Google DeepMind)
- **Model Used**: Gemini 3.8 Flash (High)
- **Workflow Methodology**: Spec-Driven Development (SDD), Test-Driven Development (TDD) & Phased Feature Branch Workflow

---

## 2. Key Prompts Table

| Prompt # | Prompt Focus | Prompt Text / Summary | Outcome / Generated Value |
|---|---|---|---|
| **P-01** | Sprint Decomposition & Spec DD | "Analyze Lab 3 handout requirements, extract numbered FRs, BRs, ACs, and define authorization matrix and branch flow for peer review." | Created comprehensive Sprint 3 engineering contracts in `docs/lab-03/specification.md`, `ui-spec.md`, `api-spec.md`, and `tests.md`. |
| **P-02** | Database & Seed Migration | "Evolve Prisma schema from RequesterUser to unified User model with roles, passwordHash, mustChangePassword, Comment, and InternalNote models. Write idempotent seed data." | Safely evolved database models, generated Prisma client, and seeded required active/inactive accounts and realistic tickets. |
| **P-03** | Auth Foundation & Security Guard | "Implement `/api/auth/login`, `/logout`, `/me`, and `/change-password` with bcrypt hashing and JWT middleware enforcing role authorization." | Established server-side security, inactive user blocking, and first-login password redirection. |
| **P-04** | Requester Regression & Public Comments | "Remove Development Requester selector, adapt existing ticket APIs to use authenticated identity, and implement Public Comments thread." | Preserved all Lab 2 Requester workflows without client ID spoofing, added public communication thread and problem resolution indicator. |
| **P-05** | IT Staff Ticket Queue | "Implement `/api/staff/tickets` with search, multi-filtering, sorting, and pagination. Build responsive Zen Green Ticket Queue screen." | Delivered operational queue allowing IT Staff to inspect tickets across the entire organization. |
| **P-06** | Ticket Detail Operations & Notes | "Implement ticket claim, ownership reassignment, IT Priority update, permitted status transitions, and private Internal Notes." | Enabled operational ticket lifecycle management while strictly protecting private Internal Notes from Requester visibility. |
| **P-07** | Admin User Management & Invariants | "Implement `/api/admin/users` CRUD with safety rules preventing self-deactivation and last admin removal. Build minimalist Admin UI." | Created Administrator interface with bulletproof server-side safety invariant checks. |
| **P-08** | E2E Testing & Peer Review Prep | "Write end-to-end multi-role tests in `e2e/lab-03` and generate visual screenshot evidence across desktop, tablet, and mobile." | Verified system integration end-to-end and compiled reviewer documentation for PR submission. |

---

## 3. My Reflection
In Lab 3, developing a full-stack role-based ticketing platform with distinct permission levels demanded rigorous adherence to Spec-Driven Development (SDD). By leveraging the Antigravity AI agent to formalize the specification, API contracts, and business rules before writing code, we eliminated ambiguities regarding data access—such as ensuring that Internal Notes are strictly confidential and never leaked to Requesters.

Organizing the implementation into distinct, atomic feature branches enabled structured peer review with our collaborator on GitHub. Each feature was developed with focused unit and API tests, ensuring that expanding capabilities for IT Staff and Administrators did not cause regressions in the Requester workflows completed in Lab 2.
