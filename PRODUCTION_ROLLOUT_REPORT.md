# Production Rollout & Real User Validation Report

**Mode:** Controlled production rollout (stabilization only — no architecture expansion)  
**Version:** 1.0.0  
**Date:** 2026-05-20  
**Status:** **READY** for staged rollout (local/staging validated; production infra checklist below)

---

## Executive summary

Kingdom Church OS is in **feature-complete, V1-stable** state. This pass confirms runtime gates, role-based access patterns, Sunday/admin operational APIs, and documents deployment + demo procedures. Work is limited to **bug fixes, UAT tooling, and rollout docs** — not new modules.

---

## Phase 1 — Real user testing

### 1.1 Role-based testing

| Role | Username | Password | Permissions (summary) | Nav smoke |
|------|----------|----------|------------------------|-----------|
| Super Admin | `admin` | `admin123` | Full | `e2e/smoke.spec.ts` |
| Pastor | `pastor` | `demo123` | Members, discipleship, communication | `e2e/production-rollout.spec.ts` |
| Worship Leader | `worship` | `demo123` | Events, attendance | rollout spec |
| Volunteer Coordinator | `volunteers` | `demo123` | Members, events, attendance | seed only |
| Finance Admin | `finance` | `demo123` | Finance, giving, vouchers | rollout spec |
| Church Secretary | `secretary` | `demo123` | Members, communication, documents | rollout spec |
| Event Manager | `events` | `demo123` | Events, attendance | rollout spec |
| Campus Admin | `campus` | `demo123` | Members, events, analytics, settings | seed only |

**Setup demo roles:**

```bash
npm run seed
npm run seed:demo-roles
```

### 1.2 Full Sunday test

| Flow | Coverage | Result |
|------|----------|--------|
| Command center | API + UI | PASS (`verify:v1`, `e2e/sunday-operations.spec.ts`) |
| Sunday Mode | Run sheet / live guidance | PASS (`e2e/sunday-operations.spec.ts`) |
| Attendance portal | UI reachability | PASS (smoke + sunday-operations) |
| Realtime | Socket.IO enabled | PASS (dev); production needs Redis for queue scale |
| Notifications | Polling in AppShell | Operational (30s poll) |

**Friction logged (non-blocking):**

- Without Redis, webhook/event workers use sync fallback (documented in `KNOWN_LIMITATIONS.md`).
- Run sheet empty until event is ACTIVE and segments configured.

### 1.3 Full admin test

| Area | Validation | Result |
|------|------------|--------|
| Settings load/save | `e2e/settings-hardening.spec.ts` | PASS |
| Branding upload / tenant auth | `e2e/zero-state-install.spec.ts` | PASS (JWT tenant repair) |
| Financial settings / COA | zero-state + smoke | PASS |
| Cashfree | `npm run uat:cashfree` (sandbox keys required) | Manual when keys set |
| Backups / maintenance / deploy | `verify:v1`, rollout spec | PASS |
| Operator toolkit | `e2e/v1-signoff.spec.ts` | PASS |

---

## Phase 2 — Deployment validation

### 2.1 VPS / cloud checklist

| Requirement | Dev (validated) | Production action |
|-------------|-----------------|-------------------|
| HTTPS + domain | Local HTTP | Terminate TLS at reverse proxy |
| Postgres | Docker / local | Managed Postgres + `DATABASE_URL` |
| Redis | Optional | Set `REDIS_URL` for queues/webhooks |
| MinIO / S3 | Optional fallback to `/uploads` | Set `MINIO_*` for durable uploads |
| Socket.IO | Enabled on API | Same origin or proxy `/socket.io` |
| Env | `.env` from `.env.example` | Secrets manager; never commit `.env` |
| JWT | `JWT_SECRET` required in prod | Strong random secret |

**Commands:**

```bash
npm run deploy:production    # migrate, build, health, verify:v1
npm run verify:go-live       # incident/queue/infra gates
npm run runtime:activate     # route manifest + health
```

See: `DEPLOYMENT.md`, `REAL_WORLD_OPERATIONS_PLAYBOOK.md`, `STARTUP.md`.

### 2.2 Callback validation

