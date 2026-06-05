/**
 * Member field save/retrieve audit — run: npx tsx scratch/member-save-audit.ts
 */
import { prisma } from '../src/server/utils/prisma.js';

const API = 'http://127.0.0.1:4002/api/v1';
const TENANT = process.env.VITE_TENANT_ID || 'default-tenant-id';

type Row = { field: string; save: string; retrieve: string; update: string; status: string };

const rows: Row[] = [];

function row(field: string, save: string, retrieve: string, update: string, ok: boolean) {
  rows.push({ field, save: save || '—', retrieve: retrieve || '—', update: update || '—', status: ok ? 'PASS' : 'FAIL' });
}

async function main() {
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': TENANT },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  if (!loginRes.ok) throw new Error('Login failed');
  const { token } = (await loginRes.json()) as { token: string };
  const auth = () => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-tenant-id': TENANT,
  });

  const createRes = await fetch(`${API}/members`, {
    method: 'POST',
    headers: auth(),
    body: JSON.stringify({
      name: `Audit ${Date.now()}`,
      email: `audit-${Date.now()}@test.local`,
      phone: '9000000001',
      dob: '1992-08-20T12:00:00.000Z',
      membershipDate: '2023-01-15T12:00:00.000Z',
      growthStage: 'Member',
      gender: 'Female',
      addressLine1: '1 Audit Street',
      city: 'Chennai',
      stateRegion: 'Tamil Nadu',
      postalCode: '600001',
      pan: 'AAAAA1111A',
    }),
  });
  const created = (await createRes.json()) as { data: Record<string, unknown> };
  const id = String(created.data.id);

  const checks: [string, unknown, keyof typeof created.data][] = [
    ['name', created.data.name, 'name'],
    ['email', created.data.email, 'email'],
    ['phone', created.data.phone, 'phone'],
    ['dob', '1992-08-20', 'dob'],
    ['membershipDate', '2023-01-15', 'membershipDate'],
    ['gender', 'Female', 'gender'],
    ['addressLine1', '1 Audit Street', 'addressLine1'],
    ['city', 'Chennai', 'city'],
    ['pan', 'AAAAA1111A', 'pan'],
  ];

  for (const [field, expected, key] of checks) {
    const val = created.data[key];
    const s = typeof val === 'string' && (field.includes('Date') || field === 'dob')
      ? val.slice(0, 10)
      : String(val ?? '');
    const exp = String(expected).slice(0, 10);
    row(field, String(expected), s, '—', s.includes(exp) || s === String(expected));
  }

  const upd = await fetch(`${API}/members/${id}`, {
    method: 'PUT',
    headers: auth(),
    body: JSON.stringify({
      growthStage: 'Volunteer',
      addressLine2: 'Block B',
      dob: '1992-09-01',
    }),
  });
  const updated = (await upd.json()) as { data: Record<string, unknown> };
  row('growthStage (partial update)', 'Volunteer', String(updated.data.growthStage), 'Volunteer', updated.data.growthStage === 'Volunteer');
  row('dob (partial update preserves)', '1992-09-01', String(updated.data.dob).slice(0, 10), '1992-09-01', String(updated.data.dob).slice(0, 10) === '1992-09-01');
  row('addressLine2 (update)', 'Block B', String(updated.data.addressLine2 ?? ''), 'Block B', updated.data.addressLine2 === 'Block B');

  const db = await prisma.member.findFirst({ where: { id } });
  row('DB sync dob', String(updated.data.dob).slice(0, 10), db?.dob?.toISOString().slice(0, 10) ?? '', '—', db?.dob?.toISOString().slice(0, 10) === String(updated.data.dob).slice(0, 10));

  await prisma.member.delete({ where: { id } }).catch(() => {});

  const failed = rows.filter((r) => r.status === 'FAIL');
  console.log(JSON.stringify({ summary: `${rows.length - failed.length}/${rows.length} passed`, rows }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
