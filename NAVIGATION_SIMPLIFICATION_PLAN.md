# Navigation Simplification — Implementation Plan

**Product:** Ultimate Church OS (UCOS)  
**Date:** 2026-06-01  
**Objective:** Implement `MODULE_ESSENCE_REPORT.md` recommendations — **navigation only**  
**Constraints:** No deleted functionality, data, or workflows. Preserve URLs via aliases and deep links.

**Deliverable type:** Engineering plan (phased implementation). Code changes follow this document in a separate PR.

---

## 1. Executive summary

| Metric | Current | After simplification |
|--------|---------|-------------------|
| **Sidebar items** (full admin, all groups) | **31** | **14** primary |
| **Nav groups** | 7 | **5** (recommended) |
| **Reduction** | — | **−17 items (−55%)** |
| **Routable module ids** | 39+ (`ERPModule`) | **Unchanged** (aliases absorb old URLs) |
| **React modules / APIs** | All kept | **Unchanged** |

Primary sidebar matches the product owner target list. Merged modules become **tabs or Settings sections**; old `?module=` values redirect through `MODULE_ALIASES`.

---

## 2. Current navigation

### 2.1 Sidebar source

Defined in `src/components/layout/AppShell.tsx` → `GROUPS` (filtered by `canSeeItem` + `shouldShowInSidebar` from `roleExperience.ts`).

### 2.2 Current sidebar inventory (31 items)

| Group (internal) | User-facing group | Items |
|------------------|---------------------|-------|
| Identity | People & Care | Members, Families, Volunteers, HR & Staff, Small Groups, Growth Pathways, Pastoral Care |
| Operations | Sunday & Events | Events, Sunday Service, Attendance, Worship Planning, Visitors & Outreach, Church Structure |
| Finance | Giving & Finance | Giving, Finance, Budgets, Vendors & Payroll, Church Assets, Church Documents |
| Engagement | Messages & Media | Sermons, Communications, Notifications |
| Website | Website | Website Builder |
| Insights & Audit | Home & Reports | Home, Reports, Academy, Change History, Activity Log |
| Platform | Church Settings | Settings, Church Admin, Roles & Access |

### 2.3 Routing today

| Layer | File | Role |
|-------|------|------|
| URL parse | `adminNavigation.ts` → `parseAdminSearchParams`, `normalizeAdminModule` | `?module=` + `?tab=` |
| Aliases | `MODULE_ALIASES` | Legacy id → module + tab |
| Render | `App.tsx` `switch (activeModule)` | One component per id |
| Canonical list | `CANONICAL_ADMIN_MODULES` | Valid admin routes |

### 2.4 Existing tabs (implementation head start)

| Parent | Tabs today | Gap for merge |
|--------|------------|---------------|
| `members` | `directory`, `discipleship` | Add `families`, `pathways` |
| `events` | `events`, `services` | Add `planning` (embed `WorshipPlanningModule`) |
| `finance` | vouchers, dashboard, reports, … | Add `budgets`, `vendors` (embed `BudgetsModule` / `VendorsModule`) |
| `communication` | overview, compose, prayer, log | Add `inbox` (embed `NotificationsModule`) |
| `settings` | organization, branding, financial, … | Add **Advanced** area for structure, roles, audit, admin, academy |

---

## 3. Proposed navigation

### 3.1 Primary sidebar (14 items) — KEEP

Aligned with implementation targets.

| # | Label | Module id | Permission (unchanged) |
|---|--------|-----------|-------------------------|
| 1 | Home | `dashboard` | analytics / ops composite |
| 2 | Members | `members` | `manage_members` |
| 3 | Volunteers | `volunteers` | `manage_members` |
| 4 | HR & Staff | `hr` | `manage_hr` or `manage_members` |
| 5 | Pastoral Care | `discipleship` | `manage_discipleship` / `manage_members` |
| 6 | Events | `events` | `manage_events` |
| 7 | Sunday Service | `sunday-mode` | `manage_events` |
| 8 | Attendance | `attendance` | `manage_attendance` |
| 9 | Giving | `giving` | `manage_giving` |
| 10 | Finance | `finance` | `manage_finance` |
| 11 | Communications | `communication` | `manage_communication` |
| 12 | Website | `website` | `manage_settings` |
| 13 | Reports | `analytics` | `manage_analytics` |
| 14 | Settings | `settings` | `manage_settings` |

