# Sunday & Events Hardening Report

**Date:** 2026-06-05  
**Scope:** Sunday & Services, Sunday Service, Events, Attendance, Visitors & Outreach, Church Structure  
**Constraint:** No architecture redesign, no new modules, no schema changes

---

## Executive summary

| Area | Before | After hardening |
|------|--------|-----------------|
| Visitor intake | 3 siloed paths | **Canonical:** Visitors & Outreach; Attendance syncs on check-in |
| Events workspace | Stub tabs | Registrations list + attendance CSV export + workflow connected |
| Attendance | Demo QR, dead buttons | Coming Soon kiosk, CSV export, notify removed |
| Service type UX | Create/setup allowed hidden type | Events excludes Service; setup read-only redirect |
| Pathways / Structure | Unclear ownership | Documented (P2 — no nav move) |

**Production readiness:** **Pilot-ready** for Sunday operations with documented P2 consolidation backlog.

---

## Priority 1 — Visitor fragmentation

### Audit (before)

| Path | Storage | Follow-up | Use case |
|------|---------|-----------|----------|
| **Visitors & Outreach** | `Contact` + `OutreachFollowUp` | Auto queue | Pastoral guest pipeline |
| **Attendance visitor check-in** | `Attendance` row (`visitorName`) | None | Headcount only |
| **Members intake** | `Member` (`growthStage: Visitor`) | None | Membership onboarding |

### Canonical workflow (implemented)

```
Sunday guest arrives
    │
    ├─► [Primary] Visitors & Outreach → POST /outreach/visitors
    │         Contact + follow-up queue
    │
    ├─► [Operational] Attendance visitor check-in
    │         POST attendance/.../records
    │         └── also POST /outreach/visitors (source: Attendance)
    │
    └─► [Membership] Members intake (when guest is ready to join)
              POST /members — not for first-time Sunday register
```

**Code:**
- `src/lib/visitorWorkflow.ts` — canonical rules + `registerVisitorForFollowUp()`
- `src/components/operations/VisitorWorkflowBanner.tsx` — operator guidance on all three surfaces
- `AttendanceModule` — visitor check-in syncs to outreach API
- `OutreachModule` — scan missed attendance wired; link to Members intake
- `MemberIntake` — banner clarifies membership vs guest register

**Data preserved:** Existing `Contact`, `Attendance`, and `Member` rows unchanged. No migration.

---

## Priority 1 — Events module

### Registrations tab

- Reads `getEventPublicProfile(event.opsConfig).registrations[]`
- Table: name, email, phone, registered date
- Empty state when no registrations

### Stub tabs removed / connected

| Tab | Action |
|-----|--------|
| **Registrations** | ✅ Implemented (real data) |
| **Attendance** | ❌ Removed (duplicate of Sessions) |
| **Communication** | ❌ Removed (lifecycle notifications are backend-only; no per-event inbox API) |
| **Reports** | ✅ Loads `GET /attendance/event/:id`, CSV download |
| **Workflow** | ✅ Shows current lifecycle + link to activity log |
| **Sessions** | ✅ Unchanged (create/open check-in) |

---

## Priority 1 — Attendance

| Item | Action |
|------|--------|
| **Export records** | ✅ `Export sessions` CSV on main view; `Export session` CSV in live portal |
| **Notify All Staff** | ❌ Removed (no notification provider wired) |
| **QR kiosk** | ✅ Replaced demo URL with **Coming soon** panel (no fake QR payload) |

---

## Priority 1 — Service type confusion

| Surface | Before | After |
|---------|--------|-------|
| Events create form | Service in dropdown (removed earlier) | Special + Small group only |
| Events list | Hides `type === 'Service'` | Unchanged |
| Events setup | Could select Service | Service shows read-only + “managed in Sunday & Services” |
| Sunday & Services | Canonical for worship services | Unchanged |

Users cannot create Service events from Events module and cannot change a non-service event into Service from setup dropdown.

---

## Priority 2 — Pathways visibility

### Ownership (documented — no code move)

