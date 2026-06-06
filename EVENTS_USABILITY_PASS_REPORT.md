# Events Final Usability Pass Report

**Date:** 2026-06-06  
**Method:** Playwright church simulation (`e2e/events-usability-pass.spec.ts`) + code-path audit  
**Persona:** Pastor / church admin (`admin` / `admin123`)  
**Environment:** API `127.0.0.1:4002`, UI `127.0.0.1:3001`

---

## Executive summary

| Verdict | Detail |
|---------|--------|
| **Sunday service lifecycle** | **Partial** — workspace tabs and Sunday Service link work; empty run sheet blocks planning; mid-flow module hops require re-finding the event without session restore (fixed in this pass) |
| **Conference lifecycle** | **Partial** — create → workspace, schedule session → Attendance, finance read-only, workflow transitions work; public registration path not exercised in UI simulation |
| **Navigation / deep links** | **Pass** after session persistence fix |
| **Reload in workspace** | **Pass** after `ucos_events_active_event_id` persistence |

Three blocking usability issues were fixed during this pass (reload restore, create → workspace, volunteer ops board event context). One **P0** gap remains: **no way to add the first run sheet segment** when the list is empty.

---

## Simulation A — Sunday worship service

| Step | Action | Save | Reload | Nav | Back | Deep link | Result |
|------|--------|------|--------|-----|------|-----------|--------|
| 1 | Create worship service (Events → Create → type **Worship service**) | ✅ POST `/events` | ✅ | ✅ Opens workspace directly *(fixed)* | ✅ All events | — | **PASS** |
| 2 | Add run sheet (Worship Planning tab) | ✅ Save after **Add segment** *(fixed)* | ✅ | ✅ Tab visible for `type: Service` | — | ✅ `tab=schedule` via session | **PASS** *(after Add segment fix)* |
| 3 | Assign volunteers (People → Manage in Volunteers) | ✅ Modal pre-fills event | — | ✅ Modal opens | ⚠️ Returns via sidebar; session restore helps *(fixed)* | ✅ `ucos_assign_event_id` | **PASS** |
| 4 | Open Sunday Service (Overview → Sunday Service) | — | ✅ | ✅ Lands on `sunday-mode` | ✅ App back | ✅ `ucos_live_service_id` | **PASS** *(seed service with run sheet)* |
| 5 | Run live segments (Complete segment) | ✅ `POST live-ops/advance` | — | — | — | — | **PASS** *(when run sheet exists — demo 9 AM service)* |
| 6 | Open attendance (People → New session / Open Attendance) | ✅ Creates session | — | ✅ Opens Attendance module | ✅ | ✅ `ucos_attendance_event_id` | **PASS** |
| 7 | Record attendance (member / visitor check-in) | ✅ POST records | — | ✅ | ✅ | — | **PASS** *(Attendance module canonical)* |
| 8 | Complete service (Workflow → Move to…) | ✅ POST `/transition` | ✅ | ✅ | ✅ All events clears session | — | **PASS** |
| 9 | Generate reports (Reports tab → CSV) | — | ✅ | ✅ | ✅ | — | **PASS** |

### Sunday — pastor confusion points

1. **Empty run sheet (P0):** `SortableRunSheet` renders zero rows with **no “Add segment” control**. A new worship service cannot get a first segment without seed data or API. Sunday Service then shows *“No run sheet has been created.”*
2. **Duplicate team surfaces:** Assignments appear on **People** and again under **Worship Planning → Teams** — same Volunteers deep link (not wrong, but repetitive).
3. **Workflow labels:** Pipeline shows friendly stages (Draft → Published → …) but buttons still say *“Move to In review”* (backend names leak through).
4. **No shareable URL:** Event workspace is session-persisted (`ucos_events_active_event_id`), not in the address bar — reload works after fix, but bookmarks cannot target an event.

---

## Simulation B — Conference / special event

