/**
 * Warm API latency benchmark for HR staff list + volunteer board (real DB only).
 */
const API_BASE = (process.env.API_BASE || 'http://127.0.0.1:4002/api/v1').replace(/\/$/, '');
const USER = process.env.E2E_USER || 'admin';
const PASS = process.env.E2E_PASS || 'admin123';
const RUNS = Number(process.env.BENCH_RUNS || 12);

async function login() {
  const tenantHeader = process.env.E2E_TENANT_ID || 'default-tenant-id';
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantHeader,
    },
    body: JSON.stringify({ username: USER, password: PASS }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status}`);
  const json = await res.json();
  const token = json?.token || json?.data?.token;
  const tenantId = json?.tenantId || json?.user?.tenantId || json?.data?.tenantId || tenantHeader;
  if (!token) throw new Error('login response missing token');
  return { token, tenantId };
}

async function timedGet(path, headers) {
  const start = performance.now();
  const res = await fetch(`${API_BASE}${path}`, { headers });
  const body = await res.text();
  const ms = Math.round(performance.now() - start);
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${body.slice(0, 200)}`);
  return ms;
}

function stats(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? sorted.at(-1) ?? 0;
  return {
    min: sorted[0] ?? 0,
    max: sorted.at(-1) ?? 0,
    avg: Math.round(sum / sorted.length),
    p50,
    p95,
    samples: sorted,
  };
}

async function benchEndpoint(label, path, headers) {
  // Warmup
  for (let i = 0; i < 2; i += 1) {
    await timedGet(path, headers);
  }
  const samples = [];
  for (let i = 0; i < RUNS; i += 1) {
    samples.push(await timedGet(path, headers));
  }
  return { label, path, ...stats(samples) };
}

async function main() {
  const { token, tenantId } = await login();
  const headers = {
    Authorization: `Bearer ${token}`,
    'x-tenant-id': tenantId,
  };

  const report = {
    apiBase: API_BASE,
    runs: RUNS,
    measuredAt: new Date().toISOString(),
    endpoints: [
      await benchEndpoint('Staff list', '/hr/employment-profiles?page=1&pageSize=25', headers),
      await benchEndpoint('Volunteer board', '/operations/volunteer-board?page=1&pageSize=25', headers),
    ],
    targets: {
      staffListMs: 250,
      volunteerBoardMs: 150,
    },
  };

  for (const ep of report.endpoints) {
    ep.meetsTarget =
      ep.label === 'Staff list'
        ? ep.p50 < report.targets.staffListMs
        : ep.p50 < report.targets.volunteerBoardMs;
  }

  console.log(JSON.stringify(report, null, 2));
}

await main();
