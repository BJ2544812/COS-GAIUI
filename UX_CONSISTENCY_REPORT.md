# UX Consistency Report — Ultimate Church OS

**Date:** 2026-06-02  
**Initiative:** Design System, UI Consistency & UX Excellence (frontend only)

---

## Button hierarchy (Phase 3)

| Module | Primary action | Secondary | Tertiary |
|--------|----------------|-----------|----------|
| Members | Add Member | Import, filters | Export |
| Events | Create Event | Filters | Share / settings |
| Giving | **Record gift** | Tab navigation, export (disabled) | Registry filters |
| Finance | New Voucher | Approve, filters | Reports |
| Volunteers | Assign volunteer (board) | Refresh | Profile link |
| HR & Staff | **Onboard staff** (HR admin) | Request leave | Policies |
| Attendance | **New session** | Export records | Open session / kiosk |
| Documents | **Upload file** | Category filter | Preview |
| Communications | Compose (existing) | Hub tabs | Campaign list |
| Notifications | **Mark all read** (when unread) | Refresh | Filter all/unread |

### Changes applied

- Giving: removed emerald override on primary; uses brand `ActionButton`  
- Workforce: single primary **Onboard staff**; leave request secondary  
- Attendance: renamed “Open Live Portal” → **New session** (clearer intent)  
- Notifications: primary only when unread count > 0  

---

## Navigation & flow (Phase 7)

| Pattern | Implementation |
|---------|----------------|
| App shell breadcrumb | `AppShell` — Church Office → group → module |
| Module breadcrumb | Optional `ModuleHeader.breadcrumb` |
| Sub-flow back | `SubpageHeader` — Giving record gift, Attendance live session |
| Deep links | Members `?memberId=`, Events session storage (unchanged) |
| Tab state | `ModuleTabs` — Giving workspace, Academy tracks |

### Fixes

- Giving create flow uses back header instead of orphan ghost icon + 4xl title  
- Attendance live mode uses `SubpageHeader` with grouped actions  

---

## Form & table excellence (Phase 8)

| Area | Status |
|------|--------|
| Giving registry table | Standardized `ds.tableHead`, reduced cell padding |
| Giving create form | Card padding normalized; labels retain church uppercase style |
| Search inputs | `ds.formInput` on giving history search |
| Loading | Existing `LoadingSkeleton` / StatCard loading prop |
| Errors | `FeedbackBanner` on Giving; Attendance errors moved from raw div |

---

## UX friction removed (Phase 11)

| Issue | Resolution |
|-------|------------|
| Oversized KPI numbers (6xl) | StatCard `kpiValue` scale |
| Competing visual weights on Giving overview | Three equal StatCards + one chart section |
| Workforce dark hero felt like different app | ModuleHeader aligned with Finance/Members |
| “Notification Command” marketing title | Renamed **Notifications** |
| Redundant chart styling code | Shared `ChurchAreaChart` |
| Academy track pills inconsistent with Giving tabs | `ModuleTabs` component |

---

## Image consistency (Phase 6)

| Asset | Standard |
|-------|----------|
| `AppAvatar` | Sizes: sm, default, lg, xl, 2xl — `object-cover`, rounded-full |
| Placeholder | Slate-100 fallback initials |
| Member / staff lists | Continue using `AppAvatar` (no backend change) |

**Recommendation:** Enforce `size="lg"` in directory tables and `xl` on profile headers in a follow-up pass.

---

## Accessibility & contrast (Phase 9)

| Item | Action |
|------|--------|
| Focus states | `ds.focusRing` on `ActionButton`, `ModuleTabs` |
| Feedback banners | `role="alert"` on error tone |
| Tab list | `role="tablist"` / `aria-selected` on ModuleTabs |
| Chart tooltips | Readable 12px semibold, bordered |
| Body outline | Existing `outline-ring/50` in `index.css` |

**Remaining:** Audit indigo-on-white ghost buttons in legacy cards; run axe on Finance voucher dialog.

---

## First impression by role (Phase 10)

| Role | Landing | Polish notes |
|------|---------|--------------|
| Pastor | Dashboard executive | Title scale reduced; insight panels unchanged |
| Church Administrator | Dashboard operations | Onboarding checklist preserved |
| Finance Manager | Finance module | Already ModuleHeader-aligned |
| HR Manager | HR & Staff | Now matches ERP header pattern |
| Volunteer Coordinator | Events / Volunteers | ModuleHeader present |
| Member | Portal | Warm cards; separate from ERP (intentional) |

**Question:** Does it feel premium? **Improved** on refactored modules; Website public site intentionally untouched.

---

## Modules using ModuleHeader (reference)

Members, Families, Events, Finance, Volunteers, Discipleship, Attendance, Giving, Workforce, Communications, Documents (vault + registry), Notifications, Academy, Analytics, Settings, Permissions, Audit, Platform admin, Worship, Structure, Outreach, Budgets, Vendors, Sermons, Dashboard (partial — custom lens switcher retained).

---

## Known limitations

- Website builder retains editorial large type inside canvas (by design — no public UX change)  
- Some modules still mix shadcn `Button` inside cards with `ActionButton` in headers  
- `react-big-calendar` unused — no calendar UI consistency yet  
- Member portal not fully migrated to `PageLayout` (lower traffic than ERP)  
