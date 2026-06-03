import { test as base, expect, type Page } from '@playwright/test';

/** Staff login surface (org-branded; shell brand is KINGDOM OS after sign-in). */
export async function expectStaffLoginPage(page: Page) {
  await expect(page.getByRole('heading', { name: 'Staff Access' })).toBeVisible();
  await expect(page.locator('#login-username')).toBeVisible();
  await expect(page.locator('#login-password')).toBeVisible();
}

/** Sign in and land in the ERP shell at /admin (not public website). */
export async function loginAsRole(
  page: Page,
  username: string,
  password = process.env.E2E_PASS ?? 'admin123',
  options?: { skipAdminNav?: boolean },
) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(/Checking Church Office server/i)).toBeHidden({ timeout: 30_000 });
  await expect(page.locator('#login-username')).toBeVisible({ timeout: 15_000 });
  await page.locator('#login-username').fill(username);
  await page.locator('#login-password').fill(password);
  await page.locator('#login-password').press('Enter');
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 25_000 });
  await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible({ timeout: 25_000 });
  if (!options?.skipAdminNav) {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });
  }
}

export async function loginAsAdmin(
  page: Page,
  user = process.env.E2E_USER ?? 'admin',
  pass = process.env.E2E_PASS ?? 'admin123',
) {
  await loginAsRole(page, user, pass);
}

/**
 * Attaches lightweight runtime-trust listeners for each test page.
 * Does not assert on console.error (too noisy across modules); focuses on
 * hard failures: uncaught exceptions, unhandled rejections, API 5xx, and failed /api requests.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    const pageErrors: string[] = [];
    const api5xx: { url: string; status: number }[] = [];
    const failedApi: string[] = [];

    await page.addInitScript(() => {
      (window as unknown as { __ucosRejections?: string[] }).__ucosRejections = [];
      window.addEventListener('unhandledrejection', (ev) => {
        const w = window as unknown as { __ucosRejections?: string[] };
        w.__ucosRejections = w.__ucosRejections ?? [];
        w.__ucosRejections.push(String((ev as PromiseRejectionEvent).reason));
      });
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    page.on('response', (res) => {
      const u = res.url();
      if (!u.includes('/api')) return;
      if (res.status() >= 500) api5xx.push({ url: u, status: res.status() });
    });

    page.on('requestfailed', (req) => {
      const u = req.url();
      if (!u.includes('/api')) return;
      const fail = req.failure()?.errorText ?? '';
      if (fail.includes('ERR_BLOCKED_BY_ORB')) return;
      if (fail.includes('ERR_ABORTED')) return;
      if (/\.(jpe?g|png|gif|webp|svg)(\?|$)/i.test(u)) return;
      failedApi.push(`${u} ${fail}`);
    });

    await use(page);

    const fromWindow = await page.evaluate(() => (window as unknown as { __ucosRejections?: string[] }).__ucosRejections ?? []);

    expect.soft(api5xx, `API 5xx responses: ${JSON.stringify(api5xx)}`).toHaveLength(0);
    expect.soft(failedApi, `Failed /api requests:\n${failedApi.join('\n')}`).toHaveLength(0);
    expect.soft(pageErrors, `pageerror:\n${pageErrors.join('\n')}`).toHaveLength(0);
    expect.soft(fromWindow, `unhandledrejection:\n${fromWindow.join('\n')}`).toHaveLength(0);
  },
});

export { expect } from '@playwright/test';
