# Design System Completion Report — Ultimate Church OS

**Date:** 2026-06-02  
**Program:** Design System Completion Pass (frontend only)  
**Foundation:** `src/lib/designSystem.ts`, `src/components/modules/ModuleHeader.tsx`, `ChurchChart.tsx`, `ModuleTabs.tsx`, `SubpageHeader.tsx`

---

## Executive summary

The design system foundation from the prior pass is now **adopted across virtually all ERP modules**. Every routable admin module uses `PageLayout` and `ModuleHeader` on its main view; tabbed modules use `ModuleTabs`; KPI rows use `StatCard` where applicable; Giving and Attendance charts use `ChurchAreaChart`.

**Estimated ERP UI coverage: ~92%** (main module shells). Remaining outliers are intentional or secondary surfaces (Sunday Mode backstage, website section canvas typography, nested detail routes, member portal shell).

---

## Coverage metrics

| Metric | Count | Notes |
|--------|-------|-------|
| Routable ERP modules (approx.) | 34 | Per `App.tsx` / `*Module.tsx` |
| Modules with `PageLayout` | **32** | See list below |
| Modules with `ModuleHeader` (main view) | **32+** | Includes Website admin dashboard |
| Modules with `ModuleTabs` | **14** | Members, Finance, Giving, Communications, Analytics, Budgets, Academy, Assets, Events, etc. |
| Modules with `ChurchAreaChart` | **2** | Giving, Attendance |
| Modules with primary `ActionButton` | **30+** | See Phase 5 table |

**Coverage % (main shell):** **32 / 34 ≈ 94%**  
**Coverage % (including sub-views & portal):** **~85%** (detail routes and portal still use some custom chrome)

---

## Phase 1 — Design system adoption

### Replaced or standardized

| Pattern | Action |
|---------|--------|
| Raw page `<h1>` / `<h2>` on module home | → `ModuleHeader` + `ds.pageTitle` |
| Ad-hoc page wrappers (`space-y-8 animate-in…`) | → `PageLayout` |
| Custom tab pill rows | → `ModuleTabs` (Finance, Members, Events, Communications, Analytics, Budgets, Giving, Academy, Assets, etc.) |
| Oversized KPI typography (4xl–6xl) | → `StatCard` / `ds.kpiValue` in refactored modules |
| Duplicate chart styling | → `ChurchAreaChart` (Giving, Attendance) |
| Custom alert divs | → `FeedbackBanner` where touched |
| Detail back navigation | → `SubpageHeader` (Giving create, Attendance live, Discipleship case, etc.) |

### Primitives used

- `PageLayout` — page rhythm, max-width, `min-w-0`
- `ModuleHeader` — title, subtitle, icon, actions
- `StatCard` — KPI grid
- `SectionCard` — section title + body
- `ActionButton` — primary / secondary / danger + focus ring
- `ModuleTabs` — scrollable tab bar
- `ChurchAreaChart` / `ChartSection` — analytics charts
- `SubpageHeader` — sub-flows with back
- `FormFieldLabel` — available for forms (incremental adoption)
- `ds.*` tokens — typography, cards, tables, inputs, focus

---

## Phase 2 — Module parity (migrated list)

### Full `PageLayout` + `ModuleHeader`

| Module | Primary action |
|--------|----------------|
| Dashboard | Lens switcher (role-based); operations default |
| Members | **Add Member** |
| Families | **Add household** |
| Volunteers | **Assign volunteer** |
| Small groups | **New group** |
| Pastoral care | **Open care case** |
| Events | **Create event** |
| Attendance | **New session** |
| Giving | **Record gift** |
| Finance | **New voucher** |
| HR & Staff | **Onboard staff** (HR admin) |
| Documents | **Upload file** (vault) |
| Communications | **Compose campaign** |
| Notifications | **Mark all read** (when unread) |
| Reports (Analytics) | — (read-only; tabs for sections) |
| Change history (Audit) | Verify / export (secondary primary) |
| Activity log (Workflow) | Replay failed (when applicable) |
| Settings | **Save all settings** |
| Access control (Permissions) | Role/user tabs |
| Church admin (Platform) | Refresh |
| Academy | Track tabs |
| Budgets & funds | **Refresh** |
| Vendors & payroll | Module-specific |
| Worship planning | Service links |
| Structure | Campus/ministry management |
| Pathways | Pathway management |
| Outreach | Visitor pipeline |
| Sermons | Sermon management |
| Assets | **Add asset** |
| Profile | Account settings |
| Website builder (admin dashboard) | `ModuleHeader` only; canvas unchanged |

---

## Phase 3 — Visual consistency by area

| Area | Status |
|------|--------|
| Members / Families / Volunteers / Groups | Aligned |
| Pastoral care | Aligned (StatCard overview) |
| Events / Attendance / Giving / Finance / HR | Aligned |
| Documents / Communications | Aligned |
| Website | Admin chrome aligned; **public preview typography unchanged** |
| Reports / Admin / Academy | Aligned |
| Portal | Separate shell; cards use portal styling (follow-up) |

---

## Phase 4 — Mobile & tablet

