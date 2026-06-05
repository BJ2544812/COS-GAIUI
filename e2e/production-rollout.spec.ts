import { test, expect, loginAsRole } from './fixtures';

const TENANT = process.env.E2E_TENANT_ID ?? 'default-tenant-id';
const DEMO_PASS = process.env.DEMO_ROLE_PASSWORD ?? 'demo123';

type RoleCase = {
  user: string;
  label: string;
  expectNav: RegExp;
  denyNavTestId?: string;
};

const ROLE_CASES: RoleCase[] = [
  { user: 'finance', label: 'Finance Manager', expectNav: /finance/i, denyNavTestId: 'nav-settings' },
  { user: 'events', label: 'Ministry Leader', expectNav: /events/i, denyNavTestId: 'nav-settings' },
  { user: 'pastor', label: 'Senior Pastor', expectNav: /members|pastoral/i, denyNavTestId: 'nav-settings' },
  { user: 'worship', label: 'Worship Pastor', expectNav: /sunday service|attendance|worship/i },
  {
    user: 'secretary',
    label: 'Communications Manager',
    expectNav: /members|communications/i,
    denyNavTestId: 'nav-finance',
  },
  { user: 'volunteers', label: 'Volunteer Coordinator', expectNav: /volunteers|events/i, denyNavTestId: 'nav-settings' },
  { user: 'campus', label: 'Campus Admin', expectNav: /settings|home/i, denyNavTestId: 'nav-finance' },
];

test.describe('Production rollout — role-based access', () => {
  for (const role of ROLE_CASES) {
    test(`${role.label} sees allowed nav and lands in shell`, async ({ page }) => {
      await loginAsRole(page, role.user, DEMO_PASS);
      await expect(page.getByRole('button', { name: role.expectNav }).first()).toBeVisible({
        timeout: 15_000,
      });
      if (role.denyNavTestId) {
        await expect(page.getByTestId(role.denyNavTestId)).toHaveCount(0);
      }
    });
  }
});

test.describe('Production rollout — Sunday & admin surfaces', () => {
  test('Sunday operations API + UI paths', async ({ page, request }) => {
    const login = await request.post('/api/v1/auth/login', {
      headers: { 'x-tenant-id': TENANT },
      data: { username: 'admin', password: 'admin123' },
    });
    expect(login.ok()).toBeTruthy();
    const { token, tenantId } = await login.json();
    const headers = { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId };

    const cc = await request.get('/api/v1/operations/command-center', { headers });
    expect(cc.ok()).toBeTruthy();

    await loginAsRole(page, 'admin', 'admin123');
    await page.goto('/admin');
    await page.getByTestId('nav-sunday-mode').click({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Sunday Mode' })).toBeVisible({ timeout: 20_000 });
  });

  test('admin toolkit: settings, deploy, backup APIs', async ({ request }) => {
    const login = await request.post('/api/v1/auth/login', {
      headers: { 'x-tenant-id': TENANT },
      data: { username: 'admin', password: 'admin123' },
    });
    const { token, tenantId } = await login.json();
    const headers = { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId };

    for (const path of [
      '/api/v1/settings',
      '/api/v1/deploy/infrastructure',
      '/api/v1/deploy/backups',
      '/api/v1/deploy/maintenance',
    ]) {
      const res = await request.get(path, { headers });
      expect(res.status(), path).toBeLessThan(500);
      expect(res.ok(), `${path} ${await res.text()}`).toBeTruthy();
    }
  });
});