**Not in primary list but remain routable** (role-gated or “More” — see §3.3):

- `small-groups` — keep route; show in sidebar only for `small_group_leader` / pastoral roles  
- `outreach` — keep route; optional Tier-2 or Pastoral submenu  
- `assets`, `documents`, `sermons` — keep route; Tier-2 under Settings or Finance/Website (not in this phase’s primary list)

### 3.2 Proposed groups (5)

| Group | Items |
|-------|--------|
| **Home & Reports** | Home, Reports |
| **People** | Members, Volunteers, HR & Staff, Pastoral Care |
| **Sunday & Events** | Events, Sunday Service, Attendance |
| **Stewardship** | Giving, Finance |
| **Engage & Configure** | Communications, Website, Settings |

### 3.3 Merged children (not in sidebar)

| Former sidebar item | New home |
|---------------------|----------|
| Families | Members → tab `families` |
| Growth Pathways | Members → tab `pathways` |
| Worship Planning | Events → tab `planning` |
| Budgets | Finance → tab `budgets` |
| Vendors & Payroll | Finance → tab `vendors` |
| Notifications | Communications → tab `inbox` |
| Church Structure | Settings → tab `structure` |
| Roles & Access | Settings → tab `permissions` |
| Activity Log | Settings → tab `activity` |
| Change History | Settings → tab `audit` |
| Church Admin | Settings → tab `admin` |
| Academy | Settings → tab `academy` |

---

## 4. Migration mapping

### 4.1 URL / alias table (preserve bookmarks)

Add or update rows in `MODULE_ALIASES` (`adminNavigation.ts`). Old URLs must resolve and set tab side-effects.

| Old `?module=` | New canonical URL | Tab | Session side-effect key |
|----------------|-------------------|-----|-------------------------|
| `families` | `members` | `families` | `ucos_members_active_tab` (new) |
| `pathways` | `members` | `pathways` | `ucos_members_active_tab` |
| `worship` | `events` | `planning` | `ucos_events_active_tab` (extend values) |
| `budgets` | `finance` | `budgets` | `church_erp_finance_tab` (extend type) |
| `funds` | `finance` | `budgets` | (alias `funds` → finance budgets; map funds sub-tab inside BudgetsModule) |
| `vendors` | `finance` | `vendors` | `church_erp_finance_tab` |
| `notifications` | `communication` | `inbox` | `ucos_communication_active_tab` (new) |
| `structure` | `settings` | `structure` | `ucos_settings_active_tab` (new) |
| `permissions` | `settings` | `permissions` | `ucos_settings_active_tab` |
| `workflow-monitor` | `settings` | `activity` | `ucos_settings_active_tab` |
| `event-admin` | `settings` | `activity` | (existing alias → remap to settings) |
| `audit-logs` | `settings` | `audit` | `ucos_settings_active_tab` |
| `admin-center` | `settings` | `admin` | `ucos_settings_active_tab` |
| `feature-flags` | `settings` | `admin` | sub-tab inside SystemAdminCenter |
| `integrations` | `settings` | `admin` | governance sub-tab |
| `academy` | `settings` | `academy` | `ucos_settings_active_tab` |
| `tenant-settings` | `settings` | — | (keep) |
| `services` | `events` | `services` | (keep) |
| `workforce` | `hr` | `directory` | (keep) |
| `missions` | `outreach` | — | (keep) |
| `engagement` | `analytics` | — | (keep) |
| `content` | `sermons` | — | (keep; no sidebar) |

**Example preserved deep links:**

```
/admin?module=families          → /admin?module=members&tab=families
/admin?module=worship           → /admin?module=events&tab=planning
/admin?module=budgets           → /admin?module=finance&tab=budgets
/admin?module=notifications     → /admin?module=communication&tab=inbox
/admin?module=permissions       → /admin?module=settings&tab=permissions
/admin?module=workflow-monitor  → /admin?module=settings&tab=activity
```

