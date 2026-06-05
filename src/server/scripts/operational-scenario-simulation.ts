/**
 * Full operational church-life simulation on EXISTING data (no DB reset).
 * Configures tenant as HIF Eco Park Church and exercises modules end-to-end via API.
 *
 * Usage: npm run simulate:church
 * Requires API: http://127.0.0.1:4002
 */
import '../utils/loadEnv.ts';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../utils/prisma.js';

const API = (process.env.SIM_API_BASE || 'http://127.0.0.1:4002/api/v1').replace(/\/$/, '');
const CHURCH = 'HIF Eco Park Church';
const SIM = 'hif-ecopark-sim';
const REPORT_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../FULL_OPERATIONAL_SCENARIO_REPORT.md',
);

type PhaseResult = {
  phase: string;
  step: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  detail?: string;
};

const results: PhaseResult[] = [];
const issues: { id?: string; phase: string; summary: string; detail: string }[] = [];

function record(phase: string, step: string, status: PhaseResult['status'], detail?: string) {
  results.push({ phase, step, status, detail });
  const icon = status === 'PASS' ? '✓' : status === 'WARN' ? '⚠' : status === 'SKIP' ? '○' : '✗';
  console.log(`  ${icon} [${phase}] ${step}${detail ? ` — ${detail}` : ''}`);
  if (status === 'FAIL') {
    issues.push({ phase, summary: step, detail: detail || 'failed' });
  }
}

