/**
 * Finance trust sprint — browser-first validation for pilot lock gate.
 * Run: npx playwright test e2e/finance-trust-sprint.spec.ts --reporter=line
 */
import { test, expect } from './fixtures';
import { loginAsRole } from './fixtures';
import fs from 'node:fs';
import path from 'node:path';

const DEMO_PASS = 'demo123';
const ADMIN_PASS = 'admin123';

const CA_EXPORT_TYPES = [
  'trial_balance',
  'ledger',
  'day_book',
  'cash_bank_book',
  'fund_statements',
  'event_pnl',
  'donor_statements',
  'tally_foundation',
] as const;

async function gotoFinanceVouchers(page: import('@playwright/test').Page) {
  await page.goto('/admin?module=finance&tab=vouchers');
  await expect(page.getByRole('heading', { name: 'Finance', exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByRole('tab', { name: 'Vouchers', exact: true })).toBeVisible();
}

async function filterVoucherStatus(page: import('@playwright/test').Page, status: 'All' | 'Draft' | 'Approved' | 'Posted' | 'Reversed') {
  await page
    .locator('div.grid.grid-cols-2.md\\:grid-cols-5 > button')
    .filter({ has: page.getByText(status, { exact: true }) })
    .click();
}

async function createBalancedDraftVoucher(page: import('@playwright/test').Page, marker: string) {
  await page.getByRole('button', { name: 'New voucher' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: /New voucher/i })).toBeVisible();

  await expect(async () => {
    const selects = dialog.locator('select');
    expect(await selects.count()).toBeGreaterThanOrEqual(3);
    expect(await selects.nth(1).locator('option').count()).toBeGreaterThan(1);
  }).toPass({ timeout: 30_000 });

  await dialog.getByPlaceholder('e.g. Utilities — March').fill(marker);

  const lineRows = dialog.locator('.grid.grid-cols-12');
  await lineRows.nth(0).locator('select').selectOption({ index: 2 });
  await lineRows.nth(1).locator('select').selectOption({ index: 3 });
  await lineRows.nth(0).getByPlaceholder('Debit').fill('1500');
  await lineRows.nth(1).getByPlaceholder('Credit').fill('1500');
  await expect(dialog.getByText('Debits 1500.00 · Credits 1500.00 · Balanced')).toBeVisible();
  await dialog.getByRole('button', { name: 'Save draft' }).click();
  await expect(dialog).toBeHidden({ timeout: 20_000 });
  await expect(page.getByText(/Draft voucher saved/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 30_000 });
}

test.describe('Finance trust sprint — P0 voucher lifecycle', () => {
  test('Treasurer: draft → approve → post → reverse with search, refresh, ledger', async ({ page }) => {
    const marker = `TRUST-SPRINT-${Date.now()}`;
    page.on('dialog', (d) => d.accept());

    await loginAsRole(page, 'finance', DEMO_PASS);
    await gotoFinanceVouchers(page);

    await createBalancedDraftVoucher(page, marker);

    // Draft filter
    await filterVoucherStatus(page, 'Draft');
    await expect(page.getByText(marker)).toBeVisible({ timeout: 15_000 });

    const row = page.locator('tr').filter({ hasText: marker });
    await row.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByText(/approved\./i)).toBeVisible({ timeout: 15_000 });

    await filterVoucherStatus(page, 'Approved');
    await expect(row).toBeVisible({ timeout: 15_000 });
    await row.getByRole('button', { name: 'Post' }).click();
    await expect(page.getByText(/posted\./i)).toBeVisible({ timeout: 15_000 });

    await filterVoucherStatus(page, 'Posted');
    await expect(row).toBeVisible({ timeout: 15_000 });
    await row.getByRole('button', { name: 'Reverse' }).click();
    await expect(page.getByText(/reversal draft created/i)).toBeVisible({ timeout: 15_000 });

    await page.getByPlaceholder('Search voucher no/description/source').fill(marker);
    await expect(page.getByText(marker)).toBeVisible();

    await page.getByRole('button', { name: 'Refresh' }).first().click();
    await expect(page.getByText(marker)).toBeVisible({ timeout: 15_000 });

    // Ledger impact — open Ledgers under Accounting setup
    await page.getByRole('button', { name: 'Accounting setup' }).click();
    await page.getByRole('tab', { name: 'Ledgers', exact: true }).click();
    const ledgerSelect = page.locator('select').filter({ has: page.locator('option:has-text("Account")') }).first();
    if (await ledgerSelect.count()) {
      await ledgerSelect.selectOption({ index: 1 });
      await page.getByRole('button', { name: 'View ledger' }).click();
      await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    }
  });

  test('Administrator: full voucher lifecycle', async ({ page }) => {
    const marker = `TRUST-ADMIN-${Date.now()}`;
    page.on('dialog', (d) => d.accept());

    await loginAsRole(page, 'admin', ADMIN_PASS);
    await gotoFinanceVouchers(page);
    await createBalancedDraftVoucher(page, marker);

    await filterVoucherStatus(page, 'Draft');
    const row = page.locator('tr').filter({ hasText: marker });
    await expect(row).toBeVisible({ timeout: 15_000 });
    await row.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByText(/approved\./i)).toBeVisible({ timeout: 15_000 });
    await filterVoucherStatus(page, 'Approved');
    await expect(row).toBeVisible({ timeout: 15_000 });
    await row.getByRole('button', { name: 'Post' }).click();
    await page.getByPlaceholder('Search voucher no/description/source').fill(marker);
    await expect(page.getByText(marker)).toBeVisible();
  });

  test('Finance Officer: can create draft (no approve/post permissions)', async ({ page }) => {
    const marker = `TRUST-ACCT-${Date.now()}`;
    await loginAsRole(page, 'accountant', DEMO_PASS);
    await gotoFinanceVouchers(page);
    await createBalancedDraftVoucher(page, marker);

    await filterVoucherStatus(page, 'Draft');
    await expect(page.getByText(marker)).toBeVisible({ timeout: 15_000 });
    const row = page.locator('tr').filter({ hasText: marker });
    await expect(row.getByRole('button', { name: 'Approve' })).toHaveCount(0);
  });
});

