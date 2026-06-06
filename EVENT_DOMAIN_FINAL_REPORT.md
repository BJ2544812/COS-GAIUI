# EVENT DOMAIN FINAL REPORT

**Product:** Ultimate Church OS (UCOS)  
**Date:** 2026-06-05  
**Scope:** Events (workspace + module), Sunday Service, Attendance  
**Method:** Documentation-first audit → UI trace → API → service → repository → persistence  
**Out of scope (per instruction):** Dashboard, Finance module edits, Communication module edits  

**Sources read:** `MODULE_EXPLAINER_CATALOG`, `MODULE_ESSENCE_REPORT`, `NAVIGATION_SIMPLIFICATION_PLAN`, `SUNDAY_OPERATIONS_GUIDE`, `SUNDAY_SERVICE_VALUE_REPORT`, `SUNDAY_SERVICE_CLARITY_REPORT`, `SUNDAY_SERVICE_UX_REPORT`, `EVENT_CONNECTIVITY_AUDIT`, `EVENT_CONTRACTS`, `SUNDAY_EVENTS_HARDENING_REPORT`

---

## Executive verdict

| Module | Lock readiness | Confidence |
|--------|----------------|------------|
| **Events** | **Conditional** | Workspace core paths are DB-backed; budget tab matches documented scope (actual P&L only); gaps in session edit, in-workspace volunteer ops, Live Ops tab |
| **Sunday Service** | **Conditional** | Only live conductor UI; segment advance persists; **segment timer broken** for standard `MM:SS` run sheet durations |
| **Attendance** | **Conditional** | Check-in open/close/export are real; event linkage works from Events, not from standalone session create; QR kiosk stub |

**Overall:** Do **not** fully lock Sunday & Events until **P0/P1** items below are resolved or explicitly accepted for pilot.

---

## Documentation intent (budget & finance)

Per **EVENT_CONNECTIVITY_AUDIT** and **MODULE_ESSENCE_REPORT**:

| Documented intent | Implementation |
|-------------------|----------------|
| Event create/setup must **not** expose fake budget widgets | ✅ Removed from create UI |
| Event P&L derives from **posted Finance vouchers** linked to event | ✅ `GET /finance/events/:eventId/accounting-statement` + embedded in workspace |
| Org-wide budget creation/allocation lives in **Finance / Budgets** | ✅ `POST/GET /finance/budgets`, `GET /finance/budgets/vs-actual` |
| Per-event **planned budget allocation** in Events workspace | ❌ **Not documented as required** — intentionally removed |
| Event workspace Budget tab | Shows **actual** income/expense/net from vouchers — not planned vs remaining |

**Conclusion:** Event Budget tab is **read-only actuals**, not a budget planner. Planned budget work belongs in **Budgets → Budget workspace** and **Budgets → Event finance** (church-wide list). Do not expect allocation/consumption/remaining-budget widgets inside Events unless product docs change.

---

## Phase 1 — Events module & workspace

**Entry:** `EventsModule` → event card → `EventWorkspace`  
**Aggregate API:** `GET /events/:id/workspace` → Prisma `Event`, `AttendanceSession`, `MemberResponsibility`, `AccountingService.getEventAccountingStatement`

### Tab summary

| Tab | Status | Priority | Notes |
|-----|--------|----------|-------|
| Overview | **PARTIAL** | P1 | Metrics from DB; edit routing to Setup/plan, not inline save |
| Sessions | **PARTIAL** | P1 | Create + open check-in ✅; edit session metadata ❌ |
| Registrations | **WORKING** | — | Reads `opsConfig.public.registrations[]`; public POST persists |
| Volunteers | **PARTIAL** | P1 | Read-only list; assign/remove only via Volunteers module |
| Budget | **WORKING** *(scoped)* | P2 | Real voucher totals when finance posted; no planned budget (by design) |
| Reports | **WORKING** | — | `GET /attendance/event/:id` + client CSV |
| Workflow | **PARTIAL** | P1 | Transitions persist; doc labels ≠ backend states |
| Live Ops | **PARTIAL** | P1 | Non-service: redirect card; `LiveEventOpsPanel` unwired |
| Run sheet *(service only)* | **WORKING** | — | Redirect to Worship Services → ServicePlanPanel |

---

### Overview — **PARTIAL** (P1)

