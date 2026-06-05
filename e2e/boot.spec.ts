import { test, expect, expectStaffLoginPage, loginAsAdmin } from './fixtures';

test.describe('Kingdom OS boot integrity', () => {
  test('invalid JWT on public home does not white-screen; admin route shows login', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'definitely.not.a.valid.jwt.token');
      localStorage.setItem('auth_tenant_id', 'default-tenant-id');
    });
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/, { timeout: 25_000 });
    await expect(page.locator('main').first()).toBeVisible({ timeout: 25_000 });

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/, { timeout: 25_000 });
    await expectStaffLoginPage(page);
  });

  test('unknown tenant on admin clears bad session and shows login', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'x.y.z');
      localStorage.setItem('auth_tenant_id', 'tenant-that-does-not-exist-00000000');
    });
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/, { timeout: 25_000 });
    await expectStaffLoginPage(page);
  });

  test('session restore after login shows shell', async ({ page }) => {
    await loginAsAdmin(page);

    await page.reload();
    await expect(page).not.toHaveURL(/\/login$/, { timeout: 20_000 });
    await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible({ timeout: 20_000 });
  });
});
