import { test, expect, loginAsAdmin, loginAsRole, type Page } from './fixtures';

const DEMO_PASS = process.env.E2E_DEMO_PASS ?? 'demo123';

test.describe('HR operations — admin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('HR command center loads overview', async ({ page }) => {
    await page.getByTestId('nav-hr').click();
    await expect(page.getByRole('heading', { name: /HR & Staff/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Staff Operations', { exact: true })).toBeVisible();
  });

  test('leave policy settings API returns tenant defaults', async ({ page, request }) => {
    const auth = await page.evaluate(() => ({
      token: localStorage.getItem('auth_token') || '',
      tenantId: localStorage.getItem('auth_tenant_id') || 'default-tenant-id',
    }));
    const res = await request.get('http://127.0.0.1:4002/api/v1/hr/settings', {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'x-tenant-id': auth.tenantId,
      },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    const defaults = json?.data?.leaveDefaults ?? json?.data?.defaults;
    expect(defaults?.Annual ?? defaults?.annual).toBeDefined();
  });

  test('HR nav and workforce directory reachable', async ({ page }) => {
    await page.getByTestId('nav-workforce').click();
    await expect(page.getByRole('heading', { name: /HR & Staff/i })).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('nav-hr').click();
    await expect(page.getByRole('heading', { name: /HR & Staff/i })).toBeVisible();
  });

  test('self-service tab is visible', async ({ page }) => {
    await page.getByTestId('nav-hr').click();
    await page.getByRole('button', { name: /My Self-Service/i }).click();
    await expect(page.getByText(/Personal Portal|self-service|My /i).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe('HR operations — role visibility', () => {
  test('pastor sees HR but not payroll tab', async ({ page }) => {
    await loginAsRole(page, 'pastor', DEMO_PASS);
    await page.getByTestId('nav-hr').click();
    await expect(page.getByRole('heading', { name: /HR & Staff/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /Payroll & Payrun/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Leave Workflows/i })).toBeVisible();
  });

  test('finance sees payroll tab', async ({ page }) => {
    await loginAsRole(page, 'finance', DEMO_PASS);
    await page.getByTestId('nav-hr').click();
    await expect(page.getByRole('button', { name: /Payroll & Payrun/i })).toBeVisible({ timeout: 15_000 });
  });

  test('pastor cannot read payroll structures via API', async ({ page, request }) => {
    await loginAsRole(page, 'pastor', DEMO_PASS);
    const auth = await page.evaluate(() => ({
      token: localStorage.getItem('auth_token') || '',
      tenantId: localStorage.getItem('auth_tenant_id') || 'default-tenant-id',
    }));
    const res = await request.get('http://127.0.0.1:4002/api/v1/hr/payroll-structures', {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'x-tenant-id': auth.tenantId,
      },
    });
    expect(res.status()).toBe(403);
  });

  test('finance can read payroll structures via API', async ({ page, request }) => {
    await loginAsRole(page, 'finance', DEMO_PASS);
    const auth = await page.evaluate(() => ({
      token: localStorage.getItem('auth_token') || '',
      tenantId: localStorage.getItem('auth_tenant_id') || 'default-tenant-id',
    }));
    const res = await request.get('http://127.0.0.1:4002/api/v1/hr/payroll-structures', {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'x-tenant-id': auth.tenantId,
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('worship leader does not see HR nav', async ({ page }) => {
    await loginAsRole(page, 'worship', DEMO_PASS);
    await expect(page.getByTestId('nav-hr')).toHaveCount(0);
  });

  test('hradmin sees pipeline tab', async ({ page }) => {
    await loginAsRole(page, 'hradmin', DEMO_PASS);
    await page.getByTestId('nav-hr').click();
    await expect(page.getByRole('button', { name: /Pipeline & Onboard/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('pastor does not see pipeline tab', async ({ page }) => {
    await loginAsRole(page, 'pastor', DEMO_PASS);
    await page.getByTestId('nav-hr').click();
    await expect(page.getByRole('button', { name: /Pipeline & Onboard/i })).toHaveCount(0);
  });

  test('campus leader sees HR and leave approvals', async ({ page }) => {
    await loginAsRole(page, 'campus', DEMO_PASS);
    await page.getByTestId('nav-hr').click();
    await expect(page.getByRole('button', { name: /Leave Workflows/i })).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('HR operations — workflows (API)', () => {
  async function authHeaders(page: Page) {
    const auth = await page.evaluate(() => ({
      token: localStorage.getItem('auth_token') || '',
      tenantId: localStorage.getItem('auth_tenant_id') || 'default-tenant-id',
    }));
    return {
      Authorization: `Bearer ${auth.token}`,
      'x-tenant-id': auth.tenantId,
      'Content-Type': 'application/json',
    };
  }

  test('create and deny leave request', async ({ page, request }) => {
    await loginAsRole(page, 'hradmin', DEMO_PASS, { skipAdminNav: true });
    const headers = await authHeaders(page);
    const profiles = await request.get('http://127.0.0.1:4002/api/v1/hr/employment-profiles', { headers });
    const memberId = ((await profiles.json())?.data ?? [])[0]?.memberId;
    expect(memberId).toBeTruthy();
    const start = new Date();
    start.setDate(start.getDate() + 45);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const create = await request.post('http://127.0.0.1:4002/api/v1/hr/leave-requests', {
      headers,
      data: {
        memberId,
        leaveType: 'Sick',
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        reason: 'E2E leave workflow',
      },
    });
    expect(create.ok()).toBeTruthy();
    const created = await create.json();
    const id = created?.data?.id;
    expect(id).toBeTruthy();
    const deny = await request.patch(`http://127.0.0.1:4002/api/v1/hr/leave-requests/${id}`, {
      headers,
      data: { status: 'Rejected', notes: 'E2E deny' },
    });
    expect(deny.ok()).toBeTruthy();
    const denied = await deny.json();
    expect(denied?.data?.status ?? denied?.status).toBeTruthy();
  });

  test('create reimbursement request', async ({ page, request }) => {
    await loginAsRole(page, 'hradmin', DEMO_PASS);
    const headers = await authHeaders(page);
    const profiles = await request.get('http://127.0.0.1:4002/api/v1/hr/employment-profiles', { headers });
    const memberId = ((await profiles.json())?.data ?? [])[0]?.memberId;
    const res = await request.post('http://127.0.0.1:4002/api/v1/hr/reimbursements', {
      headers,
      data: { memberId, amount: 99, category: 'Ministry', description: 'E2E reimbursement' },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('leave conflict scanner returns structured report', async ({ page, request }) => {
    await loginAsAdmin(page);
    const auth = await page.evaluate(() => ({
      token: localStorage.getItem('auth_token') || '',
      tenantId: localStorage.getItem('auth_tenant_id') || 'default-tenant-id',
    }));
    const members = await request.get('http://127.0.0.1:4002/api/v1/members?limit=5', {
      headers: { Authorization: `Bearer ${auth.token}`, 'x-tenant-id': auth.tenantId },
    });
    const list = (await members.json())?.data ?? [];
    const memberId = list[0]?.id;
    if (!memberId) return;
    const res = await request.get(
      `http://127.0.0.1:4002/api/v1/hr/leave-requests/conflicts?memberId=${memberId}&startDate=2026-07-01&endDate=2026-07-05`,
      { headers: { Authorization: `Bearer ${auth.token}`, 'x-tenant-id': auth.tenantId } },
    );
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json?.data?.hasConflict).toBeDefined();
  });
});
