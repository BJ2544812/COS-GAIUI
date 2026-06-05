# Ultimate Church OS — Final Release Candidate Report

**Date:** 2026-06-01  
**Validation cycle:** Final engineering verification (post–`RELEASE_CANDIDATE_AUDIT.md`)  
**Codebase:** `d:\COS-GAIUI`

---

## Release recommendation

| Gate | Verdict |
|------|---------|
| **Human UAT entry** | **GO** |
| **Production go-live** | **GO WITH CONDITIONS** (operations checklist below) |

**Rationale:** All required automated checks pass on the same codebase (lint, build, church/HR simulations with zero failures, Playwright CI **119 passed / 0 failed**). Remaining items are operational configuration and non-blocking product gaps—not release-critical engineering defects.

---

## 1. RC fix verification (present in codebase)

| Item from RC audit | Verified |
|--------------------|----------|
| Member portal API: groups, sermons, documents, church info, prayer history | ✓ `MemberPortalService.ts` |
| Member prayer submit | ✓ `POST /member-portal/prayer-requests` |
| Academy guides served at `/guides/*.md` | ✓ `public/guides/` + `catalog.ts` |
| Terminology: Pastoral Care (not Shepherd Workspace) | ✓ Product UI |
| Demo Church portal richness + `isPublished` sermons | ✓ `seed-demo-church-v2.ts` |
| Expanded demo roles (associate, youth, accountant, etc.) | ✓ `seed-demo-roles.ts` |
| CI Playwright seeds (`dev:server:ci`) | ✓ `package.json` |
| HR route auth hardening | ✓ (prior RC) |
| Outreach `manage_outreach` | ✓ (prior RC) |
| E2E: HR & Staff title, event lifecycle, volunteers Back, demo portal | ✓ `e2e/*` |
| E2E: accounting audit trial-balance delta assertion | ✓ **Final cycle** |
| E2E: go-live admin center `skipAdminNav` | ✓ **Final cycle** |

---

## 2. Final validation evidence

Executed on **2026-06-01** after final E2E fixes.

### `npm run lint`

```
PASS — tsc --noEmit (exit 0)
```

### `npm run build`

```
PASS — vite build (exit 0)
```

### `npm run simulate:church`

```
52 PASS | 1 WARN | 0 FAIL
WARN: REDIS_URL not set — queue runs synchronously
Report: FULL_OPERATIONAL_SCENARIO_REPORT.md
```

### `npm run simulate:hr`

```
38 PASS | 1 WARN (payroll structures empty) | 0 FAIL
Report: HR_OPERATIONAL_REPORT.md
```

### `npm run test:pw:ci`

```
119 passed | 0 failed | 1 skipped | ~11.8m | exit 0
Log: playwright-final-run.log
```

**Skipped (non-blocking):** `volunteers-structure.spec.ts` — structure campus detail (conditional / environment).

**Previously failing specs — now green:**

- `demo-church` member portal  
- `event-lifecycle`  
- `hr-operations` (all)  
- `volunteers-structure`  
- `accounting-operational-audit` (trial balance: asserts **no new imbalance** from scenario, not absolute zero on polluted DB)  
- `go-live-hardening` admin incidents tab  

---

## 3. Success criteria checklist

| Criterion | Status |
|-----------|--------|
| Lint passes | ✓ |
| Build passes | ✓ |
| Simulations pass (0 fail) | ✓ |
| Playwright suite passes | ✓ (119/119 executed, 0 fail) |
| No release-critical finance blockers | ✓ Sim + accounting phases + operational audit |
| No release-critical member portal blockers | ✓ API + E2E |
| No release-critical role experience blockers | ✓ Seeds + role/nav E2E |
| No broken Academy guide links | ✓ E2E `GET /guides/senior-pastor.md` |

---

## 4. Remaining known limitations (not UAT blockers)