| Feature | Status | Trace |
|---------|--------|-------|
| Event details save | **PARTIAL** | Save via Events **Setup** (`PUT /events/:id`) — not in Overview tab |
| Status transitions | **WORKING** *(non-Service)* | `POST /events/:id/transition` → `EventService.transitionStatus` → DB + domain events + WebSocket |
| Status transitions *(Service)* | **PARTIAL** | Disabled in workspace UI (`serviceMode`); live advance can set ACTIVE via live-ops |
| Capacity | **WORKING** | `opsConfig.public.capacity` on setup; enforced on public register |
| Public visibility | **WORKING** | `publishedToWebsite` in setup; Overview shows public link + reg count |
| Event image upload | **WORKING** | `POST /upload?scope=events&eventId=` + `publicProfile.bannerImageUrl` |
| Lifecycle persistence | **WORKING** | Reload via workspace GET reflects status |
| Overview metrics | **WORKING** | `attendeeCount`, `sessionCount`, `volunteerCount` from DB aggregates — **not mocked** |

---

### Sessions — **PARTIAL** (P1)

| Feature | Status | Trace |
|---------|--------|-------|
| Session create | **WORKING** | `POST /attendance/sessions` with `eventId`, `type: EVENT`, `status: OPEN` |
| Session edit (name/date) | **BROKEN** | No UI or API usage for edit in workspace; only PATCH used for **close** in Attendance |
| Session close | **WORKING** | `PATCH /attendance/sessions/:id` `{ status: CLOSED }` in Attendance live portal |
| Session persistence | **WORKING** | Prisma `AttendanceSession`; listed on reload |
| Attendance linkage | **WORKING** | `eventId` FK; metrics roll up to workspace |
| Open check-in from workspace | **WORKING** | Sets `ucos_open_attendance_session_id` → Attendance module |

---

### Registrations — **WORKING**

| Feature | Status | Trace |
|---------|--------|-------|
| Public registrations | **WORKING** | `POST /website/public/events/:id/register` → `opsConfig.public.registrations[]` |
| Registration list | **WORKING** | Workspace tab reads same JSON array |
| Counts | **WORKING** | `publicRegistrationCount()` on overview |
| Reload persistence | **WORKING** | Stored on `Event.opsConfig` |
| Admin export API | **PARTIAL** | P2 — no dedicated staff export endpoint (UI table only) |
| Waitlist / paid tickets | **N/A** | Documented as not implemented (`EVENT_CONNECTIVITY_AUDIT`) |

---

### Volunteers — **PARTIAL** (P1)

| Feature | Status | Trace |
|---------|--------|-------|
| List assignments | **WORKING** | `EventRepository.findResponsibilitiesForEvent` |
| Assign | **PARTIAL** | Workspace → Volunteers module (`ucos_assign_event_id`); `POST /members/:id/responsibilities` |
| Remove assignment | **PARTIAL** | No delete in workspace; Volunteers uses PATCH to Inactive, not DELETE |
| Role assignment | **WORKING** | Via Volunteers assign modal + `VolunteerOpsBoard` |
| Save / reload | **WORKING** | Prisma `MemberResponsibility` |
| Live presence | **WORKING** | `opsConfig.volunteerPresence` via `PUT /events/:id/live-ops` (Sunday Service / board) |

---

### Budget — **WORKING** *(documentation scope)* (P2 for enhancements)

| Feature | Status | Trace |
|---------|--------|-------|
| Budget creation (event-level) | **N/A by design** | Docs removed from Events; org budgets in Finance |
| Budget allocation (event-level) | **N/A by design** | — |
| Actual income/expense/net | **WORKING** | `AccountingService.getEventAccountingStatement` when vouchers posted with `sourceType: event_accounting` |
| Budget consumption / remaining | **N/A in Events** | Org `budgets/vs-actual` in Budgets module only |
| Voucher integration | **WORKING** | `POST /finance/events/:eventId/accounting` (Finance desk) |
| Fake budget widgets | **None found** | Tab hidden for Service events unless finance totals exist |
| Link to Finance | **WORKING** | “Open Finance desk” button |

**Documented home for event P&L review:** Budgets → **Event finance** tab (`BudgetsModule`) + Events workspace Budget/Reports tabs.

---

### Reports — **WORKING**

| Feature | Status | Trace |
|---------|--------|-------|
| Attendance report load | **WORKING** | `GET /attendance/event/:eventId` |
| CSV export | **WORKING** | Client-side from loaded rows |
| Event metrics on report tab | **WORKING** | Finance net summary when totals exist |
| Server-side report API | **PARTIAL** | P2 — export is client-only |

---

### Workflow — **PARTIAL** (P1)

| Feature | Status | Trace |
|---------|--------|-------|
| Draft | **WORKING** | `DRAFT` + transitions |
| “Published” *(user checklist)* | **PARTIAL** | Maps to `publishedToWebsite` **and/or** `REGISTRATION_OPEN` — not one state |
| Active | **WORKING** | `ACTIVE` (+ live-ops auto-activate) |
| Completed | **WORKING** | `COMPLETED` |
| Archived | **WORKING** | `ARCHIVED` |
| All transitions persist | **WORKING** | `canTransitionEvent` enforced server-side |
| In-review / Approved / Registration closed | **WORKING** | Full graph in `eventLifecycle.ts` — richer than simplified doc list |
| Workflow tab UX | **PARTIAL** | Informational; transitions on header buttons only |
| Service event lifecycle in workspace | **PARTIAL** | Transitions hidden; completion via Sunday/Attendance paths unclear in UI |

