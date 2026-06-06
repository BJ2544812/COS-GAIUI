# Frontend Usability Report

**Date:** 2026-06-05  
**Method:** Live browser validation (Cursor IDE browser) — no code inspection first  
**Environment:** UI `http://127.0.0.1:3001`  
**Primary persona exercised:** Church Admin (`admin` / `admin123`)  
**Scope:** Events · Sunday Service · Attendance only  

---

## Executive summary

| Area | Verdict | Notes |
|------|---------|-------|
| **Events workspace** | **Usable with gaps** | Six-tab workspace works; create → workspace, save, reload restore pass |
| **Worship planning** | **Pass** | Add/edit/save segment; persists after refresh |
| **Volunteers ↔ Events** | **Partial** | Assign succeeds; Events People shows count; Volunteers event board does not |
| **Sunday Service (live)** | **Usable with P0 layout bug** | Run sheet flows through; timer works; bottom bar blocks controls until scroll |
| **Attendance** | **Partial** | List loads; New session unclear; session rows not obvious click targets |
| **Role simulations** | **Blocked** | Documented demo role accounts (`pastor`, `worship` / `demo123`) could not sign in |

**Bottom line:** A single admin can run the core Sunday workflow end-to-end. Operators on fixed-viewport layouts will fight the bottom Quick Ops bar during live service and event creation. Role-based walkthroughs are blocked until demo accounts work or are re-seeded.

---

## What worked (browser-confirmed)

| Flow | Result |
|------|--------|
| Login as `admin` | Lands on operations dashboard |
| Create **Frontend Validation Sunday Service** (Worship service type) | Opens event workspace immediately |
| All six workspace tabs render | Overview, People, Worship Planning, Finance, Reports, Workflow |
| **+ Add segment** → rename → Save | Segment **Opening Worship** saved |
| Page refresh on Events module | Restores same event + Worship Planning tab + segment |
| People → **Manage in Volunteers** | Deep link opens Volunteers with event pre-selected |
| Assign Leah Cherian → Worship Team | Modal completes; global roster updates |
| Return to Events → People tab | **Team assigned: 1** |
| Overview / Sunday Service link | Sunday Service selects created event; shows **Opening Worship** segment |
| **Start timer** (after scroll) | Countdown visible (e.g. 4:58 remaining) |
| Finance tab | Read-only income/expense/net + link to Finance desk |
| Dashboard after assign | Shows **Frontend Validation Sunday Service · 1 volunteers** |

---

## Issues

### P0 — Blocks live operations or primary task completion

#### P0-1 · Bottom Quick Ops bar intercepts primary action buttons

| Field | Detail |
|-------|--------|
| **Screen** | Events → Create event; Sunday Service → Service flow controls |
| **Action** | Click **Create event**, **Start timer**, or **Advance segment** without scrolling |
| **Expected** | Button receives click; form submits or timer starts |
| **Actual** | Click intercepted by fixed bottom **Quick operations** nav (`Home`, `Sunday`, `Check-in`, …). Browser reports target blocked. |
| **Severity** | **P0** |
| **Screenshot** | `frontend-validation-sunday-service.png` (controls sit directly above bottom bar) |

**Pastor impact:** During live Sunday Service, the operator must discover that scrolling is required before timer/segment controls respond. On a busy Sunday this feels like the app is broken.

**Recommendation:** Add bottom padding to scroll containers equal to Quick Ops height, or hide Quick Ops on Sunday Service / full-height forms.

---

#### P0-2 · Demo role accounts cannot sign in (role walkthroughs blocked)

| Field | Detail |
|-------|--------|
| **Screen** | `/login` |
| **Action** | Sign in as `worship` / `demo123`, then `pastor` / `demo123` |
| **Expected** | Role-specific landing (Worship Pastor → Sunday Service; Senior Pastor → dashboard) |
| **Actual** | Remains on login page; page body contains **INVALID** text not exposed in accessibility tree (easy to miss) |
| **Severity** | **P0** for UAT role matrix; login hint on page references accounts that do not work in this environment |
| **Screenshot** | — |

**Pastor impact:** Documented pilot accounts (`LOGIN_MATRIX.md`, login footer) promise five role simulations; only `admin` worked in browser.

---

### P1 — Major confusion or broken cross-module consistency

#### P1-1 · Volunteers event board empty after successful event assignment

| Field | Detail |
|-------|--------|
| **Screen** | Volunteers module (deep-linked from Events → People → Manage in Volunteers) |
| **Action** | Assign Leah Cherian · Worship Team · **Frontend Validation Sunday Service** → Assign Role |
| **Expected** | Event-scoped ops board lists Leah under Worship Team for this service |
| **Actual** | Banner still reads **“No volunteers assigned for this event”**; global **Volunteer Assignments** table includes Leah Cherian |
| **Severity** | **P1** |

