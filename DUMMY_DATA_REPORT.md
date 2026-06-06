# Dummy Data Cleanup Report — Phase 1

**Date:** 6 June 2026  
**Method:** Code audit + browser validation  
**Status:** Complete

---

## Summary

Removed or replaced fake statistics, evaluator widgets, placeholder UI, and test artifacts across admin Home and adjacent modules. Real seeded data (Grace Community Church) is preserved; only decorative or misleading surfaces were changed.

---

## Removed from Production Home

| Item | Location | Action |
|------|----------|--------|
| "Show me what to test next" | `DashboardModule` | Removed from Home (remains in Academy) |
| Setup progress / Ministry onboarding | `DashboardModule` | Hidden unless `VITE_SHOW_HOME_ONBOARDING=true` |
| Role first-day panel | `DashboardModule` | Removed from Home |
| Quick Insights scratch pad | `DashboardModule` | Removed (unsynced placeholder) |
| "Explore Ultimate Church OS" header button | `AppShell` | Hidden (dev-only with `VITE_SHOW_WALKTHROUGH`) |
| Pilot UAT credentials on login | `LoginPage` | Removed |

---

## Fake Statistics Removed

| Module | Fake data | Replacement |
|--------|-----------|-------------|
| `MembersModule` | Fixed 40% progress bar on every row | Growth stage badge only |
| `NotificationsModule` | Hardcoded delivery volume chart, 0.02% bounce rate | Honest empty state copy |
| `AssetsModule` | 24% wear level, 88% component health, fake recommended tasks | Maintenance history empty states |
| `WebsiteModule` | Default 2,500+ / 120+ / $45k+ stats bar | Dashed empty state until editor adds stats |
| `GivingModule` | Disabled "Full export coming soon" button | Removed |

---

## Test Artifact Filtering (extended)

| Surface | Filter |
|---------|--------|
| Home command center | `operationalEventFilter` (server + client) |
| Dashboard event/task lists | `filterOperationalTestArtifacts` / `filterOperationalTestTaskTitles` |
| Events, Sunday, Attendance modules | Already filtered (Phase 0) |

---

## Preserved (real data — not removed)

- Member counts, giving totals, attendance counts from API
- Finance voucher registry (119 vouchers)
- Demo church seed records (`gcc-v2` source tag — display cleanup deferred to Finance filter labels)
- Academy / Training module evaluator tools (intentional, off Home path)

---

## Empty States Added

- Personal Home: "Nothing urgent right now" for zero tasks
- Website stats bar: "Add statistics in the page editor"
- Notifications: "Delivery analytics will appear here once campaigns have been sent"
- Assets maintenance: "None planned yet" / schedule CTA

---

## Browser Validation

- Admin Home: no Usability events, no evaluator widgets
- Playwright role landings: **13/13 pass**

---

*Phase 1 complete. No fake numbers on primary leadership surfaces.*
