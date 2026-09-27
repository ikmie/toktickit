import { execSync } from 'node:child_process';

function getGitHubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.argv[2]) return process.argv[2];
  try {
    const creds = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n' }).toString();
    const match = creds.match(/password=(.+)/);
    if (match) return match[1].trim();
  } catch (e) {
    // fallback
  }
  return null;
}

const token = getGitHubToken();
if (!token) {
  console.error('Error: GitHub token not found');
  process.exit(1);
}

const REPO = 'ikmie/toktickit';

const prs = [
  {
    title: 'PR #2 - Database Schema Evolution & Idempotent Seed',
    head: 'feature/lab4-2-database-seed',
    base: 'feature/lab4-1-docs-contract',
    body: `Resolves #34

### Scope
- ActionTaken Prisma model with relations to Ticket and User
- Compound indexes on [ticketId], [performedById], [actionDateTime]
- Non-destructive migration preserving Labs 1-3 data
- Idempotent seed data with zero-action and multi-action tickets
- Reviewer: @SinghLemonH`
  },
  {
    title: 'PR #3 - Actions Taken REST API & Resolution Gate',
    head: 'feature/lab4-3-actions-taken-backend',
    base: 'feature/lab4-2-database-seed',
    body: `Resolves #35

### Scope
- Actions Taken CRUD: POST /api/tickets/:id/actions, GET, PUT
- Dynamic follow-up note validation (BR-05)
- Server-side Resolution Gate invariant blocking RESOLVED if actions count is 0 (BR-09)
- Optimistic concurrency control with expectedUpdatedAt (BR-16)
- Reviewer: @SinghLemonH`
  },
  {
    title: 'PR #4 - Role Dashboard Backend APIs & Metrics',
    head: 'feature/lab4-4-dashboards-backend',
    base: 'feature/lab4-3-actions-taken-backend',
    body: `Resolves #36

### Scope
- Authoritative dashboard endpoints: /api/dashboards/requester, /staff, /admin
- Server-side query calculations and strict requester isolation
- Reviewer: @SinghLemonH`
  },
  {
    title: 'PR #5 - Actions Taken & Role Dashboards UI',
    head: 'feature/lab4-5-frontend-ui',
    base: 'feature/lab4-4-dashboards-backend',
    body: `Resolves #37

### Scope
- RequesterDashboardPage and StaffDashboardPage in Zen Green style
- ActionsTakenSection modal and audit log table
- Resolution Gate warning banner and disabled cues on Ticket Detail
- Queue drill-down filter navigation
- Reviewer: @SinghLemonH`
  },
  {
    title: 'PR #6 - E2E Verification, Hardening & Zen Green Polish',
    head: 'feature/lab4-6-e2e-hardening',
    base: 'feature/lab4-5-frontend-ui',
    body: `Resolves #38

### Scope
- Playwright E2E suites: actions-taken-flow, ticket-resolution, dashboards
- Visual responsive verification across Desktop (1280px), Tablet (768px), Mobile (375px)
- Section 4 Visual & Accessibility checklist compliance
- Verified 139 passing tests across client and server
- Reviewer: @SinghLemonH`
  }
];

async function run() {
  console.log('Creating PRs on GitHub...\n');

  for (const pr of prs) {
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/pulls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'TokTickIT-Script'
        },
        body: JSON.stringify(pr)
      });

      const data = await res.json();
      if (!res.ok) {
        console.error(`❌ Failed to create "${pr.title}":`, data.message || data);
      } else {
        console.log(`✅ Created PR #${data.number}: ${data.title}`);
        console.log(`   URL: ${data.html_url}`);

        // Request review from SinghLemonH
        try {
          await fetch(`https://api.github.com/repos/${REPO}/pulls/${data.number}/requested_reviewers`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
              'User-Agent': 'TokTickIT-Script'
            },
            body: JSON.stringify({ reviewers: ['SinghLemonH'] })
          });
          console.log(`   Review requested from: SinghLemonH`);
        } catch (e) {
          console.warn(`   Could not request reviewer: ${e.message}`);
        }
      }
    } catch (err) {
      console.error(`❌ Error creating "${pr.title}":`, err.message);
    }
  }

  console.log('\nAll separated feature PRs are ready on GitHub for SinghLemonH to review!');
}

run();
