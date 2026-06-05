import { test, expect, loginAsAdmin } from './fixtures';

test.describe('Accounting Phase 7 bank reconciliation baseline', () => {
  test('creates reconciliation session, imports statement lines, and auto-matches vouchers', async ({ page }) => {
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
    const asset = accounts.find((a) => a.type === 'Asset' && a.isActive);
    const revenue = accounts.find((a) => a.type === 'Revenue' && a.isActive);
    expect(asset?.id).toBeTruthy();
    expect(revenue?.id).toBeTruthy();

    const amount = 611;
    const donationRes = await apiCall('POST', 'giving/donations', {
      amount,
      method: 'Bank Transfer',
      date: new Date().toISOString(),
      reference: `PH7-${Date.now()}`,
      debitAccountId: asset.id,
      creditAccountId: revenue.id,
    });
    expect(donationRes.status).toBe(201);

    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 2);
    const to = new Date(now);
    to.setDate(to.getDate() + 2);

    const sessionRes = await apiCall('POST', 'finance/bank-reconciliation/sessions', {
      accountId: asset.id,
      fromDate: from.toISOString(),
      toDate: to.toISOString(),
    });
    expect(sessionRes.status).toBe(201);
    const session = (sessionRes.json as any)?.data;
    expect(session?.id).toBeTruthy();

    const importRes = await apiCall('POST', `finance/bank-reconciliation/sessions/${session.id}/lines`, {
      lines: [
        {
          txnDate: now.toISOString(),
          amount,
          direction: 'Credit',
          reference: `BANK-${Date.now()}`,
          description: 'Bank credit line',
        },
      ],
    });
    expect(importRes.status).toBe(201);

    const autoRes = await apiCall('POST', `finance/bank-reconciliation/sessions/${session.id}/auto-match`);
    expect(autoRes.ok).toBeTruthy();
    const totals = (autoRes.json as any)?.data?.totals;
    expect((totals?.matchedLines ?? 0)).toBeGreaterThanOrEqual(1);
  });
});

