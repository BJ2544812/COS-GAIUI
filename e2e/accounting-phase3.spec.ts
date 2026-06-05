import { test, expect, loginAsAdmin } from './fixtures';

test.describe('Accounting Phase 3 receipt infrastructure', () => {
  test('donation creates financial receipt and supports regeneration', async ({ page }) => {
    await loginAsAdmin(page);

    const apiCall = async (
      method: 'GET' | 'POST',
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

    const accountsRes = await apiCall('GET', 'finance/accounts');
    expect(accountsRes.ok).toBeTruthy();
    const accounts = ((accountsRes.json as any)?.data ?? []) as any[];
    const debit = accounts.find((a) => a.type === 'Asset' && a.isActive);
    const credit = accounts.find((a) => a.type === 'Revenue' && a.isActive);
    expect(debit?.id).toBeTruthy();
    expect(credit?.id).toBeTruthy();

    const donationRes = await apiCall('POST', 'giving/donations', {
      amount: 999,
      method: 'Bank Transfer',
      date: new Date().toISOString(),
      reference: `PH3-${Date.now()}`,
      debitAccountId: debit.id,
      creditAccountId: credit.id,
    });
    expect(donationRes.status).toBe(201);
    const donation = (donationRes.json as any)?.data;
    expect(donation?.id).toBeTruthy();

    const receiptRes = await apiCall('GET', `giving/donations/${donation.id}/receipt`);
    expect(receiptRes.ok).toBeTruthy();
    const receipt = (receiptRes.json as any)?.data;
    expect(String(receipt?.receiptNo || '')).toContain('RCP-');
    expect(String(receipt?.pdfUrl || '')).toContain('/uploads/receipts/');

    const regenRes = await apiCall('POST', `giving/donations/${donation.id}/receipt/regenerate`);
    expect(regenRes.ok).toBeTruthy();
    const regenerated = (regenRes.json as any)?.data;
    expect(regenerated?.id).toBe(receipt?.id);
    expect((regenerated?.regeneratedCount ?? 0)).toBeGreaterThanOrEqual(1);
  });
});

