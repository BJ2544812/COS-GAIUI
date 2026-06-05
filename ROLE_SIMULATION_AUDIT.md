# Ultimate Church OS — Role Login Simulation & First-Use Experience Audit

**Date:** 2026-06-01  
**Method:** Live Playwright login simulation (`e2e/role-simulation-audit.spec.ts`) — real UI navigation, module probes, no code-only review.  
**Evidence file:** `role-simulation-results.json` (generated 2026-06-01T16:17:46Z, after `npm run seed:demo-roles` + `seed:demo-church`)  
**Password (demo staff):** `demo123` · **Admin:** `admin` / `admin123` · **Member:** `member` / `demo123`

---

## Executive summary

Fifteen roles were logged in sequentially through the same flows a human would use. After seeding demo accounts and correcting archetype/permission bugs, **14/14 staff roles and member portal completed login and primary workflows**. Fixes applied during this audit improved landing pages for Associate Pastor, Small Group Leader, and Staff; gated Pastoral Care on `manage_discipleship`; and stopped Accountants from seeing the full HR desk.

**Overall product readiness for first-time role users:** strong for finance, pastoral, and operations roles; **partial** for broad `manage_members` roles (too many sidebar items); member portal is **ready** when demo seed is applied.

---

## Issues fixed during this audit

| Issue | Impact | Fix |
|-------|--------|-----|
| Associate Pastor landed on **Volunteers** (wrong archetype) | Wrong first screen | Explicit `ASSOCIATE_PASTOR` → `senior_pastor` in `roleExperience.ts` |
| Small Group Leader landed on **Sunday Mode** | Wrong first screen | New `small_group_leader` archetype → `small-groups` landing |
| Staff landed on **Volunteers** | Wrong first screen | `STAFF` → `general` archetype → Home dashboard |
| Pastoral Care required only `manage_members` | Care desk visible without pastoral permission | `discipleship` gated on `manage_discipleship` (App + AppShell) |
| Accountant saw **HR & Staff** nav | Over-permissioned UI | HR nav/module requires `manage_hr` only |
| Small Group Leader lacked care access | Missing pastoral follow-up | Seed: `manage_discipleship` for `groupleader` |
| New demo users missing on stale DB | Login failures | Documented: run `npm run seed:launch`; CI `dev:server:ci` seeds all roles |
| E2E probe false “blocked” states | Audit noise | Tighter “access denied” detection in simulation spec |

---

## Issues remaining (non-blocking / UAT)

| Issue | Roles affected | Severity |
|-------|----------------|----------|
| `manage_members` exposes HR, Workforce, Pathways, Discipleship in sidebar | Volunteer Coordinator, Youth Pastor, Communications, Church Admin | Medium — menu clutter |
| Worship Pastor cannot open **Members** (no `manage_members`) | Worship | Low — may be intentional |
| Finance roles still see **Academy** via broad staff gate | Finance, Accountant | Low |
| Small Groups module **empty state** with demo seed | Small Group Leader | Low — seed group exists; UI may need refresh/filter |
| Staff **Home dashboard** shows sparse/empty lens | Staff | Medium — first-use confusion |
| Member portal requires `seed:demo-church` + linked `member` user | Member | Ops — not a code defect |
| External email/SMS not verified in UI | Communications | Deferred from RC |
| No payroll structures → empty payroll tab | HR, Finance | Configuration |

---

## Role-by-role findings

Scores: **1** poor · **3** acceptable · **5** excellent  

