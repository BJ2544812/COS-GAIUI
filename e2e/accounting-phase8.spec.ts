import { test, expect, loginAsAdmin } from './fixtures';

test.describe('Accounting Phase 8 petty cash and reimbursements', () => {
  test('records petty cash top-up and reimbursement with summary', async ({ page }) => {
    await loginAsAdmin(page);

    const apiCall = async (
      method: 'GET' | 'POST',
      path: string,
      body?: Record<string, unknown>,
    ) =>
      page.evaluate(
        async ({ method, path, body }) => {
          const token = localStorage.getItem('auth_token');
          const tenantId = localStorage.getItem('auth_tenant_id') || 'default-tenant-id';
          const res = await fetch(`/api/v1/${path}`, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-id': tenantId,
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
          });
          const json = await res.json().catch(() => null);
          return { ok: res.ok, status: res.status, json };
        },
        { method, path, body: body ?? null },
      );

    const accountsRes = await apiCall('GET', 'finance/accounts');
    expect(accountsRes.ok).toBeTruthy();
    const accounts = ((accountsRes.json as any)?.data ?? []) as any[];
    const bank = accounts.find((a) => a.type === 'Asset' && a.isActive);
    const expense = accounts.find((a) => a.type === 'Expense' && a.isActive);
    expect(bank?.id).toBeTruthy();
    expect(expense?.id).toBeTruthy();

    const createPetty = await apiCall('POST', 'finance/accounts', {
      code: `PC${Date.now().toString().slice(-6)}`,
      name: `Petty Cash ${Date.now()}`,
      type: 'Asset',
    });
    expect(createPetty.status).toBe(201);
    const petty = (createPetty.json as any)?.data;
    expect(petty?.id).toBeTruthy();

    const topupRes = await apiCall('POST', 'finance/petty-cash/topups', {
      amount: 1200,
      fromAccountId: bank.id,
      pettyCashAccountId: petty.id,
      description: 'Initial petty cash',
    });
    expect(topupRes.status).toBe(201);
    expect((topupRes.json as any)?.data?.status).toBe('posted');

    const reimburseRes = await apiCall('POST', 'finance/petty-cash/reimbursements', {
      amount: 300,
      expenseAccountId: expense.id,
      pettyCashAccountId: petty.id,
      description: 'Local transport reimbursement',
    });
    expect(reimburseRes.status).toBe(201);
    expect((reimburseRes.json as any)?.data?.status).toBe('posted');

    const summaryRes = await apiCall('GET', `finance/petty-cash/summary?accountId=${encodeURIComponent(petty.id)}`);
    expect(summaryRes.ok).toBeTruthy();
    const summary = (summaryRes.json as any)?.data;
    expect((summary?.inflow ?? 0)).toBeGreaterThanOrEqual(1200);
    expect((summary?.outflow ?? 0)).toBeGreaterThanOrEqual(300);
    expect((summary?.closingBalance ?? 0)).toBeGreaterThan(0);
  });
});

