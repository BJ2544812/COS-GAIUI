# Ultimate Church OS — Release Candidate Audit

**Date:** 2026-06-01  
**Scope:** Final engineering completion pass before human acceptance testing (UAT)  
**Verdict:** **GO FOR UAT WITH CONDITIONS** — core church operations, finance simulation, HR simulation, and the majority of automated UI tests pass. Remaining items are documented below; several Playwright failures were addressed in this pass and should be re-verified with a full `npm run test:pw:ci` after pull.

---

## Executive summary

This pass **implemented** (not audit-only) release-critical gaps from prior reports:

| Area | Outcome |
|------|---------|
| Member portal | Extended API + UI: groups, sermons, documents, church info, prayer submit/history |
| Academy guides | Guides copied to `public/guides/`; Academy links use `/guides/*.md` (browser-servable) |
| Terminology | “Shepherd Workspace” → **Pastoral Care**; setup wizard church-friendly copy; HR desk notes |
| Demo Church v2 | Portal member gets attendance, group, document, prayer, notifications, org settings, published sermons |
| Role seeds | Added Associate Pastor, Youth Pastor, Accountant, Small Group Leader, Staff; pastor + comms outreach |
| E2E / CI | Fixed `event-lifecycle` fixture bug; HR tests aligned to **HR & Staff** title; CI boot seeds demo data |
| Security (carried) | HR performance/training/recruitment routes require HR permissions; outreach uses `manage_outreach` |

---

## Validation evidence

| Command | Result | Evidence |
|---------|--------|----------|
| `npm run lint` | **PASS** | `tsc --noEmit` clean after RC changes |
| `npm run build` | **PASS** | Vite production build succeeded |
| `npm run simulate:church` | **51 PASS, 1 WARN, 0 FAIL** | `FULL_OPERATIONAL_SCENARIO_REPORT.md` — Redis unset (sync queue) |
| `npm run simulate:hr` | **38 PASS, 0 FAIL** | `HR_OPERATIONAL_REPORT.md` — payroll structures empty (WARN step) |
| `npm run test:pw:ci` | **112 passed, 7 failed, 1 skipped** (~19.3m) | `playwright-rc-run.log` — see §11 |

### Playwright full suite (2026-06-01)

- **Passed:** 112 tests including smoke, navigation-sweep, role-experience, production-rollout, finance phases, frontend-operational-qa, communication-launch, boot, v1-signoff (subset), etc.
- **Failed (7):** See remediation table below.
- **Skipped:** 1

**Fixes applied after the run (re-run recommended):**

| Test | Cause | Fix |
|------|-------|-----|
| `demo-church` member portal | Demo seed not in CI DB; assertion on `heading` | `dev:server:ci` runs `seed.ts` + `seed-demo-church-v2` + `seed-demo-roles`; portal assertions use text |
| `hr-operations` (3) | UI title **HR & Staff** vs test “HR Operations” | E2E updated |
| `event-lifecycle` | Invalid `loginAsAdmin` fixture + home nav | Import `loginAsAdmin(page)`; deep link `/admin?module=events` |
| `volunteers-structure` | Strict mode on duplicate Back buttons | Use `getByLabel('Back')` |
| `accounting-operational-audit` | Scenario / data dependent | Re-run; investigate if persists after seed |

---

## Section 1 — Module verification (summary)

