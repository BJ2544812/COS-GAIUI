import { test, expect } from './fixtures';

const USER = process.env.E2E_USER ?? 'admin';
const PASS = process.env.E2E_PASS ?? 'admin123';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.locator('#login-username').fill(USER);
  await page.locator('#login-password').fill(PASS);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 25_000 });
  await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible({ timeout: 25_000 });
}

async function navigateBySidebar(page: import('@playwright/test').Page, navId: string, groupHint?: string) {
  let item = page.getByTestId(navId);
  if ((await item.count()) === 0 && groupHint) {
    const groupButton = page.getByRole('button', { name: new RegExp(`^${groupHint}$`, 'i') }).first();
    if (await groupButton.count()) {
      await groupButton.click();
    }
    item = page.getByTestId(navId);
  }
  await expect(item).toBeVisible();
  await item.scrollIntoViewIfNeeded();
  await item.click();
  await expect(page.getByRole('main').first()).toBeVisible();
}

test.describe('Frontend operational QA and stability', () => {
  test('priority modules are operational from UI with tabs/actions responsive', async ({ page }) => {
    test.setTimeout(180_000);
    await login(page);

    await navigateBySidebar(page, 'nav-dashboard', 'Insights');
    await navigateBySidebar(page, 'nav-members', 'Identity');
    await navigateBySidebar(page, 'nav-families', 'Identity');
    await navigateBySidebar(page, 'nav-volunteers', 'Identity');
    await navigateBySidebar(page, 'nav-structure', 'Operations');
    await navigateBySidebar(page, 'nav-giving', 'Finance');
    await navigateBySidebar(page, 'nav-finance', 'Finance');
    await navigateBySidebar(page, 'nav-budgets', 'Finance');
    await navigateBySidebar(page, 'nav-vendors', 'Finance');
    await navigateBySidebar(page, 'nav-assets', 'Finance');
    await navigateBySidebar(page, 'nav-audit-logs', 'Insights');
    await navigateBySidebar(page, 'nav-events', 'Operations');
    await navigateBySidebar(page, 'nav-website', 'Website');
    await navigateBySidebar(page, 'nav-settings', 'Platform');

    await navigateBySidebar(page, 'nav-dashboard', 'Insights');
    const dashboardMain = page.getByRole('main').first();
    const executive = dashboardMain.getByRole('button', { name: 'Executive' });
    if (await executive.count()) await executive.click();
    const financeLens = dashboardMain.getByRole('button', { name: 'Finance' });
    if (await financeLens.count()) await financeLens.click();

    await navigateBySidebar(page, 'nav-members', 'Identity');
    const memberSearch = page.getByPlaceholder('Search by name, email, or phone...');
    if (await memberSearch.count()) {
      await memberSearch.fill('test');
      await memberSearch.clear();
    }

    await navigateBySidebar(page, 'nav-giving', 'Finance');
    for (const label of ['Overview', 'All gifts', 'Donors', 'Campaigns']) {
      const tab = page.getByRole('button', { name: label });
      if (await tab.count()) await tab.click();
    }

    await navigateBySidebar(page, 'nav-finance', 'Finance');
    const financeMain = page.getByRole('main').first();
    for (const label of ['Dashboard', 'Vouchers', 'Receipts', 'Settlements', 'Document Registry']) {
      const tab = financeMain.getByRole('button', { name: label, exact: true });
      if (await tab.count()) await tab.click();
    }
    const resetFilters = page.getByRole('button', { name: 'Reset Filters' });
    if (await resetFilters.count()) await resetFilters.click();

    await navigateBySidebar(page, 'nav-budgets', 'Finance');
    for (const label of ['Fund Dashboard', 'Budget Workspace', 'Event Finance']) {
      const tab = page.getByRole('button', { name: label });
      if (await tab.count()) await tab.click();
    }

    await navigateBySidebar(page, 'nav-vendors', 'Finance');
    for (const label of ['Vendor Workspace', 'Payables Center', 'Payroll Workspace']) {
      const tab = page.getByRole('button', { name: label });
      if (await tab.count()) await tab.click();
    }

    await navigateBySidebar(page, 'nav-assets', 'Finance');
    const docsTab = page.getByRole('main').getByRole('button', { name: 'Documents', exact: true }).first();
    if (await docsTab.count()) await docsTab.click();
    const assetsTab = page.getByRole('button', { name: 'Physical Assets' });
    if (await assetsTab.count()) await assetsTab.click();

    await navigateBySidebar(page, 'nav-audit-logs', 'Insights');
    const auditSearch = page.getByPlaceholder('Search logs...');
    if (await auditSearch.count()) {
      await auditSearch.fill('voucher');
      await auditSearch.clear();
    }

    await navigateBySidebar(page, 'nav-events', 'Operations');
    for (const label of ['Events', 'Service Planning']) {
      const tab = page.getByRole('main').getByRole('button', { name: label, exact: true }).first();
      if (await tab.count()) await tab.click();
    }

    await page.reload();
    await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible({ timeout: 20_000 });
  });

  test('dashboard surfaces timeout/network degradation and recovers with retry', async ({ page }) => {
    let blockMembersAnalytics = true;
    await page.route('**/api/v1/analytics/members**', async (route) => {
      if (blockMembersAnalytics) {
        return route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'error',
            error: 'Forbidden for test',
          }),
        });
      }
      return route.continue();
    });

    await login(page);
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByText(/Some dashboard panels are unavailable/i)).toBeVisible({ timeout: 30_000 });

    blockMembersAnalytics = false;
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByText(/Some dashboard panels are unavailable/i)).toBeHidden({ timeout: 30_000 });
  });

  test('public website and auth surfaces remain operational', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('body')).toContainText(/home|about|ministries|sermons|events|giving/i);
    const loginLink = page.getByRole('link', { name: /login/i }).first();
    if (await loginLink.count()) {
      await loginLink.click();
    } else {
      await page.goto('/login');
    }
    await expect(page.getByRole('heading', { name: 'Staff Access' })).toBeVisible();
  });
});