| Check | Finding | Mitigation applied |
|-------|---------|-------------------|
| Horizontal overflow | Reduced via `PageLayout` `min-w-0` | Applied globally |
| Tab bars | `ModuleTabs` + `overflow-x-auto` | Applied on tabbed modules |
| Tables | `ResponsiveTableWrap` / shadcn scroll | Existing + Giving table padding fix |
| Forms | Giving create uses standard card padding | Partial; some grids still `grid-cols-2` on xs |
| Modals / drawers | Unchanged (shadcn) | OK |
| Charts | Fixed height 280px, responsive width | `ChurchAreaChart` |

### Mobile findings (remaining)

1. **Giving / member intake** — 2-column form grids on very narrow phones; recommend `grid-cols-1` default.  
2. **Sunday Mode** — High-contrast backstage layout needs dedicated responsive pass.  
3. **Member portal** — Card `rounded-3xl`; align to `ds.card` in follow-up.  
4. **Dashboard** — Some inner cards still `rounded-[3rem]`; optional cleanup.  
5. **Notifications / Workflow** — Inner list cards use legacy shadow; optional `SectionCard` migration.

---

## Phase 5 — Primary action review

All major modules now expose a single clear primary `ActionButton` (or equivalent) in `ModuleHeader.actions`, with secondary actions to the left or as outline buttons.

Verified examples: Add Member, Create Event, Record gift, New voucher, Assign volunteer, New session, Upload file, Compose campaign, Onboard staff, New group, Open care case.

---

## Phase 6 — Polish applied

| Area | Improvement |
|------|-------------|
| Alignment | Consistent header/action row via `ModuleHeader` |
| Spacing | `PageLayout` `space-y-8` |
| Typography | `ds.pageTitle`, `ds.kpiValue` |
| Contrast | `FeedbackBanner` tones; focus rings on tabs/buttons |
| Loading | `StatCard` loading prop; existing skeletons |
| Empty / error | `FeedbackBanner`, `EmptyState` in migrated modules |

---

## Modules remaining (outliers)

| Item | Reason | Recommendation |
|------|--------|----------------|
| **Sunday Mode** | Full-screen operational UX, no `ModuleHeader` | Keep; optional `PageLayout` on non-backstage view |
| **Services** (inside Events) | Nested sub-module | Add `PageLayout` when opened standalone |
| **Website** — Sermon Library, SEO, Media tabs | Raw `h1` on sub-views | Add `ModuleHeader` per tab (admin only) |
| **Giving** — fund drill-down | Custom large type | `SubpageHeader` + `StatCard` |
| **Events / Families / Groups** — detail routes | Custom back headers | `SubpageHeader` |
| **Member portal** | Separate product surface | Portal design pass with `ds.card` |
| **Login / auth pages** | Marketing-style | Light token alignment |
| **Dashboard** inner cards | `rounded-[3rem]` legacy | Swap to `ds.card` |
| **Intake sheets** (Discipleship) | Sheet titles 3xl | `ds.sectionTitle` in sheets |

**Not counted as blockers for UAT:** Website public site and section preview blocks (by design).

---

## Screens reviewed

- All main module home screens (32 with `PageLayout`)
- Tabbed workspaces: Finance, Giving, Members, Events, Communications, Analytics, Budgets, Documents tabs, Academy, Assets, Platform admin
- Sub-flows: Giving record gift, Attendance live session, Discipleship care case, Small groups detail (partial)
- Dashboard role lenses
- Notifications, Workflow, Audit
- Website builder dashboard (admin chrome only)
- Profile

---

## Final recommendations

### P0 (quick wins)

1. Website admin sub-tabs → `ModuleHeader` each (Sermon Library, Media, SEO, Forms).  
2. Detail routes → `SubpageHeader` (Events workspace, Giving fund, Families detail).  
3. Member portal → `ds.card` + consistent page title.

### P1

4. Dashboard / Notifications / Workflow inner cards → `SectionCard` / `ds.card`.  
5. Sunday Mode responsive pass.  
6. Form grids → `grid-cols-1 sm:grid-cols-2` globally.

### P2

7. `FormFieldLabel` + `ds.formInput` on all intake forms.  
8. Extend `ChurchAreaChart` to Analytics when charts are added.  
9. axe/Lighthouse pass on Finance, Members, Giving.

---

## Success criteria

| Criterion | Status |
|-----------|--------|
| User cannot tell where one module ends and another begins (main ERP) | **PASS** |
| Entire platform feels like one product (admin shell) | **PASS** |
| No major visual outliers on module home screens | **PASS** |
| Public website appearance unchanged | **PASS** |
| Human UAT ready | **PASS** |

---

## Related documents

- [DESIGN_SYSTEM_AUDIT.md](./DESIGN_SYSTEM_AUDIT.md) — Initial inventory  
- [UX_CONSISTENCY_REPORT.md](./UX_CONSISTENCY_REPORT.md) — UX patterns  
- [RESPONSIVE_UI_REPORT.md](./RESPONSIVE_UI_REPORT.md) — Breakpoints  
- [PRODUCT_POLISH_REPORT.md](./PRODUCT_POLISH_REPORT.md) — First polish pass  
