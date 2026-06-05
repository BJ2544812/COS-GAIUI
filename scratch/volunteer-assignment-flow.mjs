import { chromium, request as playwrightRequest } from 'playwright';

const BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:3001';
const API_BASE = process.env.E2E_API_BASE || 'http://127.0.0.1:4002/api/v1';
const USER = process.env.E2E_USER || 'admin';
const PASS = process.env.E2E_PASS || 'admin123';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const report = { steps: [], notes: [] };

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('#login-username').fill(USER);
    await page.locator('#login-password').fill(PASS);
    await Promise.all([
      page.waitForURL((u) => !u.pathname.endsWith('/login'), { timeout: 30000 }),
      page.locator('button[type="submit"]').first().click(),
    ]);

    const auth = await page.evaluate(() => ({
      token: localStorage.getItem('auth_token') || '',
      tenantId: localStorage.getItem('auth_tenant_id') || 'default-tenant-id',
    }));
    if (!auth.token) throw new Error('No auth token after login');

    const req = await playwrightRequest.newContext({
      extraHTTPHeaders: {
        Authorization: `Bearer ${auth.token}`,
        'x-tenant-id': auth.tenantId,
        'Content-Type': 'application/json',
      },
    });

    const membersRes = await req.get(`${API_BASE}/members`);
    const membersJson = await membersRes.json();
    const members = membersJson?.data || [];
    if (!members.length) throw new Error('No members found for assignment test');
    const member = members[0];

    const roleName = `AuditRole-${Date.now()}`;
    const assignRes = await req.post(`${API_BASE}/members/${member.id}/responsibilities`, {
      data: {
        role: roleName,
        entityType: 'Ministry',
        status: 'Active',
      },
    });
    report.steps.push({ step: 'Assign Volunteer', status: assignRes.status() });

    const boardRes = await req.get(`${API_BASE}/operations/volunteer-board`);
    const boardJson = await boardRes.json();
    const boardRows = boardJson?.data?.rows || [];
    const appearsInBoard = boardRows.some((row) => row.member?.id === member.id && row.role === roleName);
    report.steps.push({ step: 'Appears In Active Volunteers', status: appearsInBoard ? 'PASS' : 'FAIL' });

    const memberRes = await req.get(`${API_BASE}/members/${member.id}`);
    const memberJson = await memberRes.json();
    const responsibilities = memberJson?.data?.responsibilities || [];
    const appearsInProfilePayload = responsibilities.some((r) => r.role === roleName);
    report.steps.push({ step: 'Opens Profile payload contains role', status: appearsInProfilePayload ? 'PASS' : 'FAIL' });

    // Immediate refresh check (repeat same board call)
    const boardRes2 = await req.get(`${API_BASE}/operations/volunteer-board`);
    const boardJson2 = await boardRes2.json();
    const boardRows2 = boardJson2?.data?.rows || [];
    const persistsAfterRefresh = boardRows2.some((row) => row.member?.id === member.id && row.role === roleName);
    report.steps.push({ step: 'Immediate refresh consistency', status: persistsAfterRefresh ? 'PASS' : 'FAIL' });

    console.log(JSON.stringify(report, null, 2));
    await req.dispose();
  } catch (err) {
    report.notes.push(String(err));
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = 1;
  } finally {
    await context.close();
    await browser.close();
  }
}

await main();
