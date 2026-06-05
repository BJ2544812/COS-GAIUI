/**
 * Real login simulation for every demo role — collects landing, nav, and module load signals.
 * Output: role-simulation-results.json (repo root)
 */
import fs from 'node:fs';
import path from 'node:path';
import { test, expect, loginAsRole } from './fixtures';

const DEMO_PASS = process.env.DEMO_ROLE_PASSWORD ?? 'demo123';
const OUT = path.join(process.cwd(), 'role-simulation-results.json');

type RoleSim = {
  key: string;
  username: string;
  roleName?: string;
  loginOk: boolean;
  landingUrl: string;
  landingModule: string | null;
  dashboardTitle?: string;
  visibleNav: string[];
  hiddenExpectedNav: string[];
  moduleProbes: Record<string, 'ok' | 'blocked' | 'error' | 'empty'>;
  apiErrors: string[];
  notes: string[];
};

const ROLES: {
  key: string;
  username: string;
  password?: string;
  loginPath?: string;
  isMember?: boolean;
  expectedLanding?: RegExp;
  mustSeeNav: string[];
  mustNotSeeNav?: string[];
  probeModules: string[];
}[] = [
  {
    key: 'Admin',
    username: 'admin',
    password: 'admin123',
    expectedLanding: /module=dashboard|\/admin/,
    mustSeeNav: ['nav-dashboard', 'nav-settings', 'nav-members'],
    probeModules: ['dashboard', 'members', 'finance', 'settings'],
  },
  {
    key: 'Senior Pastor',
    username: 'pastor',
    expectedLanding: /module=dashboard/,
    mustSeeNav: ['nav-dashboard', 'nav-discipleship', 'nav-members', 'nav-giving'],
    mustNotSeeNav: ['nav-finance'],
    probeModules: ['dashboard', 'discipleship', 'members', 'analytics', 'giving', 'outreach'],
  },
  {
    key: 'Church Administrator',
    username: 'churchadmin',
    expectedLanding: /module=dashboard/,
    mustSeeNav: ['nav-dashboard', 'nav-events', 'nav-members', 'nav-settings'],
    mustNotSeeNav: ['nav-finance'],
    probeModules: ['dashboard', 'members', 'families', 'events', 'attendance', 'volunteers', 'communication'],
  },
  {
    key: 'Associate Pastor',
    username: 'associate',
    expectedLanding: /module=dashboard/,
    mustSeeNav: ['nav-discipleship', 'nav-members'],
    mustNotSeeNav: ['nav-finance'],
    probeModules: ['dashboard', 'discipleship', 'members', 'events', 'attendance'],
  },
  {
    key: 'Youth Pastor',
    username: 'youth',
    expectedLanding: /module=sunday-mode|module=events/,
    mustSeeNav: ['nav-events', 'nav-attendance'],
    probeModules: ['sunday-mode', 'events', 'attendance', 'members', 'discipleship'],
  },
  {
    key: 'Worship Pastor',
    username: 'worship',
    expectedLanding: /module=sunday-mode/,
    mustSeeNav: ['nav-sunday-mode', 'nav-events'],
    mustNotSeeNav: ['nav-finance'],
    probeModules: ['sunday-mode', 'events', 'attendance', 'worship'],
  },
  {
    key: 'Finance Manager',
    username: 'finance',
    expectedLanding: /module=finance/,
    mustSeeNav: ['nav-finance', 'nav-giving'],
    mustNotSeeNav: ['nav-discipleship'],
    probeModules: ['giving', 'finance', 'budgets', 'vendors', 'assets', 'analytics'],
  },
  {
    key: 'Accountant',
    username: 'accountant',
    expectedLanding: /module=finance/,
    mustSeeNav: ['nav-finance', 'nav-giving'],
    mustNotSeeNav: ['nav-hr'],
    probeModules: ['finance', 'giving', 'budgets'],
  },
  {
    key: 'HR Manager',
    username: 'hradmin',
    expectedLanding: /module=hr|module=workforce/,
    mustSeeNav: ['nav-hr'],
    probeModules: ['hr', 'workforce', 'members'],
  },
  {
    key: 'Volunteer Coordinator',
    username: 'volunteers',
    expectedLanding: /module=volunteers/,
    mustSeeNav: ['nav-volunteers', 'nav-events'],
    probeModules: ['volunteers', 'events', 'attendance', 'sunday-mode'],
  },
  {
    key: 'Communications Manager',
    username: 'secretary',
    expectedLanding: /module=communication/,
    mustSeeNav: ['nav-communication', 'nav-notifications'],
    probeModules: ['communication', 'notifications', 'website', 'outreach'],
  },
  {
    key: 'Ministry Leader',
    username: 'events',
    expectedLanding: /module=sunday-mode|module=events/,
    mustSeeNav: ['nav-events'],
    probeModules: ['events', 'attendance', 'sunday-mode'],
  },
  {
    key: 'Small Group Leader',
    username: 'groupleader',
    expectedLanding: /module=small-groups|module=members/,
    mustSeeNav: ['nav-small-groups', 'nav-members'],
    probeModules: ['small-groups', 'members', 'attendance'],
  },
  {
    key: 'Staff',
    username: 'staffdesk',
    expectedLanding: /module=dashboard|module=events/,
    mustSeeNav: ['nav-members', 'nav-events'],
    probeModules: ['dashboard', 'members', 'events'],
  },
  {
    key: 'Member',
    username: 'member',
    loginPath: '/member-login',
    isMember: true,
    expectedLanding: /\/portal/,
    mustSeeNav: [],
    probeModules: [],
  },
];

