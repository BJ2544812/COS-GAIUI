import { test, expect } from './fixtures';

const MEMBER_PASS = process.env.DEMO_MEMBER_PASSWORD ?? 'demo123';

test.describe('Demo Church v2', () => {
  test('member login reaches portal with profile', async ({ page }) => {
    await page.goto('/member-login');
    await page.locator('#member-login-username').fill('member');
    await page.locator('#member-login-password').fill(MEMBER_PASS);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/portal/, { timeout: 25_000 });
    await expect(page.getByText('My Church').first()).toBeVisible();
    await expect(page.getByText('Prayer requests').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('My groups').first()).toBeVisible();
  });

  test('academy quick-start guides are served from public folder', async ({ request }) => {
    const res = await request.get('/guides/senior-pastor.md');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body.length).toBeGreaterThan(100);
  });

  test('staff login link from member page', async ({ page }) => {
    await page.goto('/member-login');
    await expect(page.getByRole('link', { name: /church office/i })).toBeVisible();
  });

  test('academy module loads for admin', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-username').fill('admin');
    await page.locator('#login-password').fill('admin123');
    await page.locator('button[type="submit"]').first().click();
    await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible({ timeout: 25_000 });
    await page.goto('/admin?module=academy');
    await expect(page.getByRole('heading', { name: 'Academy' })).toBeVisible({ timeout: 20_000 });
  });
});
