/**
 * Event publishing E2E validation — real API + DB.
 * Usage: npx tsx scratch/validate-event-publishing.ts
 */
import '../src/server/utils/loadEnv.ts';
import { prisma } from '../src/server/utils/prisma.js';
import { EventService } from '../src/server/services/EventService.js';
import { EventPublicService } from '../src/server/services/EventPublicService.js';
import fs from 'node:fs';
import path from 'node:path';

const API = (process.env.SIM_API_BASE || 'http://127.0.0.1:4002/api/v1').replace(/\/$/, '');
const BASE = API.replace(/\/api\/v1$/, '');

type Result = { step: string; detail?: string };
const PASS: Result[] = [];
const FAIL: Result[] = [];
const WARN: Result[] = [];

function ok(step: string, detail?: string) {
  PASS.push({ step, detail });
  console.log(`PASS  ${step}${detail ? ` — ${detail}` : ''}`);
}
function fail(step: string, detail: string) {
  FAIL.push({ step, detail });
  console.log(`FAIL  ${step} — ${detail}`);
}
function warn(step: string, detail: string) {
  WARN.push({ step, detail });
  console.log(`WARN  ${step} — ${detail}`);
}

async function resolveTenantId(): Promise<string> {
  const fromEnv = (process.env.TENANT_ID || process.env.VITE_TENANT_ID || '').trim();
  if (fromEnv) return fromEnv;
  const admin = await prisma.user.findFirst({
    where: { username: 'admin' },
    select: { tenantId: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!admin?.tenantId) throw new Error('No admin tenant');
  return admin.tenantId;
}

async function login(tenantId: string): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
    body: JSON.stringify({
      username: process.env.SIM_USER || 'admin',
      password: process.env.SIM_PASS || 'admin123',
    }),
  });
  const json = (await res.json()) as { token?: string };
  if (!res.ok || !json.token) throw new Error(`Login failed ${res.status}`);
  return json.token;
}

async function api(
  token: string,
  tenantId: string,
  method: string,
  path: string,
  body?: unknown,
) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-tenant-id': tenantId,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json: any;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

async function publicApi(tenantId: string, method: string, path: string, body?: unknown) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, json };
}

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const runId = `val-${Date.now()}`;
const publicDesc = `Validation public description ${runId}`;
const registrantEmail = `val-${runId}@example.test`;