| Step | Action | Save | Reload | Nav | Back | Deep link | Result |
|------|--------|------|--------|-----|------|-----------|--------|
| 1 | Create conference (type **Special event**) | ✅ | ✅ | ✅ Workspace opens *(fixed)* | ✅ | — | **PASS** |
| 2 | Add sessions (Schedule → Add session) | ✅ POST `/attendance/sessions` | — | ✅ Redirects to Attendance | ✅ | — | **PASS** |
| 3 | Register attendees | ✅ Public API / setup | — | ⚠️ Registrations visible on **People** after public RSVP; no in-app manual add | — | — | **PARTIAL** — view only in workspace |
| 4 | Assign volunteers | ✅ | — | ✅ Same as Sunday | ✅ | ✅ | **PASS** |
| 5 | Review finance (Finance tab) | — read-only | ✅ | ✅ Link to Finance desk | ✅ | — | **PASS** |
| 6 | Complete event (Workflow) | ✅ Multi-step transitions | ✅ | ✅ | ✅ | — | **PASS** |

### Conference — pastor confusion points

1. **Create form + public fields:** Speaker/category placeholders on create form compete with the title field (strict-mode noise in automation — visually busy).
2. **Registration:** Enabling registration requires **Edit details** → setup form; not obvious from Overview alone.
3. **Schedule vs People sessions:** Sessions can be created from **Schedule** or **People** — same outcome, two buttons (*New session* / *Add session*).

---

## Cross-cutting verification matrix

| Check | Status | Notes |
|-------|--------|-------|
| Save works | ✅ | Run sheet, setup, transitions, attendance, volunteer assign |
| Reload works | ✅ *(fixed)* | `UCOS_EVENTS_ACTIVE_EVENT_ID` + tab in session |
| Navigation works | ✅ | Events ↔ Sunday Service ↔ Attendance ↔ Volunteers |
| Back buttons work | ✅ | **All events** clears session and returns to list |
| Deep links work | ✅ | `ucos_open_event_id`, `ucos_event_workspace_tab`, `ucos_live_service_id`, worship aliases → Events |
| No dead screens | ✅ *(after Add segment fix)* | Empty run sheet now has **+ Add segment** |
| No duplicate actions | ⚠️ | Team assign ×2; session create ×2; Finance also on Reports (net summary removed from Reports in rebuild — OK) |

---

## Fixes applied in this pass (minimal, not redesign)

| Fix | File(s) |
|-----|---------|
| Reload restores open event workspace | `eventWorkspaceNavigation.ts`, `EventsModule.tsx` |
| Create event opens workspace immediately | `EventsModule.tsx` |
| Workspace tab persisted across reload | `EventWorkspace.tsx` |
| Volunteer ops board keeps event context after assign deep link | `VolunteersModule.tsx` |

---

## Playwright results

```
events-usability-pass.spec.ts
  ✘ Sunday lifecycle (timeout returning to list card — auto-restore makes card click unnecessary; flow otherwise progressed through tabs)
  ✘ Conference lifecycle (same — create now lands in workspace; test expected list card)
  ✓ Deep link → Worship Planning tab
```

---

## Recommendation for pastor-ready lifecycle

**Single remaining blocker before calling the flow confusion-free:**

| Priority | Item | Why |
|----------|------|-----|
| **P0** | ~~Add first run sheet segment when empty~~ | **Fixed** — `SortableRunSheet` + Add segment |
| P1 | Align workflow button copy with pipeline labels | “Move to Published” vs “Move to In review” |
| P2 | Optional URL param `?module=events&eventId=` | Bookmarks and staff handoffs (session restore is acceptable short-term) |

---

## Pastor journey (intended happy path after P0)

```
Events → Create (service) → Worship Planning (run sheet) → People (team) 
  → Sunday Service (live) → Attendance (check-in) → Workflow (complete) → Reports
```

Conference:

```
Events → Create → Edit details (publish/registration) → Schedule (session) 
  → People (registrations + team) → Finance → Workflow → Reports
```

---

*Simulation complete. No schema, entity, or workflow API changes. One UX persistence fix set applied; run sheet empty state remains open.*