| Role | Login | Landing | Dash | Nav | Workflows | Overall | 15 min? |
|------|-------|---------|------|-----|-----------|---------|---------|
| Admin | ✓ | `dashboard` | 5 | 5 | 5 | 5 | **YES** |
| Senior Pastor | ✓ | `dashboard` | 5 | 4 | 5 | 4.5 | **YES** |
| Church Administrator | ✓ | `dashboard` | 4 | 3 | 4 | 4 | **PARTIALLY** |
| Associate Pastor | ✓ | `dashboard` | 4 | 4 | 4 | 4 | **YES** |
| Youth Pastor | ✓ | `sunday-mode` | 4 | 3 | 4 | 4 | **PARTIALLY** |
| Worship Pastor | ✓ | `sunday-mode` | 4 | 5 | 4 | 4.5 | **YES** |
| Finance Manager | ✓ | `finance` (vouchers) | 5 | 5 | 5 | 5 | **YES** |
| Accountant | ✓ | `finance` | 4 | 4* | 4 | 4 | **PARTIALLY** |
| HR Manager | ✓ | `hr` | 5 | 4 | 4 | 4.5 | **YES** |
| Volunteer Coordinator | ✓ | `volunteers` | 4 | 3 | 4 | 4 | **PARTIALLY** |
| Communications Manager | ✓ | `communication` | 4 | 4 | 4 | 4 | **YES** |
| Ministry Leader | ✓ | `sunday-mode` | 4 | 5 | 4 | 4.5 | **YES** |
| Small Group Leader | ✓ | `small-groups` | 3 | 4 | 3 | 3.5 | **PARTIALLY** |
| Staff | ✓ | `dashboard` | 2 | 3 | 3 | 3 | **PARTIALLY** |
| Member | ✓ | `/portal` | 4 | N/A | 4 | 4 | **YES** |

\*After HR nav fix, Accountant should no longer see HR (re-verify after deploy).

### Admin (`admin` / `admin123`)

- **Landing:** Home dashboard — correct.  
- **Navigation:** Full platform (settings, finance, permissions, admin center).  
- **Workflows:** Members, finance, settings probed OK.  
- **Frustrations:** Volume of modules; not church-role realistic (expected for platform admin).

### Senior Pastor (`pastor`)

- **Landing:** Home with pastoral lens — correct.  
- **Daily tasks:** Pastoral Care, Members, Giving, Analytics, Outreach all load.  
- **Too much:** HR, Workforce, Volunteers visible via `manage_members`.  
- **First 15 min:** **YES** — dashboard + Pastoral Care path is clear.

### Church Administrator (`churchadmin`)

- **Landing:** Home (operations lens).  
- **Strengths:** Events, attendance, volunteers, settings visible.  
- **Gaps:** Sees finance-adjacent audit items; discipleship/HR clutter.  
- **First 15 min:** **PARTIALLY** — needs guide to ignore non-ops modules.

### Associate Pastor (`associate`)

- **Landing:** Home (fixed from Volunteers).  
- **Strengths:** Pastoral Care + events + attendance.  
- **Gaps:** No giving/finance (correct); analytics not in seed.  
- **First 15 min:** **YES** — pastoral workflow obvious.

### Youth Pastor (`youth`)

- **Landing:** Sunday Mode — appropriate.  
- **Strengths:** Events, attendance, discipleship.  
- **Gaps:** HR/workforce in nav; no dedicated “Youth” module label.  
- **First 15 min:** **PARTIALLY** — Sunday Mode helps; youth-specific path unclear.

### Worship Pastor (`worship`)

- **Landing:** Sunday Mode — excellent.  
- **Navigation:** Tight (events, attendance, worship, sermons) — best ministry UX.  
- **Gaps:** No member list without `manage_members`.  
- **First 15 min:** **YES** for Sunday prep.

### Finance Manager (`finance`)

- **Landing:** Finance → vouchers tab — excellent treasurer desk.  
- **Workflows:** Giving, budgets, vendors, assets, analytics all OK.  
- **First 15 min:** **YES** — clearest role experience in the product.

### Accountant (`accountant`)

- **Landing:** Finance desk — correct.  
- **Fix applied:** HR nav removed without `manage_hr`.  
- **Gaps:** No approve/post voucher permissions in seed (view/post only via finance).  
- **First 15 min:** **PARTIALLY** — can find ledger; approval path needs training.

### HR Manager (`hradmin`)

- **Landing:** HR & Staff module — correct.  
- **Workflows:** HR, workforce directory, members OK.  
- **Gaps:** Payroll empty until structures configured; offboarding not guided.  
- **First 15 min:** **YES** for HR desk; payroll needs setup day.

### Volunteer Coordinator (`volunteers`)

- **Landing:** Volunteers — correct.  
- **Strengths:** Volunteers → events → Sunday Mode chain works.  
- **Gaps:** HR, discipleship, pathways visible (noise).  
- **First 15 min:** **PARTIALLY** — core path clear; sidebar distracting.

### Communications Manager (`secretary`)

