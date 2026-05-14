import { test, expect } from './fixtures';

const USER = process.env.E2E_USER ?? 'admin';
const PASS = process.env.E2E_PASS ?? 'admin123';

test.describe('Kingdom OS boot integrity', () => {
  test('root with invalid JWT shows login (no redirect storm, no white screen)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'definitely.not.a.valid.jwt.token');
      localStorage.setItem('auth_tenant_id', 'default-tenant-id');
    });
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/, { timeout: 25_000 });
    await expect(page.getByRole('heading', { name: 'Kingdom OS' })).toBeVisible();
    await expect(page.locator('#login-username')).toBeVisible();
  });

  test('root with unknown tenant id clears bad session and shows login', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'x.y.z');
      localStorage.setItem('auth_tenant_id', 'tenant-that-does-not-exist-00000000');
    });
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/, { timeout: 25_000 });
    await expect(page.getByRole('heading', { name: 'Kingdom OS' })).toBeVisible();
  });

  test('session restore after login shows shell', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-username').fill(USER);
    await page.locator('#login-password').fill(PASS);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).not.toHaveURL(/\/login$/, { timeout: 20_000 });
    await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible({ timeout: 20_000 });

    await page.reload();
    await expect(page).not.toHaveURL(/\/login$/, { timeout: 20_000 });
    await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible({ timeout: 20_000 });
  });
});
