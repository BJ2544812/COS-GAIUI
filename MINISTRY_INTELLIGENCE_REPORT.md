# Ministry Intelligence & Platform Polish — Report

## Summary

Phases 1–8 extend the operational OS with **tenant-scoped ministry intelligence** derived from live data (assignments, attendance, events, tasks, engagement snapshots, domain events). No core systems were redesigned.

## Phase 1 — Ministry Intelligence Engine

**`MinistryIntelligenceService`** + **`MinistryIntelligenceRepository`**

| API | Purpose |
|-----|---------|
| `GET /operations/ministry-intelligence` | Full executive bundle + analytics event |
| `.../volunteer-health` | Burnout, reliability, overload, leadership readiness |
| `.../service-health` | Readiness trends, media issues, delay alerts |
| `.../event-health` | Attendance, donations, volunteer utilization |
| `.../predictive` | Staffing, burnout, service, workflow, attendance signals |
| `.../engagement` | Participation scores, at-risk members |
| `.../follow-up` | Pastoral priority recommendations |
| `.../executive` | Ministry + operational health dashboard |
| `.../pastoral` | Disengagement, stress, follow-up cases |
| `.../campus-overview` | Per-campus readiness and gaps |
| `GET /operations/members/:id/ministry-journey` | Unified timeline |

## Phase 2 — Discipleship & Engagement

- Engagement from **`MemberEngagementSnapshot`** + attendance + volunteering
- Follow-up engine: missed attendance, first-time guests without tasks
- **Ministry journey timeline** on member profile Journey tab

## Phase 3 — Cross-Campus

- **Campus filter** on command center (`CampusFilterSelect`)
- Campus overview API with per-campus readiness and volunteer gaps
- Intelligence queries respect optional `campusId`

## Phase 4 — Experience Polish

- **Realtime status bar** (connected / reconnecting / offline)
- Keyboard: `Ctrl+Shift+L` → Sunday Mode, `Ctrl+Shift+D` → Dashboard
- Command palette: Sunday Mode + Command Center quick access
- Sunday Mode **backstage (dark) mode** toggle for low-light ops

## Phase 5 — Advanced Realtime

- **`presence:update`** — operators in tenant/service context
- **`presence-join`** on socket connect
- **`ops:lock`** on volunteer reassignment
- **Operational locks** prevent concurrent reassignment conflicts

## Phase 6 — Executive & Pastoral Layer

- **Executive** dashboard tab: `ExecutiveInsightPanel`
- **Pastoral** lens: `PastoralInsightPanel`
- Command center: `MinistryIntelligenceStrip` + volunteer health panel

## Phase 7–8 — Quality

- `npm run lint` (tsc) clean
- UI components under `src/components/intelligence/`
- Types: `src/lib/ministryIntelligenceTypes.ts`

## Verification

```bash
npm run dev:server
npm run dev
npm run lint
```

## Follow-ups (non-blocking)

- Persist engagement snapshots on a schedule (worker) for richer trends
- Socket JWT handshake
- Cross-campus service template sync (data model exists; UI hooks ready via campus filter)
