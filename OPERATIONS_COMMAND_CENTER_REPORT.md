# Operations Command Center — Phase Report

**Date:** 2026-05-19  
**Scope:** Unified operational UX, workflow visibility, notifications, drag-and-drop run sheets, realtime updates

## Delivered

### Phase 1 — Unified operations dashboard

| Item | Implementation |
|------|----------------|
| **API** | `GET /api/v1/operations/command-center` — aggregates services, events, tasks, gaps, notifications, attendance |
| **Readiness** | `operationalReadiness.ts` — READY / WARNING / BLOCKED for events and services |
| **Role lens** | `resolveOperationalLens()` — super_admin, operations, pastoral, finance, volunteer_coordinator |
| **UI** | `OperationsCommandCenter` — default **Command** tab on Dashboard |
| **Sections** | Today's services, upcoming events, volunteer gaps, quick actions, summary metrics |

### Phase 2 — Workflow visibility

| Item | Implementation |
|------|----------------|
| **Panel** | `WorkflowCommandPanel` — my tasks, team tasks, domain event timeline |
| **API** | `GET /discipleship/v2/tasks/operational` |
| **Actions** | Complete task from command panel; jump to events / discipleship / workflow monitor |

### Phase 3 — Notification center

| Item | Implementation |
|------|----------------|
| **Real metrics** | Total, unread, high priority, actionable (from live data) |
| **Actions** | **Open** button uses `actionLink` → module navigation |
| **Realtime** | Socket listener refreshes list on `notification:new` |

### Phase 4 — Volunteer / attendance coordination

| Item | Implementation |
|------|----------------|
| **Gaps** | Command center lists events with &lt; 2 volunteers; one-click → Volunteers assign modal |
| **Attendance** | Quick link to open sessions from command center |

### Phase 5 — Drag-and-drop run sheet

| Item | Implementation |
|------|----------------|
| **Library** | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| **Component** | `SortableRunSheet` in Worship Services detail view |
| **Persist** | Existing `PUT events/:id/run-sheet` |

### Phase 6–7 — Realtime & quality

| Item | Implementation |
|------|----------------|
| **Socket.IO** | Server hub on HTTP server; Vite proxy `/socket.io` |
| **Events** | `event:status` broadcast on lifecycle transition |
| **Lint** | `npm run lint` clean |

## How to use

1. Open **Dashboard** → **Command** tab (default).
2. Review readiness badges on services/events; use **Refresh** or wait for live updates.
3. Click volunteer gaps → **Volunteers** with event pre-selected.
4. **Worship services** → open service → drag run sheet rows → **Save run sheet**.
5. **Notifications** → **Open** on actionable items.

## Restart

```bash
npm run db:migrate
npm run dev:server
npm run dev
```

## Backlog (not in this pass)

- Full volunteer drag-and-drop scheduling board
- Event session agenda drag-and-drop
- Socket auth token binding (currently tenant room via query)
- Dedicated mobile check-in “Sunday mode” layout
- Push/email channel health (replace sidebar placeholders when channels are wired)
