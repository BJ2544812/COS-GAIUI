import { test, expect, loginAsAdmin } from './fixtures';

test.describe('Accounting Phase 6 budgeting and event accounting', () => {
  test('creates budget and posts event accounting voucher', async ({ page }) => {
    await loginAsAdmin(page);

    const apiCall = async (
      method: 'GET' | 'POST',
      path: string,
      body?: Record<string, unknown>,
      publicRoute = false
    ) =>
      page.evaluate(
        async ({ method, path, body, publicRoute }) => {
          const token = localStorage.getItem('auth_token');
          const tenantId = localStorage.getItem('auth_tenant_id') || 'default-tenant-id';
          const res = await fetch(`/api/v1/${path}`, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-id': tenantId,
              ...(!publicRoute && token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
          });
          const json = await res.json().catch(() => null);
          return { ok: res.ok, status: res.status, json };
        },
        { method, path, body: body ?? null, publicRoute },
      );

    const fundsRes = await apiCall('GET', 'finance/funds');
    expect(fundsRes.ok).toBeTruthy();
    let fund = ((fundsRes.json as any)?.data ?? [])[0];
    if (!fund) {
      const createdFund = await apiCall('POST', 'finance/funds', {
        name: `Phase6 Fund ${Date.now()}`,
        type: 'Restricted',
      });
      expect(createdFund.status).toBe(201);
      fund = (createdFund.json as any)?.data;
    }

    const budgetRes = await apiCall('POST', 'finance/budgets', {
      fundId: fund.id,
      amount: 5000,
      trackingMode: 'SOFT',
    });
    expect(budgetRes.status).toBe(201);

    const vsActualRes = await apiCall('GET', 'finance/budgets/vs-actual');
    expect(vsActualRes.ok).toBeTruthy();
    const rows = (vsActualRes.json as any)?.data?.rows ?? [];
    expect(rows.length).toBeGreaterThan(0);

    const accountsRes = await apiCall('GET', 'finance/accounts');
    expect(accountsRes.ok).toBeTruthy();
    const accounts = ((accountsRes.json as any)?.data ?? []) as any[];
    const expense = accounts.find((a) => a.type === 'Expense' && a.isActive);
    const asset = accounts.find((a) => a.type === 'Asset' && a.isActive);
    expect(expense?.id).toBeTruthy();
    expect(asset?.id).toBeTruthy();

    const eventsRes = await apiCall('GET', 'website/public/events', undefined, true);
    expect(eventsRes.ok).toBeTruthy();
    const event = ((eventsRes.json as any)?.data ?? [])[0];
    expect(event?.id).toBeTruthy();

    const postEvent = await apiCall('POST', `finance/events/${event.id}/accounting`, {
      amount: 750,
      debitAccountId: expense.id,
      creditAccountId: asset.id,
      description: 'Event expense booking',
    });
    expect(postEvent.status).toBe(201);
    expect((postEvent.json as any)?.data?.status).toBe('posted');

    const statementRes = await apiCall('GET', `finance/events/${event.id}/accounting-statement`);
    expect(statementRes.ok).toBeTruthy();
    expect(((statementRes.json as any)?.data?.vouchers ?? []).length).toBeGreaterThan(0);
  });
});

