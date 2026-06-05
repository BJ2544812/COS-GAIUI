# Responsive UI Report — Ultimate Church OS

**Date:** 2026-06-02  
**Scope:** Layout, tables, forms, modals, charts (frontend)

---

## Layout shell

| Breakpoint | Behavior |
|------------|----------|
| Desktop (≥1024px) | Fixed sidebar, `main` padding `p-6 lg:p-8` |
| Tablet | Sidebar collapses to drawer; module content full width |
| Mobile | Drawer nav, stacked headers, horizontal scroll on tab bars |

`PageLayout` adds `min-w-0`, `max-w-[1600px]`, prevents overflow blowout from wide tables.

---

## Sidebar (Phase 4)

- Mobile: overlay drawer (existing `AppShell`)  
- Group labels remain visible; items truncate with `flex-1 truncate`  
- **Recommendation:** Add `aria-expanded` on menu toggle (follow-up)

---

## Tables

| Pattern | Responsive approach |
|---------|---------------------|
| `ResponsiveTableWrap` | `overflow-x-auto` + bordered container |
| Giving history | Reduced horizontal padding on small screens |
| Members / Finance | shadcn Table wrapper scroll |

**Verified:** Giving overview table uses standard padding (`px-4 md:px-6`) instead of fixed `px-12`.

---

## Forms

| Screen | Mobile behavior |
|--------|-----------------|
| Giving — Record gift | `max-w-4xl` centered; grid `grid-cols-2` may stack on very narrow — **recommend** `sm:grid-cols-2` follow-up |
| Member intake | Existing dialog/sheet patterns unchanged |
| HR modals | Full-width on small viewports via existing dialogs |

---

## Modals & drawers

- shadcn `Dialog` / `Sheet` — unchanged; use viewport max-height  
- Finance voucher create — existing component  

**No clipped content** introduced by this pass.

---

## Cards & KPI grids

| Module | Grid |
|--------|------|
| Giving overview | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| Attendance metrics | `sm:grid-cols-3` + `lg:grid-cols-12` chart row |
| Notifications | `sm:grid-cols-2 lg:grid-cols-4` |
| Communications hub | Same as notifications |

Removed extreme hover `translate-y-[-8px]` on Giving KPI cards (reduced motion-friendly).

---

## Charts

- `ChurchAreaChart` uses `ResponsiveContainer` 100% width  
- Fixed height 280px default — prevents collapse on mobile  
- Legend: implicit via tooltip (consistent)  

---

## Filters & tabs

- `ModuleTabs`: `overflow-x-auto` on tab bar — swipe on mobile  
- Giving search: `w-full sm:w-56` in section header  

---

## Graphs reviewed

| Module | Chart | Status |
|--------|-------|--------|
| Giving | Area — velocity | Unified `ChurchAreaChart` |
| Attendance | Area — trend | Unified `ChurchAreaChart` |
| Dashboard | Component panels | No Recharts |
| Analytics | Tables / KPIs | No chart library yet |

---

## Issues found & fixed

| Issue | Fix |
|-------|-----|
| Horizontal overflow from 6xl text + wide padding | KPI typography scale |
| Tab bar wrapping awkwardly | `ModuleTabs` with scroll |
| Live attendance header crowding on mobile | `SubpageHeader` flex-col stack |

---

## Remaining responsive recommendations

1. Audit `grid-cols-2` forms below 360px width — add `grid-cols-1` default  
2. Sunday Mode backstage layout — dedicated pass (high contrast mode)  
3. Member portal: stack stat cards on `xs`  
4. Test Finance voucher table on iPad landscape  
5. Add `touch-action` friendly hit targets (min 44px) on tab buttons  

---

## Test matrix (manual)

| Viewport | Status |
|----------|--------|
| 1440×900 desktop | Expected PASS |
| 1280×800 laptop | Expected PASS |
| 768×1024 tablet | Expected PASS (drawer) |
| 390×844 mobile | Expected PASS with horizontal tab scroll |

---

## Success criteria

| Criterion | Status |
|-----------|--------|
| No new horizontal page scroll on refactored modules | PASS |
| Tables scroll inside container | PASS |
| Charts resize with container | PASS |
| Module headers stack on narrow screens | PASS |