test.describe('Finance trust sprint — P0 CA exports', () => {
  test('Treasurer: every CA export returns valid CSV', async ({ page, request }) => {
    await loginAsRole(page, 'finance', DEMO_PASS);
    await page.goto('/admin?module=finance&tab=ca-audit');
    await expect(page.getByText('Month-end pack')).toBeVisible({ timeout: 20_000 });

    const auth = await page.evaluate(() => ({
      token: localStorage.getItem('auth_token'),
      tenant: localStorage.getItem('auth_tenant_id') || 'default-tenant-id',
    }));

    const accountsRes = await request.get('/api/v1/finance/accounts', {
      headers: {
        Authorization: auth.token ? `Bearer ${auth.token}` : '',
        'x-tenant-id': auth.tenant,
      },
    });
    const accountsBody = await accountsRes.json();
    const firstAccountId = accountsBody?.data?.[0]?.id ?? '';

    const results: Array<{ type: string; ok: boolean; rows: number; detail: string }> = [];

    for (const type of CA_EXPORT_TYPES) {
      const payload: Record<string, unknown> = { type };
      if (type === 'ledger' && firstAccountId) payload.accountId = firstAccountId;

      const res = await request.post('/api/v1/finance/ca-exports', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: auth.token ? `Bearer ${auth.token}` : '',
          'x-tenant-id': auth.tenant,
        },
        data: payload,
      });
      const body = await res.json().catch(() => ({}));
      const csv = body?.data?.csv ?? '';
      const rowCount = body?.data?.rowCount ?? 0;
      const lines = csv.split(/\r?\n/).filter(Boolean);
      const hasHeader = lines.length > 0 && (lines[0].includes(',') || lines[0] === 'no_data');
      const ok = res.ok() && csv.length > 0 && hasHeader;
      results.push({
        type,
        ok,
        rows: rowCount,
        detail: ok ? `header=${lines[0]?.slice(0, 60)} rows=${rowCount}` : `status=${res.status()} ${JSON.stringify(body?.error ?? body).slice(0, 100)}`,
      });
    }

    const failed = results.filter((r) => !r.ok);
    if (failed.length) {
      fs.writeFileSync(
        path.join(process.cwd(), 'scratch', 'finance-trust-ca-exports.json'),
        JSON.stringify({ results, failed }, null, 2),
      );
    }
    expect(failed, `CA export failures: ${JSON.stringify(failed)}`).toHaveLength(0);

    // Browser download path for Trial Balance
    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
    await page.getByRole('button', { name: 'Download CSV' }).first().click();
    const download = await downloadPromise;
    const dlPath = path.join(process.cwd(), 'scratch', await download.suggestedFilename());
    await download.saveAs(dlPath);
    const content = fs.readFileSync(dlPath, 'utf8');
    expect(content.length).toBeGreaterThan(20);
    expect(content.split('\n').length).toBeGreaterThan(1);
  });
});
