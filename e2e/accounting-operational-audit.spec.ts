import { test, expect, loginAsAdmin } from './fixtures';

type ApiResult = { ok: boolean; status: number; json: any };

test.describe('ERP hardening operational audit', () => {
  test('real-world church accounting scenarios reconcile safely', async ({ page }) => {
    await loginAsAdmin(page);

    const apiCall = async (
      method: 'GET' | 'POST' | 'PATCH',
      path: string,
      body?: Record<string, unknown>,
    ): Promise<ApiResult> =>
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

    const trialBeforeRes = await apiCall('GET', 'finance/trial-balance');
    expect(trialBeforeRes.ok).toBeTruthy();
    const trialDiffBefore = Number((trialBeforeRes.json as any)?.data?.totals?.difference ?? 0);

    const accountsRes = await apiCall('GET', 'finance/accounts');
    expect(accountsRes.ok).toBeTruthy();
    const accounts = ((accountsRes.json as any)?.data ?? []) as any[];
    const asset = accounts.find((a) => a.type === 'Asset' && a.isActive);
    const revenue = accounts.find((a) => a.type === 'Revenue' && a.isActive);
    const expense = accounts.find((a) => a.type === 'Expense' && a.isActive);
    const liability = accounts.find((a) => a.type === 'Liability' && a.isActive);
    expect(asset?.id).toBeTruthy();
    expect(revenue?.id).toBeTruthy();
    expect(expense?.id).toBeTruthy();
    expect(liability?.id).toBeTruthy();

    // 1,2: Sunday offering + online donation
    const sundayRef = `SUN-${Date.now()}`;
    const onlineRef = `ONL-${Date.now()}`;
    const sunday = await apiCall('POST', 'giving/donations', {
      amount: 5200,
      method: 'Cash',
      date: new Date().toISOString(),
      reference: sundayRef,
      debitAccountId: asset.id,
      creditAccountId: revenue.id,
    });
    const online = await apiCall('POST', 'giving/donations', {
      amount: 8400,
      method: 'Bank Transfer',
      date: new Date().toISOString(),
      reference: onlineRef,
      debitAccountId: asset.id,
      creditAccountId: revenue.id,
    });
    expect(sunday.status).toBe(201);
    expect(online.status).toBe(201);
    const sundayDonation = (sunday.json as any)?.data;
    const onlineDonation = (online.json as any)?.data;
    expect(sundayDonation?.voucherId).toBeTruthy();
    expect(onlineDonation?.voucherId).toBeTruthy();

    // 3,4: restricted mission + building funds
    const fundsRes = await apiCall('GET', 'finance/funds');
    expect(fundsRes.ok).toBeTruthy();
    const funds = ((fundsRes.json as any)?.data ?? []) as any[];
    const mkFund = async (name: string, type: string) => {
      const ex = funds.find((f: any) => f.name === name);
      if (ex) return ex;
      const created = await apiCall('POST', 'finance/funds', { name, type });
      expect(created.status).toBe(201);
      return (created.json as any)?.data;
    };
    const missionFund = await mkFund(`Mission Restricted ${Date.now()}`, 'Restricted');
    const buildingFund = await mkFund(`Building Restricted ${Date.now()}`, 'Restricted');
    const missionDonation = await apiCall('POST', 'giving/donations', {
      amount: 10000,
      method: 'Bank Transfer',
      date: new Date().toISOString(),
      reference: `MIS-${Date.now()}`,
      fundId: missionFund.id,
      debitAccountId: asset.id,
      creditAccountId: revenue.id,
    });
    const buildingDonation = await apiCall('POST', 'giving/donations', {
      amount: 15000,
      method: 'Bank Transfer',
      date: new Date().toISOString(),
      reference: `BLD-${Date.now()}`,
      fundId: buildingFund.id,
      debitAccountId: asset.id,
      creditAccountId: revenue.id,
    });
    expect(missionDonation.status).toBe(201);
    expect(buildingDonation.status).toBe(201);

    // 5,17: youth conference budgeting and overspend
    const budget = await apiCall('POST', 'finance/budgets', {
      name: `Youth Conference ${Date.now()}`,
      amount: 5000,
      trackingMode: 'soft',
      accountId: expense.id,
      fundId: missionFund.id,
    });
    expect(budget.status).toBe(201);
    const eventsRes = await apiCall('GET', 'events');
    expect(eventsRes.ok).toBeTruthy();
    const events = ((eventsRes.json as any)?.data ?? []) as any[];
    expect(events.length).toBeGreaterThan(0);
    const eventId = events[0].id as string;
    const overspend = await apiCall('POST', `finance/events/${eventId}/accounting`, {
      amount: 8000,
      date: new Date().toISOString(),
      description: 'Youth conference logistics overspend test',
      debitAccountId: expense.id,
      creditAccountId: asset.id,
      fundId: missionFund.id,
    });
    expect(overspend.status).toBe(201);
    expect((overspend.json as any)?.data?.status).toBe('posted');

    // 6: event reimbursement and 9: petty cash settlement
    const pettyAccount = await apiCall('POST', 'finance/accounts', {
      code: `PC${Date.now().toString().slice(-6)}`,
      name: `Petty Cash Audit ${Date.now()}`,
      type: 'Asset',
    });
    expect(pettyAccount.status).toBe(201);
    const pettyId = (pettyAccount.json as any)?.data?.id;
    expect(pettyId).toBeTruthy();
    const topup = await apiCall('POST', 'finance/petty-cash/topups', {
      amount: 3000,
      fromAccountId: asset.id,
      pettyCashAccountId: pettyId,
      description: 'Conference petty topup',
    });
    const reimb = await apiCall('POST', 'finance/petty-cash/reimbursements', {
      amount: 1200,
      expenseAccountId: expense.id,
      pettyCashAccountId: pettyId,
      description: 'Speaker travel reimbursement',
    });
    expect(topup.status).toBe(201);
    expect(reimb.status).toBe(201);
    const pettySummary = await apiCall('GET', `finance/petty-cash/summary?accountId=${encodeURIComponent(pettyId)}`);
    expect(pettySummary.ok).toBeTruthy();
    expect((pettySummary.json as any)?.data?.closingBalance).toBeGreaterThan(0);

    // 7: vendor bill lifecycle
    const vendor = await apiCall('POST', 'finance/vendors', {
      name: `Audit Vendor ${Date.now()}`,
      category: 'Sound',
    });
    expect(vendor.status).toBe(201);
    const bill = await apiCall('POST', 'finance/payables/bills', {
      vendorId: (vendor.json as any)?.data?.id,
      billNo: `VB-${Date.now()}`,
      billDate: new Date().toISOString(),
      amount: 4500,
      expenseAccountId: expense.id,
      payableAccountId: liability.id,
      description: 'Sound system service bill',
    });
    expect(bill.status).toBe(201);
    const payment = await apiCall('POST', 'finance/payables/payments', {
      billId: (bill.json as any)?.data?.id,
      amount: 3000,
      paymentDate: new Date().toISOString(),
      paymentAccountId: asset.id,
      payableAccountId: liability.id,
      description: 'Partial vendor payment',
    });
    expect(payment.status).toBe(201);

    // 8: payroll run + payment
    const membersRes = await apiCall('GET', 'members');
    expect(membersRes.ok).toBeTruthy();
    const memberData = (membersRes.json as any)?.data;
    const members = (Array.isArray(memberData) ? memberData : memberData?.members ?? []) as any[];
    if (!members.length) {
      const createMember = await apiCall('POST', 'members', { name: `Payroll Audit ${Date.now()}`, status: 'Active' });
      expect(createMember.status).toBe(201);
      members.push((createMember.json as any)?.data);
    }
    const payrollYear = 2200 + (Date.now() % 50);
    const payrollMonth = ((Date.now() / 1000) | 0) % 12 + 1;
    const run = await apiCall('POST', 'finance/payroll/runs', {
      periodYear: payrollYear,
      periodMonth: payrollMonth,
      lines: [
        {
          memberId: members[0].id,
          grossAmount: 32000,
          deductionAmount: 3000,
          salaryExpenseAccountId: expense.id,
          payrollPayableAccountId: liability.id,
        },
      ],
    });
    expect(run.status).toBe(201);
    const runId = (run.json as any)?.data?.id;
    const payRun = await apiCall('POST', `finance/payroll/runs/${runId}/pay`, {
      paymentAccountId: asset.id,
      paymentDate: new Date().toISOString(),
    });
    expect(payRun.ok).toBeTruthy();

    // 10,11: asset capitalization + depreciation
    const fixedAsset = await apiCall('POST', 'finance/accounts', {
      code: `FA${Date.now().toString().slice(-6)}`,
      name: `Fixed Asset Audit ${Date.now()}`,
      type: 'Asset',
    });
    const accumDep = await apiCall('POST', 'finance/accounts', {
      code: `AD${Date.now().toString().slice(-6)}`,
      name: `Accum Dep Audit ${Date.now()}`,
      type: 'Liability',
    });
    expect(fixedAsset.status).toBe(201);
    expect(accumDep.status).toBe(201);
    const assetCreate = await apiCall('POST', 'assets', {
      name: `Projector ${Date.now()}`,
      value: 90000,
      purchaseDate: new Date().toISOString(),
    });
    expect(assetCreate.status).toBe(201);
    const assetId = (assetCreate.json as any)?.data?.id;
    const cap = await apiCall('POST', `finance/assets/${assetId}/capitalize`, {
      fixedAssetAccountId: (fixedAsset.json as any)?.data?.id,
      paymentAccountId: asset.id,
      value: 90000,
      usefulLifeMonths: 60,
      purchaseDate: new Date().toISOString(),
    });
    expect(cap.ok).toBeTruthy();
    const dep = await apiCall('POST', 'finance/assets/depreciation/run', {
      depreciationExpenseAccountId: expense.id,
      accumulatedDepreciationAccountId: (accumDep.json as any)?.data?.id,
      asOfDate: new Date().toISOString(),
      assetIds: [assetId],
    });
    expect(dep.ok).toBeTruthy();
    expect((dep.json as any)?.data?.posted).toBeTruthy();

    // 12: bank reconciliation mismatch
    const reconSession = await apiCall('POST', 'finance/bank-reconciliation/sessions', {
      accountId: asset.id,
      fromDate: new Date(Date.now() - 7 * 86400000).toISOString(),
      toDate: new Date().toISOString(),
      statementOpeningBalance: 0,
    });
    expect(reconSession.status).toBe(201);
    const sessionId = (reconSession.json as any)?.data?.id;
    const importLines = await apiCall('POST', `finance/bank-reconciliation/sessions/${sessionId}/lines`, {
      lines: [
        {
          txnDate: new Date().toISOString(),
          reference: `MISMATCH-${Date.now()}`,
          description: 'Unmatched line',
          amount: 777.77,
          direction: 'Credit',
        },
      ],
    });
    expect(importLines.ok).toBeTruthy();
    await apiCall('POST', `finance/bank-reconciliation/sessions/${sessionId}/auto-match`, {});
    const reconSummary = await apiCall('GET', `finance/bank-reconciliation/sessions/${sessionId}`);
    expect(reconSummary.ok).toBeTruthy();
    expect(((reconSummary.json as any)?.data?.totals?.unmatchedLines ?? 0)).toBeGreaterThan(0);

    // 13: duplicate callback/idempotency behavior via duplicate donation reference
    const dupRef = `DUP-${Date.now()}`;
    const d1 = await apiCall('POST', 'giving/donations', {
      amount: 1800,
      method: 'Bank Transfer',
      date: new Date().toISOString(),
      reference: dupRef,
      debitAccountId: asset.id,
      creditAccountId: revenue.id,
    });
    const d2 = await apiCall('POST', 'giving/donations', {
      amount: 1800,
      method: 'Bank Transfer',
      date: new Date().toISOString(),
      reference: dupRef,
      debitAccountId: asset.id,
      creditAccountId: revenue.id,
    });
    expect(d1.status).toBe(201);
    expect(d2.status).toBe(201);
    expect((d1.json as any)?.data?.id).toBe((d2.json as any)?.data?.id);

    // 14: donation reversal
    const reverseDonation = await apiCall('POST', `giving/donations/${onlineDonation.id}/reverse`, {});
    expect(reverseDonation.ok).toBeTruthy();
    expect((reverseDonation.json as any)?.data?.reversalVoucherId).toBeTruthy();

    // 15: voucher reversal
    const reverseVoucher = await apiCall('POST', `finance/vouchers/${sundayDonation.voucherId}/reversal`, {
      reason: 'Operational reversal audit',
    });
    expect(reverseVoucher.status).toBe(201);

    // 16: approval rejection flow
    const approvalReq = await apiCall('POST', 'finance/approvals/requests', {
      entityType: 'Voucher',
      entityId: sundayDonation.voucherId,
      amount: 5200,
      moduleKey: 'finance',
    });
    expect(approvalReq.status).toBe(201);
    const reqId = (approvalReq.json as any)?.data?.id;
    const reject = await apiCall('POST', `finance/approvals/requests/${reqId}/decide`, {
      decision: 'Rejected',
      notes: 'Rejected during hardening audit scenario',
    });
    expect(reject.ok).toBeTruthy();
    expect((reject.json as any)?.data?.status).toBe('Rejected');

    // 18: year-close bypass attempt (invalid id must fail safely)
    const closeInvalid = await apiCall('POST', 'finance/financial-years/not-real-id/close', { notes: 'bypass test' });
    expect(closeInvalid.status).toBe(400);

    // 19: donor statement generation + 20 trial balance reconciliation
    const donorExport = await apiCall('POST', 'finance/ca-exports', { type: 'donor_statements' });
    expect(donorExport.ok).toBeTruthy();
    expect((donorExport.json as any)?.data?.checksumSha256).toBeTruthy();
    const trialBalance = await apiCall('GET', 'finance/trial-balance');
    expect(trialBalance.ok).toBeTruthy();
    const diffAfter = Number((trialBalance.json as any)?.data?.totals?.difference ?? 0);
    expect(Math.abs(diffAfter - trialDiffBefore)).toBeLessThanOrEqual(0.01);

    // Audit chain checks
    const audit = await apiCall('GET', 'finance/audit/logs?limit=200');
    expect(audit.ok).toBeTruthy();
    const logs = ((audit.json as any)?.data ?? []) as any[];
    expect(logs.length).toBeGreaterThan(0);
  });

  test('permission abuse scenarios are blocked', async ({ page, request }) => {
    await loginAsAdmin(page);
    const tenantId = await page.evaluate(() => localStorage.getItem('auth_tenant_id') || 'default-tenant-id');

    const unauth = await request.post('/api/v1/finance/vouchers', {
      headers: { 'x-tenant-id': tenantId },
      data: {},
    });
    expect([401, 403]).toContain(unauth.status());

    const exportNoAuth = await request.post('/api/v1/finance/ca-exports', {
      headers: { 'x-tenant-id': tenantId },
      data: { type: 'trial_balance' },
    });
    expect([401, 403]).toContain(exportNoAuth.status());

    const closeNoAuth = await request.post('/api/v1/finance/financial-years/not-real-id/close', {
      headers: { 'x-tenant-id': tenantId },
      data: {},
    });
    expect([401, 403]).toContain(closeNoAuth.status());

    const tamper = await request.get('/api/v1/finance/vouchers/not-real/attachment-checksums', {
      headers: {
        'x-tenant-id': tenantId,
        Authorization: 'Bearer invalid-token',
      },
    });
    expect([401, 403]).toContain(tamper.status());
  });
});

