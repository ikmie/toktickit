import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { chromium } = require('../client/node_modules/playwright');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const baseArtifactDir = path.join(rootDir, 'artifacts', 'lab-04', 'screenshots');
const staffDashDir = path.join(baseArtifactDir, 'staff-dashboard');
const reqDashDir = path.join(baseArtifactDir, 'requester-dashboard');
const actionsDir = path.join(baseArtifactDir, 'actions-taken');

[staffDashDir, reqDashDir, actionsDir].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173 ...');
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');

  // --- PART 1: IT STAFF LOG IN ---
  console.log('Logging in as IT Staff (michael.b@toktickit.com)...');
  await page.fill('input[type="email"]', 'michael.b@toktickit.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');

  await page.waitForSelector('[data-testid="staff-dashboard"]', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // 1. Staff Dashboard Screenshots (Desktop, Tablet, Mobile)
  console.log('Capturing Staff Dashboard screenshots...');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(staffDashDir, 'desktop.png'), fullPage: true });

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(staffDashDir, 'tablet.png'), fullPage: true });

  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(staffDashDir, 'mobile.png'), fullPage: true });

  // 2. Navigate to Ticket Detail to capture Actions Taken
  await page.setViewportSize({ width: 1280, height: 800 });
  console.log('Navigating to Ticket Queue / Ticket Detail...');
  await page.click('[data-testid="nav-staff-queue"]');
  await page.waitForSelector('[data-testid^="queue-row-"]', { timeout: 10000 });

  // Click on the first row
  await page.locator('[data-testid^="queue-row-"]').first().click();
  await page.waitForSelector('[data-testid="actions-taken-section"]', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Actions List Screenshot
  console.log('Capturing Actions Taken List screenshot...');
  await page.screenshot({ path: path.join(actionsDir, 'actions-list.png'), fullPage: true });

  // Click "+ Record Action Taken"
  console.log('Opening Record Action Taken modal...');
  await page.click('[data-testid="btn-add-action"]');
  await page.waitForSelector('[data-testid="action-modal"]', { timeout: 5000 });
  await page.fill('[data-testid="input-action-description"]', 'Investigated thermal throttling on server rack.');
  await page.fill('[data-testid="input-action-result"]', 'Identified faulty exhaust blower motor.');
  await page.click('[data-testid="check-action-followup"]');
  await page.fill('[data-testid="input-action-followup-note"]', 'Order replacement blower unit from spare parts inventory.');
  await page.waitForTimeout(500);

  // Modal Screenshot
  await page.screenshot({ path: path.join(actionsDir, 'record-action-modal.png'), fullPage: true });

  // Close modal
  await page.click('button.btn-close');
  await page.waitForTimeout(500);

  // Navigate to Ticket with zero actions for Resolution Gate Warning
  console.log('Creating/navigating to ticket with zero actions for Resolution Gate Warning...');
  const newTicketId = await page.evaluate(async () => {
    const token = localStorage.getItem('toktickit_token');
    const res = await fetch('http://localhost:5001/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'Demo Zero Action Ticket for Resolution Gate',
        description: 'Demonstrating that status cannot be set to RESOLVED without Actions Taken.',
        requestedPriority: 'MEDIUM',
      }),
    });
    const data = await res.json();
    await fetch(`http://localhost:5001/api/staff/tickets/${data.id}/claim`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    return data.id;
  });

  await page.click('[data-testid="staff-back-to-queue-btn"]');
  await page.waitForSelector(`[data-testid="queue-row-${newTicketId}"]`, { timeout: 10000 });
  await page.click(`[data-testid="queue-row-${newTicketId}"]`);
  await page.waitForSelector('[data-testid="staff-status-select"]', { timeout: 10000 });

  // Select RESOLVED status (allowed from OPEN)
  await page.selectOption('[data-testid="staff-status-select"]', 'RESOLVED');
  await page.waitForTimeout(500);

  // Resolution Gate Warning Screenshot
  if (await page.isVisible('[data-testid="resolution-gate-warning"]')) {
    console.log('Capturing Resolution Gate Warning screenshot...');
    await page.screenshot({ path: path.join(actionsDir, 'resolution-gate-warning.png'), fullPage: true });
  }

  // --- PART 2: REQUESTER LOG IN ---
  console.log('Signing out...');
  await page.click('[data-testid="logout-btn"]');
  await page.goto('http://localhost:5173/dashboard');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });

  console.log('Logging in as Requester (supanut.soph@kmutt.ac.th)...');
  await page.fill('input[type="email"]', 'supanut.soph@kmutt.ac.th');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');

  await page.waitForSelector('[data-testid="requester-dashboard"]', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Requester Dashboard Screenshots (Desktop, Tablet, Mobile)
  console.log('Capturing Requester Dashboard screenshots...');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(reqDashDir, 'desktop.png'), fullPage: true });

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(reqDashDir, 'tablet.png'), fullPage: true });

  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(reqDashDir, 'mobile.png'), fullPage: true });

  // Requester Ticket Detail (Read-Only Actions View)
  await page.setViewportSize({ width: 1280, height: 800 });
  console.log('Opening Requester ticket detail for read-only Actions Taken screenshot...');
  // Click first recent ticket on Requester Dashboard
  if (await page.isVisible('[data-testid^="recent-ticket-"]')) {
    await page.locator('[data-testid^="recent-ticket-"]').first().click();
  } else {
    await page.click('[data-testid="nav-my-tickets"]');
    await page.waitForSelector('table[data-testid="tickets-table"] tbody tr', { timeout: 10000 });
    await page.locator('table[data-testid="tickets-table"] tbody tr').first().click();
  }

  await page.waitForSelector('[data-testid="actions-taken-section"]', { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(actionsDir, 'requester-readonly.png'), fullPage: true });

  console.log('All screenshots successfully captured!');
  await browser.close();
}

run().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