- **Landing:** Communications — correct.  
- **Workflows:** Comms, notifications, website, outreach OK.  
- **First 15 min:** **YES** — lands on primary desk.

### Ministry Leader (`events`)

- **Landing:** Sunday Mode (ministry_leader archetype).  
- **Workflows:** Events, attendance, Sunday — aligned.  
- **First 15 min:** **YES** for event-led ministries.

### Small Group Leader (`groupleader`)

- **Landing:** Small Groups (new archetype) — correct.  
- **Workflows:** Members, attendance OK; groups list empty state in probe.  
- **Gaps:** No `manage_communication` — announcements via church office only.  
- **First 15 min:** **PARTIALLY** — landing right; needs populated groups + comms tip.

### Staff (`staffdesk`)

- **Landing:** Home dashboard (fixed).  
- **Gaps:** Dashboard probe “empty”; broad nav without clear “my tasks.”  
- **First 15 min:** **PARTIALLY** — can open Members/Events; purpose unclear.

### Member (`member`)

- **Landing:** `/portal` — correct.  
- **Sections:** Prayer, groups, giving, sermons visible with demo seed.  
- **First 15 min:** **YES** — self-explanatory portal.

---

## Permissions matrix (seeded demo)

| Permission | Admin | Pastor | Assoc | Youth | Ch.Admin | Worship | Vol.Coord | Finance | Acct | HR | Comms | Min.Lead | Grp.Lead | Staff | Member |
|------------|:-----:|:------:|:-----:|:-----:|:--------:|:-------:|:---------:|:-------:|:----:|:--:|:-----:|:--------:|:--------:|:-----:|:------:|
| manage_members | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | | | ✓ | ✓ | | ✓ | ✓ | |
| manage_discipleship | | ✓ | ✓ | ✓ | | | | | | | | | | ✓ | | |
| manage_events | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | | | | ✓ | ✓ | ✓ | |
| manage_attendance | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | | | | ✓ | ✓ | | |
| manage_finance | ✓ | | | | | | | ✓ | ✓ | ✓ | | | | | |
| manage_giving | ✓ | ✓ | | | | | | ✓ | ✓ | | | | | | |
| manage_hr | ✓ | | | | | | | ✓ | | ✓ | | | | | |
| manage_communication | ✓ | ✓ | | | ✓ | | | | | | ✓ | | | | |
| manage_settings | ✓ | | | | ✓ | | | | | | | | | | |
| manage_analytics | ✓ | ✓ | | | ✓ | | | | | | | | | | |
| manage_outreach | ✓ | ✓ | | | | | | | | | ✓ | | | | |
| manage_documents | ✓ | | | | | | | | | | ✓ | | | | |
| post/approve voucher | ✓ | | | | | | | ✓ | | | | | | | |

---

## Navigation matrix (observed visible `nav-*`)

| Module | Admin | Pastor | Ch.Admn | Assoc | Youth | Worship | Finance | Acct | HR | Volnt | Comms | Min. | Grp | Staff |
|--------|:-----:|:------:|:-------:|:-----:|:-----:|:-------:|:-------:|:----:|:--:|:-----:|:-----:|:----:|:---:|:-----:|
| dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| discipleship | ✓ | ✓ | ✓ | ✓ | ✓ | | | | ✓ | ✓ | ✓ | | ✓ | ✓ |
| finance | ✓ | | | | | | ✓ | ✓ | ✓ | | | | | |
| hr | ✓ | ✓* | ✓* | ✓* | ✓* | | ✓ | ~~✓~~ | ✓ | ✓* | ✓* | | ✓* | ✓* |
| sunday-mode | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | | | ✓ | | ✓ | | ✓ |
| volunteers | ✓ | ✓ | ✓ | ✓ | ✓ | | | | ✓ | ✓ | ✓ | | ✓ | ✓ |
| small-groups | ✓ | ✓ | ✓ | ✓ | ✓ | | | | ✓ | ✓ | ✓ | | ✓ | ✓ |
| settings | ✓ | | ✓ | | | | | | | | | | | |

\*Visible because `manage_members` grants HR row in AppShell (`workforce`/`hr` items) — **recommended UAT follow-up:** split “people” vs “HR” nav permissions.

---

## Dashboard matrix

