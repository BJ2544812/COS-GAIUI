#!/usr/bin/env node

const TENANT = process.env.E2E_TENANT_ID || 'default-tenant-id';
const BASE = process.env.E2E_API_BASE_URL || 'http://127.0.0.1:4002/api/v1';

async function main() {
  const login = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': TENANT },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const { token } = await login.json();
  const h = { Authorization: `Bearer ${token}`, 'x-tenant-id': TENANT };
  for (const path of [
    'website/pages',
    'website/sermons',
    'website/events?limit=30',
    'website/structure/ministries',
    'website/giving/campaigns',
    'website/structure/campuses',
    'website/public/leadership',
  ]) {
    const res = await fetch(`${BASE}/${path}`, { headers: h });
    const text = await res.text();
    console.log(path, res.status, text.slice(0, 200));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