### 4.2 `normalizeAdminModule` behavior

When alias matches:

1. Return `{ module: parent, tab }`.  
2. Call `applyModuleTabSideEffects(parent, tab)`.  
3. Optionally `replace: true` navigate in `App.tsx` so address bar shows canonical URL (recommended for clarity, not required for function).

When raw id is still canonical (e.g. `budgets`) but removed from sidebar:

- Treat as alias target on parse (same as table above).  
- Keep `App.tsx` `case 'budgets':` rendering `BudgetsModule` **or** delegate from `FinanceModule` when `tab=budgets` — either pattern preserves behavior.

### 4.3 `CANONICAL_ADMIN_MODULES`

- **Do not remove** ids from `ERPModule` or `App.tsx` switch.  
- Introduce `PRIMARY_SIDEBAR_MODULES: readonly ERPModule[]` (14 ids) used only by `AppShell` / `shouldShowInSidebar`.  
- `CANONICAL_ADMIN_MODULES` remains superset for routing + command palette.

### 4.4 Component integration pattern

| Parent | Change |
|--------|--------|
| `MembersModule` | Extend tab union; render `<FamiliesModule embedded />` / `<PathwaysModule embedded />` or lazy import sections |
| `EventsModule` | Add tab `planning`; render `<WorshipPlanningModule onModuleChange={…} />` |
| `FinanceModule` | Add tabs `budgets`, `vendors`; render existing modules with `embedded` prop (add optional `embedded?: boolean` to hide duplicate headers) |
| `CommunicationModule` | Add tab `inbox`; render `<NotificationsModule onModuleChange={…} />` |
| `SettingsModule` | Add tab strip **Advanced**; mount `StructureModule`, `PermissionsModule`, `WorkflowMonitoringModule`, `AuditLogsModule`, `SystemAdminCenterModule`, `AcademyModule` by tab |

**No API or Prisma changes.**

---

## 5. Implementation phases

### Phase 1 — Aliases & routing (low risk)

**Files:** `adminNavigation.ts`, `App.tsx` (optional URL replace), tests for `normalizeAdminModule`.

- Add all alias rows in §4.1.  
- Extend `applyModuleTabSideEffects` for members, communication, settings tabs.  
- Verify `localStorage` `church_erp_last_module` still resolves.

**Exit criteria:** Old bookmarks open correct UI; no 404 / Access Denied regressions.

### Phase 2 — Parent tabs (medium)

**Files:** parent modules listed in §4.4; `financeNavigation.ts` (extend `FinanceWorkspaceTab`); events tab union.

- Embed child modules.  
- Pass `initialTab` from `adminTab` in `App.tsx` (same pattern as `finance` / `hr`).

**Exit criteria:** Full feature parity when arriving via parent tab vs old module id.

### Phase 3 — Sidebar trim (medium)

**Files:** `AppShell.tsx`, `roleExperience.ts`, `churchProductCopy.ts` (group labels optional).

- Replace `GROUPS` with 14-item primary list + `PRIMARY_SIDEBAR_MODULES`.  
- Update `shouldShowInSidebar` to hide merged ids for default roles.  
- Keep `sidebarAllowList` entries but map mental model (e.g. `notifications` → allow `communication`).

**Exit criteria:** Super-admin sees 14 items; focused roles unchanged or smaller.

### Phase 4 — Polish (low)

- Command palette / quick ops: point `notifications` → `communication` + inbox.  
- Header notification bell: unchanged (already global).  
- Walkthroughs (`walkthroughs.ts`): update `module` targets.  
- `data-testid="nav-*"`: keep old ids as aliases only in tests if needed.

---

## 6. Role impact

### 6.1 Permission matrix

**Unchanged.** `App.tsx` `permissionMap` and `canAccessModule` stay per original module id. Aliases normalize **before** access check only if we navigate to parent; ensure:

```ts
// Recommended: normalize module for access, preserve tab
const { module, tab } = normalizeAdminModule(rawModule);
canAccessModule(module); // parent
// For merged-only permissions: members still covers families/pathways
```

| Merged module | Permission source (unchanged) |
|---------------|-------------------------------|
| families, pathways | `manage_members` (via members) |
| worship | `manage_events` (via events) |
| budgets, vendors | `manage_finance` (via finance) |
| notifications | `manage_communication` (via communication) |
| structure, permissions, audit, activity, admin, academy | `manage_settings` (via settings) |

### 6.2 Archetype adjustments (`roleExperience.ts`)

| Archetype | Current pain | After |
|-----------|--------------|-------|
| **super_admin** | 31 nav items | 14 primary + Tier-2 routes |
| **church_admin** | `sidebarAllowList` includes `notifications`, `worship`, `audit-logs` | Replace ids: `communication`, `events`+planning tab, `settings`+activity |
| **finance** | `budgets`, `vendors` in shortcuts | `finance` + `tab=budgets` / `tab=vendors` |
| **hr** | Already on `hr` | No change |
| **ministry_leader** | `worship`, `sunday-mode` in quick ops | `events?tab=planning` or keep `sunday-mode` shortcut |
| **volunteer_coordinator** | No worship in allow list | Unchanged |
| **communications** | `communication` + `notifications` | Single `communication`; inbox tab |
| **accountant** | `sidebarAllowList`: budgets, vendors | `finance` only in list; tabs via shortcuts |

### 6.3 Quick ops bar

| Old quick op id | New behavior |
|-----------------|--------------|
| `notifications` | `onModuleChange('communication', 'inbox')` |
| `worship` | `onModuleChange('events', 'planning')` |

Update `labelForQuickOp` — remove orphan labels for hidden sidebar ids or keep for backward compatibility in code paths.

### 6.4 Member portal

**Unchanged** (`/portal`). No sidebar.

---

## 7. Sidebar complexity reduction

### 7.1 Counts

| Role view | Before | After (primary) | Δ |
|-----------|--------|-----------------|---|
| Full admin (all permissions) | 31 | 14 | **−55%** |
| Church admin allow-list (~18) | ~18 | ~12–14 | **−22% to −33%** |
| Accountant allow-list | 6 | 4–5 | **−17%** |
| Volunteer coordinator | 7 | 6 | **−14%** |

### 7.2 Cognitive groups

| Before | After |
|--------|-------|
| 7 group headers | 5 group headers |
| “Where is Budgets?” → Finance group + 5 siblings | Finance → one item, tabs inside |
| “Notifications vs Communications?” | One Communications item |
| “Church Admin vs Settings?” | One Settings item |

### 7.3 What does not change

- Sunday Service standalone entry (live ops).  
- HR & Staff standalone (per target list).  
- All backend routes and workflows.  
- Notification bell in header.  
- `profile` via avatar (not sidebar).

---

## 8. File checklist

| File | Action |
|------|--------|
| `src/lib/adminNavigation.ts` | Aliases, `PRIMARY_SIDEBAR_MODULES`, side-effects |
| `src/lib/financeNavigation.ts` | Add `budgets`, `vendors` to `FinanceWorkspaceTab` |
| `src/components/layout/AppShell.tsx` | New `GROUPS`, 14 items |
| `src/lib/roleExperience.ts` | `sidebarAllowList`, `quickOps`, `dashboardShortcuts` |
| `src/App.tsx` | Pass `initialTab` to parents; optional canonical URL replace |
| `src/modules/members/MembersModule.tsx` | Tabs: families, pathways |
| `src/modules/events/EventsModule.tsx` | Tab: planning |
| `src/modules/finance/FinanceModule.tsx` | Tabs: budgets, vendors |
| `src/modules/communication/CommunicationModule.tsx` | Tab: inbox |
| `src/modules/settings/SettingsModule.tsx` | Advanced tabs + embeds |
| `src/lib/churchProductCopy.ts` | Optional group label tweaks |
| `src/lib/walkthroughs.ts` | Module targets |
| `MODULE_ESSENCE_REPORT.md` | Reference only |

