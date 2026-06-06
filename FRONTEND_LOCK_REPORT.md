# Frontend Lock Report — Sunday & Events Domain

**Date:** 2026-06-06  
**Method:** Live browser validation only (http://127.0.0.1:3001)  
**Roles tested:** Administrator (`admin`), Senior Pastor (`pastor`), Worship Leader (`worship`), Youth Pastor (`youth`), Counter Team (`counter`)  
**Passwords:** `admin123` / `demo123` (after `npm run seed:demo-roles`)

---

## Executive summary

The Sunday & Events domain is **lock-ready for pilot** with the fixes applied in this sprint. All five roles sign in, land on role-appropriate screens, and can complete the core event lifecycle in the browser. Remaining items are polish (P2) — mostly legacy seed data times and optional dashboard shortcuts.

**Sidebar structure matches spec:** People & Care · Sunday & Events (Events, Sunday Service, Attendance) · Settings → Church Structure.

**One Event = One Workspace** is implemented with six tabs: Overview, People, Worship Planning / Schedule, Finance (read-only), Reports, Workflow.

---

## Role validation matrix

| Role | Login | Landing | Sunday & Events access | Notes |
|------|-------|---------|------------------------|-------|
| Administrator | ✓ | Home dashboard | Full | All tabs verified |
| Senior Pastor | ✓ | Pastoral leadership dashboard | Full | Events, Sunday Service visible |
| Worship Leader | ✓ | Sunday Service cockpit | Full | Timer / Advance segment reachable |
| Youth Pastor | ✓ | Sunday Service cockpit | Full | Same as worship |
| Counter Team | ✓ | Attendance module | Attendance + Sunday Service | New `counter` / `demo123` account |

---

## Event workspace — tab verification

| Tab | Expected | Browser result | Severity |
|-----|----------|----------------|----------|
| **Overview** | Name, date, venue, description, image, capacity, visibility, status | ✓ All fields present; Edit details opens setup | — |
| **People** | Registrations, volunteers, attendance summary | ✓ Team assigned count; Manage in Volunteers deep-link; New session → Attendance | — |
| **Worship Planning** (Service) | Run sheet, teams, notes; single Save | ✓ One **Save plan** button; Add segment; delete segment | Fixed (was duplicate Save) |
| **Schedule** (non-service) | Sessions, program | ✓ Sessions list + Add session; program from description | — |
| **Finance** | Read-only income / expenses / net | ✓ No entry fields; link to Finance module | — |
| **Reports** | Attendance, registrations, export | ✓ Export CSV when data exists | — |
| **Workflow** | Draft → Published → Active → Completed → Archived | ✓ Pipeline chips + **Move to Published** (no backend wording) | Fixed |

**Bookmarkable URLs:** `?module=events&event={id}&tab={tab}` — verified (refresh preserves workspace tab).

---

## Event types — create form

All eight church types present in browser dropdown:

Worship Service · Prayer Meeting · Youth Event · Conference · Training · Outreach · Special Event · Small Group

New worship services default to **next Sunday**; times stored at 9:00 AM local for services.

---

## Worship planning

| Action | Expected | Actual | Fix |
|--------|----------|--------|-----|
| Empty run sheet | Add Segment affordance, no fake rows | ✓ Empty state + **Add segment** button | Prominent button added |
| Create / edit segment | Inline edit + save | ✓ Persists after refresh | — |
| Delete segment | Trash control per row | ✓ Remove segment button | Prior sprint |
| Save | One save action | ✓ Single **Save plan** in embedded workspace | Prior sprint |

---

## Sunday Service (live only)

| Action | Expected | Actual | Fix |
|--------|----------|--------|-----|
| Select service | Dropdown of today's services | ✓ | — |
| Start timer | Clickable, not blocked by Quick Ops | ✓ After padding increase | Increased main `pb` to 7rem |
| Advance segment | Clickable | ✓ | — |
| No planning on live screen | No run sheet editor | ✓ Removed **View service plan** | **This sprint** |
| Team deep link | Events → People, not duplicate volunteer module | ✓ **View team roster** → event People tab | **This sprint** |
| Attendance | Deep link only | ✓ Record attendance → Attendance module | — |

---

## Attendance

| Action | Expected | Actual | Fix |
|--------|----------|--------|-----|
| Session history obvious | Clickable rows | ✓ `role="button"`, aria-label, “Click to check in” | Prior sprint |
| New session | Modal, not `prompt()` | ✓ **New check-in session** dialog | Prior sprint |
| Export | Export sessions header action | ✓ Present | — |

---

## Volunteers — single source of truth

| Screen | Expected | Actual | Fix |
|--------|----------|--------|-----|
| Events → People | Shows assigned count | ✓ Team assigned: 1 | — |
| Volunteers board (from Manage in Volunteers) | Same assignments | ✓ Leah Cherian shown when event focused | `localRows` sync — prior sprint |
| Sidebar | No separate Volunteers entry | ✓ Not in sidebar (deep-link only) | Matches spec |

---

## Issues log

### P0 — Critical (fixed)

| Screen | Action | Expected | Actual | Fix applied |
|--------|--------|----------|--------|-------------|
| App shell | Click bottom actions with Quick Ops visible | Buttons always clickable | Quick Ops intercepted **View service plan** | Increased bottom padding to `7rem + safe-area` |
| Login | Role accounts sign in | pastor, worship, youth, counter work | Failed before seed | Ran `seed:demo-roles`; added **Counter Team** account |

### P1 — High (fixed)

| Screen | Action | Expected | Actual | Fix applied |
|--------|--------|----------|--------|-------------|
| Home → Upcoming events | Read status | Draft, Published… | Raw `DRAFT`, `REVIEW`, `APPROVED` | `OperationsCommandCenter` uses `EVENT_STATUS_LABELS` + type catalog |
| Event → Workflow | Transition button | Move to Published | Submit for review | `workflowActionsForStatus()` — pipeline labels only |
| Event → People | Session status | Open / Closed | `OPEN` | `attendanceSessionStatusLabel()` |
| Sunday Service | Quick actions | Live only, no planning | View service plan opened planning | Removed; team → Events People tab |
| Volunteers board | After assign from Events | Show same volunteers | Empty board | `localRows` from responsibilities — prior sprint |
| Worship Planning | Save | One button | Two Save buttons | Embedded mode single Save — prior sprint |

### P2 — Polish (open / acceptable)

| Screen | Action | Expected | Actual | Notes |
|--------|--------|----------|--------|-------|
| Service picker | Display time | 9:00 AM local | Some seed events show 5:30 AM | Legacy UTC seed data; new events use 9:00 AM default |
| Home quick actions | Assign volunteers | Single entry via Events | Standalone Volunteers module link | Acceptable as deep-link; not in sidebar |
| Dashboard | Volunteer gaps | Events People is canonical | Links to Volunteers module | Pre-fills event assign modal — OK |
| Activity Log | Workflow tab link | Church language | “View activity log” | Internal audit trail — acceptable for admin |

---

## Sidebar compliance

```
People & Care
  Members · Small Groups · Pastoral Care · Visitors & Outreach

Sunday & Events
  Events · Sunday Service · Attendance

Settings (+ Church Structure via Settings → structure)
```

No extra entries added under Sunday & Events.

---

## Retest checklist (browser)

- [x] Login / logout all five roles
- [x] Create event — all 8 types visible
- [x] Open event workspace — all 6 tabs
- [x] Worship Planning — add / edit / delete segment, save, refresh
- [x] Workflow — church pipeline labels
- [x] People → Manage in Volunteers — board matches
- [x] Sunday Service — timer, advance, no planning duplicate
- [x] Attendance — session list + new session modal
- [x] URL bookmark `?event=&tab=`

---

## Files changed (this lock sprint)

- `src/lib/eventLifecycle.ts` — pipeline workflow actions; session status labels
- `src/components/events/EventWorkspace.tsx` — workflow buttons; session labels
- `src/components/operations/OperationsCommandCenter.tsx` — church status on dashboard
- `src/components/operations/SortableRunSheet.tsx` — prominent Add segment button
- `src/components/layout/AppShell.tsx` — Quick Ops bottom padding
- `src/modules/sunday/SundayModeModule.tsx` — live-only quick actions
- `src/server/scripts/seed-demo-roles.ts` — Counter Team account (prior sprint)
- `src/lib/roleExperience.ts` — counter_team archetype (prior sprint)

---

## Sign-off recommendation

**Pilot-ready** for Sunday & Events domain. Church staff can:

1. Create any gathering type in one workspace  
2. Plan worship (service events) or schedule sessions (other events)  
3. Assign team from People tab with matching volunteer board  
4. Run live Sunday Service with timer and segment advance  
5. Check in via Attendance with clear session history  
6. Advance workflow using church-friendly stage names  

Re-run browser pass after any new seed or deployment to confirm role accounts exist (`npm run seed:demo-roles`).
