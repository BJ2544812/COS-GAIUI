import { test, expect } from '@playwright/test';

/**
 * Transport-level failure simulations (route.abort). Intentionally does not use
 * `./fixtures` because that fixture treats failed /api requests as test failures.
 */
test.describe('Runtime resilience (simulated API faults)', () => {
  test('/auth/me unreachable with stored token shows recovery UI, not a white screen', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.route('**/api/v1/auth/me**', (route) => route.abort('failed'));
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'header.payload.sig');
      localStorage.setItem('auth_tenant_id', 'default-tenant-id');
    });

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Kingdom OS' })).toBeVisible({ timeout: 25_000 });
    await expect(page.getByRole('button', { name: 'Retry connection' })).toBeVisible({ timeout: 25_000 });
    expect(errors, `pageerror: ${errors.join('\n')}`).toHaveLength(0);
  });

  test('login submit when /auth/login is unreachable shows a clear failure state', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.route('**/api/v1/auth/login**', (route) => route.abort('failed'));
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Kingdom OS' })).toBeVisible({ timeout: 25_000 });
    await page.locator('#login-username').fill('admin');
    await page.locator('#login-password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText(/cannot reach|failed to fetch|network/i)).toBeVisible({ timeout: 15_000 });
    expect(errors, `pageerror: ${errors.join('\n')}`).toHaveLength(0);
  });

  test('after /auth/me transport failure, Retry reaches API again (invalid JWT then normal login)', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    let block = true;
    await page.route('**/api/v1/auth/me**', async (route) => {
      if (block) return route.abort('failed');
      return route.continue();
    });

    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'header.payload.sig');
      localStorage.setItem('auth_tenant_id', 'default-tenant-id');
    });

    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Retry connection' })).toBeVisible({ timeout: 25_000 });

    block = false;
    await page.getByRole('button', { name: 'Retry connection' }).click();

    await expect(page.getByRole('button', { name: 'Retry connection' })).not.toBeVisible({ timeout: 25_000 });
    await expect(page.getByRole('heading', { name: 'Kingdom OS' })).toBeVisible();
    await expect(page.locator('#login-username')).toBeVisible();

    const user = process.env.E2E_USER ?? 'admin';
    const pass = process.env.E2E_PASS ?? 'admin123';
    await page.locator('#login-username').fill(user);
    await page.locator('#login-password').fill(pass);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).not.toHaveURL(/\/login$/, { timeout: 30_000 });
    await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible({ timeout: 30_000 });
    expect(errors, `pageerror: ${errors.join('\n')}`).toHaveLength(0);
  });
});
