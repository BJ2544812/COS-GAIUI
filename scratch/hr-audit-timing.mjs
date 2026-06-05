import { chromium } from 'playwright';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const USER = process.env.E2E_USER || 'admin';
const PASS = process.env.E2E_PASS || 'admin123';

function nowMs() {
  return performance.now();
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#login-username').fill(USER);
  await page.locator('#login-password').fill(PASS);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.endsWith('/login'), { timeout: 30000 }),
    page.locator('button[type="submit"]').first().click(),
  ]);
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
}

async function timedStep(label, fn) {
  const start = nowMs();
  await fn();
  const end = nowMs();
  return { label, ms: Math.round(end - start) };
}

async function waitForApi(page, urlIncludes, trigger) {
  const start = nowMs();
  const responsePromise = page.waitForResponse(
    (r) => r.url().includes(urlIncludes) && r.request().method() === 'GET',
    { timeout: 60000 },
  );
  await trigger();
  const response = await responsePromise;
  const end = nowMs();
  return {
    url: response.url(),
    status: response.status(),
    ms: Math.round(end - start),
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const report = {
    timings: [],
    api: [],
    notes: [],
  };

  try {
    await login(page);
    await page.getByText('KINGDOM OS', { exact: true }).waitFor({ timeout: 30000 });

    // HR/Workforce module load + staff list API timing
    const hrApi = await waitForApi(page, '/api/v1/hr/employment-profiles', async () => {
      const hrNav = page.getByTestId('nav-hr');
      await hrNav.waitFor({ timeout: 30000 });
      await hrNav.click();
    });
    report.api.push({ metric: 'Staff list API', ...hrApi });
    report.timings.push(
      await timedStep('HR Dashboard initial module load', async () => {
        await page.getByText('HR & Staff', { exact: true }).first().waitFor({ timeout: 30000 });
      }),
    );

    // Volunteer module load + volunteer board API timing
    const volApi = await waitForApi(page, '/api/v1/operations/volunteer-board', async () => {
      await page.getByTestId('nav-volunteers').click();
    });
    report.api.push({ metric: 'Volunteer list API', ...volApi });
    report.timings.push(
      await timedStep('Volunteer list load', async () => {
        await page.getByText('Volunteers', { exact: true }).first().waitFor({ timeout: 30000 });
      }),
    );

    // Staff list load timing from HR tab
    const staffListApi = await waitForApi(page, '/api/v1/hr/employment-profiles', async () => {
      await page.getByTestId('nav-hr').click();
    });
    report.api.push({ metric: 'Staff list refresh API', ...staffListApi });
    report.timings.push(
      await timedStep('Staff list render ready', async () => {
        await page.getByText(/Active Workforce|Employment Profiles|Staff/i).first().waitFor({ timeout: 30000 });
      }),
    );

    await page.getByRole('button', { name: /Staff directory/i }).click();

    // Staff profile open timing (modal/detail)
    const staffCards = page.locator('button').filter({ hasText: /Started:|Ministry|Staff/ });
    if (await staffCards.count()) {
      try {
        report.timings.push(
          await timedStep('Staff profile load', async () => {
            const candidate = staffCards.first();
            await candidate.click();
            await page.getByText(/Emergency Contact|Compensation|Employment/i).first().waitFor({ timeout: 15000 });
          }),
        );
      } catch {
        report.notes.push('Staff profile load timing skipped: could not stabilize profile detail selector in current UI state.');
      }
    } else {
      report.notes.push('Staff profile load timing skipped: no visible staff cards in current dataset.');
    }

    // Assignment screens timing (volunteer assign action)
    await page.getByTestId('nav-volunteers').click();
    const assignButtons = page.getByRole('button', { name: /Assign Volunteer|Assign/i });
    if (await assignButtons.count()) {
      try {
        report.timings.push(
          await timedStep('Assignment screen open', async () => {
            await assignButtons.first().click();
            await page.getByText(/Assign Role|Role Assignment|Entity Type/i).first().waitFor({ timeout: 15000 });
          }),
        );
      } catch {
        report.notes.push('Assignment screen timing skipped: assign dialog selector did not stabilize.');
      }
    } else {
      report.notes.push('Assignment screen timing skipped: no assign button visible.');
    }

    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    report.notes.push(`Measurement error: ${String(error)}`);
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = 1;
  } finally {
    await context.close();
    await browser.close();
  }
}

await main();
