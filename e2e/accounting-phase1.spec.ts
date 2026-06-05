import { test, expect, loginAsAdmin } from './fixtures';

test.describe('Accounting Phase 1 hardening', () => {
  test('voucher lifecycle is immutable, reversible, and audited', async ({ page }) => {
    await loginAsAdmin(page);

    const apiCall = async (
      method: 'GET' | 'POST' | 'PUT',
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
    const accounts = Array.isArray((accountsRes.json as any)?.data) ? (accountsRes.json as any).data : [];

    const debit = accounts.find((a: any) => a.type === 'Asset' && a.isActive);
    const credit = accounts.find((a: any) => a.type === 'Revenue' && a.isActive);
    expect(debit?.id).toBeTruthy();
    expect(credit?.id).toBeTruthy();

    const seed = Date.now();
    const sourceId = `e2e-phase1-${seed}`;
    const createRes = await apiCall('POST', 'finance/vouchers', {
      type: 'Receipt',
      date: new Date().toISOString(),
      amount: 1234,
      description: `Phase1 voucher ${sourceId}`,
      source: 'manual',
      sourceType: 'manual',
      sourceId,
      sourceMetadata: { testCase: 'phase1-lifecycle', seed },
      attachments: [
        {
          fileUrl: `https://example.org/attachments/${sourceId}.pdf`,
          title: 'Support document',
          mimeType: 'application/pdf',
          checksumSha256: 'abc123',
        },
      ],
      entries: [
        { accountId: debit.id, debit: 1234, credit: 0, narration: 'Receipt in bank' },
        { accountId: credit.id, debit: 0, credit: 1234, narration: 'Donation income' },
      ],
    });
    expect(createRes.status).toBe(201);
    const created = (createRes.json as any)?.data;
    expect(created?.status).toBe('draft');
    expect(created?.sourceType).toBe('manual');
    expect(created?.sourceId).toBe(sourceId);
    expect(Array.isArray(created?.attachments)).toBeTruthy();
    expect(created.attachments.length).toBe(1);

    const voucherId = String(created.id);
    const approveRes = await apiCall('POST', `finance/vouchers/${voucherId}/approve`);
    expect(approveRes.ok).toBeTruthy();

    const postRes = await apiCall('POST', `finance/vouchers/${voucherId}/post`);
    expect(postRes.ok).toBeTruthy();
    const posted = (postRes.json as any)?.data;
    expect(posted?.status).toBe('posted');
    expect(String(posted?.voucherNo || '')).toContain('-');

    const updateAfterPostRes = await apiCall('PUT', `finance/vouchers/${voucherId}`, {
      description: 'should fail',
      entries: [
        { accountId: debit.id, debit: 1234, credit: 0 },
        { accountId: credit.id, debit: 0, credit: 1234 },
      ],
    });
    expect(updateAfterPostRes.status).toBe(400);

    const duplicatePostRes = await apiCall('POST', `finance/vouchers/${voucherId}/post`);
    expect(duplicatePostRes.status).toBe(400);

    const reversalDraftRes = await apiCall('POST', `finance/vouchers/${voucherId}/reversal`);
    expect(reversalDraftRes.status).toBe(201);
    const reversalDraft = (reversalDraftRes.json as any)?.data;
    const reversalId = String(reversalDraft?.id);
    expect(reversalDraft?.status).toBe('draft');

    const approveReversalRes = await apiCall('POST', `finance/vouchers/${reversalId}/approve`);
    expect(approveReversalRes.ok).toBeTruthy();
    const postReversalRes = await apiCall('POST', `finance/vouchers/${reversalId}/post`);
    expect(postReversalRes.ok).toBeTruthy();
    const postedReversal = (postReversalRes.json as any)?.data;
    expect(postedReversal?.status).toBe('posted');

    const originalRes = await apiCall('GET', `finance/vouchers/${voucherId}`);
    expect(originalRes.ok).toBeTruthy();
    const original = (originalRes.json as any)?.data;
    expect(original?.reversalVoucher?.id).toBe(reversalId);

    const auditRes = await apiCall('GET', `finance/audit/logs?entityType=Voucher&entityId=${voucherId}&limit=20`);
    expect(auditRes.ok).toBeTruthy();
    const auditRows = (auditRes.json as any)?.data ?? [];
    const actions = new Set((Array.isArray(auditRows) ? auditRows : []).map((r: any) => r.action));
    expect(actions.has('voucher.created')).toBeTruthy();
    expect(actions.has('voucher.approved')).toBeTruthy();
    expect(actions.has('voucher.posted')).toBeTruthy();
  });
});

