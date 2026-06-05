import { test, expect, loginAsAdmin } from './fixtures';

test.describe('Accounting Phase 2 fund integrity', () => {
  test('donation fund linkage, inter-fund transfer, and reversal flow', async ({ page }) => {
    await loginAsAdmin(page);

    const apiCall = async (
      method: 'GET' | 'POST' | 'PATCH',
      path: string,
      body?: Record<string, unknown>,
    ) => {
      return page.evaluate(
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
          const raw = await res.text();
          let json: unknown = null;
          try {
            json = raw ? JSON.parse(raw) : null;
          } catch {
            json = raw;
          }
          return { ok: res.ok, status: res.status, json };
        },
        { method, path, body: body ?? null },
      );
    };

    const fundsRes = await apiCall('GET', 'finance/funds');
    expect(fundsRes.ok).toBeTruthy();
    const funds = Array.isArray((fundsRes.json as any)?.data) ? (fundsRes.json as any).data : [];

    const mkFund = async (name: string, type: string) => {
      const existing = funds.find((f: any) => f.name === name);
      if (existing) return existing;
      const created = await apiCall('POST', 'finance/funds', { name, type });
      expect(created.status).toBe(201);
      return (created.json as any).data;
    };

    const buildingFund = await mkFund(`Building Fund E2E ${Date.now()}`, 'Restricted');
    const missionsFund = await mkFund(`Missions Fund E2E ${Date.now()}`, 'BoardDesignated');

    const accountsRes = await apiCall('GET', 'finance/accounts');
    expect(accountsRes.ok).toBeTruthy();
    const accounts = Array.isArray((accountsRes.json as any)?.data) ? (accountsRes.json as any).data : [];
    const debit = accounts.find((a: any) => a.type === 'Asset' && a.isActive);
    const credit = accounts.find((a: any) => a.type === 'Revenue' && a.isActive);
    expect(debit?.id).toBeTruthy();
    expect(credit?.id).toBeTruthy();

    const ref = `PH2-${Date.now()}`;
    const donationRes = await apiCall('POST', 'giving/donations', {
      amount: 2500,
      method: 'Bank Transfer',
      date: new Date().toISOString(),
      reference: ref,
      fundId: buildingFund.id,
      debitAccountId: debit.id,
      creditAccountId: credit.id,
    });
    expect(donationRes.status).toBe(201);
    const donation = (donationRes.json as any)?.data;
    expect(donation?.id).toBeTruthy();
    expect(donation?.voucherId).toBeTruthy();
    expect(donation?.fundId).toBe(buildingFund.id);

    const duplicateRefRes = await apiCall('POST', 'giving/donations', {
      amount: 2500,
      method: 'Bank Transfer',
      date: new Date().toISOString(),
      reference: ref,
      fundId: buildingFund.id,
      debitAccountId: debit.id,
      creditAccountId: credit.id,
    });
    expect(duplicateRefRes.status).toBe(201);
    expect((duplicateRefRes.json as any)?.data?.id).toBe(donation.id);

    const stmtRes = await apiCall('GET', `finance/funds/${buildingFund.id}/statement`);
    expect(stmtRes.ok).toBeTruthy();
    const stmt = (stmtRes.json as any)?.data;
    expect(stmt?.receipts).toBeGreaterThanOrEqual(2500);

    const transferRes = await apiCall('POST', 'finance/fund-transfers', {
      fromFundId: buildingFund.id,
      toFundId: missionsFund.id,
      amount: 500,
      transferAccountId: debit.id,
      date: new Date().toISOString(),
      description: 'Inter-fund transfer test',
    });
    expect(transferRes.status).toBe(201);
    expect((transferRes.json as any)?.data?.status).toBe('posted');

    const reverseRes = await apiCall('POST', `giving/donations/${donation.id}/reverse`);
    expect(reverseRes.status).toBe(200);
    expect((reverseRes.json as any)?.data?.reversalVoucherId).toBeTruthy();

    const reconRes = await apiCall('GET', 'giving/donations/reconciliation');
    expect(reconRes.ok).toBeTruthy();
    const rows = (reconRes.json as any)?.data?.rows ?? [];
    const row = rows.find((r: any) => r.donationId === donation.id);
    expect(row?.status).toBe('Reversed');
  });
});

