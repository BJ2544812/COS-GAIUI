# EVENT DOMAIN LOCK REPORT

**Date:** 2026-06-05  
**Sprint:** P0/P1 fixes from `EVENT_DOMAIN_FINAL_REPORT.md`  
**Scope:** Events, Sunday Service, Attendance only  

---

## Fixes applied this sprint

| ID | Fix | Files |
|----|-----|-------|
| **E-P0-1** | `MM:SS` duration parsing — `05:00` = 5 minutes | `src/lib/liveOps.ts` |
| **E-P1-2** | Removed synthetic default run sheet from live-ops API | `src/server/services/LiveOpsService.ts` |
| **E-P1-2 UI** | Empty state: “No run sheet has been created.” + “Open Worship Planning” | `src/modules/sunday/SundayModeModule.tsx` |
| **E-P1-2 plan** | Service plan editor loads empty array, not fabricated segments | `src/modules/sunday-services/ServicePlanPanel.tsx` |
| **E-P1-5** | Event context flows to Attendance via `openAttendanceForEvent()` | `src/lib/attendanceNavigation.ts`, EventWorkspace, EventsModule, ServicePlanPanel, SundayModeModule, AttendanceModule |
| **E-P1-9** | E2E updated for “Sunday Service” naming | `e2e/sunday-operations.spec.ts` |

**Verified duration parsing (tsx):**

| Input | Minutes | Seconds |
|-------|---------|---------|
| `01:30` | 1.5 | 90 |
| `05:00` | 5 | 300 |
| `15:00` | 15 | 900 |
| `45:00` | 45 | 2700 |

**Not changed (per instruction):** Budgeting, Finance module, Communication, event-local budget widgets.

---

## Lock classification

### P0 — Resolved

| ID | Issue | Status |
|----|-------|--------|
| E-P0-1 | Segment timer `MM:SS` parsing | **FIXED** |

### P1 — Status after sprint

| ID | Issue | Status |
|----|-------|--------|
| E-P1-1 | `LiveEventOpsPanel` unwired | **OPEN** — redirect-only Live Ops tab remains intentional for non-Service events per docs |
| E-P1-2 | Synthetic run sheets | **FIXED** |
| E-P1-3 | No session edit in workspace | **OPEN** |
| E-P1-4 | Volunteers read-only in workspace | **OPEN** |
| E-P1-5 | Orphan attendance sessions | **FIXED** — eventId context + standalone confirm |
| E-P1-6 | Emergency broadcast UI feedback | **OPEN** |
| E-P1-7 | Service event lifecycle hidden in workspace | **OPEN** (by design — worship uses Sunday Service) |
| E-P1-8 | “Published” vs backend states | **OPEN** (documentation/labeling) |
| E-P1-9 | Stale e2e selectors | **FIXED** |

### P2 — Remaining (pilot acceptable)

| ID | Issue |
|----|-------|
| E-P2-1 | QR kiosk “Coming soon” |
| E-P2-2 | Session history button disabled |
| E-P2-3 | Session cards omit event name |
| E-P2-4 | No staff registration export API |
| E-P2-5 | Legacy module ids in deep links (aliases resolve) |
| E-P2-6 | Overview edits require Setup navigation |
| E-P2-7 | Waitlist, paid tickets, auto-attendance on register |

---

## Module lock verdict

| Module | Freeze? | Rationale |
|--------|---------|-----------|
| **Events** | **YES — pilot freeze** | Workspace tabs use real APIs; registrations, sessions, reports, workflow transitions persist; budget tab shows Finance voucher actuals only (documented). Remaining P1 items are UX depth, not data integrity. |
| **Sunday Service** | **YES — pilot freeze** | P0 timer fixed; live advance persists to DB; empty run sheet no longer fabricated; planning link canonical. Segment advance blocked server-side when no run sheet. |
| **Attendance** | **YES — pilot freeze** | Check-in, close, export operational; event linkage enforced when opened from Events/Sunday Service; standalone requires explicit confirm. |

**Overall Sunday & Events domain:** **Approved for pilot freeze** with documented P1/P2 backlog.

---

## Architecture compliance

| Rule | Status |
|------|--------|
| One planning surface (Events → Worship Services) | ✅ |
| One live surface (Sunday Service) | ✅ |
| One check-in surface (Attendance) | ✅ |
| Event P&L from Finance vouchers only | ✅ Unchanged |
| No event-local budget fabrication | ✅ Unchanged |
| No synthetic run sheets in live ops | ✅ Fixed |

---

## Pre-production checklist (optional hardening)

1. Wire emergency broadcast success/error toast (E-P1-6)
2. Session metadata edit in Attendance or Events Sessions tab (E-P1-3)
3. In-workspace volunteer reassign or deep link with return path (E-P1-4)
4. Run full `e2e/event-lifecycle.spec.ts` + `e2e/sunday-operations.spec.ts` against demo church seed
5. Accept or implement LiveEventOpsPanel merge vs redirect-only (E-P1-1)

---

## Files changed

- `src/lib/liveOps.ts`
- `src/lib/attendanceNavigation.ts` *(new)*
- `src/server/services/LiveOpsService.ts`
- `src/modules/sunday/SundayModeModule.tsx`
- `src/modules/sunday-services/ServicePlanPanel.tsx`
- `src/modules/attendance/AttendanceModule.tsx`
- `src/components/events/EventWorkspace.tsx`
- `src/modules/events/EventsModule.tsx`
- `e2e/sunday-operations.spec.ts`

`npm run lint` (tsc) passes.

---

*Prior audit: `EVENT_DOMAIN_FINAL_REPORT.md`*