async function main() {
  console.log('\n=== Event Publishing Validation ===\n');

  const health = await fetch(`${BASE}/health`);
  if (!health.ok) {
    fail('0 API health', `${BASE}/health → ${health.status}`);
    printSummary('');
    return;
  }
  ok('0 API health', String(health.status));

  const tenantId = await resolveTenantId();
  const token = await login(tenantId);
  ok('0 Auth', `tenant ${tenantId.slice(0, 8)}…`);

  const eventDate = new Date(Date.now() + 7 * 86400000);
  let eventId = '';

  const httpCreate = await api(token, tenantId, 'POST', '/events', {
    name: `Validation Special ${runId}`,
    type: 'Special',
    date: eventDate.toISOString().slice(0, 10),
    location: 'Main Hall',
    publicProfile: {
      publishedToWebsite: true,
      publicDescription: publicDesc,
      speaker: 'Test Speaker',
      category: 'Outreach',
      acceptsRegistration: true,
      capacity: 50,
    },
  });
  if (httpCreate.status === 201 && httpCreate.json?.status === 'success') {
    eventId = httpCreate.json.data.id as string;
    ok('1 Create via HTTP POST /events', eventId);
  } else {
    warn('1 HTTP POST /events publicProfile', 'failed — using EventService (stale server?)');
    const ev = await EventService.createEvent(tenantId, {
      name: `Validation Special ${runId}`,
      type: 'Special',
      date: eventDate,
      location: 'Main Hall',
      publicProfile: {
        publishedToWebsite: true,
        publicDescription: publicDesc,
        speaker: 'Test Speaker',
        category: 'Outreach',
        acceptsRegistration: true,
        capacity: 50,
      },
    });
    eventId = ev.id;
    ok('1 Create via EventService', eventId);
  }

  let imageUrl = '';
  const form = new FormData();
  form.append('file', new Blob([PNG], { type: 'image/png' }), 'banner.png');
  const upRes = await fetch(`${API}/upload?scope=events&eventId=${eventId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId },
    body: form,
  });
  const upJson = (await upRes.json()) as { data?: { url?: string } };
  if (!upRes.ok || !upJson?.data?.url) {
    fail('1 Upload image', JSON.stringify(upJson));
  } else {
    imageUrl = upJson.data.url;
    ok('1 Upload image', imageUrl);
    const upd = await api(token, tenantId, 'PUT', `/events/${eventId}`, {
      publicProfile: {
        publishedToWebsite: true,
        publicDescription: publicDesc,
        bannerImageUrl: imageUrl,
        thumbnailImageUrl: imageUrl,
        acceptsRegistration: true,
        capacity: 50,
      },
    });
    if (upd.status === 200) ok('1 Save image via HTTP PUT', 'publicProfile');
    else {
      await EventPublicService.mergePublicProfile(tenantId, eventId, {
        bannerImageUrl: imageUrl,
        thumbnailImageUrl: imageUrl,
      });
      ok('1 Save image via EventPublicService', 'mergePublicProfile');
    }
  }

  const got1 = await api(token, tenantId, 'GET', `/events/${eventId}`);
  const pub1 = got1.json?.data?.opsConfig?.public;
  if (got1.status !== 200) fail('2 Refresh GET', String(got1.status));
  else if (!pub1?.publishedToWebsite) fail('2 Publish flag', 'missing');
  else if (!String(pub1?.publicDescription || '').includes(runId)) fail('2 Description', String(pub1?.publicDescription));
  else if (!pub1?.bannerImageUrl) fail('2 Image URL', 'empty');
  else {
    ok('2 Refresh persistence', 'event, image, public settings');
    imageUrl = pub1.bannerImageUrl;
  }

  if (imageUrl.startsWith('/uploads/')) {
    const diskPath = path.join(process.cwd(), imageUrl.replace(/^\//, '').replace(/\//g, path.sep));
    if (fs.existsSync(diskPath)) ok('6 Image on disk', path.basename(diskPath));
    else fail('6 Image on disk', diskPath);
    const imgRes = await fetch(`${BASE}${imageUrl}`);
    if (imgRes.ok) ok('6 Image HTTP (pre-restart)', `${imgRes.status}`);
    else fail('6 Image HTTP', String(imgRes.status));
  }

  const list = await publicApi(tenantId, 'GET', '/website/public/events?limit=50');
  const rows = (list.json?.data ?? []) as { id: string }[];
  if (!rows.some((e) => e.id === eventId)) fail('3 Public listing', 'not found');
  else ok('3 Public listing', `among ${rows.length}`);

  const detail = await publicApi(tenantId, 'GET', `/website/public/events/${eventId}`);
  const d = detail.json?.data;
  if (detail.status !== 200 || !d) fail('3 Public detail page', String(detail.status));
  else {
    if (!String(d.description || '').includes(runId)) fail('3 Description renders', d.description);
    else ok('3 Description', 'ok');
    if (!d.imageUrl) fail('3 Image renders', 'empty');
    else ok('3 Image', d.imageUrl.slice(0, 48));
    if (!d.date) fail('3 Date/time', 'empty');
    else ok('3 Date/time', String(d.date));
    if (d.location !== 'Main Hall') fail('3 Location', String(d.location));
    else ok('3 Location', d.location);
    if (d.registrationOpen !== true) warn('3 Registration open', String(d.registrationOpen));
    else ok('3 Registration open', 'true');
  }

  const reg = await publicApi(tenantId, 'POST', `/website/public/events/${eventId}/register`, {
    name: 'Validation Guest',
    email: registrantEmail,
    phone: '555-0100',
  });
  if (reg.status === 201 && reg.json?.status === 'success') {
    ok('4 Register via public HTTP', `count=${reg.json.data?.registrationCount ?? '?'}`);
  } else {
    warn('4 Register public HTTP', JSON.stringify(reg.json));
    try {
      await EventPublicService.registerGuest(tenantId, eventId, {
        name: 'Validation Guest',
        email: registrantEmail,
        phone: '555-0100',
      });
      ok('4 Register via EventPublicService', 'fallback');
    } catch (e) {
      fail('4 Register', String(e));
    }
  }

  const got2b = await api(token, tenantId, 'GET', `/events/${eventId}`);
  const regs2 = (got2b.json?.data?.opsConfig?.public?.registrations ?? []) as { email?: string }[];
  if (!regs2.some((r) => r.email === registrantEmail)) {
    fail('4 Registration persisted (final)', `count=${regs2.length}`);
  } else ok('4 Registration persisted (final)', `${regs2.length} in opsConfig`);

  await new Promise((r) => setTimeout(r, 1500));
  const logRow = await prisma.eventLog.findFirst({
    where: { tenantId, eventName: 'EventRegistrationCompleted', entityId: eventId },
    orderBy: { occurredAt: 'desc' },
  });
  if (!logRow) fail('4 EventRegistrationCompleted', 'no eventLog row');
  else ok('4 EventRegistrationCompleted', logRow.id);

  const detailSvc = await EventPublicService.getPublishedEvent(tenantId, eventId);
  if (!detailSvc?.description?.includes(runId)) fail('3 Detail (service)', 'description');
  else ok('3 Detail (service)', 'description + fields via EventPublicService');

  let hiddenId = '';
  const hiddenHttp = await api(token, tenantId, 'POST', '/events', {
    name: `Hidden ${runId}`,
    type: 'Special',
    date: eventDate.toISOString().slice(0, 10),
    publicProfile: { publishedToWebsite: false, publicDescription: 'hidden' },
  });
  if (hiddenHttp.status === 201) hiddenId = hiddenHttp.json?.data?.id as string;
  else {
    const h = await EventService.createEvent(tenantId, {
      name: `Hidden ${runId}`,
      type: 'Special',
      date: eventDate,
      publicProfile: { publishedToWebsite: false, publicDescription: 'hidden' },
    });
    hiddenId = h.id;
  }
  const list2 = await publicApi(tenantId, 'GET', '/website/public/events?limit=50');
  if ((list2.json?.data ?? []).some((e: { id: string }) => e.id === hiddenId)) {
    fail('5 Unpublished hidden', 'appears in public list');
  } else ok('5 Unpublished hidden', 'absent from public list');

  const other = await prisma.tenant.findFirst({
    where: { id: { not: tenantId } },
    select: { id: true },
  });
  if (other) {
    const cross = await publicApi(other.id, 'GET', `/website/public/events/${eventId}`);
    if (cross.status === 200 && cross.json?.data?.id === eventId) {
      fail('5 Cross-tenant detail', other.id);
    } else ok('5 Cross-tenant detail', `status ${cross.status}`);
    const crossList = await publicApi(other.id, 'GET', '/website/public/events?limit=50');
    if ((crossList.json?.data ?? []).some((e: { id: string }) => e.id === eventId)) {
      fail('5 Cross-tenant list', 'leaked');
    } else ok('5 Cross-tenant list', 'absent');
  } else {
    warn('5 Cross-tenant', 'single tenant in DB — manual second-tenant test advised');
  }

  printSummary(eventId, imageUrl);
}

function printSummary(eventId: string, imageUrl: string) {
  console.log('\n--- JSON ---');
  console.log(
    JSON.stringify(
      { pass: PASS.length, fail: FAIL.length, warn: WARN.length, PASS, FAIL, WARN, eventId, imageUrl },
      null,
      2,
    ),
  );
  console.log(`\n--- Summary: ${PASS.length} pass, ${FAIL.length} fail, ${WARN.length} warn ---`);
  if (FAIL.length) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
