import { test, expect, loginAsAdmin } from './fixtures';

test.describe('Accounting Phase 4 gateway architecture', () => {
  test('exposes gateway-agnostic config and generic public verify route', async ({ page }) => {
    await loginAsAdmin(page);

    const authApi = async (method: 'GET' | 'POST', path: string, body?: Record<string, unknown>) =>
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
          return { status: res.status, ok: res.ok, json };
        },
        { method, path, body: body ?? null },
      );

    const publicApi = async (method: 'POST', path: string, body?: Record<string, unknown>) =>
      page.evaluate(
        async ({ method, path, body }) => {
          const tenantId = localStorage.getItem('auth_tenant_id') || 'default-tenant-id';
          const res = await fetch(`/api/v1/${path}`, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-id': tenantId,
            },
            body: body ? JSON.stringify(body) : undefined,
          });
          const json = await res.json().catch(() => null);
          return { status: res.status, ok: res.ok, json };
        },
        { method, path, body: body ?? null },
      );

    const cfg = await authApi('GET', 'giving/payment-gateway');
    expect(cfg.ok).toBeTruthy();
    const data = (cfg.json as any)?.data;
    expect(['cashfree', 'razorpay']).toContain(data?.primaryGateway);
    expect(data?.cashfree).toBeTruthy();
    expect(data?.razorpay).toBeTruthy();

    const verifyBad = await publicApi('POST', 'website/public/giving/verify', { gateway: 'razorpay' });
    expect(verifyBad.status).toBe(400);
    expect((verifyBad.json as any)?.error?.code).toBe('BAD_INPUT');
  });
});

