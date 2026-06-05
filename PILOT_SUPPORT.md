# Kingdom Church OS — Production Pilot Support

**Mode:** Live production pilot (V1 locked — **issue-driven only**)  
**Version:** 1.0.0

This is the single entry point for **pilot churches**, **VPS operators**, and **internal QA**.

**Out of scope:** new major domains, architecture redesign, ERP expansion.  
**In scope:** stabilization, deployment refinement, UX polish, pilot support, regression prevention.

All work starts from reported friction → `STABILIZATION_BUG_LOG.md`.

---

## 1. Pilot readiness checklist

| Step | Command / action | Pass criteria |
|------|------------------|---------------|
| Database | `npm run db:migrate` | No migration errors |
| First tenant | Installer or `npm run seed` | Admin can sign in |
| Demo roles (UAT) | `npm run seed:demo-roles` | Role accounts work (`demo123`) |
| API health | `GET /health` | `database: connected` |
| V1 routes | `GET /health/routes` | `status: ready` |
| Regression gate | `npm run stabilization:gate` | 0 failed |
| Church-life simulation | `npm run simulate:church` | See `FULL_OPERATIONAL_SCENARIO_REPORT.md` |
| HR operational simulation | `npm run simulate:hr` | See `HR_OPERATIONAL_REPORT.md` (0 failed) |
| HR Playwright | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test e2e/hr-operations.spec.ts` | 15/15 after `seed:demo-roles` |
| Full pilot bundle | `npm run pilot:validate` | Writes `PILOT_STATUS_REPORT.md` |
| HR capability audit | `npm run audit:hr` | See `HR_READINESS_REPORT.md` |
| UI smoke | See §4 Playwright | Pilot specs green |
| Cashfree (if used) | `npm run uat:cashfree` | Sandbox order + webhook |
| Backup export | `npm run backup:tenant` | Artifact created |
| Backup validation | `npm run backup:validate` | `BACKUP_VALIDATION_REPORT.md` |
| Production compose | `docker compose -f docker-compose.production.yml` | Healthchecks + Redis AOF |

---

## 2. VPS / HTTPS deployment (minimal path)

### Environment (production)

Set in `.env` on the server (see `.env.example`, `DEPLOYMENT.md`):

| Variable | Required | Notes |
|----------|----------|-------|
| `NODE_ENV` | Yes | `production` (enables production auth rate limits) |
| `DATABASE_URL` | Yes | Managed Postgres |
| `JWT_SECRET` | Yes | Long random secret |
| `REDIS_URL` | Strongly recommended | Queues, webhook workers |
| `MINIO_*` or persistent `uploads/` | Recommended | Logos, receipts |
| `PORT` | Yes | Default `4002` behind reverse proxy |
| `VITE_TENANT_ID` | Yes | Must match seeded tenant |

Build SPA with public API URL:

```bash
VITE_API_BASE_URL=https://api.yourchurch.org/api/v1 npm run build
```

### Reverse proxy (HTTPS)

- Terminate TLS at **nginx / Caddy / Traefik**
- Proxy `/api`, `/health`, `/socket.io`, `/uploads` → API process
- Serve static `dist/` for staff UI or run Vite build behind same host
- Public site: `/` routes to SPA; staff ERP: `/admin`, `/login`

### Webhooks (Cashfree)

Register in Cashfree dashboard:

```text
POST https://api.yourchurch.org/api/v1/giving/webhooks/cashfree
```

Raw body required (already configured on server). Test with sandbox before live keys.

### Post-deploy verification

```bash
npm run deploy:production
# or manually:
npm run stabilization:gate
HEALTH_URL=https://api.yourchurch.org/health npm run verify:go-live
```

---

## 3. Pilot accounts (internal UAT)

After `npm run seed` + `npm run seed:demo-roles`:

| Role | Username | Password |
|------|----------|----------|
| Super Admin | `admin` | `admin123` |
| Pastor | `pastor` | `demo123` |
| Worship | `worship` | `demo123` |
| Finance | `finance` | `demo123` |
| Events | `events` | `demo123` |
| Volunteers | `volunteers` | `demo123` |
| Secretary | `secretary` | `demo123` |
| Campus | `campus` | `demo123` |

**URLs:** Staff → `https://your-domain/login` → `/admin` · Public → `/`