---

### Live Ops — **PARTIAL** (P1)

| Feature | Status | Trace |
|---------|--------|-------|
| Live ops API | **WORKING** | `GET/PUT /events/:id/live-ops`, advance, emergency — `LiveOpsService` → `Event.opsConfig` |
| Event live panel (non-Service) | **PARTIAL** | Tab shows **redirect to Sunday Service** — not inline panel |
| Service-type redirect | **WORKING** | Banner → Sunday Service + Worship Services plan |
| `LiveEventOpsPanel` | **BROKEN** *(integration)* | Component exists, **never imported**; duplicate UI per `SUNDAY_SERVICE_VALUE_REPORT` |
| State persistence | **WORKING** | DB + WebSocket `service:update`, `ops:refresh` |
| Default run sheet in GET | **PARTIAL** | P1 — empty DB run sheet returns synthetic default in API response **without persisting**; masks “no plan” state |

---

## Phase 2 — Sunday Service

**Module:** `SundayModeModule`  
**Doc alignment:** `SUNDAY_SERVICE_VALUE_REPORT` — **KEEP** as only segment conductor; planning links out.

| Feature | Status | Priority | Trace |
|---------|--------|----------|-------|
| Service selection | **WORKING** | — | `GET /events` filter `type === Service`; today auto-select; `ucos_live_service_id` deep link |
| Segment advance | **WORKING** | — | `POST .../live-ops/advance` → DB |
| Segment skip | **WORKING** | — | Same endpoint |
| Timer start | **WORKING** | — | `PUT .../live-ops` `liveActive`, `segmentStartedAt` |
| Timer countdown | **BROKEN** | **P0** | `parseDurationMinutes("05:00")` → **300 min** not 5 min (`liveOps.ts` treats `MM:SS` as `MM×60+SS`) |
| Team presence display | **WORKING** | — | `teamBucketStatuses()` from responsibilities + `volunteerPresence` |
| Team edit in cockpit | **PARTIAL** | P2 | Read-only buckets; edit in Volunteers board |
| Alerts / log issue | **WORKING** | — | `PUT live-ops` issues array |
| Emergency broadcast | **PARTIAL** | P1 | `POST .../live-ops/emergency` works; **no success/error UI** |
| Live state reload | **WORKING** | — | `useRealtimeOps` + manual Retry |
| Realtime bar | **WORKING** | — | WebSocket per `EVENT_CONTRACTS` |
| Fullscreen backstage | **WORKING** | — | UI present |
| Planning links | **PARTIAL** | P2 | Still navigates `sunday-services` id (aliases resolve to Events → Worship Services) |
| Empty run sheet UX | **PARTIAL** | P1 | Default segments shown from API merge — operator may think plan exists |
| Only live conductor | **WORKING** | — | No other UI calls `live-ops/advance` |

---

## Phase 3 — Attendance

**Module:** `AttendanceModule`  
**Doc alignment:** `MODULE_EXPLAINER_CATALOG` — canonical check-in; Events link sessions.

| Feature | Status | Priority | Trace |
|---------|--------|----------|-------|
| Open session | **WORKING** | — | `POST /attendance/sessions` |
| Close session | **WORKING** | — | `PATCH` → `CLOSED` |
| Member check-in | **WORKING** | — | `POST .../records` |
| Visitor check-in | **WORKING** | — | Records + `registerVisitorForFollowUp()` |
| Search | **WORKING** | — | Client filter on loaded members/records |
| Manual entry | **WORKING** | — | Member + visitor forms |
| Metrics | **WORKING** | — | `GET /attendance/metrics` |
| Export sessions | **WORKING** | — | Client CSV |
| Export session records | **WORKING** | — | Client CSV in live portal |
| Event linkage from Events | **WORKING** | — | Session create includes `eventId` |
| Event linkage from Attendance “New session” | **PARTIAL** | P1 | Creates `type: SERVICE` **without** `eventId` |
| Deep link open session | **WORKING** | — | `ucos_open_attendance_session_id` |
| Session list shows event | **PARTIAL** | P2 | Campus/date only — no event name |
| QR / self kiosk | **BROKEN** | P2 | Explicit “Coming soon” — not fake QR |
| Session history button | **BROKEN** | P2 | Disabled stub |
| Offline queue | **WORKING** | — | `offlineAttendanceQueue.ts` |

---

## Worship Services planning (Events tab)

Canonical planning surface per blueprint (not a separate lock module, but required for Service workflow):

