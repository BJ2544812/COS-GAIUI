import { test, expect } from './fixtures';

const USER = process.env.E2E_USER ?? 'admin';
const PASS = process.env.E2E_PASS ?? 'admin123';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.locator('#login-username').fill(USER);
  await page.locator('#login-password').fill(PASS);
  await page.locator('button[type="submit"]').first().click();
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 25_000 });
  await page.goto('/admin?module=dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible({ timeout: 25_000 });
}

test.describe('Operational navigation sweep', () => {
  test('sidebar modules are navigable with no dead clicks', async ({ page }) => {
    await login(page);

    const nav = page.locator('[data-testid^="nav-"]');
    const ids = await nav.evaluateAll((nodes) =>
      nodes
        .map((n) => n.getAttribute('data-testid'))
        .filter((v): v is string => Boolean(v)),
    );

    expect(ids.length).toBeGreaterThan(10);

    for (const id of ids) {
      const button = page.getByTestId(id);
      await expect(button).toBeVisible();
      await button.click();
      await expect(page.getByRole('main').first()).toBeVisible();
      await expect(button).toHaveClass(/bg-indigo-50/, { timeout: 10_000 });
      await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible();
    }
  });
});