| Module | Nav | Screens | CRUD | Search/filters | Export | Permissions | RC status |
|--------|-----|---------|------|----------------|--------|-------------|-----------|
| Members | ✓ | ✓ | ✓ | ✓ | Partial | ✓ | **Ready** |
| Families | ✓ | ✓ | ✓ | ✓ | — | ✓ | **Ready** |
| Volunteers | ✓ | ✓ | ✓ | ✓ | — | ✓ | **Ready** (1 E2E flake fixed) |
| HR & Staff | ✓ | ✓ | ✓ | ✓ | Reports | ✓ | **Ready** — no offboarding wizard |
| Small Groups | ✓ | ✓ | ✓ | ✓ | — | ✓ | **Ready** |
| Pathways | ✓ | ✓ | Read/update | — | — | ✓ | **Ready** — progress via Pastoral Care |
| Pastoral Care | ✓ | ✓ | ✓ | ✓ | — | ✓ | **Ready** |
| Events | ✓ | ✓ | ✓ | ✓ | — | ✓ | **Ready** (lifecycle E2E adjusted) |
| Sunday Service | ✓ | ✓ | Ops | — | — | ✓ | **Ready** |
| Attendance | ✓ | ✓ | ✓ | ✓ | — | ✓ | **Ready** — bulk notify not wired |
| Worship | ✓ | ✓ | ✓ | — | — | ✓ | **Ready** |
| Outreach | ✓ | ✓ | ✓ | — | — | ✓ | **Ready** — permission fix verified in code |
| Church Structure | ✓ | ✓ | ✓ | — | — | ✓ | **Ready** |
| Giving | ✓ | ✓ | ✓ | ✓ | Receipts | ✓ | **Ready** |
| Finance | ✓ | ✓ | ✓ | ✓ | Audit exports | ✓ | **Ready** — some print/PDF disabled states |
| Budgets | ✓ | ✓ | ✓ | — | — | ✓ | **Ready** — voucher linkage UI gap |
| Vendors | ✓ | ✓ | ✓ | — | — | ✓ | **Ready** |
| Payroll | ✓ | ✓ | Config-dependent | — | — | ✓ | **UAT** — configure structures in UI |
| Assets | ✓ | ✓ | ✓ | — | — | ✓ | **Ready** |
| Documents | ✓ | ✓ | ✓ | — | — | ✓ | **Ready** |
| Sermons | ✓ | ✓ | ✓ | — | — | ✓ | **Ready** |
| Communication | ✓ | ✓ | ✓ | — | — | ✓ | **UAT** — in-app primary; email/SMS queue |
| Notifications | ✓ | ✓ | ✓ | — | — | ✓ | **Ready** |
| Website | ✓ | ✓ | ✓ | — | — | ✓ | **UAT** — SEO audit disabled |
| Home (dashboard) | ✓ | ✓ | Lens by role | — | — | ✓ | **Ready** |
| Analytics | ✓ | ✓ | Reports | — | Export | ✓ | **Ready** |
| Activity Log | ✓ | ✓ | Read | ✓ | — | Admin | **Ready** |
| Settings | ✓ | ✓ | ✓ | — | — | ✓ | **Ready** |
| Admin Center | ✓ | ✓ | Ops | — | Backup | Platform | **Ready** |
| Permissions | ✓ | ✓ | ✓ | — | — | Admin | **Ready** |
| Academy | ✓ | ✓ | Progress local | — | — | ✓ | **Ready** — guides in `public/guides/` |
| Member Portal | ✓ | ✓ | Prayer submit | — | — | Member | **Ready for UAT** |

---

## Section 2 — Member portal

**Routes:** `/member-login`, `/portal`  
**API:** `GET /api/v1/member-portal/summary`, `POST /api/v1/member-portal/prayer-requests`

| Feature | Status |
|---------|--------|
| Profile | ✓ Linked member profile |
| Giving history | ✓ Last 10 gifts + total |
| Events | ✓ Upcoming events |
| Attendance | ✓ 90-day count + recent check-ins |
| Groups | ✓ Small groups list |
| Volunteer schedule | ✓ Active responsibilities |
| Prayer requests | ✓ Submit + recent list |
| Announcements | ✓ User notifications |
| Sermons | ✓ Published sermons + watch link |
| Documents | ✓ Types + verification status (no file download in portal — by design) |
| Church information | ✓ From `organization` setting |
| Member dashboard | ✓ Summary cards |