**Pastor impact:** Volunteer coordinator assigns someone, sees success in the table, but the event header still says nobody is assigned — undermines trust before Sunday.

---

#### P1-2 · Workflow button labels do not match pipeline stages

| Field | Detail |
|-------|--------|
| **Screen** | Events workspace → Workflow tab |
| **Action** | Read pipeline vs transition buttons |
| **Expected** | Button text matches visible stage names (e.g. **Move to Published**) |
| **Actual** | Friendly pipeline shows stages like **Published**; buttons still say backend names such as **Move to In review** |
| **Severity** | **P1** |

**Pastor impact:** Admin hesitates to advance event state for fear of doing the wrong thing.

---

#### P1-3 · No dedicated Prayer Meeting or Youth Event types at create

| Field | Detail |
|-------|--------|
| **Screen** | Events → Create event |
| **Action** | Attempt to create Prayer Meeting and Youth Event as specified in test plan |
| **Expected** | Clear type choices matching church language |
| **Actual** | Combobox offers only **Worship service**, **Special event**, **Small group gathering**. Prayer/Youth exist in seed data via category labels (e.g. “Wednesday Prayer Meeting · Prayer”) but are not first-class create types |
| **Severity** | **P1** |

**Pastor impact:** Youth pastor creates a “Small group gathering” or mis-types a prayer night as Special event; reporting/filtering by ministry type stays inconsistent.

---

#### P1-4 · Duplicate Save buttons on Worship Planning tab

| Field | Detail |
|-------|--------|
| **Screen** | Events workspace → Worship Planning |
| **Action** | Observe save affordances |
| **Expected** | One clear save action for the run sheet |
| **Actual** | Two **Save** buttons visible (run sheet header + team/notes panel) |
| **Severity** | **P1** |

**Pastor impact:** Worship leader unsure which Save persists segments vs team notes; risk of thinking work saved when only one panel was written.

---

#### P1-5 · Attendance “New session” affordance unclear

| Field | Detail |
|-------|--------|
| **Screen** | Attendance module |
| **Action** | Click **New session** |
| **Expected** | Modal or navigate to session setup with event picker |
| **Actual** | First click blocked by header; after scroll, click focuses button but no dialog appeared in accessibility tree; user remains on list view |
| **Severity** | **P1** |

**Pastor impact:** Counter team cannot confidently open a new check-in session from the main Attendance screen without trial and error.

---

#### P1-6 · Recent session rows appear non-interactive

| Field | Detail |
|-------|--------|
| **Screen** | Attendance → Recent service sessions |
| **Action** | Attempt to open **Sunday Worship Service — 9:00 AM** for check-in |
| **Expected** | Obvious clickable row/card opens live check-in |
| **Actual** | Sessions render as **heading** elements (`h3`), not buttons/links; no clear tap target in accessibility snapshot |
| **Severity** | **P1** |

**Pastor impact:** Counter team sees history but cannot tell how to re-enter an active session.

---

### P2 — Polish, discoverability, non-blocking

#### P2-1 · Event workspace not bookmarkable

| Field | Detail |
|-------|--------|
| **Screen** | Events workspace |
| **Action** | Copy URL / share link to specific event |
| **Expected** | URL identifies event (or opens workspace after login) |
| **Actual** | URL stays `?module=events`; state only in sessionStorage |
| **Severity** | **P2** |

---

#### P2-2 · Create event blocked until scroll (same root as P0-1)

| Field | Detail |
|-------|--------|
| **Screen** | Events → Create event form |
| **Action** | Click **Create event** with default scroll position |
| **Expected** | Submit on first click |
| **Actual** | Intercepted by Quick Ops; works after `scrollIntoView` |
| **Severity** | **P2** (elevated to P0 when combined with Sunday live ops) |

---

#### P2-3 · New worship service defaults to 5:30 AM on Saturday

| Field | Detail |
|-------|--------|
| **Screen** | Event workspace Overview; Sunday Service picker |
| **Action** | Create worship service on 2026-06-06 (Friday Jun 5 “today” in env) |
| **Expected** | Sensible Sunday morning time |
| **Actual** | **Saturday, June 6, 2026 · 5:30 AM**; Sunday Service shows **Today 5:30 AM** |
| **Severity** | **P2** |

---

#### P2-4 · Duplicate paths for teams and attendance sessions

| Field | Detail |
|-------|--------|
| **Screen** | Events → People vs Worship Planning; People vs Schedule for sessions |
| **Action** | Compare entry points |
| **Expected** | One canonical path per task |
| **Actual** | **Manage in Volunteers** on both People and Worship Planning; **New session** / **Open Attendance** on People vs schedule flows |
| **Severity** | **P2** |

---

#### P2-5 · Segment delete control not discoverable

