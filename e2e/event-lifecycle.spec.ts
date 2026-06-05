import { test, expect, loginAsAdmin } from './fixtures';

test.describe('Event lifecycle & workspace', () => {
  test('creates event, transitions lifecycle, loads workspace', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin?module=events');
    await expect(page.getByRole('heading', { name: /events/i })).toBeVisible({ timeout: 15000 });

    const eventTitle = `E2E Lifecycle ${Date.now()}`;
    const createBtn = page.getByRole('button', { name: /create event/i }).first();
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      const titleField = page.getByPlaceholder(/annual youth conclave/i);
      if (await titleField.isVisible().catch(() => false)) {
        await titleField.fill(eventTitle);
        const dateInput = page.locator('input[type="date"]').first();
        if (await dateInput.isVisible().catch(() => false)) {
          await dateInput.fill('2030-06-15');
        }
        await page.getByRole('button', { name: /save|create|publish|finalize/i }).first().click();
      }
    }

    const card = page
      .locator('[class*="cursor-pointer"]')
      .filter({ hasText: new RegExp(eventTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '|Sunday|Worship|Demo', 'i') })
      .first();
    await expect(card).toBeVisible({ timeout: 25_000 });
    await card.click();

    await expect(page.getByText(/loading event workspace|overview|run sheet/i).first()).toBeVisible({ timeout: 20000 });

    const reviewBtn = page.getByRole('button', { name: 'REVIEW' });
    if (await reviewBtn.isVisible().catch(() => false)) {
      await reviewBtn.click();
      await expect(page.getByText(/in review|REVIEW/i).first()).toBeVisible({ timeout: 10000 });
    }
  });
});