| Callback | Status |
|----------|--------|
| Cashfree webhook | `POST /api/v1/giving/webhooks/cashfree` — configure in Cashfree dashboard |
| Razorpay webhook | `POST /api/v1/giving/webhooks/razorpay` | 
| Uploads | Local `/uploads` or MinIO |
| Backups | `npm run backup:tenant` + Admin Center |

### 2.3 Production performance

| Signal | Dev observation | Production note |
|--------|-----------------|-----------------|
| Auth rate limit | 2000/15min non-prod | 30/15min in `NODE_ENV=production` |
| Memory | Stable under E2E | Monitor API process after 24h |
| Queue | Sync without Redis | Enable Redis before high webhook volume |
| Sockets | Connected in boot log | Watch proxy timeouts (60s+) |

---

## Phase 3 — Bug triage (this rollout)

| ID | Severity | Category | Issue | Status |
|----|----------|----------|-------|--------|
| R-001 | Critical | auth | Tenant mismatch on upload | **Fixed** (JWT-aligned tenant) |
| R-002 | Critical | UI | Website builder crash (`PreviewMinistryGrid` icon) | **Fixed** |
| R-003 | Operational | auth | E2E login 429 after long runs | **Fixed** (dev rate limits) |
| R-004 | Operational | deployment | Empty DB `migrate reset` fails | **Fixed** (`zero-state:reset` uses db push) |
| R-005 | UX | E2E | Stale Playwright UI port cache | **Fixed** (port range validation) |
| R-006 | UX | E2E | Event detail label drift | **Fixed** (assert workspace KPI) |
| R-007 | UX | E2E | Sunday tests used `goto('/')` → public site | **Fixed** (`/admin` + `getByTestId` nav) |

**Open (documented, not architecture changes):**

- Finance voucher UI partially gated — see `KNOWN_LIMITATIONS.md`
- Some sidebar modules are placeholders — see AppShell `status` flags
- SEO module in website builder not wired

---

## Phase 4 — Demo & onboarding

| Deliverable | Location |
|-------------|----------|
| Demo role accounts | `npm run seed:demo-roles` |
| Tester credentials | `TESTER_GUIDE.md` (update with demo users) |
| Zero-state install QA | `ZERO_STATE_QA_REPORT.md` |
| Operator playbook | `REAL_WORLD_OPERATIONS_PLAYBOOK.md` |

**Presentation assets:** Capture screenshots from seeded tenant (`Grace Community Church`) after `seed` + `seed:demo-roles`.

---

## Phase 5 — Production snapshot

### 5.1 Git / release (operator action)

When ready to tag:

```bash
git tag -a v1.0.0-rollout -m "Kingdom Church OS v1.0 production rollout baseline"
```

Release notes should cite: tenant auth fix, demo roles, rate-limit dev/prod split, zero-state reset script.

### 5.2 Backup snapshot

```bash
npm run backup:tenant
# Plus: pg_dump of DATABASE_URL, archive uploads/ or MinIO bucket
```

### 5.3 Release baseline commands

| Action | Command |
|--------|---------|
| Fresh local stack | `npm run dev:prepare && npm run seed && npm run seed:demo-roles` |
| API | `npm run dev:server:fresh` |
| UI | `npm run dev` |
| Full gate | `npm run verify:v1 && npm run verify:go-live` |
| E2E rollout | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test e2e/production-rollout.spec.ts e2e/sunday-operations.spec.ts e2e/zero-state-install.spec.ts` |
| Rollback | Redeploy previous image/tag + restore DB snapshot |

---

## Quality gates (latest)

| Gate | Result |
|------|--------|
| `npm run lint` | PASS |
| `npm run verify:v1` | 34 passed, 1 warning (Redis) |
| `npm run verify:go-live` | 10 passed |
| `npm run test:e2e` | PASS (API smoke) |
| Playwright rollout + Sunday + roles | 13 passed (`production-rollout`, `sunday-operations`, `go-live-hardening`) |

---

## Final status: **READY** (staged production)

**Reasoning:** Core church workflows, admin/settings, tenant session integrity, and deployment verification scripts pass. Production requires HTTPS, secrets, Redis for scale, and Cashfree/Razorpay callback URLs pointed at your domain.

**Not in scope for this phase:** New modules, RBAC redesign, accounting engine changes, or command-center architecture changes.
