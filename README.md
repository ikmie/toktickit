# TokTickIT - IT Service Desk Application

TokTickIT is an IT service desk web application built with React, Express, Prisma ORM, and PostgreSQL.

## Lab 1: Full-Stack Hello World Starter

### Repository Structure
```
toktickit/
├── client/           # React + TypeScript + Vite + Bootstrap UI
├── server/           # Express + TypeScript + Prisma API & Tests
│   ├── prisma/       # Prisma schema & seed scripts
│   ├── src/          # Server source code
│   └── tests/        # Supertest API tests
│       └── lab-01/
├── docs/             # Documentation & submission materials
│   └── lab-01/
│       ├── ai_use.md
│       ├── reviewer.md
│       └── tests.md
├── .gitignore
└── README.md
```

### Setup Instructions

1. **Install Server Dependencies & Setup DB**:
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Ensure PostgreSQL is running and DATABASE_URL in .env is correct
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

2. **Install Client Dependencies**:
   ```bash
   cd ../client
   npm install
   ```

3. **Run Application**:
   - Start Server: `npm run dev` (in `server/`)
   - Start Client: `npm run dev` (in `client/`)

4. **Run Tests**:
   - Server Tests: `npm run test` (in `server/`)
   - Client Tests: `npm run test` (in `client/`)