---

## 4. Issue-driven workflow (mandatory)

```text
1. Real user or tester reports friction
2. Reproduce
3. Root-cause
4. Minimal safe fix
5. Retest
6. Regression gates (below)
7. Update STABILIZATION_BUG_LOG.md
8. Update docs if operator-facing behavior changed
```

### Before every fix

```powershell
npm run stabilization:gate
npm run test:pilot
```

Set `PLAYWRIGHT_BASE_URL` to your pilot host when not local (default `http://127.0.0.1:3001`).

### If the issue affects HR

```powershell
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test e2e/hr-operations.spec.ts
```

### If the issue affects Sunday / operations

```powershell
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test e2e/sunday-operations.spec.ts
```

### Full UI suite (release candidate only)

```powershell
npm run test:pw
```

---

## 5. Reporting friction (pilot churches)

For every issue, add a row to **`STABILIZATION_BUG_LOG.md`** → *Friction backlog*:

1. **Who** — role (pastor, finance, etc.)
2. **Where** — module + URL
3. **Steps** — numbered repro
4. **Expected vs actual**
5. **Screenshot / API status** if applicable

Do **not** close issues without gates from §4 and a row in the bug log (FIXED + retest command).

---

## 6. Focus areas for live feedback

| Area | What to watch |
|------|----------------|
| Auth / session | Login loops, 429 after many attempts, tenant mismatch on save/upload |
| Settings | Branding upload, financial defaults, Cashfree keys |
| Sunday Mode | Run sheet, live ops, navigation from events |
| RBAC | Wrong module visible for role |
| Mobile | Sidebar, tables, Sunday Mode on tablet |
| Realtime | Socket disconnect recovery (check browser console) |
| Giving | Public `/donate`, webhook settlement in admin |

Known V1 limits: **`KNOWN_LIMITATIONS.md`**

---

## 7. Rollback

1. Stop API/worker containers or process
2. Restore Postgres from last `pg_dump`
3. Restore `uploads/` or MinIO bucket snapshot
4. Redeploy previous release tag
5. Run `npm run stabilization:gate` against restored stack

---

## 8. Related documents

| Doc | Purpose |
|-----|---------|
| [STABILIZATION_BUG_LOG.md](./STABILIZATION_BUG_LOG.md) | Issue triage |
| [PRODUCTION_ROLLOUT_REPORT.md](./PRODUCTION_ROLLOUT_REPORT.md) | Rollout status |
| [TESTER_GUIDE.md](./TESTER_GUIDE.md) | Tester handoff |
| [STARTUP.md](./STARTUP.md) | Local two-process dev |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Docker / SSL / backups |
| [deploy/nginx.production.conf](./deploy/nginx.production.conf) | Reverse proxy template |
| [RESTORE_RUNBOOK.md](./RESTORE_RUNBOOK.md) | Backup & disaster recovery |
| [PRODUCTION_HARDENING_STATUS.md](./PRODUCTION_HARDENING_STATUS.md) | Stabilization cycle status |
| [REAL_WORLD_OPERATIONS_PLAYBOOK.md](./REAL_WORLD_OPERATIONS_PLAYBOOK.md) | Operator procedures |
| [PILOT_STATUS_REPORT.md](./PILOT_STATUS_REPORT.md) | Latest `pilot:validate` snapshot |
| [HR_MATURITY_REPORT.md](./HR_MATURITY_REPORT.md) | HR pilot readiness |

---

## Current pilot status

**Last validation (local):** `stabilization:gate` PASS · `test:pilot` 40/40 · `e2e/hr-operations` 15/15 · `simulate:hr` 0 failed  

Re-run before each release: `npm run pilot:validate`

**Architecture:** Locked V1 — pilot support = fixes + docs only (no new domains)
