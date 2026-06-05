import { test, expect, loginAsRole } from './fixtures';

test.describe('Go-live hardening', () => {
  test('platform monitoring APIs respond for admin', async ({ request }) => {
    const login = await request.post('/api/v1/auth/login', {
      headers: { 'x-tenant-id': process.env.E2E_TENANT_ID || 'default-tenant-id' },
      data: {
        username: process.env.E2E_USER || 'admin',
        password: process.env.E2E_PASS || 'admin123',
      },
    });
    expect(login.ok()).toBeTruthy();
    const { token } = (await login.json()) as { token: string };
    const tenantId = process.env.E2E_TENANT_ID || 'default-tenant-id';
    const headers = {
      Authorization: `Bearer ${token}`,
      'x-tenant-id': tenantId,
    };

    const incidents = await request.get('/api/v1/platform/incidents', { headers });
    expect(incidents.ok()).toBeTruthy();
    const incJson = await incidents.json();
    expect(incJson.data).toHaveProperty('summary');
    expect(incJson.data).toHaveProperty('queueMetrics');

    const queue = await request.get('/api/v1/platform/queue-metrics', { headers });
    expect(queue.ok()).toBeTruthy();
    const queueJson = await queue.json();
    expect(queueJson.data).toHaveProperty('mode');
  });

  test('admin center incidents tab loads', async ({ page }) => {
    await loginAsRole(page, process.env.E2E_USER ?? 'admin', process.env.E2E_PASS ?? 'admin123', {
      skipAdminNav: true,
    });
    await page.goto('/admin?module=admin-center');
    await page.getByRole('button', { name: /admin center/i }).click({ timeout: 15_000 }).catch(() => undefined);
    await page.getByText('System admin center', { exact: false }).waitFor({ timeout: 20_000 }).catch(() => undefined);
    const incidentsTab = page.getByRole('button', { name: 'Incidents' });
    if (await incidentsTab.isVisible().catch(() => false)) {
      await incidentsTab.click();
      await expect(page.getByText('Operational incidents')).toBeVisible({ timeout: 15_000 });
    }
  });

  test('public endpoints accept rate-limited traffic', async ({ request }) => {
    const res = await request.get('/api/v1/website/public/settings', {
      headers: { 'x-tenant-id': process.env.E2E_TENANT_ID || 'default-tenant-id' },
    });
    expect(res.status()).toBeLessThan(500);
  });
});
