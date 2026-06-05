import { test, expect, loginAsAdmin } from './fixtures';

test.describe('Volunteers & Structure operational', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('volunteer assignment persists after reload', async ({ page }) => {
    await page.getByRole('button', { name: /volunteers/i }).first().click();
    await expect(page.getByRole('heading', { name: /volunteers/i })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /assign role/i }).first().click();
    await expect(page.getByRole('heading', { name: /assign ministry role/i })).toBeVisible();

    const modal = page.locator('.fixed .rounded-3xl').first();
    const selects = modal.locator('select');
    await selects.nth(0).selectOption({ index: 1 });
    await selects.nth(1).selectOption('Usher');
    const submit = modal.getByRole('button', { name: /^assign role$/i });
    await expect(submit).toBeEnabled({ timeout: 5_000 });
    await submit.click();

    const apiMissing = page.getByText(/api route not found/i);
    if (await apiMissing.isVisible({ timeout: 3_000 }).catch(() => false)) {
      test.skip(true, 'Restart dev:server to load responsibility routes');
    }

    await expect(page.getByText('Usher').first()).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible({ timeout: 25_000 });
    await page.getByRole('button', { name: /volunteers/i }).first().click();
    await expect(page.getByText('Usher').first()).toBeVisible({ timeout: 15_000 });
  });

  test('second role appends without overwriting first', async ({ page }) => {
    await page.getByRole('button', { name: /volunteers/i }).first().click();
    await expect(page.getByRole('heading', { name: /volunteers/i })).toBeVisible({ timeout: 15_000 });

    const assignFirst = async (role: string) => {
      await page.getByRole('button', { name: /assign role/i }).first().click();
      await expect(page.getByRole('heading', { name: /assign ministry role/i })).toBeVisible();
      const modal = page.locator('.fixed .rounded-3xl').first();
      const selects = modal.locator('select');
      await selects.nth(0).selectOption({ index: 1 });
      const memberLabel = await selects.nth(0).locator('option:checked').textContent();
      await selects.nth(1).selectOption(role);
      const submit = modal.getByRole('button', { name: /^assign role$/i });
      await expect(submit).toBeEnabled({ timeout: 5_000 });
      await submit.click();
      const apiMissing = page.getByText(/api route not found/i);
      if (await apiMissing.isVisible({ timeout: 3_000 }).catch(() => false)) {
        test.skip(true, 'Restart dev:server to load responsibility routes');
      }
      await expect(page.getByText(role).first()).toBeVisible({ timeout: 15_000 });
      return (memberLabel ?? '').trim();
    };

    const memberName = await assignFirst('Usher');
    await assignFirst('Greeter');

    const memberRows = page.locator('.divide-y > div').filter({ hasText: memberName });
    await expect(memberRows.filter({ hasText: 'Usher' }).first()).toBeVisible({ timeout: 10_000 });
    await expect(memberRows.filter({ hasText: 'Greeter' }).first()).toBeVisible({ timeout: 10_000 });
    expect(await memberRows.count()).toBeGreaterThanOrEqual(2);

    await memberRows.filter({ hasText: 'Greeter' }).first().click();
    await page.getByLabel('Back').click();
    await expect(page.getByText(/volunteer/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Usher').first()).toBeVisible();
    await expect(page.getByText('Greeter').first()).toBeVisible();
  });

  test('structure campus detail and ministry roster load', async ({ page }) => {
    await page.getByRole('button', { name: /church structure|structure/i }).first().click();
    await expect(page.getByText(/organization network/i)).toBeVisible({ timeout: 15_000 });

    const campusCard = page.locator('[class*="cursor-pointer"]').filter({ hasText: /campus|main|grace/i }).first();
    if (!(await campusCard.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, 'No campus in seed — run npm run seed');
    }

    await campusCard.click();
    await expect(page.getByRole('heading', { name: /ministry teams & departments/i })).toBeVisible({ timeout: 15_000 });

    const teamCard = page.locator('[class*="cursor-pointer"]').filter({ hasText: /worship|youth|outreach|children|team roster/i }).first();
    if (await teamCard.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await teamCard.click();
      await expect(page.getByText(/serving roster/i)).toBeVisible({ timeout: 10_000 });
    }
  });
});
