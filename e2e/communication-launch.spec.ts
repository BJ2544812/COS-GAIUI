import { test, expect, loginAsAdmin, loginAsRole } from './fixtures';

test.describe('Communication & outreach launch', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('communication hub API responds', async ({ page }) => {
    const res = await page.request.get('/api/v1/communication/hub', {
      headers: {
        'x-tenant-id': process.env.E2E_TENANT_ID ?? 'default-tenant-id',
        Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('auth_token'))}`,
      },
    });
    expect(res.status()).toBeLessThan(500);
    if (res.ok()) {
      const json = await res.json();
      expect(json.status).toBe('success');
      expect(json.data).toHaveProperty('analytics');
    }
  });

  test('outreach dashboard API responds', async ({ page }) => {
    const res = await page.request.get('/api/v1/outreach/dashboard', {
      headers: {
        'x-tenant-id': process.env.E2E_TENANT_ID ?? 'default-tenant-id',
        Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('auth_token'))}`,
      },
    });
    expect(res.status()).toBeLessThan(500);
    if (res.ok()) {
      const json = await res.json();
      expect(json.status).toBe('success');
      expect(json.data).toHaveProperty('stats');
    }
  });

  test('communication module loads overview', async ({ page }) => {
    await page.goto('/admin?module=communication');
    await expect(page.getByRole('heading', { name: 'Communications' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/deliveries|campaigns|announcements/i).first()).toBeVisible();
  });

  test('secretary loads Communications without module error', async ({ page }) => {
    await loginAsRole(page, 'secretary', process.env.DEMO_ROLE_PASSWORD ?? 'demo123', { skipAdminNav: true });
    await page.goto('/admin?module=communication');
    await expect(page.getByRole('heading', { name: 'Communications' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/server offline|could not load|forbidden/i)).not.toBeVisible();
  });

  test('churchadmin loads Communications without module error', async ({ page }) => {
    await loginAsRole(page, 'churchadmin', process.env.DEMO_ROLE_PASSWORD ?? 'demo123', { skipAdminNav: true });
    await page.goto('/admin?module=communication');
    await expect(page.getByRole('heading', { name: 'Communications' })).toBeVisible({ timeout: 15_000 });
  });
});
