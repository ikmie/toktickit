/**
 * Helper script to automatically create Lab 3 GitHub Issues in ikmie/toktickit.
 * Usage:
 *   node scripts/create-lab3-issues.mjs <GITHUB_PERSONAL_ACCESS_TOKEN>
 */

const token = process.argv[2] || process.env.GITHUB_TOKEN;

if (!token) {
  console.error('\x1b[31mError: GitHub token required.\x1b[0m');
  console.log('Usage: node scripts/create-lab3-issues.mjs <YOUR_GITHUB_PAT>');
  console.log('Generate a classic PAT with "repo" and "project" scope at: https://github.com/settings/tokens');
  process.exit(1);
}

const REPO = 'ikmie/toktickit';

const issues = [
  {
    title: '[Lab 3] Sprint 3 Engineering Specification & Contracts',
    body: `### Scope
- Formalize FR-01 to FR-17 and BR-01 to BR-20
- Define Role-Based Authorization Matrix across Requester, IT Staff, and Admin
- Deliver \`docs/lab-03/specification.md\`, \`ui-spec.md\`, \`api-spec.md\`, and \`tests.md\`
- Setup peer review template in \`docs/lab-03/reviewer.md\`
- Tracked branch: \`feature/lab3-1-docs-contract\` -> \`lab3-staging\` (PR #1)`
  },
  {
    title: '[Lab 3] Database Schema Evolution & Seed Migration',
    body: `### Scope
- Evolve Prisma schema from RequesterUser to unified User model with roles: REQUESTER, IT_STAFF, ADMIN
- Add passwordHash, mustChangePassword, Comment, and InternalNote models
- Create idempotent seed script with realistic tickets, active/inactive accounts, and test credentials
- Tracked branch: \`feature/lab3-2-database-seed\` -> \`lab3-staging\` (PR #2)`
  },
  {
    title: '[Lab 3] Authentication & Authorization Foundation',
    body: `### Scope
- Implement JWT authentication endpoints: POST /api/auth/login, /logout, /me, /change-password
- Password complexity validator enforcing BR-03 (8+ chars, upper, lower, number, special)
- First-login password change barrier middleware (BR-02)
- Server-side role-based authorization guards (requireRole)
- Tracked branch: \`feature/lab3-3-auth-foundation\` -> \`lab3-staging\` (PR #3)`
  },
  {
    title: '[Lab 3] Requester Regression, Comments & Problem Resolution',
    body: `### Scope
- Seamless migration from simulated X-Requester-Id to authenticated identity with zero regression
- Ticket ownership isolation (BR-04)
- Public Comments thread on Ticket Detail (FR-06, BR-06)
- "Problem Appears Resolved" indication flag for Requesters (FR-07)
- Tracked branch: \`feature/lab3-4-requester-regression\` -> \`lab3-staging\` (PR #4)`
  },
  {
    title: '[Lab 3] IT Staff Ticket Queue & Operational Workflows',
    body: `### Scope
- Shared IT Staff Ticket Queue with search, multi-filter, column sort, and pagination
- Operational triage controls: Ticket Claim (auto-advances NEW -> OPEN) and Assignee ownership
- IT Priority selector (LOW, MEDIUM, HIGH, URGENT)
- Permitted Status Transition Lifecycle Matrix (BR-14)
- Confidential Internal Notes with distinct #FFFBEB styling, strictly hidden from Requesters (BR-15)
- Tracked branch: \`feature/lab3-5-it-staff-tickets\` -> \`lab3-staging\` (PR #5)`
  },
  {
    title: '[Lab 3] Administrator User Management & Safety Guards',
    body: `### Scope
- Administrator User Management interface: search, role filter, status filter, and pagination
- Create user modal with temporary password generation and mustChangePassword = true (FR-13)
- Edit user details and reset temporary password modal (FR-14, FR-16)
- Self-deactivation prevention safety invariant (BR-17)
- Last active Administrator removal/demotion protection (BR-18)
- Tracked branch: \`feature/lab3-6-admin-user-management\` -> \`lab3-staging\` (PR #6)`
  },
  {
    title: '[Lab 3] Multi-role E2E Flow Verification & Deliverable Artifacts',
    body: `### Scope
- Multi-role End-to-End automated integration tests in e2e/lab-03/
- Authentication flow, IT staff triage & notes flow, and user governance flow
- Verified 101 passing tests across server and client suites
- Finalized reviewer.md records and ai-use.md prompt log
- Tracked branch: \`feature/lab3-7-e2e-artifacts\` -> \`lab3-staging\` (PR #7)`
  },
  {
    title: '[Lab 3] Release Integration: Staging to Main',
    body: `### Scope
- Final staged release merging lab3-staging into main with zero regression
- Verification of all 101 automated test cases and production client build
- Tracked PR: lab3-staging -> main (PR #8)`
  }
];

async function createIssues() {
  console.log(`Creating ${issues.length} Lab 3 issues in ${REPO}...\n`);

  for (const issue of issues) {
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'TokTickIT-Lab3-Script'
        },
        body: JSON.stringify(issue)
      });

      const data = await res.json();
      if (!res.ok) {
        console.error(`❌ Failed to create "${issue.title}":`, data.message || data);
      } else {
        console.log(`✅ Created #${data.number}: ${data.title}`);
        console.log(`   URL: ${data.html_url}`);
      }
    } catch (err) {
      console.error(`❌ Error creating "${issue.title}":`, err.message);
    }
  }

  console.log('\nDone! Now in your GitHub Project Kanban board:');
  console.log('1. Open https://github.com/users/ikmie/projects/1');
  console.log('2. Click "+ Add item" in the "Ready" column');
  console.log('3. Type "#" and select the newly created Lab 3 issues to place them in the Ready column.');
}

createIssues();
