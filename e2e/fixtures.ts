import { test as base, expect } from '@playwright/test';

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
