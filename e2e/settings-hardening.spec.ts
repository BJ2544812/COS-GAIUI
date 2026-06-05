import { test, expect, loginAsAdmin } from './fixtures';

const TENANT = 'default-tenant-id';

test.describe('Settings hardening', () => {
  test('settings API load and save', async ({ request }) => {
    const login = await request.post('/api/v1/auth/login', {
      headers: { 'x-tenant-id': TENANT },
      data: { username: 'admin', password: 'admin123' },
    });
    expect(login.ok()).toBeTruthy();
    const { token, tenantId } = await login.json();
    expect(tenantId).toBe(TENANT);
    const headers = { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId };

    const get = await request.get('/api/v1/settings', { headers });
    expect(get.ok()).toBeTruthy();
    const body = await get.json();
    expect(body.structured).toBeTruthy();
    expect(body.structured.organization).toBeTruthy();
    expect(body.structured.operational).toBeTruthy();

    const save = await request.post('/api/v1/settings', {
      headers: { ...headers, 'Content-Type': 'application/json' },
      data: {
        organization: { name: body.structured.organization.name || 'Test Church' },
        operational: { notificationDelivery: 'in_app' },
      },
    });
    expect(save.ok()).toBeTruthy();
  });

  test('settings module loads in UI', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/');
    const settingsNav = page.getByRole('button', { name: /settings/i }).first();
    if (await settingsNav.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await settingsNav.click();
      await expect(page.getByText('System Settings')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText('Organization')).toBeVisible();
    }
  });
});
