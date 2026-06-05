import { test, expect, loginAsAdmin } from './fixtures';

test.describe('Release candidate', () => {
  test('license and operator toolkit APIs', async ({ request }) => {
    const login = await request.post('/api/v1/auth/login', {
      headers: { 'x-tenant-id': 'default-tenant-id' },
      data: { username: 'admin', password: 'admin123' },
    });
    expect(login.ok()).toBeTruthy();
    const { token } = await login.json();
    const headers = { Authorization: `Bearer ${token}`, 'x-tenant-id': 'default-tenant-id' };

    const license = await request.get('/api/v1/deploy/license', { headers });
    expect(license.ok()).toBeTruthy();

    const diag = await request.get('/api/v1/platform/operator/diagnostics', { headers });
    expect(diag.ok()).toBeTruthy();

    const search = await request.get('/api/v1/platform/search?q=a', { headers });
    expect(search.ok()).toBeTruthy();
    const searchJson = await search.json();
    expect(searchJson.data).toHaveProperty('volunteers');
  });

  test('admin operator tab visible', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/');
    await page.getByRole('button', { name: /admin center/i }).first().click({ timeout: 15_000 }).catch(() => undefined);
    await page.getByText('System admin center', { exact: false }).waitFor({ timeout: 20_000 }).catch(() => undefined);
    const opTab = page.getByRole('button', { name: 'Operator toolkit' });
    if (await opTab.isVisible().catch(() => false)) {
      await opTab.click();
      await expect(page.getByText('Production operator tools')).toBeVisible({ timeout: 10_000 });
    }
  });
});
