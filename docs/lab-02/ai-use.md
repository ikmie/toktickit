# AI Use Log and Reflection - Lab 02

## 1. AI Tool & Model Overview
- **AI Agent / Assistant**: Antigravity 
- **Model Used**: Gemini 3.6 Flash (High)
- **Workflow Methodology**: Spec-Driven  & Test-Driven Development

---

## 2. Key Prompts Table

| Prompt # | Prompt Focus | Prompt Text / Summary | Outcome / Generated Value |
|---|---|---|---|
| **P-01** | Contract Review | "Read docs/lab-02/specification.md, tests.md, ui-spec.md, and api-spec.md. List ambiguities, conflicts, dependencies, and proposed implementation order." | Identified scope boundaries, verified BR numbering, established branch strategy. |
| **P-02** | Database & Seed | "Implement Prisma models for RequesterUser, Ticket, RelatedSystem, Attachment, and Enums for Priority and Status. Write idempotent seed data." | Created schema models with indexes and seed script with 4 active requesters & 1 inactive. |
| **P-03** | Requester Context API | "Implement GET /api/requesters and frontend RequesterContext for selecting active Development Requester testing identity." | Built requester selector state management and top header badge display. |
| **P-04** | Ticket Creation API & UI | "Implement POST /api/tickets with ticket number generator TKT-YYYY-XXXXXX and CreateTicket form component with Zen Green theme." | Delivered Create Ticket screen with inline field validation, busy state, and success modal. |
| **P-05** | My Tickets API & UI | "Implement GET /api/tickets paginated list query with search, category, priority, status filters, sorting, and MyTickets screen." | Created responsive My Tickets view with desktop table and mobile card stack. |
| **P-06** | Attachment Lifecycle | "Implement upload (multer 5MB limit, JPG/PNG/WEBP/PDF), download, and PATCH soft-remove attachment with reason." | Implemented file upload middleware, file streaming download, and soft-removal reason dialog. |
| **P-07** | Ownership Security | "Enforce ticket and attachment ownership check against X-Requester-Id header. Return HTTP 403/404 for cross-requester access." | Secured backend endpoints preventing unauthorized access across requesters. |
| **P-08** | Automated Testing | "Write API integration tests in server/tests/lab-02 and React UI component tests for CreateTicket, MyTickets, and AttachmentSection." | Built comprehensive Vitest and React Testing Library test suite. |

---

## 3. My Reflection
After i have use an AI coding agent with Spec-Driven Development to help me with a full-stack ticketing MVP while making sure the architectural quality. By defining explicit engineering contracts before starting (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) to let AI agent maintained exact conformance with business rules as defined.
