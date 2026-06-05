import { test, expect, expectStaffLoginPage, loginAsAdmin } from './fixtures';

test.describe('Local runtime connectivity', () => {
  test('login page renders repeatedly without white screen', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.goto('/login');
      await expectStaffLoginPage(page);
    }
  });

  test('login then reload session twice', async ({ page }) => {
    await loginAsAdmin(page);

    await page.reload();
    await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible({ timeout: 25_000 });

    await page.reload();
    await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible({ timeout: 25_000 });
  });
});