async function resolveTenantId(): Promise<string> {
  const fromEnv = (process.env.TENANT_ID || process.env.VITE_TENANT_ID || '').trim();
  if (fromEnv) return fromEnv;
  const admin = await prisma.user.findFirst({
    where: { username: 'admin' },
    select: { tenantId: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!admin?.tenantId) throw new Error('No admin tenant — seed first.');
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
  const json = (await res.json()) as { token?: string; tenantId?: string };
  if (!res.ok || !json.token) throw new Error(`Login failed (${res.status})`);
  return json.token;
}

async function api(
  token: string,
  tenantId: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; json: any }> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-tenant-id': tenantId,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function findMemberByEmail(tenantId: string, email: string) {
  return prisma.member.findFirst({ where: { tenantId, email } });
}

async function upsertMember(
  token: string,
  tenantId: string,
  spec: { name: string; email: string; role: string; growthStage?: string; familyId?: string },
) {
  const existing = await findMemberByEmail(tenantId, spec.email);
  if (existing) return existing.id;
  const { status, json } = await api(token, tenantId, 'POST', '/members', {
    name: spec.name,
    email: spec.email,
    phone: '+91 98765 43210',
    role: spec.role,
    status: 'Active',
    growthStage: spec.growthStage || 'Member',
    familyId: spec.familyId,
  });
  if (status >= 200 && status < 300 && json?.data?.id) return json.data.id as string;
  throw new Error(`create member ${spec.email}: ${status} ${JSON.stringify(json?.error ?? json)}`);
}

async function findEventByName(tenantId: string, name: string) {
  return prisma.event.findFirst({ where: { tenantId, name: { contains: name } } });
}

async function main() {
  console.log('\n[simulate] Kingdom Church OS — full operational scenario (no DB reset)\n');
  console.log(`[simulate] Church profile: ${CHURCH}\n`);

  const health = await fetch(`${API.replace(/\/api\/v1$/, '')}/health`);
  if (!health.ok) {
    console.error('[simulate] API not reachable. Start: npm run dev:server');
    process.exit(1);
  }

  const tenantId = await resolveTenantId();
  const token = await login(tenantId);
  const hdr = { token, tenantId };

  // ── Phase 1: Church installation simulation ─────────────────────────────
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { name: CHURCH, domain: 'hifecopark.local' },
  });
  record('1 Install', 'Tenant renamed to HIF Eco Park Church', 'PASS');

  const settingsPayload = {
    organization: {
      name: CHURCH,
      tagline: 'Growing together in faith at Eco Park',
      address: 'HIF Eco Park Campus, Sector V, Kolkata, West Bengal 700091',
      phone: '+91 33 4012 8800',
      email: 'office@hifecopark.org',
      registrationNumber: 'WB-CH-2024-0891',
    },
    branding: {
      primaryColor: '#1E3A5F',
      secondaryColor: '#C9A227',
      publicTagline: 'Welcome home — worship, grow, serve',
      themeMode: 'light' as const,
    },
    system: { timezone: 'Asia/Kolkata', dateFormat: 'DD/MM/YYYY' as const, language: 'en' as const },
    paymentGateway: { onlineGivingEnabled: true, primaryGateway: 'cashfree' as const, cashfreeEnvironment: 'sandbox' as const },
  };
  const settingsSave = await api(hdr.token, hdr.tenantId, 'POST', '/settings', settingsPayload);
  if (settingsSave.status >= 200 && settingsSave.status < 300) {
    record('1 Install', 'Operational settings saved (org + branding)', 'PASS');
  } else {
    record('1 Install', 'Settings save', 'FAIL', `${settingsSave.status}`);
  }

  const settingsGet = await api(hdr.token, hdr.tenantId, 'GET', '/settings');
  const orgName =
    settingsGet.json?.structured?.organization?.name ??
    settingsGet.json?.data?.organization?.name;
  if (orgName === CHURCH) record('1 Install', 'Settings persist (organization name)', 'PASS');
  else record('1 Install', 'Settings persist', 'WARN', `got: ${orgName}`);

  await prisma.setting.upsert({
    where: { tenantId_key: { tenantId, key: 'license_entitlements' } },
    create: {
      tenantId,
      key: 'license_entitlements',
      value: JSON.stringify({
        plan: 'pilot-ministry',
        modules: ['members', 'events', 'attendance', 'giving', 'finance', 'website', 'operations', 'communication'],
        issuedTo: CHURCH,
        validThrough: '2027-12-31',
      }),
    },
    update: {
      value: JSON.stringify({
        plan: 'pilot-ministry',
        modules: ['members', 'events', 'attendance', 'giving', 'finance', 'website', 'operations', 'communication'],
        issuedTo: CHURCH,
        validThrough: '2027-12-31',
      }),
    },
  });
  const license = await api(hdr.token, hdr.tenantId, 'GET', '/deploy/license');
  if (license.status === 200 && license.json?.data?.modules?.length) {
    record('1 Install', 'License entitlements active', 'PASS', license.json.data.plan);
  } else record('1 Install', 'License entitlements', 'WARN', String(license.status));

  const onboarding = await api(hdr.token, hdr.tenantId, 'GET', '/deploy/onboarding');
  if (onboarding.status === 200) {
    record('1 Install', 'Onboarding checklist loads', 'PASS', `${onboarding.json?.data?.completedCount ?? '?'}/${onboarding.json?.data?.totalCount ?? '?'}`);
  } else record('1 Install', 'Onboarding checklist', 'FAIL', String(onboarding.status));

  const pubSettings = await fetch(`${API}/website/public/settings`, {
    headers: { 'x-tenant-id': tenantId },
  });
  const pubJson = await pubSettings.json().catch(() => null);
  const pubName = pubJson?.data?.organization?.name;
  if (pubSettings.ok && (pubName === CHURCH || pubName?.includes('HIF'))) {
    record('1 Install', 'Public website settings reflect church', 'PASS');
  } else {
    record('1 Install', 'Public website settings', 'WARN', `name=${pubName}`);
  }

  // ── Phase 2: Members & families ─────────────────────────────────────────
  let familyId: string | undefined;
  const existingFamily = await prisma.family.findFirst({
    where: { tenantId, name: `${SIM} Nair Household` },
  });
  if (existingFamily) familyId = existingFamily.id;
  else {
    const famRes = await api(hdr.token, hdr.tenantId, 'POST', '/families', {
      name: `${SIM} Nair Household`,
      addressLine1: '12 Palm Grove, Eco Park',
      city: 'Kolkata',
      stateRegion: 'West Bengal',
      postalCode: '700091',
      country: 'India',
    });
    if (famRes.status >= 200 && famRes.status < 300) {
      familyId = famRes.json?.data?.id;
      record('2 Members', 'Nair household created', 'PASS');
    } else record('2 Members', 'Household create', 'FAIL', `${famRes.status}`);
  }

  const members = [
    { name: 'Ravi Nair', email: `${SIM}.ravi@${'hifecopark.org'}`, role: 'Adult Member', growthStage: 'Member' },
    { name: 'Priya Nair', email: `${SIM}.priya@${'hifecopark.org'}`, role: 'Adult Member', growthStage: 'Member' },
    { name: 'Arjun Nair', email: `${SIM}.arjun@${'hifecopark.org'}`, role: 'Youth', growthStage: 'Youth' },
    { name: 'Meera Thomas', email: `${SIM}.meera@${'hifecopark.org'}`, role: 'Volunteer Coordinator', growthStage: 'Leader' },
    { name: 'David Kurian', email: `${SIM}.finance@${'hifecopark.org'}`, role: 'Finance Steward', growthStage: 'Leader' },
    { name: 'Sarah Mathew', email: `${SIM}.worship@${'hifecopark.org'}`, role: 'Worship Leader', growthStage: 'Leader' },
    { name: 'James Paul', email: `${SIM}.campus@${'hifecopark.org'}`, role: 'Campus Coordinator', growthStage: 'Leader' },
  ];
  const memberIds: string[] = [];
  for (const m of members) {
    try {
      const id = await upsertMember(hdr.token, hdr.tenantId, {
        ...m,
        familyId: m.name.includes('Nair') ? familyId : undefined,
      });
      memberIds.push(id);
      record('2 Members', `Member: ${m.name}`, 'PASS');
    } catch (e) {
      record('2 Members', `Member: ${m.name}`, 'FAIL', e instanceof Error ? e.message : String(e));
    }
  }

  if (memberIds[0] && familyId) {
    const link = await api(hdr.token, hdr.tenantId, 'POST', `/members/${memberIds[0]}/family/link`, { familyId });
    if (link.status >= 200 && link.status < 300) record('2 Members', 'Parent/child family linkage', 'PASS');
    else record('2 Members', 'Family link API', 'WARN', String(link.status));
  }

  const familiesList = await api(hdr.token, hdr.tenantId, 'GET', '/families');
  if (familiesList.status === 200 && Array.isArray(familiesList.json?.data) && familiesList.json.data.length > 0) {
    record('2 Members', 'Families directory', 'PASS', `${familiesList.json.data.length} households`);
  } else record('2 Members', 'Families directory', 'FAIL');

  const pathways = await api(hdr.token, hdr.tenantId, 'GET', '/structure/pathways');
  if (pathways.status === 200) record('2 Members', 'Discipleship pathways list', 'PASS');
  else record('2 Members', 'Pathways', 'WARN', String(pathways.status));

  // ── Phase 3: Pastoral & shepherd ────────────────────────────────────────
  const careDash = await api(hdr.token, hdr.tenantId, 'GET', '/care/dashboard');
  if (careDash.status === 200) record('3 Pastoral', 'Prayer & care dashboard', 'PASS');
  else record('3 Pastoral', 'Care dashboard', 'WARN', String(careDash.status));

  if (memberIds[0]) {
    const note = await api(hdr.token, hdr.tenantId, 'POST', `/members/${memberIds[0]}/care-notes`, {
      note: `${SIM}: Follow-up after Sunday — family doing well, schedule home visit.`,
      date: new Date().toISOString(),
    });
    if (note.status >= 200 && note.status < 300) record('3 Pastoral', 'Shepherd care note on member', 'PASS');
    else record('3 Pastoral', 'Care note create', 'FAIL', String(note.status));

    const careCase = await api(hdr.token, hdr.tenantId, 'POST', '/discipleship/v2/care-cases', {
      memberId: memberIds[0],
      category: 'Pastoral follow-up',
      urgency: 'MEDIUM',
      confidentialityLevel: 'PASTORAL',
    });
    if (careCase.status >= 200 && careCase.status < 300) record('3 Pastoral', 'Care case opened', 'PASS');
    else record('3 Pastoral', 'Care case', 'WARN', String(careCase.status));
  }

  const commHub = await api(hdr.token, hdr.tenantId, 'GET', '/communication/hub');
  if (commHub.status === 200) record('3 Pastoral', 'Communication hub', 'PASS');
  else record('3 Pastoral', 'Communication hub', 'WARN', String(commHub.status));

  const notifs = await api(hdr.token, hdr.tenantId, 'GET', '/notifications');
  if (notifs.status === 200) record('3 Pastoral', 'Notifications inbox', 'PASS');
  else record('3 Pastoral', 'Notifications', 'WARN', String(notifs.status));

  // ── Phase 4: Events & Sunday operations ─────────────────────────────────
  const eventSpecs = [
    { name: `${SIM} Sunday Worship Gathering`, type: 'Service', days: 7 },
    { name: `${SIM} Friday Worship Night`, type: 'Worship', days: 5 },
    { name: `${SIM} Youth Alive Night`, type: 'Youth', days: 14 },
    { name: `${SIM} Kingdom Conference 2026`, type: 'Conference', days: 45 },
  ];
  const eventIds: string[] = [];
  for (const ev of eventSpecs) {
    let id = (await findEventByName(tenantId, ev.name))?.id;
    if (!id) {
      const start = new Date();
      start.setDate(start.getDate() + ev.days);
      const created = await api(hdr.token, hdr.tenantId, 'POST', '/events', {
        name: ev.name,
        type: ev.type,
        date: start.toISOString(),
        location: 'HIF Eco Park Main Auditorium',
        internalNotes: `Operational simulation event for ${CHURCH}`,
      });
      if (created.status >= 200 && created.status < 300) id = created.json?.data?.id;
      else {
        record('4 Events', ev.name, 'FAIL', `${created.status}`);
        continue;
      }
    }
    if (id) {
      eventIds.push(id);
      record('4 Events', ev.name, 'PASS');
      const ws = await api(hdr.token, hdr.tenantId, 'GET', `/events/${id}/workspace`);
      if (ws.status === 200) record('4 Events', `Workspace: ${ev.type}`, 'PASS');
      else record('4 Events', `Workspace: ${ev.type}`, 'WARN', String(ws.status));
    }
  }

  const cmd = await api(hdr.token, hdr.tenantId, 'GET', '/operations/command-center');
  if (cmd.status === 200) record('4 Events', 'Command center (Sunday ops)', 'PASS');
  else record('4 Events', 'Command center', 'FAIL', String(cmd.status));

  if (eventIds[0]) {
    const live = await api(hdr.token, hdr.tenantId, 'GET', `/events/${eventIds[0]}/live-ops`);
    if (live.status === 200) record('4 Events', 'Live ops / run sheet API', 'PASS');
    else record('4 Events', 'Live ops', 'WARN', String(live.status));
  }

  const attSessions = await api(hdr.token, hdr.tenantId, 'GET', '/attendance/sessions');
  if (attSessions.status === 200) record('4 Events', 'Attendance sessions', 'PASS');
  else record('4 Events', 'Attendance sessions', 'WARN', String(attSessions.status));

  // ── Phase 5: Worship & outreach ─────────────────────────────────────────
  const volBoard = await api(hdr.token, hdr.tenantId, 'GET', '/operations/volunteer-board');
  if (volBoard.status === 200) record('5 Ministry', 'Volunteer coordination board', 'PASS');
  else record('5 Ministry', 'Volunteer board', 'WARN', String(volBoard.status));

  const ministries = await api(hdr.token, hdr.tenantId, 'GET', '/website/structure/ministries');
  if (ministries.status === 200) record('5 Ministry', 'Ministry structure for worship', 'PASS');
  else record('5 Ministry', 'Ministries', 'WARN', String(ministries.status));

  const outreach = await api(hdr.token, hdr.tenantId, 'GET', '/outreach/dashboard');
  if (outreach.status === 200) record('5 Ministry', 'Outreach dashboard', 'PASS');
  else record('5 Ministry', 'Outreach dashboard', 'WARN', String(outreach.status));

  const visitor = await api(hdr.token, hdr.tenantId, 'POST', '/outreach/visitors', {
    name: `${SIM} Visitor — Ananya Das`,
    phone: '+91 99887 76655',
    visitDate: new Date().toISOString(),
    notes: 'First visit during Sunday service; requested follow-up call.',
  });
  if (visitor.status >= 200 && visitor.status < 300) record('5 Ministry', 'Visitor registration', 'PASS');
  else record('5 Ministry', 'Visitor registration', 'WARN', String(visitor.status));

  // ── Phase 6: Finance & giving ───────────────────────────────────────────
  const accounts = await api(hdr.token, hdr.tenantId, 'GET', '/finance/accounts');
  const acctRows = Array.isArray(accounts.json?.data) ? accounts.json.data : [];
  if (accounts.status === 200 && acctRows.length > 0) {
    record('6 Finance', 'Chart of accounts', 'PASS', `${acctRows.length} accounts`);
  } else record('6 Finance', 'Chart of accounts', 'FAIL');

  const debit = acctRows.find((a: any) => a.type === 'Asset' && a.isActive);
  const credit = acctRows.find((a: any) => a.type === 'Revenue' && a.isActive);
  const ref = `${SIM}-offering-${Date.now()}`;
  if (debit && credit) {
    const donation = await api(hdr.token, hdr.tenantId, 'POST', '/giving/donations', {
      amount: 2500,
      method: 'Bank Transfer',
      date: new Date().toISOString(),
      reference: ref,
      debitAccountId: debit.id,
      creditAccountId: credit.id,
      notes: `${SIM} Sunday offering batch`,
    });
    if (donation.status >= 200 && donation.status < 300) {
      record('6 Finance', 'Offering recorded with GL linkage', 'PASS', ref);
      const list = await api(hdr.token, hdr.tenantId, 'GET', '/giving/donations');
      const found = (list.json?.data ?? []).some((d: any) => d.reference === ref || String(d.amount) === '2500');
      if (found) record('6 Finance', 'Donation persists in ledger list', 'PASS');
      else record('6 Finance', 'Donation list lookup', 'WARN');
    } else record('6 Finance', 'Offering record', 'FAIL', `${donation.status}`);
  }

  const vendors = await api(hdr.token, hdr.tenantId, 'GET', '/finance/vendors');
  if (vendors.status === 200) record('6 Finance', 'Vendor workspace API', 'PASS');
  else record('6 Finance', 'Vendors', 'WARN', String(vendors.status));

  const budgets = await api(hdr.token, hdr.tenantId, 'GET', '/finance/budgets');
  if (budgets.status === 200) record('6 Finance', 'Budget workspace API', 'PASS');
  else record('6 Finance', 'Budgets', 'WARN', String(budgets.status));

  const assets = await api(hdr.token, hdr.tenantId, 'GET', '/assets');
  if (assets.status === 200) record('6 Finance', 'Assets registry', 'PASS');
  else record('6 Finance', 'Assets', 'WARN', String(assets.status));

  const docs = await api(hdr.token, hdr.tenantId, 'GET', '/documents');
  if (docs.status === 200) record('6 Finance', 'Compliance documents list', 'PASS');
  else record('6 Finance', 'Documents', 'WARN', String(docs.status));

  const gw = await api(hdr.token, hdr.tenantId, 'GET', '/giving/payment-gateway');
  if (gw.status === 200) record('6 Finance', 'Cashfree gateway config surface', 'PASS');
  else record('6 Finance', 'Payment gateway', 'WARN', String(gw.status));

  // ── Phase 7: Website & communication ────────────────────────────────────
  const pages = await api(hdr.token, hdr.tenantId, 'GET', '/website/pages');
  if (pages.status === 200) record('7 Website', 'Website pages admin', 'PASS');
  else record('7 Website', 'Pages admin', 'WARN', String(pages.status));

  const sermonTitle = `${SIM} Sermon — Walking in Faith`;
  let sermonId: string | undefined;
  const sermons = await api(hdr.token, hdr.tenantId, 'GET', '/website/sermons');
  const existingSermon = (sermons.json?.data ?? []).find((s: any) => s.title === sermonTitle);
  if (existingSermon?.id) sermonId = existingSermon.id;
  else {
    const created = await api(hdr.token, hdr.tenantId, 'POST', '/website/sermons', {
      title: sermonTitle,
      speaker: 'Pastor Ravi Nair',
      date: new Date().toISOString(),
      description: 'Message from Sunday worship at HIF Eco Park.',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      isPublished: true,
    });
    if (created.status >= 200 && created.status < 300) {
      sermonId = created.json?.data?.id;
      record('7 Website', 'Sermon published to library', 'PASS');
    } else record('7 Website', 'Sermon create', 'WARN', String(created.status));
  }

  const pubHdr = { 'x-tenant-id': tenantId };
  const pubEvents = await fetch(`${API}/website/public/events`, { headers: pubHdr });
  if (pubEvents.ok) record('7 Website', 'Public events feed', 'PASS');
  else record('7 Website', 'Public events', 'WARN', String(pubEvents.status));

  const pubSermons = await fetch(`${API}/website/public/sermons`, { headers: pubHdr });
  if (pubSermons.ok) record('7 Website', 'Public sermons feed', 'PASS');
  else record('7 Website', 'Public sermons', 'WARN', String(pubSermons.status));

  const campaigns = await fetch(`${API}/website/public/campaigns`, { headers: pubHdr });
  if (campaigns.ok) record('7 Website', 'Public giving campaigns', 'PASS');
  else record('7 Website', 'Public campaigns', 'WARN', String(campaigns.status));

  // ── Phase 8: Platform session & infra ───────────────────────────────────
  const me = await api(hdr.token, hdr.tenantId, 'GET', '/auth/me');
  if (me.status === 200 && (me.json?.user?.username || me.json?.data?.username)) {
    record('8 Platform', 'Session /auth/me', 'PASS');
  } else record('8 Platform', 'Session /auth/me', 'FAIL', String(me.status));

  const infra = await api(hdr.token, hdr.tenantId, 'GET', '/deploy/infrastructure');
  if (infra.status === 200) {
    const probes = infra.json?.data?.probes ?? infra.json?.probes ?? [];
    const redis = probes.find((p: any) => p.name === 'redis');
    record('8 Platform', 'Infrastructure probes', 'PASS', redis?.status ?? 'n/a');
    if (redis?.status === 'degraded') {
      record('8 Platform', 'Redis (pilot VPS)', 'WARN', redis.detail);
    }
  } else record('8 Platform', 'Infrastructure', 'WARN', String(infra.status));

  const backupList = await api(hdr.token, hdr.tenantId, 'GET', '/deploy/backups');
  if (backupList.status === 200) record('8 Platform', 'Backup registry', 'PASS');
  else record('8 Platform', 'Backups list', 'WARN', String(backupList.status));

  // ── Report ──────────────────────────────────────────────────────────────
  const pass = results.filter((r) => r.status === 'PASS').length;
  const fail = results.filter((r) => r.status === 'FAIL').length;
  const warn = results.filter((r) => r.status === 'WARN').length;

  const classify = (fails: number, warns: number): 'READY' | 'WARNING' | 'BLOCKED' => {
    if (fails > 0) return fails >= 3 ? 'BLOCKED' : 'WARNING';
    if (warns > 5) return 'WARNING';
    return 'READY';
  };

  const domains = {
    operations: classify(
      results.filter((r) => r.phase.startsWith('4') && r.status === 'FAIL').length,
      results.filter((r) => r.phase.startsWith('4') && r.status === 'WARN').length,
    ),
    finance: classify(
      results.filter((r) => r.phase.startsWith('6') && r.status === 'FAIL').length,
      results.filter((r) => r.phase.startsWith('6') && r.status === 'WARN').length,
    ),
    worship: classify(
      results.filter((r) => r.phase.startsWith('5') && r.status === 'FAIL').length,
      results.filter((r) => r.phase.startsWith('5') && r.status === 'WARN').length,
    ),
    outreach: domainsOutreach(results),
    website: classify(
      results.filter((r) => r.phase.startsWith('7') && r.status === 'FAIL').length,
      results.filter((r) => r.phase.startsWith('7') && r.status === 'WARN').length,
    ),
    communications: classify(
      results.filter((r) => r.phase === '3 Pastoral' && r.status === 'FAIL').length,
      results.filter((r) => r.phase === '3 Pastoral' && r.status === 'WARN').length,
    ),
    deployments: classify(
      results.filter((r) => r.phase.startsWith('8') && r.status === 'FAIL').length,
      results.filter((r) => r.phase.startsWith('8') && r.status === 'WARN').length,
    ),
    members: classify(
      results.filter((r) => r.phase.startsWith('2') && r.status === 'FAIL').length,
      results.filter((r) => r.phase.startsWith('2') && r.status === 'WARN').length,
    ),
    onboarding: classify(
      results.filter((r) => r.phase.startsWith('1') && r.status === 'FAIL').length,
      results.filter((r) => r.phase.startsWith('1') && r.status === 'WARN').length,
    ),
  };

  function domainsOutreach(r: PhaseResult[]) {
    const f = r.filter((x) => x.phase.startsWith('5') && x.status === 'FAIL').length;
    const w = r.filter((x) => x.phase.startsWith('5') && x.status === 'WARN').length;
    return classify(f, w);
  }

  const overall =
    fail > 0
      ? fail >= 3
        ? 'BLOCKED'
        : 'WARNING'
      : warn > 0 && results.some((r) => r.step.includes('Redis'))
        ? 'WARNING'
        : warn > 3
          ? 'WARNING'
          : 'READY';

  const md = buildReportMd({
    church: CHURCH,
    tenantId,
    pass,
    fail,
    warn,
    overall,
    domains,
    results,
    issues,
  });
  writeFileSync(REPORT_PATH, md, 'utf8');

  console.log(`\n[simulate] ${pass} pass, ${warn} warn, ${fail} fail`);
  console.log(`[simulate] Overall: ${overall}`);
  console.log(`[simulate] Report: ${REPORT_PATH}\n`);

  process.exit(fail > 0 ? 1 : 0);
}