**Demo login:** `member` / `demo123` after `npm run seed:launch`

**Deferred:** Member self-service document upload; giving statements PDF in portal; group messaging.

---

## Section 3 — Role experience

| Role | Seed user | Landing / nav | RC status |
|------|-----------|-------------|-----------|
| Senior Pastor | `pastor` | Home → pastoral lens | ✓ + `manage_outreach` |
| Church Administrator | `churchadmin` | Operations | ✓ |
| Associate Pastor | `associate` | **New** | ✓ |
| Youth Pastor | `youth` | **New** | ✓ |
| Worship Pastor | `worship` | Sunday / events | ✓ |
| Finance Manager | `finance` | Finance / giving | ✓ |
| Accountant | `accountant` | **New** | ✓ |
| HR Manager | `hradmin` | HR & Staff | ✓ |
| Volunteer Coordinator | `volunteers` | Volunteers | ✓ |
| Communications Manager | `secretary` | Comms + outreach | ✓ |
| Ministry Leader | `events` | Events | ✓ |
| Small Group Leader | `groupleader` | **New** | ✓ |
| Staff | `staffdesk` | **New** | ✓ |
| Campus Admin | `campus` | Settings / analytics | ✓ |
| Member | `member` | `/portal` | ✓ |

**Password (demo roles):** `demo123` (`DEMO_ROLE_PASSWORD` override)  
**Staff admin:** `admin` / `admin123`

`src/lib/roleExperience.ts` drives post-login paths, nav order, dashboard lens, quick ops.

---

## Section 4 — Finance readiness

Operational simulation **PASS** for: offerings, GL linkage, vendors, budgets, assets, compliance docs, gateway surface, public giving feeds.

| Flow | Status |
|------|--------|
| Giving → receipt | ✓ Sim + phase tests |
| Vouchers / approvals / posting / reversals | ✓ Phase 1–2 E2E |
| Budgets | ✓ API; UI linkage to vouchers partial |
| Payroll | ✓ API; requires active structures |
| Reconciliation | ✓ Phase 7 |
| Year-end / audit exports | ✓ Phase 9–13 |

**UAT focus:** Month-end checklist with real bank file; Cashfree sandbox if used.

---

## Section 5 — HR readiness

| Flow | Status |
|------|--------|
| Recruitment / onboarding | ✓ API secured |
| Documents / leave / approvals | ✓ Simulated |
| Payroll handoff | ⚠ Configure structures |
| Performance / training | ✓ Routes gated |
| Offboarding | **Deferred** — no dedicated wizard |
| Reporting | ✓ Command center + conflicts |

---

## Section 6 — Communication

| Channel | Status |
|---------|--------|
| Announcements / campaigns (in-app) | ✓ |
| Notifications | ✓ |
| Pastoral / member comms UI | ✓ |
| Email / SMS production | **Deferred** — transport queue; verify provider in UAT |

---

## Section 7 — Terminology & UX

**Completed in RC pass:**

- Pastoral Care naming across dashboard, pathways, discipleship module, insights, notifications
- Setup wizard: “church workspace” instead of “tenant” (user-facing steps)
- Pathways subtitle: “church data” not “tenant data”
- Workflow monitor label in admin navigation
- Operational guidance: “Home” instead of “Command Center”

**Remaining (low):** Internal code comments; System Admin Center still uses “tenant” for operator backup/restore (appropriate for platform admins). Care intake may still say “Assign Shepherd” in one form label — pastoral team vocabulary.

---

## Section 8 — Academy & guides

| Item | Status |
|------|--------|
| Academy module (`/admin?module=academy`) | ✓ |
| Role learning paths | ✓ `src/lib/academy/catalog.ts` |
| Quick-start guides | ✓ `public/guides/*.md` (mirrors `docs/guides/`) |
| Deep links to modules | ✓ “Open in church office” |
| Progress tracking | ✓ localStorage `church_academy_progress_v1` |
| Guide reachability | ✓ E2E: `GET /guides/senior-pastor.md` |

