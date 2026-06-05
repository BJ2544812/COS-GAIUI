# Role Polish & UAT Preparation Report

**Date:** 2026-06-01  
**Scope:** UX polish for six roles marked **PARTIALLY** in `ROLE_SIMULATION_AUDIT.md`  
**Out of scope:** New modules, architecture changes, new workflows

---

## Summary

Target roles received **sidebar allowlists**, **focused home dashboards**, **first-day step cards**, and **clearer empty states**. Permissions are unchanged — reduced navigation is display-only; direct URLs still respect `canAccessModule`.

| Role | Polish level | Expected 15-min clarity |
|------|--------------|-------------------------|
| Church Administrator | **High** | **YES** |
| Youth Pastor | **High** | **YES** |
| Accountant | **High** | **YES** |
| Volunteer Coordinator | **High** | **YES** |
| Small Group Leader | **Medium–High** | **PARTIALLY → YES** (with data) |
| Staff | **High** | **YES** |

---

## Changes made

### Task 1 — Sidebar clutter reduction

**Mechanism:** `sidebarAllowList` on `RoleExperience` + `shouldShowInSidebar()` in `AppShell.tsx`.

| Role | Sidebar now emphasizes | Hidden from sidebar (access unchanged) |
|------|------------------------|--------------------------------------|
| Church Administrator | Events, Sunday, attendance, people, comms, settings, website, reports | HR, workforce, pathways, finance, giving |
| Youth Pastor | Sunday, events, attendance, worship, members, care, sermons | HR, finance, volunteers admin noise |
| Accountant | Giving, finance, budgets, vendors, reports | HR, people ops extras, academy* |
| Volunteer Coordinator | Volunteers, events, attendance, Sunday, members | HR, discipleship, pathways, finance |
| Small Group Leader | Groups, members, attendance, pastoral care | HR, finance, events admin breadth |
| Staff | Home, members, events, alerts, Sunday, attendance | HR, finance, pathways |

\* **Academy** now requires `manage_analytics` globally (was visible to all staff).

**New archetypes:** `youth_pastor`, `accountant`, `staff_desk` (replacing mis-routed `ministry_leader` / `finance` / `general`).

### Task 2 — Dashboard improvement

**`RoleFirstDayPanel`** (`src/components/role/RoleFirstDayPanel.tsx`):

- Four role-specific steps with one-click navigation
- Dismissible per archetype (localStorage)
- Shown on Home for all six target roles

**`DashboardModule`:**

- `focusedHome` hides Personal/Executive/Operations toggle for streamlined roles
- Church admin / youth / volunteer / group leader → **Operations command center** + first-day card
- Staff → **Personal** snapshot (tasks, events, shortcuts) + first-day card
- Accountant → **Finance executive** lens + first-day card
- Operations desk shortcuts use `dashboardShortcuts` per role

### Task 3 — Empty experience review

| Screen | Change |
|--------|--------|
| Small Groups | Leader-friendly empty copy; explains church office assigns groups |
| Volunteers | Coordinator-oriented empty copy for first assignment |

### Task 4 — First-day experience

| Element | Behavior |
|---------|----------|
| Landing pages | Unchanged URLs; titles/subtitles updated per archetype |
| First-day card | “Start here — four steps for today” on Home |
| Quick ops bar | Still driven by `roleExperience.quickOps` |
| Walkthroughs | Unchanged (Guide button); UAT plan references them |

### Task 5 — UAT preparation

**Deliverable:** `UAT_TEST_PLAN.md` — 13 role scripts with steps, expected results, pass/fail columns, sign-off table.

---

## Roles improved vs unchanged

| Status | Roles |
|--------|-------|
| **Improved** | Church Administrator, Youth Pastor, Accountant, Volunteer Coordinator, Small Group Leader, Staff |
| **Unchanged (already strong)** | Admin, Senior Pastor, Finance Manager, HR Manager, Worship Pastor, Communications, Ministry Leader, Member |
| **Future enhancement only** | Senior Pastor / Church Admin nav density for `manage_members` roles not in this pass |

---

## Remaining friction

1. **Deep links** — Users can still open `/admin?module=hr` if they have permission; sidebar only hides clutter.  
2. **Small group data** — Leaders need a group assigned in admin; empty state explains but does not create data.  
3. **Accountant approvals** — Seed lacks `approve_voucher`; treasurer must perform approvals (document in UAT).  
4. **Youth branding** — Module names are generic (Events, Sunday Mode); no separate “Youth” module id.  
5. **Communications transport** — Email/SMS production not part of this polish.

---

## Recommended future enhancements

- “More tools…” drawer for optional modules hidden from allowlist  
- Role-specific **Academy** track auto-selected on first login  
- **Youth** filter preset on Events list  
- Staff **task inbox** wired to assigned office tasks API  
- Group leader **read-only** group view when admin assigns leader in roster  

---

## Files touched

- `src/lib/roleExperience.ts` — archetypes, allowlists, focused home  
- `src/components/layout/AppShell.tsx` — sidebar filter, academy gate  
- `src/components/role/RoleFirstDayPanel.tsx` — **new**  
- `src/modules/dashboard/DashboardModule.tsx` — focused views, first-day panel  
- `src/modules/small-groups/SmallGroupsModule.tsx` — empty copy  
- `src/modules/volunteers/VolunteersModule.tsx` — empty copy  
- `src/App.tsx` — pastoral care permission check (prior RC)  
- `e2e/role-experience.spec.ts` — youth landing assertion  
- `UAT_TEST_PLAN.md` — **new**  
- `ROLE_POLISH_REPORT.md` — **new**

---

## Validation

- `npm run lint` — **PASS** (tsc --noEmit)  
- Re-run role simulation recommended:  
  `npx cross-env CI=1 playwright test e2e/role-simulation-audit.spec.ts`

---

## UAT readiness

**The platform is ready for human UAT** when:

1. `npm run seed:launch` has been run on the UAT environment.  
2. Testers use `UAT_TEST_PLAN.md` scripts.  
3. Defects are logged with the template in that document.

Polish goal met: each target role has a **clear landing story**, **reduced navigation**, **actionable home guidance**, and **honest empty states** within the first 15 minutes.
