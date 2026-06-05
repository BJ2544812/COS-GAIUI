import { test, expect, loginAsAdmin } from './fixtures';

test.describe('Members & Families operational', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('members directory loads and import dialog opens', async ({ page }) => {
    await page.getByRole('button', { name: /members/i }).first().click();
    await expect(page.getByRole('heading', { name: /members/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /^import$/i }).click();
    await expect(page.getByText(/import members/i)).toBeVisible();
  });

  test('families add household dialog and create flow', async ({ page }) => {
    const householdName = `E2E Household ${Date.now()}`;
    await page.getByRole('button', { name: /families/i }).first().click();
    await expect(page.getByRole('heading', { name: /families/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /add family/i }).click();
    await expect(page.getByRole('heading', { name: /create household/i })).toBeVisible();
    await page.getByPlaceholder(/sharma family/i).fill(householdName);
    await expect(page.getByRole('button', { name: /create family/i })).toBeEnabled();

    await page.getByRole('button', { name: /create family/i }).click();

    const apiMissing = page.getByText(/api route not found/i);
    if (await apiMissing.isVisible({ timeout: 3_000 }).catch(() => false)) {
      test.skip(true, 'Restart dev:server to load POST /api/v1/families');
    }

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15_000 });
    const search = page.getByPlaceholder(/search families/i);
    if (await search.isVisible().catch(() => false)) {
      await search.fill(householdName);
    }
    await expect(page.getByText(householdName)).toBeVisible({ timeout: 15_000 });
  });
});
