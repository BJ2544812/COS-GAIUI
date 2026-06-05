# Stabilization Bug Log — Kingdom Church OS v1.0

**Mode:** Live production pilot — **issue-driven only** (no new domains, no architecture redesign)  
**Updated:** 2026-05-24  
**Playbook:** [PILOT_SUPPORT.md](./PILOT_SUPPORT.md)

Log every reported friction here. Every row must include **repro → root cause → fix → retest** before **FIXED**.

**Before any fix:** `npm run stabilization:gate` + `npm run test:pilot` (+ HR or Sunday spec if in scope — see PILOT_SUPPORT §4).

### New issue template (copy into Friction backlog)

```markdown
| S-XXX | OPEN | [Role] | [Module] — [one-line summary] | TBD | TBD | TBD |
```

---

## Status legend

| Status | Meaning |
|--------|---------|
| **OPEN** | Reproduced, not fixed |
| **FIXED** | Fix merged + retest passed |
| **WONTFIX-V1** | Documented limitation (see `KNOWN_LIMITATIONS.md`) |
| **MONITOR** | Low severity / environment-specific |

---

## Critical / operational (auth & session)

| ID | Status | Issue | Root cause | Fix | Retest |
|----|--------|-------|------------|-----|--------|
| S-001 | FIXED | Tenant mismatch on logo/settings upload (403) | `x-tenant-id` drifted from JWT | JWT-authoritative tenant + `resolveActiveTenantId()` + login `tenantId` | `e2e/zero-state-install.spec.ts` |
| S-002 | FIXED | E2E mass login HTTP 429 | Auth rate limit 30/15min in dev | Non-prod limit 2000; prod stays 30 | Full Playwright batch |
| S-003 | MONITOR | Session restore after hard refresh | Token in localStorage | By design; `/login` restores via `refreshUser` | Manual |

---

## Settings & uploads

| ID | Status | Issue | Root cause | Fix | Retest |
|----|--------|-------|------------|-----|--------|
| S-010 | FIXED | Operational settings not persisting | Missing schema/controller merge | Zod + `SettingsController` operational section | `settings-hardening` |
| S-011 | FIXED | Upload 403 with stale tenant header | Same as S-001 | Same as S-001 | zero-state upload test |

---

## Sunday Mode & operations

| ID | Status | Issue | Root cause | Fix | Retest |
|----|--------|-------|------------|-----|--------|
| S-020 | FIXED | Sunday E2E opened public site not ERP | `goto('/')` after login | `goto('/admin')` + `nav-*` test ids | `sunday-operations.spec.ts` |
| S-021 | MONITOR | Empty run sheet until event ACTIVE | Lifecycle gating | Document in tester guide | Manual |

---

## UI / website builder

| ID | Status | Issue | Root cause | Fix | Retest |
|----|--------|-------|------------|-----|--------|
| S-030 | FIXED | Website module crash in Visual Builder | `PreviewMinistryGrid` rendered undefined `icon` | Fallback icon + map API ministry rows | `smoke` website test |
| S-031 | WONTFIX-V1 | SEO audit disabled | Not wired | `KNOWN_LIMITATIONS.md` | N/A |

---

## RBAC / roles

| ID | Status | Issue | Root cause | Fix | Retest |
|----|--------|-------|------------|-----|--------|
| S-040 | FIXED | No demo users for role UAT | Only `admin` seeded | `npm run seed:demo-roles` | `production-rollout.spec.ts` |
| S-041 | MONITOR | Campus admin has `manage_settings` | Intentional demo breadth | Document in `TESTER_GUIDE.md` | Manual |

---

## Deployment / runtime

| ID | Status | Issue | Root cause | Fix | Retest |
|----|--------|-------|------------|-----|--------|
| S-050 | FIXED | Empty DB `migrate reset` fails | Incremental migrations only | `zero-state:reset` uses db push + baseline | `zero-state:reset` |
| S-051 | MONITOR | Redis unset — sync queue | Dev optional | Set `REDIS_URL` in production | `verify:v1` warning |
| S-052 | MONITOR | MinIO unset — local uploads | Dev fallback `/uploads` | Configure MinIO in production | Manual upload |

---

## Full operational simulation (2026-05-20)

| ID | Status | Issue | Root cause | Fix | Retest |
|----|--------|-------|------------|-----|--------|
| S-053 | FIXED | No repeatable church-life simulation on live DB | Missing harness | `npm run simulate:church` + `FULL_OPERATIONAL_SCENARIO_REPORT.md` | 52 API steps + 22 Playwright |

