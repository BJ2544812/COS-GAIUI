# Sunday Service Clarity Pass — Report

**Product:** Ultimate Church OS (UCOS)  
**Date:** 2026-06-01  
**Scope:** User-facing copy and comprehension for `sunday-mode` / `SundayModeModule`  
**Out of scope:** API changes, workflow changes, feature redesign

---

## Objective

Improve clarity so a **first-time pastor** can open **Sunday Service** and understand the screen within **~5 seconds**: what the page is, which service is active, what needs attention, and what to do next.

**Canonical tagline (now on the page):**

> Run today's service, teams, attendance, and live operations.

---

## Success criteria checklist

| Criterion | How it is met |
|-----------|----------------|
| What this page is | Title **Sunday Service** + tagline on every view (including empty state) |
| Which service is active | **Active: {name} · Today · 10:30 AM** under the title; labeled **Active service** dropdown |
| What needs attention | **What needs attention** card (issues, missing order of service, team check-in, media/stream) |
| What to do next | **Suggested next step** line in the same card; helper text under flow controls |
| Workflows unchanged | Same routes, APIs (`live-ops`, advance, patch), tabs, and buttons |

---

## 1. Terminology changes

| Location | Before | After |
|----------|--------|-------|
| Sidebar (`AppShell`) | Sunday Mode (fallback label) | Sunday Service |
| `NAV_LABELS` (`churchProductCopy`) | Sunday Service | *(unchanged — source of truth)* |
| Page H1 (`SundayModeModule`) | Sunday Mode | **Sunday Service** |
| Page subtitle | Live service coordination | **Tagline** (see above) |
| Quick ops bar (`labelForQuickOp`) | Live | **Sunday** |
| Operations command center CTA | Sunday Mode | **Sunday Service** |
| Live service buttons | Live: {name} | **Sunday Service: {name}** |
| `ServicesModule` / `LiveEventOpsPanel` | Sunday Mode / Open Sunday Mode | **Sunday Service** |
| `OperationalGuidanceBanner` | Sunday Mode references | **Sunday Service** |
| Dark toggle | Backstage | **Dark view** / Light view |
| Tabs | Run sheet / Team / Alerts | **Service flow** / **Serving team** / **Alerts** |
| Readiness card | Readiness | **Service readiness** |

**Unchanged (internal):** Module id `sunday-mode`, file name `SundayModeModule`, API paths, `presenceContext`, session key `ucos_live_service_id`.

---

## 2. `SundayModeModule` — structure (pastor-first)

### Empty state (no service events)

- Sunday Service title + tagline
- Plain explanation: worship events use type **Service**
- CTA: **Plan a worship service** → Events → worship services tab

### Loaded state

1. **Header** — Title, tagline, active service name + schedule  
2. **Attention card** — Bulleted needs or “All clear” with check-in count  
3. **Suggested next step** — Contextual copy (plan flow → start timer → complete segment)  
4. **Tabs** — Service flow (default), Serving team, Alerts  
5. **Existing controls** — Complete segment, Skip, Start timer, quick links to Attendance / Volunteers / Notifications  

No new API calls; attention rules use existing `live-ops` payload (`runSheet`, `ops.issues`, `metrics`, `ops.mediaReady`, `ops.livestreamReady`).

### Attention rules (display only)

| Signal | Message |
|--------|---------|
| No run sheet segments | Order of service not set up yet |
| Open issues | N open issue(s) |
| Few volunteers checked in | Serving team needs check-in |
| Media/stream flags false | Media or stream not marked ready |
| None | All clear — checked-in count |

---

## 3. Files modified

| File | Change |
|------|--------|
| `src/modules/sunday/SundayModeModule.tsx` | Header, tagline, active service, attention card, tab labels, empty states, helper copy |
| `src/components/layout/AppShell.tsx` | Sidebar item label |
| `src/lib/roleExperience.ts` | Quick op label; pastor `dashboardShortcuts` includes `sunday-mode` |
| `src/lib/churchProductCopy.ts` | *(no edit — already Sunday Service)* |
| `src/components/operations/OperationsCommandCenter.tsx` | Button labels |
| `src/components/operations/OperationalGuidanceBanner.tsx` | Hint copy + CTA |
| `src/components/operations/QuickOpsBar.tsx` | Comment only |
| `src/modules/services/ServicesModule.tsx` | Open Sunday Service button |
| `src/components/events/LiveEventOpsPanel.tsx` | Open Sunday Service button |
| `src/lib/academy/catalog.ts` | Training summary copy |

---

## 4. Role notes

| Role | Discovery | On-page experience |
|------|-----------|-------------------|
| **Senior pastor** | Sunday Service added to dashboard shortcuts | Same clarity pass as all users |
| **Worship leader** | Lands on Sunday Service by default | Strong — flow tab + timer guidance |
| **Volunteer coordinator** | Volunteers-first landing; quick op **Sunday** | Attention card links to **Serving team** |

---

## 5. What we did not change

- Event type `Service` or event CRUD
- `GET/PUT events/:id/live-ops`, advance segment, emergency broadcast
- Tab order default (`run` first)
- Volunteer board behavior
- Planning still in **Events → Worship services** (copy points there; no merge)

---

## 6. Follow-up (optional, not in this pass)

- Toast when opening via `ucos_live_service_id`: “Showing: {service name}”
- Link from empty Alerts state to Volunteers module
- Dismissible one-line planner vs operator banner (localStorage)

---

## 7. Verification

Manual smoke test:

1. Log in as pastor or admin with `manage_events`.
2. Open **Sunday Service** from sidebar — confirm title, tagline, active service line within 5 seconds.
3. With no service events — empty state copy and **Plan a worship service**.
4. With today’s service — attention card and suggested next step visible.
5. Confirm **Complete segment** / **Start timer** still work.
6. Quick ops bar shows **Sunday**, not Live.

---

## Conclusion

The Sunday Service clarity pass aligns user-facing language to **Sunday Service**, adds the required explanatory tagline, and surfaces **active service**, **attention**, and **next step** on first paint without changing backend logic or operational workflows.
