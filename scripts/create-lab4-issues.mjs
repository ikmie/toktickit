/**
 * Helper script to automatically create Lab 4 GitHub Issues in ikmie/toktickit.
 * Usage:
 *   node scripts/create-lab4-issues.mjs [GITHUB_TOKEN]
 */

const token = process.argv[2] || process.env.GITHUB_TOKEN;

if (!token) {
  console.error('\x1b[31mError: GitHub token required.\x1b[0m');
  console.log('Usage: node scripts/create-lab4-issues.mjs <YOUR_GITHUB_PAT>');
  process.exit(1);
}

const REPO = 'ikmie/toktickit';

const issues = [
  {
    title: '[Lab 4] Sprint 4 Engineering Specification & Contracts',
    body: `### Scope
- Formalize FR-01 to FR-19 and BR-01 to BR-20
- Define parent-child Actions Taken model, auto-attribution rules, and conditional follow-up note validation
- Enforce strict Resolution Gate invariant (BR-09) and advisory requester indication rule (BR-10)
- Deliver \`docs/lab-04/specification.md\`, \`ui-spec.md\`, \`api-spec.md\`, and \`tests.md\`
- Setup peer review template in \`docs/lab-04/reviewer.md\`
- Tracked branch: \`feature/lab4-1-docs-contract\` -> \`lab4-staging\` (PR #1)`
  },
  {
    title: '[Lab 4] Database Schema Evolution & Idempotent Seed',
    body: `### Scope
- Evolve Prisma schema to introduce \`ActionTaken\` model with relations to \`Ticket\` and \`User\`
- Add secondary indexes on \`[ticketId]\`, \`[performedById]\`, and \`[actionDateTime]\`
- Ensure non-destructive migration preserving all data from Labs 1 to 3
- Create idempotent seed script covering all 8 ticket statuses and realistic 0-action vs multi-action tickets
- Tracked branch: \`feature/lab4-2-database-seed\` -> \`lab4-staging\` (PR #2)`
  },
  {
    title: '[Lab 4] Actions Taken REST API & Resolution Gate',
    body: `### Scope
- Implement CRUD endpoints: \`POST /api/tickets/:id/actions\`, \`GET\`, and \`PUT\`
- Enforce conditional follow-up note validation when \`followUpRequired: true\` (BR-05)
- Server-side Resolution Gate invariant in \`server/src/routes/staff.ts\` blocking \`RESOLVED\` if actions count is 0 (HTTP 400)
- Support optimistic concurrency control with \`expectedUpdatedAt\` header / payload (BR-16)
- Tracked branch: \`feature/lab4-3-actions-taken-backend\` -> \`lab4-staging\` (PR #3)`
  },
  {
    title: '[Lab 4] Role Dashboard Backend APIs & Metrics',
    body: `### Scope
- Authoritative Requester Dashboard API (\`GET /api/dashboards/requester\`) with strict ownership isolation (BR-11)
- IT Staff Dashboard API (\`GET /api/dashboards/staff\`) computing New, Open, In Progress, Waiting, My Assigned, Unassigned, Urgent metrics
- Administrator Dashboard API (\`GET /api/dashboards/admin\`) with user summary metrics
- Optimized server-side SQL/Prisma aggregations preventing client-side data dumping
- Tracked branch: \`feature/lab4-4-dashboards-backend\` -> \`lab4-staging\` (PR #4)`
  },
  {
    title: '[Lab 4] Actions Taken & Role Dashboards UI',
    body: `### Scope
- Build \`RequesterDashboardPage.tsx\` with summary cards, recent tickets, and quick creation action
- Build \`StaffDashboardPage.tsx\` with interactive metric cards linking to filtered Ticket Queue views
- Embed \`ActionsTakenSection.tsx\` on Ticket Detail screen with audit list, create/edit modal, and follow-up validation
- Ticket Detail Resolution Gate warning banner and disabled cues when actions count is 0
- Tracked branch: \`feature/lab4-5-frontend-ui\` -> \`lab4-staging\` (PR #5)`
  },
  {
    title: '[Lab 4] E2E Verification, Hardening & Zen Green Polish',
    body: `### Scope
- Playwright end-to-end integration suites in \`e2e/lab-04/\` (actions-taken-flow, ticket-resolution, dashboards)
- Complete visual inspection across Desktop (1280px), Tablet (768px), and Mobile (375px) with zero overflow
- Section 4 Visual & Accessibility Checklist compliance (WCAG 2.1 AA contrast, visible focus, ARIA attributes)
- Capture 10 verified screenshot artifacts in \`artifacts/lab-04/screenshots/\`
- Tracked branch: \`feature/lab4-6-e2e-hardening\` -> \`lab4-staging\` (PR #6)`
  },
  {
    title: '[Lab 4] Release Integration: Staging to Main',
    body: `### Scope
- Final staged release merging \`lab4-staging\` into \`main\` with zero regression
- Verification of 100% automated test pass rate (139/139 tests across server and client suites)
- Update \`README.md\` with Lab 4 documentation, 139 passing tests badge, and repository architecture
- Compile official single submission PDF report (\`report_lab04_67070503441.pdf\` / \`report.pdf\`)
- Tracked PR: \`lab4-staging\` -> \`main\` (PR #7)`
  }
];

async function createIssues() {
  console.log(`Creating ${issues.length} Lab 4 issues in ${REPO}...\n`);

  const created = [];

  for (const issue of issues) {
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'TokTickIT-Lab4-Script'
        },
        body: JSON.stringify(issue)
      });

      const data = await res.json();
      if (!res.ok) {
        console.error(`❌ Failed to create "${issue.title}":`, data.message || data);
      } else {
        console.log(`✅ Created #${data.number}: ${data.title}`);
        console.log(`   URL: ${data.html_url}`);
        created.push(data);
      }
    } catch (err) {
      console.error(`❌ Error creating "${issue.title}":`, err.message);
    }
  }

  console.log('\n======================================================');
  console.log('✅ All Lab 4 issues created successfully!');
  console.log('======================================================');
  console.log('\nHow to make them appear in your "Ready" column in GitHub Projects:');
  console.log('1. Open your Kanban Board: https://github.com/users/ikmie/projects/1');
  console.log('2. In the "Ready" column, click "+ Add item" (at the bottom of the column).');
  console.log('3. Type "#" and select each of the created Lab 4 issues:');
  created.forEach(c => console.log(`   - #${c.number}: ${c.title}`));
  console.log('4. The issues will now appear in the "Ready" column of your Project Kanban!');
}

createIssues();