function buildReportMd(input: {
  church: string;
  tenantId: string;
  pass: number;
  fail: number;
  warn: number;
  overall: string;
  domains: Record<string, string>;
  results: PhaseResult[];
  issues: { phase: string; summary: string; detail: string }[];
}): string {
  const date = new Date().toISOString().slice(0, 10);
  const domainTable = Object.entries(input.domains)
    .map(([k, v]) => `| ${k} | **${v}** |`)
    .join('\n');

  const steps = input.results
    .map((r) => `| ${r.phase} | ${r.step} | ${r.status} | ${r.detail ?? ''} |`)
    .join('\n');

  const issueBlock =
    input.issues.length === 0
      ? '_No hard failures in API simulation._'
      : input.issues.map((i) => `- **${i.phase}** — ${i.summary}: ${i.detail}`).join('\n');

  return `# Full Operational Scenario Report — ${input.church}

**Date:** ${date}  
**Mode:** Live simulation on existing database (no reset)  
**Tenant:** \`${input.tenantId}\`  
**Script:** \`npm run simulate:church\`

## Executive summary

| Metric | Value |
|--------|-------|
| Steps executed | ${input.results.length} |
| Pass | ${input.pass} |
| Warn | ${input.warn} |
| Fail | ${input.fail} |
| **Overall platform** | **${input.overall}** |

## Domain readiness

| Domain | Status |
|--------|--------|
${domainTable}

## Issues requiring stabilization log entry

${issueBlock}

## Phase-by-phase results

| Phase | Step | Status | Detail |
|-------|------|--------|--------|
${steps}

## Recommended follow-up

1. Run UI click-test: \`PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test e2e/frontend-operational-qa.spec.ts e2e/navigation-sweep.spec.ts e2e/deep-workflows.spec.ts\`
2. Run \`npm run stabilization:gate\` before any fix merge.
3. Log new pilot friction in \`STABILIZATION_BUG_LOG.md\`.
4. On VPS: set \`REDIS_URL\`, HTTPS, Cashfree webhook, MinIO/uploads per \`PILOT_SUPPORT.md\`.

---
_Generated by operational-scenario-simulation.ts_
`;
}

main().catch((e) => {
  console.error('[simulate] Fatal:', e);
  process.exit(1);
});