**Optional:** `src/lib/navigationConfig.ts` (new) — single source for primary vs routable ids.

---

## 9. Testing plan

| Test | Method |
|------|--------|
| Alias redirect | Unit tests for `normalizeAdminModule` (all §4.1 rows) |
| Permissions | Login as finance, HR, pastor, coordinator — open merged URLs |
| Tab state | Refresh on `/admin?module=finance&tab=budgets` retains tab |
| Sidebar | Snapshot: super-admin sees 14 `data-testid="nav-*"` |
| Quick ops | Mobile bar targets correct parent+tab |
| Bookmarks | `localStorage church_erp_last_module` with `families` still works |
| Notifications actions | `actionLink: 'sunday-mode'` etc. still resolve via existing aliases |

---

## 10. Rollback strategy

- Sidebar driven by feature flag `navSimplifiedV1` (optional) reading from settings or env.  
- If disabled: restore current `GROUPS` array from git.  
- Aliases are safe to keep even when flag off (they only improve URLs).

---

## 11. Out of scope (this plan)

- Removing `ERPModule` types or `App.tsx` cases.  
- Merging **Small Groups**, **Outreach**, **Assets**, **Documents**, **Sermons** (not in owner target list — handle in a later tier).  
- Merging Sunday Service into Events (value review says KEEP).  
- Backend permission renames.  
- Database migrations.

---

## 12. Success criteria (acceptance)

1. Primary sidebar shows **exactly 14** modules for a full-permission admin.  
2. Every merged module opens the **same UI** as before via old URL or alias.  
3. No permission regression for finance, HR, pastoral, events roles.  
4. Sidebar item count reduced by **≥50%** for default admin.  
5. Advanced modules remain reachable from **Settings** tabs.  

---

## 13. Related documents

- `MODULE_ESSENCE_REPORT.md` — audit rationale  
- `STAFF_MODULE_CONSOLIDATION_REPORT.md` — HR / workforce alias precedent  
- `SUNDAY_SERVICE_VALUE_REPORT.md` — keep Sunday Service as primary  

---

## Appendix A — Visual before / after

### Before (31)

```
People & Care (7) | Sunday & Events (6) | Giving & Finance (6) | Messages & Media (3) | Website (1) | Home & Reports (5) | Church Settings (3)
```

### After (14)

```
Home & Reports (2) | People (4) | Sunday & Events (3) | Stewardship (2) | Engage & Configure (3)
```

*(People = Members, Volunteers, HR, Pastoral Care — Small Groups remains role-gated outside this count if still shown to leaders.)*

---

## Appendix B — MERGE / KEEP / HIDE summary

| Module | Plan action |
|--------|-------------|
| dashboard | **KEEP** primary |
| members | **KEEP** primary |
| families | **MERGE** → members |
| volunteers | **KEEP** primary |
| hr | **KEEP** primary |
| small-groups | **KEEP** route; **HIDE** default sidebar (role list) |
| pathways | **MERGE** → members |
| discipleship | **KEEP** primary |
| events | **KEEP** primary |
| sunday-mode | **KEEP** primary |
| attendance | **KEEP** primary |
| worship | **MERGE** → events |
| outreach | **HIDE** default sidebar (optional Tier-2) |
| structure | **MERGE** → settings |
| giving | **KEEP** primary |
| finance | **KEEP** primary |
| budgets | **MERGE** → finance |
| vendors | **MERGE** → finance |
| assets, documents, sermons | **HIDE** sidebar (future settings/website tabs) |
| communication | **KEEP** primary |
| notifications | **MERGE** → communication |
| website | **KEEP** primary |
| analytics | **KEEP** primary (Reports) |
| academy | **MERGE** → settings |
| audit-logs | **MERGE** → settings |
| workflow-monitor | **MERGE** → settings |
| settings | **KEEP** primary |
| admin-center | **MERGE** → settings |
| permissions | **MERGE** → settings |
| profile | **KEEP** header only |

**REMOVE:** Not applicable — navigation-only consolidation.
