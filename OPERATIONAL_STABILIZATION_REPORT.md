# Kingdom Church OS — Operational Stabilization Report

**Date:** 2026-05-19  
**Scope:** Events, Service & Worship Planning, HR / Volunteers (architecture-locked execution)

## Executive summary

This pass delivers **production-oriented foundations** for the three operational pillars without redesigning architecture. Backend lifecycle, workspace APIs, workflow hooks, analytics pipeline integration (via existing `EventBus` → `eventWorker`), and operational UIs are in place. Several directive items remain as **documented backlog** (multi-month scope if implemented literally end-to-end).

## Phase 1 — Event management

### Shipped

| Area | Implementation |
|------|----------------|
| **Lifecycle** | `DRAFT` → `REVIEW` → `APPROVED` → registration states → `ACTIVE` → `COMPLETED` → `ARCHIVED` / `CANCELLED` enforced in `EventService.transitionStatus` |
| **Domain events** | `EventCreated`, `EventUpdated`, `RegistrationOpened`, `RegistrationClosed`, `EventActivated`, `EventCompleted`, `EventArchived`, `EventCancelled`, `EventApproved` via `EventBus` |
| **Schema** | Migration `20260519150000_event_ops_workforce_hardening`: `status`, `registrationOpen`, `runSheet`, `opsConfig`, timestamps, `TaskTargetType.EVENT` |
| **Workspace API** | `GET /events/:id/workspace`, `POST /events/:id/transition`, `PUT /events/:id/run-sheet`, `PUT /events/:id/ops-config` |
| **Workspace UI** | `EventWorkspace` tabs: overview, sessions, registrations, attendance, volunteers, budget, run sheet, communication, reports, workflow |
| **Events module** | Detail view uses `EventWorkspace` (operational dashboard, not legacy CRUD panel) |
| **Permissions** | `eventPermissions.ts` contextual RBAC map; returned in workspace payload for UI gating |
| **Workflow** | On `APPROVED`, discipleship `Task` created with `targetType: EVENT` |
| **Notifications** | `eventWorker` handles `EventCreated` and lifecycle event names |
| **Analytics** | Existing worker path records `analyticsEvent` for all processed domain events |
| **Finance** | Workspace pulls `AccountingService.getEventAccountingStatement` (voucher-backed) |

### Backlog (not in this pass)

- Custom registration forms, QR badges, waitlists, approval-based registration UI
- Dedicated event permission assignment UI (roles stored on responsibilities today)
- PDF / newsletter report generation
- Full agenda/sponsors/facilities/assets tabs with dedicated APIs

## Phase 2 — Service & worship planning

### Shipped

| Area | Implementation |
|------|----------------|
| **Service events** | `ServicesModule` lists `type === 'Service'` events |
| **Persisted run sheet** | Load/save via `GET/PUT events/:id/run-sheet`; editable segment table |
| **Defaults** | `defaultRunSheet()` when none stored |
| **Cross-links** | Session storage handoff to Events, Attendance, Worship, Volunteers |

### Backlog

- FullCalendar / dnd-kit drag-drop sequencing
- Live service-day operations dashboard
- Rehearsal scheduling engine, post-service review forms
- Content handoff automation (sermon archive, podcast, website sync)

## Phase 3 — HR / workforce

### Shipped

| Area | Implementation |
|------|----------------|
| **Schema** | `Member.workforceClass`, `employmentType`, `department` |
| **API** | `MemberService` parse create/update persists workforce fields |
| **Workforce UI** | `WorkforceModule` sends workforce fields on staff create |
| **Volunteers** | Event entity type in assignments; `ucos_assign_event_id` prefill from `EventWorkspace` |

### Backlog

- Recruitment/onboarding workflows, training certifications, safeguarding clearance UI
- Payroll runs, payslips, leave requests (accounting must remain voucher-only)
- Performance/burnout analytics dashboards

## Phase 4 — Cross-module integration

### Shipped

- Event ↔ volunteers (`entityType: Event`, session storage assign flow)
- Event ↔ attendance (workspace creates check-in session)
- Event ↔ finance (statement in workspace)
- Event ↔ workflow (discipleship tasks on approve)
- Event ↔ notifications + analytics (worker)

### Backlog

- Facility booking, asset allocation, sponsor CRM APIs

## Phase 5 — UI / UX

### Shipped

- Operational event workspace and service run-sheet editor
- Status badges, lifecycle transition actions, module quick links

### Backlog

- Full command-center layouts for all 18 workspace sections named in directive
- Tablet-optimized service-day live board

## Phase 6 — Testing

### Shipped

- `e2e/event-lifecycle.spec.ts` — create/open event, workspace, transition smoke
- Migration applied; `prisma generate` clean

### Recommended

```bash
npm run lint
npm run dev:server:ci   # migrate + API
npm run test:pw -- e2e/event-lifecycle.spec.ts
```

## Key files

- `src/server/utils/eventLifecycle.ts` — transitions
- `src/server/utils/eventPermissions.ts` — contextual RBAC
- `src/server/services/EventService.ts` — domain logic
- `src/components/events/EventWorkspace.tsx` — operational UI
- `src/modules/events/EventsModule.tsx` — list + workspace entry
- `src/modules/services/ServicesModule.tsx` — persisted run sheet
- `prisma/migrations/20260519150000_event_ops_workforce_hardening/`

## Restart note

After pulling these changes, run:

```bash
npm run db:migrate
npm run dev:server
npm run dev
```

Redis optional; without it domain events queue synchronously via `EventBus` fallback.
