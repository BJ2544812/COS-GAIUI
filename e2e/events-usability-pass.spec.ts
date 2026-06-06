/**
 * Real church simulation — Events final usability pass.
 * Two full lifecycles: Sunday service + conference.
 */
import { test, expect, loginAsAdmin } from './fixtures';

async function expectEventWorkspace(page: import('@playwright/test').Page) {
  await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible({ timeout: 20_000 });
}

async function returnToEventWorkspace(page: import('@playwright/test').Page) {
  await page.goto('/admin?module=events');
  await expectEventWorkspace(page);
}

test.describe('Events usability — Sunday service lifecycle', () => {
  test('pastor completes worship service flow end-to-end', async ({ page }) => {
    const stamp = Date.now();
    const serviceName = `Usability Sunday ${stamp}`;

    await loginAsAdmin(page);
    await page.goto('/admin?module=events');
    await expect(page.getByRole('heading', { name: /^Events$/i })).toBeVisible({ timeout: 20_000 });

    // 1. Create Sunday service
    await page.getByRole('button', { name: /create event/i }).first().click();
    await page.getByRole('textbox', { name: 'e.g. Youth Conclave' }).fill(serviceName);
    await page.locator('select').first().selectOption('Service');
    const today = new Date().toISOString().slice(0, 10);
    await page.locator('input[type="date"]').first().fill(today);
    await page.getByRole('button', { name: /create event/i }).last().click();
    await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible({ timeout: 25_000 });

    // Reload preserves workspace (session persistence)
    await page.reload();
    await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible({ timeout: 20_000 });

    // 2. Add run sheet (Worship Planning tab)
    await page.getByRole('tab', { name: /worship planning/i }).click();
    await page.getByRole('button', { name: /add segment/i }).click();
    await page.getByRole('button', { name: /^save$/i }).first().click();
    await expect(page.getByText(/run sheet|order of service|drag to reorder/i).first()).toBeVisible({ timeout: 15_000 });

    // 3. Assign volunteers (deep link to Volunteers)
    await page.getByRole('tab', { name: /^people$/i }).click();
    await page.getByRole('button', { name: /manage in volunteers/i }).click();
    await expect(page.getByRole('heading', { name: /volunteers/i })).toBeVisible({ timeout: 15_000 });
    const assignModal = page.getByRole('dialog').or(page.locator('[class*="modal"]').filter({ hasText: /assign/i }));
    if (await assignModal.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
    }
    await returnToEventWorkspace(page);

    // 4. Open Sunday Service
    await page.getByRole('tab', { name: /overview/i }).click();
    await page.getByRole('main').getByRole('button', { name: /sunday service/i }).click();
    await expect(page.getByRole('heading', { name: /Sunday Service/i })).toBeVisible({ timeout: 20_000 });

    // 5. Live segments (if run sheet exists)
    const completeSeg = page.getByRole('button', { name: /complete segment/i }).first();
    if (await completeSeg.isVisible().catch(() => false)) {
      await completeSeg.click();
    }

    // 6–7. Attendance
    await returnToEventWorkspace(page);
    await page.getByRole('tab', { name: /^people$/i }).click();
    const newSession = page.getByRole('button', { name: /new session/i });
    if (await newSession.isVisible().catch(() => false)) {
      await newSession.click();
      await expect(page.getByRole('heading', { name: 'Attendance', exact: true })).toBeVisible({ timeout: 15_000 });
    }

    // 8. Complete service (workflow)
    await returnToEventWorkspace(page);
    await page.getByRole('tab', { name: /workflow/i }).click();
    const moveBtn = page.getByRole('button', { name: /move to/i }).first();
    if (await moveBtn.isVisible().catch(() => false)) {
      await moveBtn.click();
    }

    // 9. Reports
    await page.getByRole('tab', { name: /reports/i }).click();
    await expect(page.getByText(/attendance|registrations|participation/i).first()).toBeVisible({ timeout: 10_000 });

    // Back to list
    await page.getByRole('button', { name: /all events/i }).click();
    await expect(page.getByRole('heading', { name: /^Events$/i })).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Events usability — conference lifecycle', () => {
  test('pastor completes conference flow end-to-end', async ({ page }) => {
    const stamp = Date.now();
    const confName = `Usability Conference ${stamp}`;

    await loginAsAdmin(page);
    await page.goto('/admin?module=events');
    await expect(page.getByRole('heading', { name: /^Events$/i })).toBeVisible({ timeout: 20_000 });

    // 1. Create conference
    await page.getByRole('button', { name: /create event/i }).first().click();
    await page.getByRole('textbox', { name: 'e.g. Youth Conclave' }).fill(confName);
    await page.locator('select').first().selectOption('Special');
    await page.locator('input[type="date"]').first().fill('2031-09-20');
    await page.getByRole('button', { name: /create event/i }).last().click();
    await expectEventWorkspace(page);

    // Edit details — enable registration
    await page.getByRole('button', { name: /edit details/i }).click();
    await expect(page.getByText(/event setup/i).first()).toBeVisible({ timeout: 10_000 });
    const pubToggle = page.getByLabel(/publish to website/i).or(page.locator('input[type="checkbox"]').first());
    if (await pubToggle.isVisible().catch(() => false)) {
      await pubToggle.check().catch(() => pubToggle.click());
    }
    await page.getByRole('button', { name: /save|update/i }).first().click();
    await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible({ timeout: 15_000 });

    // 2. Add session
    await page.getByRole('tab', { name: /^schedule$/i }).click();
    await page.getByRole('button', { name: /add session/i }).click();
    await expect(page.getByRole('heading', { name: 'Attendance', exact: true })).toBeVisible({ timeout: 15_000 });

    // 3. Return to workspace after attendance
    await returnToEventWorkspace(page);

    // 4. People / volunteers
    await page.getByRole('tab', { name: /^people$/i }).click();
    await page.getByRole('button', { name: /manage in volunteers/i }).click();
    await expect(page.getByRole('heading', { name: /volunteers/i })).toBeVisible({ timeout: 15_000 });
    await returnToEventWorkspace(page);

    // 5. Finance tab
    await page.getByRole('tab', { name: /^finance$/i }).click();
    await expect(page.getByText(/income|expenses|net/i).first()).toBeVisible({ timeout: 10_000 });

    // 6. Complete event
    await page.getByRole('tab', { name: /workflow/i }).click();
    for (let i = 0; i < 6; i++) {
      const btn = page.getByRole('button', { name: /move to/i }).first();
      if (!(await btn.isVisible().catch(() => false))) break;
      await btn.click();
      await page.waitForTimeout(400);
    }

    // Deep link reload
    await page.reload();
    await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /all events/i }).click();
    await expect(page.getByRole('heading', { name: /^Events$/i })).toBeVisible();
  });
});

test.describe('Events usability — navigation checks', () => {
  test('deep link opens event workspace on schedule tab', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin?module=events');
    await expect(page.getByRole('heading', { name: /^Events$/i })).toBeVisible({ timeout: 20_000 });

    const serviceCard = page.locator('[class*="cursor-pointer"]').filter({ hasText: /Sunday Worship|type.*Service/i }).first();
    const card = page.locator('[class*="cursor-pointer"]').filter({ has: page.getByText('Service', { exact: true }) }).first();
    await card.click();
    await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible({ timeout: 15_000 });

    const eventId = await page.evaluate(() => sessionStorage.getItem('ucos_events_active_event_id'));
    expect(eventId).toBeTruthy();

    await page.evaluate(
      ({ id }) => {
        sessionStorage.setItem('ucos_open_event_id', id!);
        sessionStorage.setItem('ucos_event_workspace_tab', 'schedule');
      },
      { id: eventId },
    );
    await page.goto('/admin?module=events');
    await expect(page.getByRole('tab', { name: /worship planning|schedule/i })).toBeVisible({ timeout: 20_000 });
  });
});
