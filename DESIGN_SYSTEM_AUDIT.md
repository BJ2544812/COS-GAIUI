# Design System Audit — Ultimate Church OS

**Date:** 2026-06-02  
**Scope:** Frontend only (no backend, API, or seed changes)  
**Goal:** One cohesive product experience across all ERP modules  

---

## Phase 1 — UI inventory (screens reviewed)

| Area | Tabs / views | Notes |
|------|----------------|-------|
| Dashboard | Personal, Executive, Operations | Custom hero typography (normalized) |
| Members | Directory, Intake, Profile, Discipleship | ModuleHeader + StatCard |
| Families | List, detail | ModuleHeader, ResponsiveTableWrap |
| Events | Events, Services, workspace | ModuleHeader, primary Create Event |
| Giving | Overview, registry, donors, campaigns, sessions, receipts, settlements, Record gift | **Refactored** — StatCard, ChurchChart, ModuleTabs |
| Finance | Vouchers, ledger, reports | ModuleHeader, ActionButton hierarchy |
| HR / Workforce | Directory, leave, payroll, policies | **Refactored** — ModuleHeader replaces gradient hero |
| Volunteers | Board, assign | ModuleHeader, StatCard |
| Attendance | Sessions, live check-in, kiosk | **Refactored** — ChurchChart, StatCard, SubpageHeader |
| Pastoral care | Cases, prayer, tasks | ModuleHeader |
| Communications | Command, compose, logs | StatCard KPI row |
| Documents | Vault, registry / print | **Refactored** — ModuleHeader both tabs |
| Website builder | Pages, media, SEO, sermons | Intentionally unchanged (public template fidelity) |
| Reports / Analytics | KPI tables | ModuleHeader |
| Notifications | Inbox, filters | **Refactored** — ModuleHeader + StatCard |
| Academy | Role tracks | **Refactored** — ModuleHeader + ModuleTabs |
| Settings, Permissions, Audit | Various | ModuleHeader pattern |
| Member portal | Home, giving, prayer, events | Separate shell; card-based |
| Auth (login) | Staff + member login | Public pages |

---

## Phase 2 — Design system enforcement

### Token source

| Layer | Location |
|-------|----------|
| CSS variables | `src/index.css` (`:root`, `@theme inline`, `--brand-*`, `--chart-*`) |
| Runtime branding | `SettingsContext.applyBranding()` |
| Class bundles | **`src/lib/designSystem.ts`** (`ds` export) |
| Module primitives | **`src/components/modules/ModuleHeader.tsx`** |

### New / extended primitives

| Component | Purpose |
|-----------|---------|
| `PageLayout` | Consistent page spacing, max-width, animation |
| `ModuleHeader` | Title `text-2xl md:text-3xl`, subtitle, icon, actions |
| `StatCard` | KPI cards — unified label/value scale |
| `SectionCard` | Section title + body |
| `ActionButton` | Primary / secondary / danger / ghost + **focus ring** |
| `ModuleTabs` | Horizontal tab bar (Giving, Academy) |
| `SubpageHeader` | Back + title for create/detail flows |
| `ChurchAreaChart` + `ChartSection` | Recharts with brand colors |
| `FormFieldLabel` | Consistent form labels |
| `ResponsiveTableWrap` | Mobile-safe tables |
| `EmptyState`, `FeedbackBanner`, `LoadingSkeleton` | States |

### Standards applied

| Element | Standard |
|---------|----------|
| Page title | `ds.pageTitle` — 2xl / 3xl, font-black |
| KPI values | `ds.kpiValue` — 2xl / 3xl (not 5xl–6xl) |
| Cards | `rounded-2xl`, `border-slate-100`, `shadow-sm` |
| Section spacing | `space-y-8` via `PageLayout` |
| Icons in header | 12×12 container, brand tint |
| Charts | Brand primary stroke, 2.5px, shared tooltip |
| Focus | `ds.focusRing` on tabs and ActionButton |

---

## Inconsistencies found (before)

- Mixed page titles: `text-3xl` … `text-6xl` uppercase heroes  
- Duplicate button systems: shadcn `Button` vs `ActionButton`  
- Charts: heavy stroke (6px), custom tooltip per module  
- Giving / Attendance: oversized KPI typography and `rounded-[4rem]` cards  
- Workforce: dark gradient header unlike other modules  
- Documents / Academy / Notifications: ad-hoc `<h1>` blocks  

---

## Improvements made (code)

1. Added `designSystem.ts`, `ChurchChart.tsx`, `ModuleTabs.tsx`, `SubpageHeader.tsx`  
2. Extended `ModuleHeader.tsx` with `PageLayout`, `FormFieldLabel`, token-aligned StatCard/SectionCard  
3. Added `.module-page` and `.erp-focus-ring` utilities in `index.css`  
4. Refactored **Giving**, **Attendance**, **Workforce**, **Documents**, **Academy**, **Notifications**, **Communication** KPIs, **Dashboard** title scale  

---

## Remaining recommendations

| Priority | Item |
|----------|------|
| P1 | Migrate **Website builder** admin chrome only (not public template blocks) to `ModuleHeader` |
| P2 | Replace remaining raw `<table>` with `ResponsiveTableWrap` + shadcn `Table` in Outreach, Structure |
| P3 | Standardize shadcn `Button` variant mapping doc for dialogs vs page actions |
| P4 | Add `ChartBar` / `ChartDonut` wrappers when Analytics gets charts |
| P5 | Dark mode pass on `slate-*` hardcoded modules |

---

## Success criteria (design system)

| Criterion | Status |
|-----------|--------|
| Documented tokens | PASS |
| Shared layout primitive | PASS (`PageLayout`) |
| Shared chart primitive | PASS (`ChurchAreaChart`) |
| Typography scale enforced on refactored modules | PASS |
| Website public appearance unchanged | PASS (no WebsiteModule content edits) |