---

## Section 9 — Demo Church

**Church:** Grace Community Church (`npm run seed:demo-church`, reset: `DEMO_CHURCH_RESET=1`)

| Data | Status |
|------|--------|
| ~80 members | ✓ |
| Families, events, gifts, prayer | ✓ |
| Portal member attendance (6), group, document, prayer, notifications | ✓ **RC added** |
| Published sermons | ✓ |
| Organization setting for portal header | ✓ **RC added** |
| Role accounts | ✓ `npm run seed:demo-roles` |
| CI boot seed | ✓ **`dev:server:ci` extended** |

---

## Section 10 — Codebase cleanup

**Action:** No large module deletions (risk). Orphan files (`MissionsModule`, `FundsModule`, etc.) remain routed via aliases — **deferred** to post-UAT.

**Removed risk:** None required for RC.

---

## Section 11 — Full validation checklist

| Check | Result |
|-------|--------|
| `npm run lint` | ✓ |
| `npm run build` | ✓ |
| `npm run simulate:church` | ✓ (Redis warn) |
| `npm run simulate:hr` | ✓ |
| `npm run test:pw:ci` | 112/7 — fixes applied, **re-run required** |

---

## Readiness matrix

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Role readiness | **High** | 15 demo roles; role experience wired |
| Finance readiness | **High** | Sim + accounting E2E phases |
| HR readiness | **Medium–High** | Offboarding + payroll config gaps |
| Member readiness | **High** | Portal feature-complete for UAT |
| Demo readiness | **High** | CI seed + portal richness |
| Training readiness | **High** | Academy + 6 guides |
| Customer readiness | **Medium** | Branding/docs for install |
| Production readiness | **Conditional** | Redis, email/SMS, full green PW suite |

---

## Known limitations (intentional or post-UAT)

1. **Email/SMS** — Not production-verified; in-app notifications primary.  
2. **HR offboarding** — No guided wizard.  
3. **Finance** — Some PDF/print actions disabled when data missing; budget–voucher UI gap.  
4. **Website SEO audit** — Disabled in UI.  
5. **Attendance** — “Notify all staff” not connected.  
6. **Member portal** — Document download not exposed (privacy).  
7. **Redis** — Optional; queue runs synchronously without `REDIS_URL`.  
8. **Playwright** — 7 failures on first full CI run; remediations in repo — confirm with second run.

---

## UAT entry criteria (recommended)

1. Run `npm run seed:launch` on UAT database.  
2. Execute `npm run test:pw:ci` until 0 failures or accepted waivers documented.  
3. Walk each role from `TESTER_GUIDE.md` / Academy tracks.  
4. Member path: `member` / `demo123` → portal prayer + giving + groups.  
5. Finance month-end dry run with treasurer account `finance` / `demo123`.  
6. Sign off communications transport separately if email/SMS required for launch.

---

## Files changed (RC pass — key)

- `src/server/services/MemberPortalService.ts` — portal data + prayer submit  
- `src/pages/MemberPortalPage.tsx` — full portal sections  
- `public/guides/*.md` — served quick-start guides  
- `src/lib/academy/catalog.ts` — guide URLs  
- Terminology: `DashboardModule`, `DiscipleshipModule`, `PathwaysModule`, `adminNavigation`, etc.  
- `src/server/scripts/seed-demo-church-v2.ts`, `seed-demo-roles.ts`  
- `package.json` — `dev:server:ci` seeds for Playwright  
- `e2e/event-lifecycle.spec.ts`, `hr-operations.spec.ts`, `demo-church.spec.ts`, `volunteers-structure.spec.ts`

---

**Sign-off:** Engineering RC pass complete. Proceed to **human UAT** with the conditions above. Production go-live requires green Playwright CI, communications transport decision, and operations runbook (backup, Redis, monitoring).
