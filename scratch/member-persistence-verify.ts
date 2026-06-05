/**
 * End-to-end member field + document generation verification (UI → API → DB).
 * Run: npx tsx scratch/member-persistence-verify.ts
 */
import { prisma } from '../src/server/utils/prisma.js';

const API = process.env.API_BASE || 'http://127.0.0.1:4002/api/v1';
const TENANT = process.env.VITE_TENANT_ID || 'default-tenant-id';

type Result = { step: string; ok: boolean; detail: string };

const results: Result[] = [];

function pass(step: string, detail: string) {
  results.push({ step, ok: true, detail });
}
function fail(step: string, detail: string) {
  results.push({ step, ok: false, detail });
}

async function main() {
  let token = '';
  let memberId = '';

  try {
    const health = await fetch('http://127.0.0.1:4002/health', { signal: AbortSignal.timeout(5000) });
    if (!health.ok) fail('health', String(health.status));
    else pass('health', 'ok');
  } catch (e) {
    fail('health', `API unreachable: ${e instanceof Error ? e.message : String(e)}`);
    console.log(JSON.stringify(results, null, 2));
    process.exit(1);
  }

  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': TENANT },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  if (!loginRes.ok) {
    fail('login', await loginRes.text());
    console.log(JSON.stringify(results, null, 2));
    process.exit(1);
  }
  const loginJson = (await loginRes.json()) as { token?: string };
  token = loginJson.token || '';
  pass('login', 'admin token acquired');

  const auth = () => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-tenant-id': TENANT,
  });

  const testDob = '1990-03-15';
  const createRes = await fetch(`${API}/members`, {
    method: 'POST',
    headers: auth(),
    body: JSON.stringify({
      name: `QA Verify ${Date.now()}`,
      email: `qa-${Date.now()}@verify.local`,
      phone: '9876543210',
      dob: `${testDob}T12:00:00.000Z`,
      membershipDate: '2024-01-10T12:00:00.000Z',
      growthStage: 'Member',
      gender: 'Male',
      addressLine1: '12 Test Lane',
      city: 'Bangalore',
      stateRegion: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      role: 'Usher',
    }),
  });
  if (!createRes.ok) {
    fail('create member', await createRes.text());
    console.log(JSON.stringify(results, null, 2));
    process.exit(1);
  }
  const created = (await createRes.json()) as { data: { id: string; dob?: string } };
  memberId = created.data.id;
  const createdDob = created.data.dob?.slice(0, 10);
  if (createdDob === testDob) pass('create dob', createdDob);
  else fail('create dob', `expected ${testDob}, got ${createdDob}`);

  const dbMember = await prisma.member.findFirst({ where: { id: memberId, tenantId: TENANT } });
  const dbDob = dbMember?.dob?.toISOString().slice(0, 10);
  if (dbDob === testDob) pass('db dob', dbDob!);
  else fail('db dob', `expected ${testDob}, got ${dbDob}`);

  const getRes = await fetch(`${API}/members/${memberId}`, { headers: auth() });
  const fetched = (await getRes.json()) as { data: { dob?: string; addressLine1?: string; city?: string } };
  if (fetched.data.dob?.slice(0, 10) === testDob) pass('get dob', fetched.data.dob.slice(0, 10));
  else fail('get dob', String(fetched.data.dob));
  if (fetched.data.addressLine1 === '12 Test Lane' && fetched.data.city === 'Bangalore') {
    pass('get address', `${fetched.data.addressLine1}, ${fetched.data.city}`);
  } else {
    fail('get address', JSON.stringify(fetched.data));
  }

  const updateDob = '1985-07-22';
  const updateRes = await fetch(`${API}/members/${memberId}`, {
    method: 'PUT',
    headers: auth(),
    body: JSON.stringify({ dob: updateDob, addressLine2: 'Apt 4B', pan: 'ABCDE1234F' }),
  });
  if (!updateRes.ok) {
    fail('update member', await updateRes.text());
  } else {
    const updated = (await updateRes.json()) as { data: { dob?: string; addressLine2?: string; pan?: string } };
    if (updated.data.dob?.slice(0, 10) === updateDob) pass('update dob', updated.data.dob.slice(0, 10));
    else fail('update dob', String(updated.data.dob));
    if (updated.data.addressLine2 === 'Apt 4B' && updated.data.pan === 'ABCDE1234F') {
      pass('update address/pan', updated.data.addressLine2);
    } else fail('update address/pan', JSON.stringify(updated.data));
  }

  const dbAfter = await prisma.member.findFirst({ where: { id: memberId } });
  if (dbAfter?.dob?.toISOString().slice(0, 10) === updateDob) pass('db update dob', updateDob);
  else fail('db update dob', dbAfter?.dob?.toISOString());

  for (const template of ['visitor_declaration', 'member_declaration', 'baptism_certificate'] as const) {
    const docRes = await fetch(`${API}/members/${memberId}/generated-documents`, {
      method: 'POST',
      headers: auth(),
      body: JSON.stringify({
        template,
        candidateDob: updateDob,
        fatherName: 'Test Father',
        motherName: 'Test Mother',
        baptismDate: '2020-06-01',
        baptismPlace: 'Main Sanctuary',
        officiantName: 'Pastor Test',
        witnessName: 'Witness Test',
        date: '2026-06-05',
        prayerRequest: 'Prayer for healing',
      }),
    });
    if (!docRes.ok) {
      fail(`generate ${template}`, await docRes.text());
      continue;
    }
    const docJson = (await docRes.json()) as { data: { fileUrl?: string } };
    const fileUrl = docJson.data.fileUrl || '';
    if (!fileUrl.includes('.html')) {
      fail(`generate ${template}`, `unexpected fileUrl: ${fileUrl}`);
      continue;
    }
    const htmlPath = fileUrl.replace(/^\/uploads\//, '');
    const fs = await import('fs');
    const path = await import('path');
    const full = path.join(process.cwd(), 'uploads', htmlPath);
    if (!fs.existsSync(full)) {
      fail(`generate ${template}`, `file missing: ${full}`);
      continue;
    }
    const html = fs.readFileSync(full, 'utf8');
    const hasProfessional =
      html.includes('trust-header') &&
      html.includes('Playfair Display') &&
      !html.includes('Replace this block');
    if (hasProfessional) pass(`generate ${template}`, 'professional template HTML');
    else fail(`generate ${template}`, 'stub or incomplete HTML detected');
  }

  await prisma.member.delete({ where: { id: memberId } }).catch(() => {});
  pass('cleanup', `deleted test member ${memberId}`);

  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ passed: results.length - failed.length, failed: failed.length, results }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