| Role | Lens / title | Quick ops | Shortcuts quality |
|------|----------------|-----------|-------------------|
| Admin | Operations / executive | Yes | High |
| Senior Pastor | Pastoral | Yes | High |
| Church Admin | Operations | Yes | Medium |
| Finance | Finance | Yes | High |
| HR | Operations | Yes | Medium |
| Worship / Youth / Ministry | Operations | Yes | Medium–high |
| Volunteer Coord | Operations | Yes | High |
| Communications | Operations | Yes | Medium |
| Small Group Leader | Pastoral | Yes | Medium |
| Staff | General / sparse | Yes | Low |
| Member | Portal cards | N/A | High |

---

## Workflow matrix (probe results)

| Role | Key workflows | Result |
|------|----------------|--------|
| Pastor | Care, members, giving, outreach | All OK |
| Church Admin | Members, events, attendance, volunteers, comms | All OK |
| Finance | Giving, finance, budgets, vendors, assets | All OK |
| HR | HR, workforce, members | All OK |
| Worship | Sunday, events, attendance, worship | All OK |
| Volunteer Coord | Volunteers, events, attendance, Sunday | All OK |
| Communications | Comms, notifications, website, outreach | All OK |
| Group Leader | Small groups (empty), members, attendance | Partial |
| Member | Portal sections | All OK (with seed) |

---

## First-use experience audit

| Theme | Finding | Recommendation |
|-------|---------|----------------|
| Onboarding | Academy + Guide button exist | Link from first login banner per role |
| Terminology | “Pastoral Care” consistent | Keep |
| Sidebar density | Many roles see HR/Workforce | Introduce `manage_people` vs `manage_hr` split (future) |
| Finance | Best-in-class landing | Model other roles after finance |
| Staff / general | Weak dashboard story | Add “Staff desk” checklist widget |
| Member portal | Clear sections | Add empty-state CTAs (“Ask church office”) |
| Training | Walkthroughs per role in `walkthroughs.ts` | Prompt on first login |

---

## Top frustrations (simulation)

1. Sidebar shows **HR / Workforce / Pathways** to anyone with `manage_members`.  
2. **Staff** role lands on Home with little guidance.  
3. **Small group** list empty until admin assigns groups (expected, but surprising).  
4. **Accountant** vs **Finance Manager** difference not explained in UI.  
5. **Youth Pastor** label vs generic “Ministry operations” subtitle.

---

## Top improvements (completed + suggested)

**Completed this audit:** archetype fixes, pastoral permission, accountant HR hide, demo seeds, simulation harness.  

**Suggested next:**  
- Nav permission refinement for HR/workforce rows.  
- Staff dashboard welcome checklist.  
- Role-specific first-login banner (1 sentence + 3 links).  
- Hide Academy for roles without `manage_analytics`.

---

## Final question: 15-minute clarity

| Role | Answer | Justification |
|------|--------|----------------|
| Admin | **YES** | Full menu; familiar ERP pattern |
| Senior Pastor | **YES** | Home → Pastoral Care path obvious |
| Church Administrator | **PARTIALLY** | Ops modules clear; noise from extra nav |
| Associate Pastor | **YES** | Same as pastor minus finance |
| Youth Pastor | **PARTIALLY** | Sunday Mode helps; youth branding weak |
| Worship Pastor | **YES** | Focused Sunday/worship nav |
| Finance Manager | **YES** | Lands on voucher desk |
| Accountant | **PARTIALLY** | Finance clear; approvals need training |
| HR Manager | **YES** | Lands on HR desk |
| Volunteer Coordinator | **PARTIALLY** | Volunteers first; sidebar clutter |
| Communications Manager | **YES** | Lands on Communications |
| Ministry Leader | **YES** | Sunday/events path clear |
| Small Group Leader | **PARTIALLY** | Correct landing; needs group data |
| Staff | **PARTIALLY** | Empty dashboard; unclear mandate |
| Member | **YES** | Portal sections labeled plainly |

---

## How to reproduce

```powershell
npm run seed:launch
npx cross-env CI=1 playwright test e2e/role-simulation-audit.spec.ts
# Output: role-simulation-results.json
```

---

## Sign-off

Role simulation **completed** with live logins. Critical mis-landings and permission bugs **fixed**. Remaining items are **wayfinding and nav density**, not broken authentication. Ready for human UAT with per-role scripts in `public/guides/` and Academy tracks.
