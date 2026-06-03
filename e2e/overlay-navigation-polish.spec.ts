import { test, expect, loginAsAdmin } from './fixtures';

test.describe('Overlay navigation polish', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('volunteer assign modal does not block sidebar navigation', async ({ page }) => {
    await page.getByTestId('nav-volunteers').click();
    await expect(page.getByRole('heading', { name: /volunteers/i })).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: /assign volunteer|assign/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Assign Ministry Role' })).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('nav-discipleship').click();
    await expect(page.getByRole('heading', { name: /pastoral care|discipleship/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Assign Ministry Role' })).toBeHidden({ timeout: 5_000 });
  });

  test('prayer intake sheet does not block sidebar navigation', async ({ page }) => {
    await page.getByTestId('nav-discipleship').click();
    await expect(page.getByRole('heading', { name: /pastoral care|discipleship/i })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('tab', { name: /prayer/i }).click();
    await page.getByRole('button', { name: /log prayer request/i }).click();
    await expect(page.getByRole('heading', { name: 'Log Prayer Request' })).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('nav-members').click();
    await expect(page.getByRole('heading', { name: /members/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Log Prayer Request' })).toBeHidden({ timeout: 5_000 });
  });
});
