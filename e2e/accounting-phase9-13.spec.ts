import { test, expect, loginAsAdmin } from './fixtures';

test.describe('Accounting Phases 9-13 payroll assets approvals exports', () => {
  test('runs payroll, asset workflow, approvals, and CA export endpoints', async ({ page }) => {
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

    const [accountsRes, membersRes] = await Promise.all([
      apiCall('GET', 'finance/accounts'),
      apiCall('GET', 'members'),
    ]);
    expect(accountsRes.ok).toBeTruthy();
    expect(membersRes.ok).toBeTruthy();
    const accounts = ((accountsRes.json as any)?.data ?? []) as any[];
    const membersPayload = (membersRes.json as any)?.data;
    const members = (Array.isArray(membersPayload) ? membersPayload : membersPayload?.members ?? []) as any[];
    const bank = accounts.find((a) => a.type === 'Asset' && a.isActive);
    const expense = accounts.find((a) => a.type === 'Expense' && a.isActive);
    const liability = accounts.find((a) => a.type === 'Liability' && a.isActive);
    expect(bank?.id).toBeTruthy();
    expect(expense?.id).toBeTruthy();
    expect(liability?.id).toBeTruthy();
    if (!members.length) {
      const createdMemberRes = await apiCall('POST', 'members', {
        name: `Payroll Member ${Date.now()}`,
        status: 'Active',
      });
      expect(createdMemberRes.status).toBe(201);
      const createdMember = (createdMemberRes.json as any)?.data;
      members.push(createdMember);
    }

    const payrollPeriodYear = 2100 + (Date.now() % 200);
    const payrollPeriodMonth = (Math.floor(Date.now() / 1000) % 12) + 1;

    const payrollRunRes = await apiCall('POST', 'finance/payroll/runs', {
      periodYear: payrollPeriodYear,
      periodMonth: payrollPeriodMonth,
      lines: [
        {
          memberId: members[0].id,
          grossAmount: 25000,
          deductionAmount: 2000,
          salaryExpenseAccountId: expense.id,
          payrollPayableAccountId: liability.id,
        },
      ],
    });
    expect(payrollRunRes.status).toBe(201);
    const payrollRun = (payrollRunRes.json as any)?.data;
    expect(payrollRun?.id).toBeTruthy();
    expect(payrollRun?.payableVoucherId).toBeTruthy();

    const payRunRes = await apiCall('POST', `finance/payroll/runs/${payrollRun.id}/pay`, {
      paymentAccountId: bank.id,
      paymentDate: new Date().toISOString(),
    });
    expect(payRunRes.ok).toBeTruthy();
    const paidRun = (payRunRes.json as any)?.data;
    expect(paidRun?.paymentVoucherId).toBeTruthy();

    const payslipId = payrollRun?.lines?.[0]?.id as string;
    const payslipRes = await apiCall('GET', `finance/payroll/payslips/${encodeURIComponent(payslipId)}`);
    expect(payslipRes.ok).toBeTruthy();
    expect((payslipRes.json as any)?.data?.payslipNo).toBeTruthy();

    const fixedAssetAccRes = await apiCall('POST', 'finance/accounts', {
      code: `FA${Date.now().toString().slice(-6)}`,
      name: `Fixed Asset ${Date.now()}`,
      type: 'Asset',
    });
    expect(fixedAssetAccRes.status).toBe(201);
    const fixedAssetAccount = (fixedAssetAccRes.json as any)?.data;

    const accumDepAccRes = await apiCall('POST', 'finance/accounts', {
      code: `AD${Date.now().toString().slice(-6)}`,
      name: `Accumulated Depreciation ${Date.now()}`,
      type: 'Liability',
    });
    expect(accumDepAccRes.status).toBe(201);
    const accumDep = (accumDepAccRes.json as any)?.data;

    const gainLossAccRes = await apiCall('POST', 'finance/accounts', {
      code: `GL${Date.now().toString().slice(-6)}`,
      name: `Asset Gain Loss ${Date.now()}`,
      type: 'Expense',
    });
    expect(gainLossAccRes.status).toBe(201);
    const gainLoss = (gainLossAccRes.json as any)?.data;

    const assetRes = await apiCall('POST', 'assets', {
      name: `Laptop ${Date.now()}`,
      value: 60000,
      purchaseDate: new Date().toISOString(),
    });
    expect(assetRes.status).toBe(201);
    const asset = (assetRes.json as any)?.data;
    expect(asset?.id).toBeTruthy();

    const capitalizeRes = await apiCall('POST', `finance/assets/${asset.id}/capitalize`, {
      fixedAssetAccountId: fixedAssetAccount.id,
      paymentAccountId: bank.id,
      value: 60000,
      usefulLifeMonths: 60,
      residualValue: 0,
      purchaseDate: new Date().toISOString(),
    });
    expect(capitalizeRes.ok).toBeTruthy();

    const depRunRes = await apiCall('POST', 'finance/assets/depreciation/run', {
      depreciationExpenseAccountId: expense.id,
      accumulatedDepreciationAccountId: accumDep.id,
      asOfDate: new Date().toISOString(),
      assetIds: [asset.id],
    });
    expect(depRunRes.ok).toBeTruthy();
    expect((depRunRes.json as any)?.data?.posted).toBeTruthy();

    const disposeRes = await apiCall('POST', `finance/assets/${asset.id}/dispose`, {
      fixedAssetAccountId: fixedAssetAccount.id,
      accumulatedDepreciationAccountId: accumDep.id,
      receiptAccountId: bank.id,
      gainLossAccountId: gainLoss.id,
      proceedsAmount: 50000,
      disposalDate: new Date().toISOString(),
    });
    expect(disposeRes.ok).toBeTruthy();
    expect((disposeRes.json as any)?.data?.status).toBe('Disposed');

    const ruleRes = await apiCall('POST', 'finance/approvals/rules', {
      entityType: 'Voucher',
      minAmount: 10000,
      level: 1,
      moduleKey: 'finance',
    });
    expect(ruleRes.status).toBe(201);

    const submitReqRes = await apiCall('POST', 'finance/approvals/requests', {
      entityType: 'Voucher',
      entityId: payrollRun.payableVoucherId,
      amount: 23000,
      moduleKey: 'finance',
    });
    expect(submitReqRes.status).toBe(201);
    const approvalRequest = (submitReqRes.json as any)?.data;

    const queueRes = await apiCall('GET', 'finance/approvals/queue');
    expect(queueRes.ok).toBeTruthy();

    const decideRes = await apiCall('POST', `finance/approvals/requests/${approvalRequest.id}/decide`, {
      decision: 'Approved',
      notes: 'Approved in E2E',
    });
    expect(decideRes.ok).toBeTruthy();
    expect((decideRes.json as any)?.data?.status).toBe('Approved');

    const exportRes = await apiCall('POST', 'finance/ca-exports', {
      type: 'trial_balance',
    });
    expect(exportRes.ok).toBeTruthy();
    expect((exportRes.json as any)?.data?.checksumSha256).toBeTruthy();
  });
});

