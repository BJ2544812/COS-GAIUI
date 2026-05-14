import { test, expect } from './fixtures';

const USER = process.env.E2E_USER ?? 'admin';
const PASS = process.env.E2E_PASS ?? 'admin123';

test.describe('Local runtime connectivity', () => {
  test('login page renders repeatedly without white screen', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.goto('/login');
      await expect(page.getByRole('heading', { name: 'Kingdom OS' })).toBeVisible();
      await expect(page.locator('#login-username')).toBeVisible();
    }
  });

  test('login then reload session twice', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-username').fill(USER);
    await page.locator('#login-password').fill(PASS);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).not.toHaveURL(/\/login$/, { timeout: 25_000 });
    await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible({ timeout: 25_000 });

    await page.reload();
    await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible({ timeout: 25_000 });

    await page.reload();
    await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible({ timeout: 25_000 });
  });
});
