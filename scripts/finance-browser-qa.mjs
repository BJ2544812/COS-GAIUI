/**
 * Browser QA sweep for Giving & Finance — run against local dev (3001) + API (4002).
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3001';
const ROLES = [
  { label: 'Treasurer', username: 'finance', password: 'demo123' },
  { label: 'Finance Officer', username: 'accountant', password: 'demo123' },
  { label: 'Administrator', username: 'admin', password: 'admin123' },
];

const GIVING_TABS = ['Overview', 'All gifts', 'Donors', 'Campaigns', 'Sunday & services', 'Receipts', 'Settlement status'];
const FINANCE_TABS = [
  'Overview', 'Vouchers', 'Chart of accounts', 'Ledgers', 'Funds', 'Budgets', 'Vendors',
  'Payroll', 'Assets', 'Reconciliation', 'Reports', 'CA & Audit', 'Document center',
];

async function login(page, username, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('#login-username', { timeout: 30000 });
  await page.fill('#login-username', username);
  await page.fill('#login-password', password);
  await page.getByRole('button', { name: 'Enter Dashboard' }).click();
  await page.waitForURL(/\/admin/, { timeout: 30000 });
}

async function tabClick(page, name) {
  const tab = page.getByRole('tab', { name, exact: true });
  await tab.click({ timeout: 10000 });
  await page.waitForTimeout(600);
}

async function main() {
  const browser = await chromium.launch();
  const results = [];

  for (const role of ROLES) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    try {
      await login(page, role.username, role.password);

      // Giving
      await page.goto(`${BASE}/admin?module=giving`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Giving")', { timeout: 15000 });
      for (const t of GIVING_TABS) {
        await tabClick(page, t);
        const empty = await page.locator('text=Something went wrong').count();
        results.push({ role: role.label, area: 'Giving', tab: t, ok: empty === 0 });
      }

      // Finance
      await page.goto(`${BASE}/admin?module=finance`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Finance")', { timeout: 15000 });
      const defaultTab = await page.getByRole('tab', { selected: true }).innerText();
      results.push({ role: role.label, area: 'Finance', tab: `default:${defaultTab}`, ok: defaultTab === 'Vouchers' });

      for (const t of FINANCE_TABS) {
        await tabClick(page, t);
        const errBanner = await page.locator('[class*="rose"], text=You do not currently have permission').count();
        results.push({ role: role.label, area: 'Finance', tab: t, ok: errBanner === 0 });
      }

      // Voucher create dialog opens
      await page.goto(`${BASE}/admin?module=finance&tab=vouchers`, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'New voucher' }).click();
      const dlg = await page.getByRole('dialog').count();
      results.push({ role: role.label, area: 'Finance', tab: 'New voucher dialog', ok: dlg > 0 });
      await page.keyboard.press('Escape');

      results.push({ role: role.label, area: 'Bootstrap', tab: 'pageerrors', ok: errors.length === 0, detail: errors.slice(0, 3).join('; ') });
    } catch (e) {
      results.push({ role: role.label, area: 'Fatal', tab: 'login/navigation', ok: false, detail: String(e.message || e) });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ total: results.length, failed: failed.length, results, failures: failed }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main();