| Feature | Status | Trace |
|---------|--------|-------|
| Service event list | **WORKING** | `GET /events` filter Service |
| Run sheet save | **WORKING** | `PUT /events/:id/run-sheet` via `ServicePlanPanel` |
| Notes save | **WORKING** | `PUT /events/:id` |
| Link to Sunday Service | **WORKING** | `openSundayLive()` |
| Link to Attendance | **WORKING** | ServicePlanPanel session create with `eventId` |

---

## E2E & automated verification

| Test | Status | Notes |
|------|--------|-------|
| `e2e/event-lifecycle.spec.ts` | **PARTIAL** | Smoke: create/open workspace; no registrations, budget, live ops |
| `e2e/sunday-operations.spec.ts` | **BROKEN** | Expects “Sunday Mode” / “Loading live service” — UI is **Sunday Service** |
| `scratch/validate-event-service-layer.ts` | **WORKING** | Service-layer public profile persistence |
| Runtime verification this pass | **Code + doc audit** | Full stack manual/E2E run recommended before production lock |

---

## Consolidated defect register

### P0 — Blocks production (live Sunday)

| ID | Area | Issue |
|----|------|-------|
| E-P0-1 | Sunday Service | Segment **timer countdown wrong** for default `MM:SS` run sheet durations (`05:00` → 300 min) |

### P1 — Must fix before lock

| ID | Area | Issue |
|----|------|-------|
| E-P1-1 | Live Ops | `LiveEventOpsPanel` implemented but **unwired**; non-service events get redirect-only tab |
| E-P1-2 | Live Ops | **Default run sheet** returned on GET without DB write — hides empty-plan state during live ops |
| E-P1-3 | Sessions | **No session edit** (name/date) in Events workspace or Attendance |
| E-P1-4 | Volunteers | Workspace **read-only** — no remove/reassign without leaving to Volunteers |
| E-P1-5 | Attendance | Standalone **New session** omits `eventId` — breaks single-destination event linkage |
| E-P1-6 | Sunday Service | **Emergency broadcast** — no operator feedback after POST |
| E-P1-7 | Workflow | Service events: lifecycle transitions **hidden** in workspace; completion path unclear |
| E-P1-8 | Workflow | Simplified “Published” checklist ≠ backend states (needs operator doc or UI labels) |
| E-P1-9 | E2E | Sunday operations spec **stale** vs current UI copy |

### P2 — Nice to have / pilot acceptable

| ID | Area | Issue |
|----|------|-------|
| E-P2-1 | Attendance | QR kiosk “Coming soon” |
| E-P2-2 | Attendance | Session history button disabled |
| E-P2-3 | Attendance | Session cards omit linked event name |
| E-P2-4 | Registrations | No staff CSV/export API |
| E-P2-5 | Sunday Service | Planning links use legacy `sunday-services` module id (aliases work) |
| E-P2-6 | Events | Overview edits require navigation to Setup — not inline |
| E-P2-7 | EVENT_CONNECTIVITY gaps | Waitlist, paid tickets, auto-attendance on register, registrant email |

---

## Lock recommendation

| Module | Verdict |
|--------|---------|
| **Events** | **Conditional lock** — safe for pilot **non-Service** events (create, publish, register, sessions, reports, workflow). Budget tab correctly shows **actuals only**. Fix P1 session/volunteer/live-ops gaps for full confidence. |
| **Sunday Service** | **Do not lock** until **E-P0-1** (timer) fixed. Advance/skip/emergency API path is sound. |
| **Attendance** | **Conditional lock** for manual check-in pilot. Document that operators should open sessions **from Events** (or accept orphan SERVICE sessions from Attendance home). |

**Single-destination compliance (post-blueprint):**

| Surface | Canonical | Verified |
|---------|-----------|----------|
| Planning | Events → Worship Services | ✅ |
| Live | Sunday Service | ✅ (timer broken) |
| Check-in | Attendance | ✅ (with eventId caveat) |
| Visitors | People → Outreach | ✅ (out of scope but linked from attendance) |
| Structure | Settings | ✅ (out of scope) |

---

## Suggested fix order (implementation — not done in this pass)

1. **E-P0-1** — Fix `parseDurationMinutes` to treat `MM:SS` as minutes:seconds (or normalize run sheet on save).
2. **E-P1-2** — Do not merge default run sheet in GET unless persisted; show empty state in Sunday Service.
3. **E-P1-5** — Attendance “New session”: optional event picker or default link to today’s service event.
4. **E-P1-1** — Either wire `LiveEventOpsPanel` for non-Service events **or** remove tab and document Sunday Service as non-Service live path (per docs, redirect is acceptable if intentional).
5. **E-P1-9** — Update e2e selectors to “Sunday Service”.

---

*Audit performed against documentation as source of truth. No code changes in this deliverable.*