| Field | Detail |
|-------|--------|
| **Screen** | Worship Planning → run sheet row |
| **Action** | Delete **Opening Worship** segment |
| **Expected** | Visible delete/remove on segment row |
| **Actual** | Row shows drag handle and fields; no delete button in accessibility tree (may require hover/icon-only control) |
| **Severity** | **P2** |

---

#### P2-6 · Login error not announced to assistive tech

| Field | Detail |
|-------|--------|
| **Screen** | `/login` |
| **Action** | Failed role login |
| **Expected** | Error message with `role="alert"` or visible inline text |
| **Actual** | **INVALID** present in DOM but not in snapshot; silent failure for screen reader users |
| **Severity** | **P2** |

---

## Role simulation matrix

| Role | Account | Browser result |
|------|---------|----------------|
| Church Admin | `admin` / `admin123` | **Complete** — full Events / Sunday / Attendance flow |
| Senior Pastor | `pastor` / `demo123` | **Blocked** — login failed |
| Worship Leader | `worship` / `demo123` | **Blocked** — login failed |
| Counter Team | (no dedicated account; uses Attendance module) | **Partial** — list view only; check-in session entry unclear |
| Youth Pastor | `youth` / `demo123` | **Not attempted** — blocked by same login issue |
| Volunteer Coordinator | `volunteers` / `demo123` | **Not attempted** — blocked by same login issue |

Existing seed events used as proxies for types not creatable in UI:

| Requested type | Browser coverage |
|----------------|------------------|
| Sunday Service | Created **Frontend Validation Sunday Service** |
| Conference | Existing **Usability Conference** / **Guest Speaker Night** (Special) in list |
| Prayer Meeting | Existing **Wednesday Prayer Meeting** on dashboard |
| Youth Event | Existing **Youth Fellowship Night** on dashboard |

---

## Tab-by-tab checklist (Frontend Validation Sunday Service)

| Tab | Exercised | Save | Refresh | Notes |
|-----|-----------|------|---------|-------|
| Overview | ✅ | — | ✅ | Edit details, Sunday Service shortcut present |
| People | ✅ | ✅ assign | ✅ | Team assigned = 1 after volunteer assign |
| Worship Planning | ✅ | ✅ | ✅ | Segment CRUD add/edit/save; delete unclear |
| Finance | ✅ | — | — | Read-only summary |
| Reports | ⚠️ | — | — | Tab reachable; export not re-tested this pass |
| Workflow | ⚠️ | — | — | Label mismatch noted (P1-2) |

---

## Sunday Service live ops checklist

| Control | Result |
|---------|--------|
| Select service | ✅ Defaults to created validation service |
| Current segment from plan | ✅ **Opening Worship** |
| Start timer | ✅ After scroll — countdown runs |
| Advance segment | ⚠️ Blocked until scroll (same layout issue) |
| Media / Livestream alerts | ✅ Visible |
| Emergency / urgent message | ✅ Button present |
| Fullscreen | ⚠️ Not exercised |
| Refresh | ⚠️ Not re-tested after timer start |
| Open event workspace | ✅ Button present |

---

## Attendance checklist

| Control | Result |
|---------|--------|
| Module loads metrics | ✅ 697 member check-ins, 43 sessions |
| Export sessions | ✅ Button visible |
| New session | ⚠️ Unclear outcome (P1-5) |
| Open existing session | ⚠️ No obvious click target (P1-6) |
| Manual check-in | ⚠️ Not reached — session not opened |
| Close session / export | ⚠️ Not reached |
| Refresh persistence | ⚠️ Not reached |

---

## Screenshots captured

| File | Shows |
|------|-------|
| `frontend-validation-sunday-overview.png` | Event workspace Overview tab, six-tab layout |
| `frontend-validation-sunday-service.png` | Sunday Service live cockpit with timer running |

*(Saved under Cursor screenshots temp path during session.)*

---

## Recommended fix order

1. **P0-1** — Bottom Quick Ops overlap (padding, z-index, or context-aware hide on Sunday Service + long forms)
2. **P0-2** — Restore demo role accounts or remove misleading login hint until seeded
3. **P1-1** — Volunteers event ops board filter after assign deep link
4. **P1-5 / P1-6** — Attendance session create + clickable session rows
5. **P1-2** — Workflow button copy aligned to pipeline labels
6. **P1-3** — Prayer/Youth-friendly create types or category guidance on create form

---

## Validation status

This report reflects **live browser interaction only**. Issues were reproduced by clicking, saving, refreshing, and navigating as a church operator — not inferred from code or automated test output.

**Next browser pass (when role accounts work):** Re-run Youth Pastor and Worship Leader flows; complete Attendance check-in → close → export; exercise Workflow transitions and Reports CSV; test segment delete and Sunday Service refresh after timer advance.
