import { test, expect, loginAsAdmin } from './fixtures';

test.describe('Accounting Phase 5 vendor/payables workflow', () => {
  test('creates vendor bill and settles payable with payment voucher', async ({ page }) => {
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
    const expense = accounts.find((a) => a.type === 'Expense' && a.isActive);
    let payable = accounts.find((a) => a.type === 'Liability' && a.isActive);
    const paymentAsset = accounts.find((a) => a.type === 'Asset' && a.isActive);
    if (!payable) {
      const createPayable = await apiCall('POST', 'finance/accounts', {
        code: `LIAB${Date.now().toString().slice(-6)}`,
        name: 'Accounts Payable - E2E',
        type: 'Liability',
      });
      expect(createPayable.status).toBe(201);
      payable = (createPayable.json as any)?.data;
    }
    expect(expense?.id).toBeTruthy();
    expect(payable?.id).toBeTruthy();
    expect(paymentAsset?.id).toBeTruthy();

    const vendorRes = await apiCall('POST', 'finance/vendors', {
      name: `Vendor ${Date.now()}`,
      email: 'vendor@example.com',
      phone: '9999999999',
    });
    expect(vendorRes.status).toBe(201);
    const vendor = (vendorRes.json as any)?.data;
    expect(vendor?.id).toBeTruthy();

    const billNo = `BILL-${Date.now()}`;
    const billRes = await apiCall('POST', 'finance/payables/bills', {
      vendorId: vendor.id,
      billNo,
      billDate: new Date().toISOString(),
      amount: 1400,
      expenseAccountId: expense.id,
      payableAccountId: payable.id,
      description: 'Test office supplies bill',
    });
    expect(billRes.status).toBe(201);
    const bill = (billRes.json as any)?.data;
    expect(bill?.id).toBeTruthy();
    expect(bill?.billVoucherId).toBeTruthy();

    const paymentRes = await apiCall('POST', 'finance/payables/payments', {
      billId: bill.id,
      paymentDate: new Date().toISOString(),
      amount: 1400,
      paymentAccountId: paymentAsset.id,
      notes: 'Settled fully',
    });
    expect(paymentRes.status).toBe(201);
    const payment = (paymentRes.json as any)?.data;
    expect(payment?.id).toBeTruthy();
    expect(payment?.paymentVoucherId).toBeTruthy();

    const billsRes = await apiCall('GET', 'finance/payables/bills');
    expect(billsRes.ok).toBeTruthy();
    const updated = ((billsRes.json as any)?.data ?? []).find((b: any) => b.id === bill.id);
    expect(updated?.status).toBe('Paid');
    expect(Number(updated?.outstanding ?? -1)).toBe(0);
  });
});

