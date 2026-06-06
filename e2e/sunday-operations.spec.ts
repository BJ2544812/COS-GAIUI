import { test, expect, loginAsAdmin } from './fixtures';

test.describe('Sunday operations simulation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('command center loads and campus filter is wired', async ({ page }) => {
    await page.goto('/admin');
    await page.getByTestId('nav-dashboard').click({ timeout: 15_000 }).catch(() =>
      page.getByRole('button', { name: /dashboard|home/i }).first().click(),
    );
    await expect(page.getByText(/command center|today's services|operations/i).first()).toBeVisible({
      timeout: 20_000,
    });

    const campusSelect = page.locator('select').filter({ hasText: /campus|all campuses/i }).first();
    if (await campusSelect.isVisible().catch(() => false)) {
      await campusSelect.selectOption({ index: 0 });
    }
    await expect(page.getByText("Today's services", { exact: false }).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Sunday Service opens and shows run sheet or guidance', async ({ page }) => {
    await page.goto('/admin');
    const sundayBtn = page
      .getByTestId('nav-sunday-mode')
      .or(page.getByRole('button', { name: /sunday service/i }).first());
    if (await sundayBtn.isVisible().catch(() => false)) {
      await sundayBtn.click();
    } else {
      await page.getByText('Sunday Service', { exact: false }).first().click({ timeout: 10_000 }).catch(() => undefined);
    }
    await expect(page.getByRole('heading', { name: /Sunday Service/i })).toBeVisible({ timeout: 20_000 });
    await expect(
      page
        .getByText(/No run sheet has been created|Service flow|Loading today'?s service|Open Worship Planning/i)
        .first(),
    ).toBeVisible({ timeout: 25_000 });
  });

  test('attendance live portal is reachable', async ({ page }) => {
    await page.goto('/admin');
    await page.getByTestId('nav-attendance').click({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Attendance' })).toBeVisible({ timeout: 20_000 });
  });
});
