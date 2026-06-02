/** Single cold-hit latency (no warmup) for staff + volunteer APIs. */
const API_BASE = (process.env.API_BASE || 'http://127.0.0.1:4002/api/v1').replace(/\/$/, '');
const tenantId = process.env.E2E_TENANT_ID || 'default-tenant-id';

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
    body: JSON.stringify({ username: process.env.E2E_USER || 'admin', password: process.env.E2E_PASS || 'admin123' }),
  });
  const json = await res.json();
  return { token: json.token, tenantId: json.tenantId || tenantId };
}

async function cold(path, headers) {
  const start = performance.now();
  const res = await fetch(`${API_BASE}${path}`, { headers });
  await res.json();
  return { path, ms: Math.round(performance.now() - start), status: res.status };
}

const { token, tenantId: tid } = await login();
const headers = { Authorization: `Bearer ${token}`, 'x-tenant-id': tid };
console.log(JSON.stringify({
  cold: [
    await cold('/hr/employment-profiles?page=1&pageSize=25', headers),
    await cold('/operations/volunteer-board?page=1&pageSize=25', headers),
  ],
}, null, 2));