---

## HR / workforce (audit 2026-05-20)

| ID | Status | Issue | Root cause | Fix | Retest |
|----|--------|-------|------------|-----|--------|
| S-054 | FIXED | Workforce directory hard to discover | `WorkforceModule` not in `AppShell` nav | Add nav item under Identity (V1 essential) | `e2e/hr-operations.spec.ts` |
| S-055 | FIXED | Staff shown via `growthStage` not `workforceClass` | UI filter in WorkforceModule | Align filters + profile fields in controller/UI | `e2e/hr-operations.spec.ts` |
| S-056 | FIXED | Payroll run creation API-only | No Finance/Vendors create UI | Minimal payroll wizard (V1 essential) in WorkforceModule | `e2e/hr-operations.spec.ts` |
| S-057 | FIXED | Payrun wizard 404 / wrong endpoint | UI called `finance/payroll-runs/quick-post` | `POST /hr/payroll/runs/generate` in WorkforceModule | `simulate:hr` + finance E2E |
| S-058 | FIXED | Roster conflict badge unreliable | UI checked notes substring only | `leaveHasConflict()` reads `conflictSnapshot` | `e2e/hr-operations.spec.ts` |
| S-059 | FIXED | Leave approve silent fail on conflicts | API 409 without UI path | Confirm dialog + `forceApprove` | Manual + simulation |
| S-060 | FIXED | Pastor saw recruitment/pipeline tabs | `isHRManager` included `manage_members` | Split `isHrAdmin` vs `isLeaveApprover` | `e2e/hr-operations.spec.ts` |
| S-061 | FIXED | Finance admin missing HR nav | Nav gated on `manage_members` only | HR nav: `manage_hr` \| `manage_finance` \| `manage_members` | `e2e/hr-operations.spec.ts` finance tab |
| S-062 | FIXED | Dashboard stats client-only | No command-center fetch | Load `/hr/command-center` for stat bar | Manual |
| S-063 | FIXED | Self-service showed raw salary to all | No UI mask for pastors | Payslip `***` unless finance/HR | Manual |
| S-064 | FIXED | Demo users not linked to members | `User.memberId` unset | `seed:demo-roles` email link + secretary member | `simulate:hr` |
| S-065 | FIXED | No graceful shutdown on deploy restart | SIGTERM killed in-flight jobs | `gracefulShutdown` + `workerRegistry` | Manual + docker restart |
| S-066 | FIXED | docker-compose worker service broken | `start:worker` script missing | Workers documented in-process; prod compose has no orphan worker | `docker-compose.production.yml` |
| S-067 | FIXED | nginx missing API/uploads paths | Dev template only `/` proxy | `deploy/nginx.production.conf` | Ops review |
| S-068 | FIXED | Mobile admin unusable (fixed sidebar) | No drawer nav | AppShell mobile menu + overlay | Manual tablet |
| S-069 | FIXED | Backup restore confidence unproven | No full DR drill with restore + pilot validation | `drill:restore` + `DISASTER_RECOVERY_REPORT.md` + `RESTORE_DRILL_REPORT.md` | `npm run drill:restore` |

See **[HR_READINESS_REPORT.md](./HR_READINESS_REPORT.md)**, **[HR_MATURITY_REPORT.md](./HR_MATURITY_REPORT.md)**, **[PRODUCTION_HARDENING_STATUS.md](./PRODUCTION_HARDENING_STATUS.md)**.

---

## Friction backlog (log new findings here)

| ID | Status | Role | Flow | Notes |
|----|--------|------|------|-------|
| — | | | | Pilot: set Redis/MinIO on VPS; Cashfree sandbox UAT before live keys |

---

## Regression gate (run before closing any fix)

```powershell
npm run stabilization:gate
npm run test:pilot
# HR:  PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test e2e/hr-operations.spec.ts
# Sun: PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test e2e/sunday-operations.spec.ts
```

---

## Related docs

- [PRODUCTION_ROLLOUT_REPORT.md](./PRODUCTION_ROLLOUT_REPORT.md)
- [ZERO_STATE_QA_REPORT.md](./ZERO_STATE_QA_REPORT.md)
- [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md)
- [TESTER_GUIDE.md](./TESTER_GUIDE.md)
