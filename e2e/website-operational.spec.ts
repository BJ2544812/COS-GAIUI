import { test, expect, loginAsRole } from './fixtures';

const USER = process.env.E2E_USER ?? 'admin';
const PASS = process.env.E2E_PASS ?? 'admin123';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.locator('#login-username').fill(USER);
  await page.locator('#login-password').fill(PASS);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

test.describe('Public website operational', () => {
  test('homepage loads with hero and navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /giving|sermons|events|about/i }).first()).toBeVisible();
  });

  test('about page renders', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('ministries page renders', async ({ page }) => {
    await page.goto('/ministries');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 30_000 });
  });

  test('sermons page renders', async ({ page }) => {
    await page.goto('/sermons');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 30_000 });
  });

  test('events page renders', async ({ page }) => {
    await page.goto('/events');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 30_000 });
  });

  test('public event detail route resolves when events exist', async ({ page, request }) => {
    const res = await request.get('/api/v1/website/public/events', {
      headers: { 'x-tenant-id': process.env.E2E_TENANT_ID ?? 'default-tenant-id' },
    });
    if (!res.ok()) {
      test.skip();
      return;
    }
    const json = (await res.json()) as { data?: Array<{ id: string }> };
    const events = json.data ?? [];
    const first = events[0];
    if (!first?.id) {
      test.skip();
      return;
    }
    await page.goto(`/events/${first.id}`);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('giving page shows impact or giving flow', async ({ page }) => {
    await page.goto('/giving');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByText(/generosity|give|impact|fuel/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('login transition from public site', async ({ page }) => {
    await page.goto('/');
    await page.goto('/login');
    await expect(page.locator('#login-username')).toBeVisible();
    await login(page);
    await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible({ timeout: 30_000 });
  });

  test('broken image does not collapse layout', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      document.querySelectorAll('img').forEach((img) => {
        img.setAttribute('src', 'https://invalid.example/broken.png');
      });
    });
    await expect(page.locator('main').first()).toBeVisible();
    const mainBox = await page.locator('main').first().boundingBox();
    expect(mainBox?.height ?? 0).toBeGreaterThan(100);
  });
});

test.describe('Website builder operational', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByTestId('nav-website').click();
    await expect(page.getByText(/website|pages|builder/i).first()).toBeVisible({ timeout: 30_000 });
  });

  test('builder loads and restore flagship control exists', async ({ page }) => {
    await page.getByRole('button', { name: /visual builder/i }).click();
    await page.getByRole('button', { name: /site ops/i }).click();
    await expect(page.getByTestId('website-restore-flagship')).toBeVisible({ timeout: 30_000 });
  });

  test('builder opens home page in editor', async ({ page }) => {
    await page.getByRole('button', { name: /visual builder/i }).click();
    await page.getByTestId('website-page-home').click({ timeout: 15_000 });
    await expect(page.locator('main').first()).toBeVisible({ timeout: 30_000 });
  });

  test('live preview uses public SPA path not /website prefix', async ({ page }) => {
    await page.getByRole('button', { name: /visual builder/i }).click();
    await page.getByTestId('website-page-home').click({ timeout: 15_000 });
    const urlLine = page.locator('span').filter({ hasText: /\/\/127\.0\.0\.1|localhost/ }).first();
    await expect(urlLine).toBeVisible({ timeout: 15_000 });
    const text = await urlLine.textContent();
    expect(text ?? '').not.toMatch(/\/website\//);
    expect(text ?? '').toMatch(/\/(|\?|$)/);
  });

  test('churchadmin can open website builder without 403', async ({ page }) => {
    await loginAsRole(page, 'churchadmin', process.env.DEMO_ROLE_PASSWORD ?? 'demo123', { skipAdminNav: true });
    await page.goto('/admin?module=website');
    await expect(page.getByRole('heading', { name: 'Website builder' })).toBeVisible({ timeout: 30_000 });
  });
});
