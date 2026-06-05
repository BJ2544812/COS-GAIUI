import { test, expect, loginAsAdmin } from './fixtures';

function assertAllUseApiV1(urls: string[]) {
  for (const u of urls) {
    expect(u, `ERP call must use /api/v1/: ${u}`).toMatch(/\/api\/v1\//);
  }
}

test.describe('Finance document registry (integration)', () => {
  test('finance desk API calls use /api/v1 only', async ({ page }) => {
    const apiUrls: string[] = [];
    page.on('request', (req) => {
      const u = req.url();
      if (/\/api\//.test(u) && !/cashfree|razorpay/i.test(u)) apiUrls.push(u);
    });
    await loginAsAdmin(page);
    await page.getByTestId('nav-finance').click();
    await page.getByRole('main').getByRole('button', { name: 'Receipts', exact: true }).click();
    await expect(page.getByText(/Donation receipts/i)).toBeVisible({ timeout: 15_000 });
    await page.waitForResponse(
      (r) => r.url().includes('/api/v1/finance/receipts') && r.status() === 200,
      { timeout: 25_000 },
    ).catch(() => null);
    for (const tab of ['Document Registry', 'Vouchers', 'Reconciliation'] as const) {
      await page.getByRole('main').getByRole('button', { name: tab, exact: true }).click();
      await page.waitForTimeout(600);
    }
    assertAllUseApiV1(apiUrls);
    expect(
      apiUrls.some((u) => /\/api\/v1\/finance\/(receipts|documents)/.test(u)),
      `expected finance receipts/registry calls, got: ${apiUrls.join(', ')}`,
    ).toBeTruthy();
  });

  test('document registry loads without API route errors', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId('nav-finance').click();
    await expect(page.getByRole('heading', { name: 'Finance', exact: true })).toBeVisible();

    await page.getByRole('main').getByRole('button', { name: 'Document Registry', exact: true }).click();
    await expect(page.getByText(/Search, preview, print, and download official PDFs/i)).toBeVisible();

    await expect(page.getByText(/API route not found/i)).toHaveCount(0, { timeout: 20_000 });

    const loading = page.getByText('Loading document registry');
    if (await loading.count()) {
      await expect(loading).toBeHidden({ timeout: 25_000 });
    }

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.getByText('No documents found').count();
    expect(hasTable > 0 || hasEmpty > 0).toBeTruthy();
  });

  test('receipts tab loads without API route errors', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId('nav-finance').click();
    await page.getByRole('main').getByRole('button', { name: 'Receipts', exact: true }).click();
    await expect(page.getByText(/Donation receipts/i)).toBeVisible();
    await expect(page.getByText(/API route not found/i)).toHaveCount(0, { timeout: 20_000 });
    const loading = page.getByText('Loading document registry');
    if (await loading.count()) await expect(loading).toBeHidden({ timeout: 25_000 });
  });

  test('registry preview action does not surface route-not-found', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId('nav-finance').click();
    await page.getByRole('main').getByRole('button', { name: 'Document Registry', exact: true }).click();
    await expect(page.getByText(/API route not found/i)).toHaveCount(0);

    const previewBtn = page.getByRole('button', { name: 'Preview' }).first();
    if (await previewBtn.count()) {
      await previewBtn.click();
      await expect(page.getByText(/API route not found/i)).toHaveCount(0);
    }
  });
});