const results: RoleSim[] = [];

test.describe.configure({ mode: 'serial' });

for (const spec of ROLES) {
  test(`simulate: ${spec.key}`, async ({ page }) => {
    const row: RoleSim = {
      key: spec.key,
      username: spec.username,
      loginOk: false,
      landingUrl: '',
      landingModule: null,
      visibleNav: [],
      hiddenExpectedNav: [],
      moduleProbes: {},
      apiErrors: [],
      notes: [],
    };

    const api5xx: string[] = [];
    page.on('response', (res) => {
      if (res.url().includes('/api') && res.status() >= 500) {
        api5xx.push(`${res.status()} ${res.url()}`);
      }
    });

    try {
      if (spec.isMember) {
        await page.goto('/member-login');
        await page.locator('#member-login-username').fill(spec.username);
        await page.locator('#member-login-password').fill(spec.password ?? DEMO_PASS);
        await page.locator('button[type="submit"]').click();
        await expect(page).toHaveURL(/\/portal/, { timeout: 25_000 });
        await expect(page.getByText('Prayer requests').first()).toBeVisible({ timeout: 20_000 });
      } else {
        await loginAsRole(page, spec.username, spec.password ?? DEMO_PASS, { skipAdminNav: true });
      }
      row.loginOk = true;
      row.landingUrl = page.url();
      const m = row.landingUrl.match(/module=([^&]+)/);
      row.landingModule = m?.[1] ?? (row.landingUrl.includes('/portal') ? 'portal' : null);

      if (spec.expectedLanding) {
        if (!spec.expectedLanding.test(row.landingUrl)) {
          row.notes.push(`Unexpected landing URL: ${row.landingUrl}`);
        }
      }

      if (!spec.isMember) {
        await page.goto('/admin?module=dashboard').catch(() => undefined);
        const dashHeading = page.getByRole('heading').first();
        if (await dashHeading.isVisible().catch(() => false)) {
          row.dashboardTitle = (await dashHeading.textContent())?.trim();
        }

        for (const id of spec.mustSeeNav) {
          const el = page.getByTestId(id);
          if (await el.isVisible().catch(() => false)) row.visibleNav.push(id);
          else row.notes.push(`Missing nav: ${id}`);
        }
        for (const id of spec.mustNotSeeNav ?? []) {
          const el = page.getByTestId(id);
          if (await el.isVisible().catch(() => false)) {
            row.hiddenExpectedNav.push(id);
            row.notes.push(`Should not see nav: ${id}`);
          }
        }

        const allNav = await page.locator('[data-testid^="nav-"]').all();
        for (const n of allNav) {
          const tid = await n.getAttribute('data-testid');
          if (tid && (await n.isVisible())) row.visibleNav.push(tid);
        }
        row.visibleNav = [...new Set(row.visibleNav)];

        for (const mod of spec.probeModules) {
          await page.goto(`/admin?module=${mod}`);
          await page.waitForTimeout(800);
          const denied = await page
            .getByRole('heading', { name: /access denied|not authorized|forbidden/i })
            .isVisible()
            .catch(() => false);
          const err = await page.getByText(/something went wrong|failed to load/i).isVisible().catch(() => false);
          const empty = await page.getByText(/no .+ yet|get started/i).isVisible().catch(() => false);
          if (denied) row.moduleProbes[mod] = 'blocked';
          else if (err) row.moduleProbes[mod] = 'error';
          else if (empty) row.moduleProbes[mod] = 'empty';
          else row.moduleProbes[mod] = 'ok';
        }
      } else {
        for (const label of ['Prayer requests', 'My groups', 'Giving history', 'Recent sermons']) {
          if (await page.getByText(label).first().isVisible().catch(() => false)) {
            row.moduleProbes[label] = 'ok';
          } else {
            row.moduleProbes[label] = 'empty';
            row.notes.push(`Portal section missing: ${label}`);
          }
        }
      }
    } catch (e) {
      row.notes.push(e instanceof Error ? e.message : String(e));
    }

    row.apiErrors = [...new Set(api5xx)];
    if (row.apiErrors.length) row.notes.push(`API 5xx: ${row.apiErrors.length}`);
    if (!row.loginOk) {
      throw new Error(`${spec.key} login failed: ${row.notes.join('; ')}`);
    }
    results.push(row);
  });
}

test.afterAll(() => {
  fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), roles: results }, null, 2));
});
