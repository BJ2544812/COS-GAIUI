import { test, expect, loginAsRole } from './fixtures';

const DEMO_PASS = process.env.DEMO_ROLE_PASSWORD ?? 'demo123';

type LandingCase = {
  user: string;
  password?: string;
  expectPath: RegExp;
  expectHeading?: RegExp;
};

const LANDING_CASES: LandingCase[] = [
  { user: 'finance', expectPath: /module=finance/, expectHeading: /finance|voucher/i },
  { user: 'accountant', expectPath: /module=finance/ },
  { user: 'hradmin', expectPath: /module=(hr|workforce)/ },
  { user: 'worship', expectPath: /module=sunday-mode/ },
  { user: 'youth', expectPath: /module=events/, expectHeading: /events/i },
  { user: 'pastor', expectPath: /module=dashboard/ },
  { user: 'associate', expectPath: /module=dashboard/ },
  { user: 'churchadmin', expectPath: /module=dashboard/ },
  { user: 'volunteers', expectPath: /module=volunteers/ },
  { user: 'secretary', expectPath: /module=communication/ },
  { user: 'groupleader', expectPath: /module=small-groups/ },
  { user: 'staffdesk', expectPath: /module=dashboard/ },
];

test.describe('Role experience — post-login landing', () => {
  for (const c of LANDING_CASES) {
    test(`${c.user} lands on role-appropriate module`, async ({ page }) => {
      await loginAsRole(page, c.user, c.password ?? DEMO_PASS, { skipAdminNav: true });
      await expect(page).toHaveURL(c.expectPath, { timeout: 20_000 });
      if (c.expectHeading) {
        await expect(page.getByRole('heading', { name: c.expectHeading }).first()).toBeVisible({
          timeout: 20_000,
        });
      }
    });
  }
});

test.describe('Role experience — finance navigation order', () => {
  test('finance user sees Giving before Members in sidebar', async ({ page }) => {
    await loginAsRole(page, 'finance', DEMO_PASS);
    await page.goto('/admin?module=finance');
    const giving = page.getByTestId('nav-giving');
    const members = page.getByTestId('nav-members');
    await expect(giving).toBeVisible({ timeout: 15_000 });
    if (await members.count()) {
      const givingBox = await giving.boundingBox();
      const membersBox = await members.boundingBox();
      if (givingBox && membersBox) {
        expect(givingBox.y).toBeLessThan(membersBox.y);
      }
    } else {
      await expect(members).toHaveCount(0);
    }
  });
});
