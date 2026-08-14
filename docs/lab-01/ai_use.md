# Lab 01 - AI Use & Reflection

I used the Antigravity coding agent through my Google Cloud Platform account. I mainly used Gemini 3.6 Flash as the LLM with a thinking level of High.

## Selected Key Prompts

| Prompt Name | Actual Prompt Text | Reflection |
|---|---|---|
| Plan Lab 1 Implementation | Read the enclosed TokTickIT Lab 1 requirements. Summarize the four GitHub Issues, their dependencies, required outputs, and required automated tests. Propose an implementation order, but do not write code yet. | The agent created a detailed implementation plan covering all 4 issues and dependency ordering. |
| Set Up Full-Stack Project | Setup the TokTickIT project tech stack as given in Lab 1 using React, TypeScript, Vite, and Bootstrap for the frontend, and Node.js, Express, and TypeScript for the backend. Configure PostgreSQL and Prisma. Use the required folder structure. | The agent initialized client and server applications matching the required structure. |
| Implement Health Check | Add GET /api/health to the existing Express backend and add Supertest test. | The agent implemented the health check route and generated an automated Supertest test suite to verify the 200 OK response. |
| Implement Category Seed | Create the Prisma Category model, migration, and seed script for 4 categories. | The agent created the Category model in Prisma schema, executed PostgreSQL migrations, and implemented the seed script for the 4 required categories. |
| Build Check System UI | Create Bootstrap-based React UI with Check System button, loading state, status display, and category list. | The agent built the React component with Bootstrap styling, managing loading spinners, health status badges, and dynamic category rendering. |
| Review Lab 1 Work | Review final implementation against acceptance criteria. | The agent conducted a systematic review against all acceptance criteria, ensuring both automated tests passed and full-stack API integration was complete. |
