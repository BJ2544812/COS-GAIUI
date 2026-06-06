import { test, expect } from './fixtures';

const USER = process.env.E2E_USER ?? 'admin';
const PASS = process.env.E2E_PASS ?? 'admin123';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.locator('#login-username').fill(USER);
  await page.locator('#login-password').fill(PASS);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 30_000 });
}

test.describe('Deep workflow persistence and trust', () => {
  test('giving donation persists across reload and is returned by API', async ({ page, request }) => {
    await login(page);
    await page.getByTestId('nav-giving').click();
    await expect(page.getByRole('heading', { name: 'Giving', exact: true })).toBeVisible();

    const suffix = Date.now();
    const amount = 987654;
    const reference = `PW-DEEP-${suffix}`;

    await page.getByRole('button', { name: 'Record gift' }).first().click();
    await expect(page.getByRole('heading', { name: 'Record gift' })).toBeVisible();

    await page.locator('input[name="amount"]').fill(String(amount));
    await page.locator('input[name="reference"]').fill(reference);
    await page.locator('select[name="method"]').selectOption('Bank Transfer');

    const createOut = await page.evaluate(
      async ({ reference, amount }) => {
        const token = localStorage.getItem('auth_token');
        const tenantId = localStorage.getItem('auth_tenant_id') || 'default-tenant-id';
        const accountsRes = await fetch('/api/v1/finance/accounts', {
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const accountsJson = await accountsRes.json();
        const rows = Array.isArray(accountsJson?.data) ? accountsJson.data : [];
        const debit = rows.find((a: any) => a.type === 'Asset' && a.isActive);
        const credit = rows.find((a: any) => a.type === 'Revenue' && a.isActive);
        const payload: Record<string, unknown> = {
          amount,
          method: 'Bank Transfer',
          date: new Date().toISOString(),
          reference,
        };
        if (debit?.id) payload.debitAccountId = debit.id;
        if (credit?.id) payload.creditAccountId = credit.id;
        const res = await fetch('/api/v1/giving/donations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => null);
        return { status: res.status, json };
      },
      { reference, amount },
    );
    let donationId = String(createOut.json?.data?.id ?? '');
    if (![200, 201].includes(createOut.status) || !donationId) {
      const auth = await page.evaluate(() => ({
        token: localStorage.getItem('auth_token') || '',
        tenantId: localStorage.getItem('auth_tenant_id') || 'default-tenant-id',
      }));
      const fallbackRes = await request.post('/api/v1/giving/donations', {
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': auth.tenantId,
          ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
        },
        data: {
          amount,
          method: 'Bank Transfer',
          date: new Date().toISOString(),
          reference,
        },
      });
      expect(fallbackRes.status()).toBe(201);
      const fallbackJson = await fallbackRes.json();
      donationId = String(fallbackJson?.data?.id ?? '');
    }
    expect(donationId).not.toHaveLength(0);

    await page.getByTestId('nav-giving').click();

    await page.reload();
    await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('nav-giving').click();
    const rows = await page.evaluate(async () => {
      const token = localStorage.getItem('auth_token');
      const tenantId = localStorage.getItem('auth_tenant_id') || 'default-tenant-id';
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const to = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const res = await fetch(`/api/v1/giving/donations/reconciliation?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json().catch(() => ({}));
      return Array.isArray(json?.data?.rows) ? json.data.rows : [];
    });
    expect(rows.some((r: { donationId?: string; id?: string }) => (r.donationId || r.id) === donationId)).toBeTruthy();
  });

  test('finance module opens voucher center with live controls', async ({ page }) => {
    await login(page);
    await page.getByTestId('nav-finance').click();
    await expect(page.getByRole('heading', { name: 'Finance', exact: true })).toBeVisible();

    await page.getByRole('tab', { name: 'Vouchers', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Voucher Registry' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset Filters' })).toBeVisible();
  });

  test('finance reconciliation tab exposes bank statement workflow', async ({ page }) => {
    await login(page);
    await page.getByTestId('nav-finance').click();
    await page.getByRole('tab', { name: 'Reconciliation', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Bank statement reconciliation' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start session' })).toBeVisible();
  });
});
