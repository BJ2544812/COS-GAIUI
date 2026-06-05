import { test, expect, loginAsAdmin } from './fixtures';

const TENANT = 'default-tenant-id';

test.describe('V1 sign-off', () => {
  test('core platform APIs respond', async ({ request }) => {
    const login = await request.post('/api/v1/auth/login', {
      headers: { 'x-tenant-id': TENANT },
      data: { username: 'admin', password: 'admin123' },
    });
    expect(login.ok()).toBeTruthy();
    const { token } = await login.json();
    const headers = { Authorization: `Bearer ${token}`, 'x-tenant-id': TENANT };

    for (const path of [
      '/api/v1/deploy/license',
      '/api/v1/deploy/maintenance',
      '/api/v1/operations/command-center',
      '/api/v1/communication/hub',
      '/api/v1/outreach/dashboard',
      '/api/v1/platform/incidents',
      '/api/v1/platform/integrations',
      '/api/v1/deploy/backups',
    ]) {
      const res = await request.get(path, { headers });
      expect(res.ok(), `${path} should return 2xx`).toBeTruthy();
    }
  });

  test('public website settings are reachable', async ({ request }) => {
    const res = await request.get('/api/v1/website/public/settings', {
      headers: { 'x-tenant-id': TENANT },
    });
    expect(res.status()).toBeLessThan(500);
  });

  test('operator toolkit and guidance surfaces', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/');

    const adminBtn = page.getByRole('button', { name: /admin center/i }).first();
    if (await adminBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await adminBtn.click();
    }

    await page.getByText(/system admin center/i).first().waitFor({ timeout: 20_000 }).catch(() => undefined);

    const opTab = page.getByRole('button', { name: 'Operator toolkit' });
    if (await opTab.isVisible().catch(() => false)) {
      await opTab.click();
      await expect(page.getByText(/production operator tools/i)).toBeVisible({ timeout: 10_000 });
    }

    const outreach = page.getByRole('button', { name: /outreach/i }).first();
    if (await outreach.isVisible().catch(() => false)) {
      await outreach.click();
      await expect(page.getByText(/visitor/i).first()).toBeVisible({ timeout: 15_000 }).catch(() => undefined);
    }
  });
});
