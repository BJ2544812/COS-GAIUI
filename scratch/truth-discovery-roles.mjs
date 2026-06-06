/**
 * Browser truth discovery — captures post-login URL, sidebar nav, and main heading per role.
 * Usage: node scratch/truth-discovery-roles.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3001';
const DEMO_PASS = process.env.DEMO_ROLE_PASSWORD || 'demo123';

const ROLES = [
  { user: 'admin', pass: 'admin123', label: 'Administrator', staff: true },
  { user: 'pastor', pass: DEMO_PASS, label: 'Senior Pastor', staff: true },
  { user: 'associate', pass: DEMO_PASS, label: 'Pastor (Associate)', staff: true },
  { user: 'worship', pass: DEMO_PASS, label: 'Worship Leader', staff: true },
  { user: 'youth', pass: DEMO_PASS, label: 'Youth Pastor', staff: true },
  { user: 'finance', pass: DEMO_PASS, label: 'Finance Officer', staff: true },
  { user: 'accountant', pass: DEMO_PASS, label: 'Treasurer (Accountant)', staff: true },
  { user: 'counter', pass: DEMO_PASS, label: 'Counter Team', staff: true },
  { user: 'volunteers', pass: DEMO_PASS, label: 'Volunteer Coordinator', staff: true },
  { user: 'staffdesk', pass: DEMO_PASS, label: 'Staff', staff: true },
  { user: 'member', pass: DEMO_PASS, label: 'Member', staff: false },
];

async function login(page, spec) {
  const url = spec.staff ? `${BASE}/login` : `${BASE}/member-login`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByText(/Checking Church Office server/i).waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});

  if (spec.staff) {
    await page.locator('#login-username').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('#login-username').fill(spec.user);
    await page.locator('#login-password').fill(spec.pass);
    await page.locator('#login-password').press('Enter');
  } else {
    await page.locator('#member-login-username').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('#member-login-username').fill(spec.user);
    await page.locator('#member-login-password').fill(spec.pass);
    await page.getByRole('button', { name: /sign in|login|enter/i }).click();
  }

  await page.waitForURL(/\/(admin|portal)/, { timeout: 25000 });
  await page.waitForTimeout(1500);
}

async function capture(page, spec) {
  const url = page.url();
  const heading = await page.locator('h1').first().textContent().catch(() => null);
  const subheading = await page.locator('h1 + p, [class*="subtitle"]').first().textContent().catch(() => null);
  const roleBadge = await page.locator('text=/Super Admin|Senior Pastor|Pastor|Finance|Member|Staff|Counter|Worship|Youth|Accountant|Volunteer/i').first().textContent().catch(() => null);

  const navItems = await page.locator('[data-testid^="nav-"]').allTextContents().catch(() => []);
  const sidebarButtons = await page.locator('nav button, aside button').allTextContents().catch(() => []);
  const quickOps = await page.locator('[data-testid^="quick-ops"]').allTextContents().catch(() => []);

  const bodySnippet = await page.locator('main').innerText().catch(() => '');
  const hasAccessDenied = /access denied|not authorized|permission/i.test(bodySnippet);
  const hasError = /something went wrong|failed to load|error/i.test(bodySnippet.slice(0, 500));

  return {
    label: spec.label,
    username: spec.user,
    url,
    heading: heading?.trim(),
    subheading: subheading?.trim(),
    roleBadge: roleBadge?.trim(),
    navTestIds: navItems.filter(Boolean),
    sidebarButtons: [...new Set(sidebarButtons.map((s) => s.trim()).filter((s) => s.length > 1 && s.length < 40))].slice(0, 40),
    quickOps: quickOps.filter(Boolean),
    hasAccessDenied,
    hasError,
    bodyPreview: bodySnippet.slice(0, 800),
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const spec of ROLES) {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await login(page, spec);
      const data = await capture(page, spec);
      results.push({ ...data, status: 'ok' });
      console.log(`✓ ${spec.label} → ${data.url}`);
    } catch (e) {
      results.push({ label: spec.label, username: spec.user, status: 'fail', error: String(e) });
      console.log(`✗ ${spec.label} — ${e.message || e}`);
    }
    await context.close();
  }

  await browser.close();
  const out = 'scratch/truth-discovery-roles.json';
  writeFileSync(out, JSON.stringify(results, null, 2));
  console.log(`\nWrote ${out}`);
}

main();
