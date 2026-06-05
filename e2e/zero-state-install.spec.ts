import { test, expect, loginAsAdmin } from './fixtures';

const TENANT = process.env.E2E_TENANT_ID ?? 'default-tenant-id';

/** Minimal 1x1 PNG */
function tinyPngBuffer(): Buffer {
  const b64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  return Buffer.from(b64, 'base64');
}

test.describe('Zero-state install & tenant auth', () => {
  test('setup-status and version are public', async ({ request }) => {
    const status = await request.get('/api/v1/deploy/setup-status');
    expect(status.ok()).toBeTruthy();
    const statusJson = await status.json();
    expect(statusJson.data).toHaveProperty('needsSetup');

    const version = await request.get('/api/v1/deploy/version');
    expect(version.ok()).toBeTruthy();
  });

  test('login returns tenantId aligned with JWT', async ({ request }) => {
    const login = await request.post('/api/v1/auth/login', {
      headers: { 'x-tenant-id': TENANT },
      data: { username: 'admin', password: 'admin123' },
    });
    expect(login.ok()).toBeTruthy();
    const body = await login.json();
    expect(body.tenantId).toBe(TENANT);
    expect(body.token).toBeTruthy();

    const payload = JSON.parse(
      Buffer.from(body.token.split('.')[1], 'base64').toString('utf8'),
    ) as { tenantId?: string };
    expect(payload.tenantId).toBe(TENANT);
  });

  test('branding upload survives stale x-tenant-id header', async ({ request }) => {
    const login = await request.post('/api/v1/auth/login', {
      headers: { 'x-tenant-id': TENANT },
      data: { username: 'admin', password: 'admin123' },
    });
    const { token } = await login.json();
    const wrongTenant = TENANT === 'default-tenant-id' ? 'stale-wrong-tenant' : 'default-tenant-id';

    const upload = await request.post('/api/v1/upload', {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-tenant-id': wrongTenant,
      },
      multipart: {
        file: {
          name: 'logo.png',
          mimeType: 'image/png',
          buffer: tinyPngBuffer(),
        },
      },
    });
    expect(upload.status(), await upload.text()).not.toBe(403);
    expect(upload.ok()).toBeTruthy();
    const up = await upload.json();
    expect(up.url || up.data?.url).toBeTruthy();
  });

  test('settings persist after save', async ({ request }) => {
    const login = await request.post('/api/v1/auth/login', {
      headers: { 'x-tenant-id': TENANT },
      data: { username: 'admin', password: 'admin123' },
    });
    const { token, tenantId } = await login.json();
    const headers = {
      Authorization: `Bearer ${token}`,
      'x-tenant-id': tenantId,
      'Content-Type': 'application/json',
    };

    const get = await request.get('/api/v1/settings', { headers });
    expect(get.ok()).toBeTruthy();
    const body = await get.json();

    const marker = `Zero-State QA ${Date.now()}`;
    const save = await request.post('/api/v1/settings', {
      headers,
      data: {
        organization: {
          name: marker,
        },
      },
    });
    expect(save.ok()).toBeTruthy();

    const again = await request.get('/api/v1/settings', { headers });
    const againBody = await again.json();
    expect(againBody.structured?.organization?.name).toBe(marker);
    expect(body.structured).toBeTruthy();
  });

  test('admin can open settings after login (UI)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/');
    const settingsNav = page.getByRole('button', { name: /settings/i }).first();
    if (await settingsNav.isVisible({ timeout: 12_000 }).catch(() => false)) {
      await settingsNav.click();
      await expect(page.getByText('System Settings')).toBeVisible({ timeout: 15_000 });
    }
  });

  test('health and route manifest', async ({ request }) => {
    const health = await request.get('/health');
    expect(health.ok()).toBeTruthy();
    const h = await health.json();
    expect(h.database).toBe('connected');

    const routes = await request.get('/health/routes', {
      headers: { 'x-tenant-id': TENANT },
    });
    expect(routes.ok()).toBeTruthy();
  });
});

test.describe('Zero-state — chart of accounts smoke', () => {
  test('finance accounts list loads for admin', async ({ request }) => {
    const login = await request.post('/api/v1/auth/login', {
      headers: { 'x-tenant-id': TENANT },
      data: { username: 'admin', password: 'admin123' },
    });
    const { token, tenantId } = await login.json();
    const res = await request.get('/api/v1/finance/accounts', {
      headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    const rows = Array.isArray(json) ? json : json.data ?? json.accounts ?? [];
    expect(rows.length).toBeGreaterThan(0);
  });
});