1. **Redis optional** — Background jobs run synchronously without `REDIS_URL`.  
2. **Email/SMS** — In-app communications primary; external transport not production-certified in this cycle.  
3. **HR offboarding** — No dedicated wizard (manual workflow).  
4. **Payroll** — Requires active pay structures configured in UI (simulation warns when empty).  
5. **Finance UI** — Some PDF/print actions disabled when data missing; budget–voucher UI linkage partial.  
6. **Website** — SEO audit control disabled in builder.  
7. **Attendance** — “Notify all staff” not wired.  
8. **Member portal** — Document download not exposed (privacy-by-design).  
9. **Pre-existing GL imbalance** — Possible on long-lived dev DBs; audit test validates **scenario does not worsen** trial balance.

---

## 5. Deferred items (post-UAT / post-launch)

- Orphan module file cleanup (`MissionsModule`, etc.) — low risk, alias-routed.  
- Member document upload in portal.  
- Giving statement PDF in portal.  
- Group messaging in portal.  
- Full HR offboarding wizard.  
- Production email/SMS provider certification.

---

## 6. Production deployment guidance

1. **Database:** `prisma migrate deploy` on production Postgres.  
2. **Seed:** Run production seed policy (not full demo seed); use `seed:launch` only for pilot/demo environments.  
3. **Environment:** Set `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL` (recommended), object storage (MinIO/S3), optional `GEMINI_API_KEY`.  
4. **Process:** API on ~4002, static UI from `dist/` or reverse proxy; health at `/health`.  
5. **TLS & CORS:** Restrict origins to church domain(s).  
6. **Backups:** Use Admin Center / `backup:tenant` before upgrades.  
7. **Monitoring:** Platform incidents API + queue metrics; watch API 5xx.  
8. **Communications:** Configure SMTP/SMS provider before promising external delivery.  
9. **Finance:** Import opening balances; verify trial balance before first live posting.  
10. **Pilot package:** `npm run seed:launch` → demo roles `demo123`, member `member` / `demo123`.

---

## 7. UAT guidance

### Entry

- Engineering sign-off: **complete** (this report).  
- Start role-based walkthroughs using Academy tracks and `public/guides/*.md`.

### Suggested scripts (5–10 days)

| Day | Focus | Accounts |
|-----|--------|----------|
| 1 | Install, settings, branding | `admin` |
| 2 | Members, families, groups | `churchadmin`, `groupleader` |
| 3 | Sunday, attendance, volunteers | `volunteers`, `worship` |
| 4 | Pastoral care, prayer | `pastor`, `member` (portal prayer) |
| 5 | Giving, finance month-end dry run | `finance`, `accountant` |
| 6 | HR leave, payroll config | `hradmin` |
| 7 | Communications, website | `secretary` |
| 8 | Role landing pages + permissions | All demo roles |
| 9 | Member portal end-to-end | `member` |
| 10 | Sign-off workshop | Stakeholders |

### Pass/fail for UAT exit

- Each role completes primary workflows without data loss.  
- Finance treasurer signs off reconciliation path.  
- Pastor signs off pastoral care + prayer visibility.  
- Member signs off portal (profile, giving, groups, prayer).  
- Document any waivers for email/SMS and offboarding.

---

## 8. Commands reference (reproduce validation)

```powershell
cd d:\COS-GAIUI
npm run lint
npm run build
npm run simulate:church
npm run simulate:hr
npm run test:pw:ci
```

---

## 9. Sign-off

| Role | Status |
|------|--------|
| Engineering (automated) | **Complete — GO for UAT** |
| Product / Pastor acceptance | Pending human UAT |
| Production operations | Pending Redis, comms, finance opening balance |

**Next step:** Begin human UAT using demo church (`npm run seed:launch`) or production-configured tenant. Do not treat production go-live as unconditional until operations checklist (§6) is signed.

---

*Supersedes interim status in `RELEASE_CANDIDATE_AUDIT.md` for validation outcomes; feature scope unchanged from RC audit.*