| Surface | Owns | Notes |
|---------|------|-------|
| **Pathways module** (`?module=pathways`) | Church-wide pathway **blueprints** (read-only catalog) + bulk growth-stage assignment | Hidden from sidebar; URL access only |
| **Member profile → Spiritual Journey** | Per-member growth stage, milestones, responsibilities, small groups | **Operational owner** for individual discipleship |
| **Members directory** | Same `growthStage` field | Directory lens |

**Recommendation:** Do not duplicate pathway UI in Spiritual Journey. Pathways module remains admin/seed configuration; day-to-day stage changes happen on member profile or Members directory. Consider sidebar link under People & Care in a future nav pass (not this sprint).

---

## Priority 2 — Church Structure placement

### Options evaluated (no move implemented)

| Placement | Pros | Cons |
|-----------|------|------|
| **Sunday & Events** (current) | Near ops context | Infrequent admin task; clutters Sunday group |
| **Settings → Structure tab** (doc plan) | Matches `MODULE_ESSENCE_REPORT` “admin only, rare” | Requires nav merge PR |
| **Administration / Platform** | Clear separation | Extra group for one module |

**Recommendation:** **Target: Settings → Structure tab** per `NAVIGATION_SIMPLIFICATION_PLAN.md`. **Keep in Sunday & Events for pilot** until nav simplification PR. AppShell status `partial` remains accurate.

---

## Backend integrity (verified)

| Flow | UI → API → Service → DB |
|------|-------------------------|
| Visitor register | OutreachModule → `OutreachOperationsService` → `Contact` |
| Attendance visitor + sync | AttendanceModule → `AttendanceService` + `registerVisitorForFollowUp` |
| Event registrations tab | EventWorkspace → `opsConfig.public.registrations` on `Event` |
| Attendance export | Client CSV from `GET attendance/sessions` / session records |
| Event attendance report | `GET attendance/event/:id` → CSV |

No mock metrics in hardened paths.

---

## Priority classification (remaining)

### P0 — Broken
None identified post-hardening for core Sunday loop.

### P1 — Deferred (post-pilot)
| ID | Item |
|----|------|
| SE-H01 | Unify visitor **edit** across Contact ↔ Member on conversion (schema optional later) |
| SE-H02 | Public QR self check-in (member app / public URL) |
| SE-H03 | Staff notify on session close (requires comms provider) |
| SE-H04 | Event delete UI (API exists) |

### P2 — UX / nav
| ID | Item |
|----|------|
| SE-H05 | Move Church Structure under Settings |
| SE-H06 | Surface Pathways in sidebar or Spiritual Journey link |
| SE-H07 | Remove orphaned `ServicesModule.tsx` |
| SE-H08 | Nav simplification (6 → 3 Sunday & Events items) |

---

## Verification

```bash
npm run lint
```

**Manual checks:**
1. Outreach → Register visitor → follow-up appears
2. Attendance → visitor check-in → same guest in Outreach contacts (after refresh)
3. Events → non-service event → Registrations tab shows public RSVPs
4. Events → Reports tab → download CSV after session check-ins
5. Events create/setup → no Service type selectable
6. Attendance → kiosk shows Coming soon (no example.invalid URL)

---

## Files changed

| File | Change |
|------|--------|
| `src/lib/visitorWorkflow.ts` | Canonical visitor helper |
| `src/components/operations/VisitorWorkflowBanner.tsx` | Operator guidance |
| `src/modules/outreach/OutreachModule.tsx` | Canonical copy, missed-attendance scan |
| `src/modules/attendance/AttendanceModule.tsx` | Outreach sync, export, QR, remove notify |
| `src/modules/members/MemberIntake.tsx` | Intake vs guest banner |
| `src/components/events/EventWorkspace.tsx` | Registrations, reports, workflow; remove stubs |
| `src/modules/events/EventsModule.tsx` | Service type locked in setup |
| `src/App.tsx` | Pass `onModuleChange` to Attendance/Outreach |

---

**Overall:** Sunday & Events domain is **hardened for pilot production** with canonical visitor workflow, real event registration visibility, and honest attendance UX. Full nav/structure rationalization remains a follow-up sprint.
