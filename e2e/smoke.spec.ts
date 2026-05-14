import { test, expect } from './fixtures';

const USER = process.env.E2E_USER ?? 'admin';
const PASS = process.env.E2E_PASS ?? 'admin123';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.locator('#login-username').fill(USER);
  await page.locator('#login-password').fill(PASS);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

test.describe('Kingdom OS operational smoke', () => {
  test('login and shell render', async ({ page }) => {
    await login(page);
    await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible();
  });

  test('session persists after reload', async ({ page }) => {
    await login(page);
    await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible();
  });

  test('logout returns to login', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
  });

  test('dashboard loads with stat surfaces', async ({ page }) => {
    await login(page);
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByText(/Welcome back\.|Overview/).first()).toBeVisible();
    await expect(page.getByText('Loading dashboard…')).toBeHidden({ timeout: 30_000 });
    await expect(page.locator('text=/Tasks|Upcoming|Giving|Attendance/i').first()).toBeVisible();
  });

  test('members intake creates member and profile edit persists', async ({ page }) => {
    await login(page);
    await page.getByTestId('nav-members').click();
    await expect(page.getByRole('heading', { name: 'Members', exact: true })).toBeVisible();

    const suffix = Date.now();
    const email = `pw.member.${suffix}@example.com`;
    const first = `PWFirst${suffix}`;
    const last = `PWLast${suffix}`;

    await page.getByRole('button', { name: 'Add Member' }).click();
    await expect(page.getByRole('heading', { name: 'Member Intake' })).toBeVisible();
    await page.getByPlaceholder('John').fill(first);
    await page.getByPlaceholder('Doe').fill(last);
    await page.locator('input[type="date"]').first().fill('1990-01-15');
    await page.getByRole('button', { name: /Continue to Contact/i }).click();
    await page.getByPlaceholder('john.doe@example.com').fill(email);
    await page.locator('select').filter({ has: page.locator('option[value="Downtown"]') }).selectOption('Downtown');
    await page.getByRole('button', { name: /Continue to Family/i }).click();
    await page.getByPlaceholder('Doe Family').fill(`PW Household ${suffix}`);
    await page.getByRole('button', { name: /Continue to Spiritual/i }).click();
    await page.getByRole('button', { name: 'Baptized' }).click();
    await page.getByRole('checkbox', { name: /visitor \/ membership declaration policy/i }).check();
    await page.getByRole('button', { name: 'Complete Registration' }).click();
    await expect(page.getByText('Member saved successfully.').first()).toBeVisible({ timeout: 30_000 });

    await page.locator('tr', { hasText: email }).first().click();
    await expect(page.getByRole('heading', { name: `${first} ${last}` })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('1/15/1990').first()).toBeVisible();
    await expect(page.getByText(`PW Household ${suffix}`).first()).toBeVisible();

    await page.getByRole('button', { name: 'Spiritual Journey' }).click();
    await expect(page.getByText('Baptism').first()).toBeVisible();

    await page.getByRole('button', { name: 'Compliance' }).click();
    await expect(page.getByText('DeclarationForm').first()).toBeVisible();
    await page.getByRole('button', { name: /Visitor decl/i }).click();
    await expect(page.getByText('GeneratedVisitorDeclaration').first()).toBeVisible({ timeout: 30_000 });

    await page.reload();
    await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('nav-members').click();
    await page.locator('tr', { hasText: email }).first().click();
    await expect(page.getByRole('heading', { name: `${first} ${last}` })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('1/15/1990').first()).toBeVisible();
    await expect(page.getByText(`PW Household ${suffix}`).first()).toBeVisible();
    await page.getByRole('button', { name: 'Compliance' }).click();
    await expect(page.getByText('GeneratedVisitorDeclaration').first()).toBeVisible({ timeout: 20_000 });

    await page.getByTestId('nav-families').click();
    await expect(page.getByRole('heading', { name: 'Families', exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(`PW Household ${suffix}`).first()).toBeVisible({ timeout: 25_000 });

    await page.getByTestId('nav-members').click();
    await page.locator('tr', { hasText: email }).first().click();
    await expect(page.getByRole('heading', { name: `${first} ${last}` })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Edit Profile' }).click();
    await page.getByRole('dialog').getByPlaceholder('e.g. Volunteer').fill(`Smoke role ${suffix}`);
    await page.getByRole('button', { name: 'Save Profile Changes' }).click();
    await expect(page.getByText('Profile updated successfully.').first()).toBeVisible({ timeout: 25_000 });
  });

  test('pathways assign stage persists after reload', async ({ page }) => {
    await login(page);
    await page.getByTestId('nav-members').click();
    const suffix = Date.now();
    const email = `pw.path.${suffix}@example.com`;
    const first = `PathFirst${suffix}`;
    const last = `PathLast${suffix}`;

    await page.getByRole('button', { name: 'Add Member' }).click();
    await page.getByPlaceholder('John').fill(first);
    await page.getByPlaceholder('Doe').fill(last);
    await page.getByRole('button', { name: /Continue to Contact/i }).click();
    await page.getByPlaceholder('john.doe@example.com').fill(email);
    await page.locator('select').filter({ has: page.locator('option[value="Downtown"]') }).selectOption('Downtown');
    await page.getByRole('button', { name: /Continue to Family/i }).click();
    await page.getByRole('button', { name: /Continue to Spiritual/i }).click();
    await page.getByRole('button', { name: 'Complete Registration' }).click();
    await expect(page.getByText('Member saved successfully.').first()).toBeVisible({ timeout: 30_000 });

    await page.getByTestId('nav-pathways').click();
    await expect(page.getByText('Loading members...')).toBeHidden({ timeout: 30_000 });
    await page.getByRole('button', { name: 'Assign Stage' }).first().click();
    const pathwayModal = page.locator('div.fixed').filter({ hasText: 'Assign Growth Stage' });
    await pathwayModal.locator('select').first().selectOption({ label: `${first} ${last} (Visitor)` });
    await pathwayModal.locator('button').filter({ has: page.locator('p', { hasText: /^Member$/ }) }).click();
    await pathwayModal.getByRole('button', { name: /^Assign Stage$/ }).click();

    await page.reload();
    await page.getByTestId('nav-pathways').click();
    await expect(page.getByText('Loading members...')).toBeHidden({ timeout: 30_000 });
    await expect(page.locator('div', { hasText: email }).filter({ hasText: 'Member' }).first()).toBeVisible({ timeout: 20_000 });

    await page.getByTestId('nav-members').click();
    await page.locator('tr', { hasText: email }).first().click();
    await page.getByRole('button', { name: 'Edit Profile' }).click();
    const growthSelect = page
      .getByRole('dialog')
      .locator('select')
      .filter({ has: page.locator('option[value="Visitor"]') })
      .filter({ has: page.locator('option[value="Member"]') })
      .filter({ has: page.locator('option[value="Leader"]') });
    await expect(growthSelect).toHaveValue('Member');
    await page.getByRole('button', { name: 'Cancel Changes' }).click();
  });

  test('volunteer role assignment appears on member profile after reload', async ({ page }) => {
    await login(page);
    await page.getByTestId('nav-members').click();
    const suffix = Date.now();
    const email = `pw.vol.${suffix}@example.com`;
    const first = `VolFirst${suffix}`;
    const last = `VolLast${suffix}`;

    await page.getByRole('button', { name: 'Add Member' }).click();
    await page.getByPlaceholder('John').fill(first);
    await page.getByPlaceholder('Doe').fill(last);
    await page.getByRole('button', { name: /Continue to Contact/i }).click();
    await page.getByPlaceholder('john.doe@example.com').fill(email);
    await page.locator('select').filter({ has: page.locator('option[value="Downtown"]') }).selectOption('Downtown');
    await page.getByRole('button', { name: /Continue to Family/i }).click();
    await page.getByRole('button', { name: /Continue to Spiritual/i }).click();
    await page.getByRole('button', { name: 'Complete Registration' }).click();
    await expect(page.getByText('Member saved successfully.').first()).toBeVisible({ timeout: 30_000 });

    await page.getByTestId('nav-volunteers').click();
    await page.getByRole('button', { name: 'Assign Role' }).first().click();
    const volModal = page.locator('div.fixed').filter({ hasText: 'Assign Ministry Role' });
    await volModal.locator('select').first().selectOption({ label: `${first} ${last}` });
    await volModal.locator('select').nth(1).selectOption('Greeter');
    await volModal.getByRole('button', { name: /^Assign Role$/ }).click();

    await page.getByTestId('nav-members').click();
    await page.locator('tr', { hasText: email }).first().click();
    await expect(page.getByRole('heading', { name: `${first} ${last}` })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Spiritual Journey' }).click();
    await expect(page.getByText('Greeter').first()).toBeVisible({ timeout: 20_000 });
    await page.reload();
    await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('nav-members').click();
    await page.locator('tr', { hasText: email }).first().click();
    await expect(page.getByRole('heading', { name: `${first} ${last}` })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Spiritual Journey' }).click();
    await expect(page.getByText('Greeter').first()).toBeVisible({ timeout: 20_000 });

    await page.getByTestId('nav-volunteers').click();
    await page.getByPlaceholder('Search by name or role...').fill(first);
    await expect(page.getByText('Greeter').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(`${first} ${last}`).first()).toBeVisible();
  });

  test('shepherd care log persists on timeline after save', async ({ page }) => {
    await login(page);
    await page.getByTestId('nav-members').click();
    const suffix = Date.now();
    const email = `pw.care.${suffix}@example.com`;
    const first = `CareFirst${suffix}`;
    const last = `CareLast${suffix}`;

    await page.getByRole('button', { name: 'Add Member' }).click();
    await page.getByPlaceholder('John').fill(first);
    await page.getByPlaceholder('Doe').fill(last);
    await page.getByRole('button', { name: /Continue to Contact/i }).click();
    await page.getByPlaceholder('john.doe@example.com').fill(email);
    await page.locator('select').filter({ has: page.locator('option[value="Downtown"]') }).selectOption('Downtown');
    await page.getByRole('button', { name: /Continue to Family/i }).click();
    await page.getByRole('button', { name: /Continue to Spiritual/i }).click();
    await page.getByRole('button', { name: 'Complete Registration' }).click();
    await expect(page.getByText('Member saved successfully.').first()).toBeVisible({ timeout: 30_000 });

    await page.getByTestId('nav-discipleship').click();
    await expect(page.getByText('Loading Workspace...')).toBeHidden({ timeout: 30_000 });
    await page.getByRole('button', { name: 'Open Care Case' }).first().click();
    const careSheet = page.locator('[data-slot="sheet-content"]').filter({ hasText: 'Open Care Case' });
    await careSheet.locator('select').first().selectOption({ label: `${first} ${last}` });
    await careSheet.getByRole('button', { name: 'Open Care Case' }).click();

    await expect(page.getByRole('heading', { name: `${first} ${last}` })).toBeVisible({ timeout: 25_000 });

    const note = `Pastoral follow-up ${suffix}`;
    await page.getByPlaceholder(/pastoral note/i).fill(note);
    await page.getByRole('button', { name: 'Save Log' }).click();
    await expect(page.getByRole('heading', { name: /Note added/i }).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('p.text-xs').filter({ hasText: note }).first()).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: /Back to Workspace/i }).click();
    await page.getByRole('tab', { name: 'Care Cases' }).click();
    const carePanel = page.getByRole('tabpanel', { name: 'Care Cases' });
    await carePanel.getByText(`${first} ${last}`).first().click();
    await expect(page.getByRole('heading', { name: `${first} ${last}` })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: /Note added/i }).first()).toBeVisible({ timeout: 25_000 });
    await expect(page.locator('p.text-xs').filter({ hasText: note }).first()).toBeVisible({ timeout: 25_000 });

    await page.reload();
    await expect(page.getByText('KINGDOM OS', { exact: true })).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('nav-discipleship').click();
    await expect(page.getByText('Loading Workspace...')).toBeHidden({ timeout: 30_000 });
    await page.getByRole('tab', { name: 'Care Cases' }).click();
    const carePanelReloaded = page.getByRole('tabpanel', { name: 'Care Cases' });
    await carePanelReloaded.getByText(`${first} ${last}`).first().click();
    await expect(page.getByRole('heading', { name: `${first} ${last}` })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: /Note added/i }).first()).toBeVisible({ timeout: 25_000 });
    await expect(page.locator('p.text-xs').filter({ hasText: note }).first()).toBeVisible({ timeout: 25_000 });
  });

  test('event create then open detail', async ({ page }) => {
    await login(page);
    await page.getByTestId('nav-events').click();
    const title = `PW Event ${Date.now()}`;
    await page.getByRole('button', { name: 'Create Event' }).click();
    await page.getByPlaceholder(/Annual Youth/i).fill(title);
    await page.getByRole('button', { name: 'Publish Event' }).click();
    await expect(page.getByText(/was created/).first()).toBeVisible({ timeout: 30_000 });
    await page.getByRole('heading', { name: title, level: 3 }).click();
    await expect(page.getByRole('heading', { name: title, level: 2 })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Check-ins and guests').first()).toBeVisible();
  });

  test('attendance live portal loads', async ({ page }) => {
    await login(page);
    await page.getByTestId('nav-attendance').click();
    await expect(page.getByRole('heading', { name: 'Attendance' })).toBeVisible();
    page.once('dialog', (d) => d.accept(`PW Smoke ${Date.now()}`));
    await page.getByRole('button', { name: 'Open Live Portal' }).click();
    await expect(page.getByRole('heading', { name: 'Live Attendance Portal' })).toBeVisible({ timeout: 25_000 });
  });

  test('giving recent history table renders', async ({ page }) => {
    await login(page);
    await page.getByTestId('nav-giving').click();
    await expect(page.getByRole('heading', { name: 'Giving', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Donor' })).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText('Recent History').first()).toBeVisible();
  });

  test('sermon create and edit round-trip', async ({ page }) => {
    await login(page);
    await page.getByTestId('nav-sermons').click();
    const title = `PW Sermon ${Date.now()}`;
    await page.locator('#sermon-title').fill(title);
    await page.getByRole('button', { name: 'Create sermon' }).click();
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 25_000 });
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page.locator('#sermon-title').fill(`${title} edited`);
    await page.getByRole('button', { name: 'Update sermon' }).click();
    await expect(page.getByText(`${title} edited`).first()).toBeVisible({ timeout: 25_000 });
  });

  test('website visual builder: edit hero, save draft, optional page switch', async ({ page }) => {
    await login(page);
    await page.getByTestId('nav-website').click();
    await expect(page.getByRole('heading', { name: 'Website builder' })).toBeVisible();
    await page.getByRole('button', { name: 'Visual Builder' }).click();
    await expect(page.getByRole('button', { name: 'Exit' }).first()).toBeVisible();

    const hero = page.getByTestId('website-hero-title');
    await hero.click();
    await page.getByTestId('website-hero-title').locator('input').fill(`Kingdom smoke ${Date.now()}`);
    await page.getByTestId('website-hero-title').locator('input').blur();
    const saveBtn = page.getByRole('button', { name: /Save Draft/i });
    await expect(saveBtn).toBeEnabled({ timeout: 15_000 });
    await saveBtn.click();
    await expect(page.getByRole('button', { name: /Save Draft/i })).toBeDisabled({ timeout: 30_000 });

    const alt = page.getByTestId('website-page-visit');
    if (await alt.isVisible().catch(() => false)) {
      page.once('dialog', (d) => d.accept());
      await alt.click();
      await expect(page.getByText('URL: /visit').first()).toBeVisible({ timeout: 20_000 });
    }
  });

  test('permissions and settings load', async ({ page }) => {
    await login(page);
    await page.getByTestId('nav-permissions').click();
    await expect(page.getByRole('heading', { name: 'Access Control' })).toBeVisible({ timeout: 25_000 });
    await page.getByTestId('nav-settings').click();
    await expect(page.getByRole('heading', { name: 'System Settings' })).toBeVisible({ timeout: 25_000 });
  });
});
