# EVENT DOCUMENT GAP REPORT

**Product:** Ultimate Church OS (UCOS)  
**Date:** 2026-06-05  
**Scope:** Events domain — document truth reconciliation only  
**Constraint:** No implementation in this pass. Every row compares **official documentation** to **current code/UI**.

---

## 1. Document inventory (sources read)

| Document | Role in this audit |
|----------|-------------------|
| `MODULE_EXPLAINER_CATALOG.md` | Canonical user-facing module purpose, examples, who/when/why |
| `MODULE_ESSENCE_REPORT.md` | KEEP/MERGE/HIDE/REMOVE; module relationships; worship/services alias |
| `EVENT_CONNECTIVITY_AUDIT.md` | Field matrix, public website, registration, communication triggers, **Phase 7 cleanup (budget removed)** |
| `EVENT_CONTRACTS.md` | Domain events, realtime events, workflow replay — not UI feature spec |
| `API_CONTRACTS.md` | Generic API envelope only — **no event-specific contracts** |
| `SUNDAY_OPERATIONS_GUIDE.md` | Operator runbook: Sunday Mode, run sheet tab, team, alerts |
| `SUNDAY_SERVICE_VALUE_REPORT.md` | Sunday Service KEEP; LiveEventOpsPanel overlap; segment advance uniqueness |
| `SUNDAY_SERVICE_CLARITY_REPORT.md` | Naming (Sunday Service), tabs (Service flow / Serving team / Alerts), attention card |
| `SUNDAY_SERVICE_UX_REPORT.md` | Surface map, role first impressions, planning vs live split |
| `NAVIGATION_SIMPLIFICATION_PLAN.md` | Target sidebar (3 Sunday items), alias table (`worship` → `events?tab=planning`), Finance merge |
| `SUNDAY_EVENTS_HARDENING_REPORT.md` | Registrations tab, Communication tab removed, Service type locked, visitor canonical path |
| `REAL_WORLD_OPERATIONS_PLAYBOOK.md` | Sunday prep + event ops checklists |
| `OPERATOR_HANDBOOK.md` | High-level Events + Sunday Mode operator notes |

**Explicitly excluded as truth sources:** `EVENT_DOMAIN_FINAL_REPORT.md`, `EVENT_DOMAIN_LOCK_REPORT.md`, implementation history, and agent assumptions.

---

## 2. Internal documentation conflicts (resolve before implementation)

These are **doc-vs-doc** tensions. Implementation cannot satisfy all without a doc amendment.

| Topic | Document A says | Document B says |
|-------|-----------------|-----------------|
| Worship Planning home | `NAVIGATION_SIMPLIFICATION_PLAN`: Events → tab **`planning`**, embed `WorshipPlanningModule` | `MODULE_ESSENCE_REPORT`: Worship services alias → **`events?tab=services`**; run sheet in Services |
| Legacy URL `?module=worship` | `NAVIGATION_SIMPLIFICATION_PLAN`: → `events&tab=**planning**` | Current alias implementation → `events&tab=**worship-services**` (neither doc names this tab id) |
| Events calendar includes services | `MODULE_EXPLAINER_CATALOG` Events: *"services, conferences, classes, outreach"*; example *"open Sunday 9 AM workspace"* | `SUNDAY_EVENTS_HARDENING_REPORT`: Events list **hides** `type === 'Service'`; create form excludes Service |
| Run sheet editor location | `EVENT_CONNECTIVITY_AUDIT`: *"Sunday & Services"* | `SUNDAY_SERVICE_CLARITY_REPORT` / hardening: *"Events → Worship Services"* |
| Sunday live tab name | `SUNDAY_OPERATIONS_GUIDE`: *"Run sheet timing \| Sunday Mode → **Run sheet**"* | `SUNDAY_SERVICE_CLARITY_REPORT`: tab **Service flow** (not Run sheet) |
| Sunday module name | `REAL_WORLD_OPERATIONS_PLAYBOOK`, `SUNDAY_OPERATIONS_GUIDE`, `OPERATOR_HANDBOOK`: **Sunday Mode** | `SUNDAY_SERVICE_CLARITY_REPORT`, `MODULE_EXPLAINER_CATALOG`: **Sunday Service** |
| Live ops in Events | `SUNDAY_SERVICE_VALUE_REPORT`: Events Live tab could embed Sunday layout; `LiveEventOpsPanel` duplicate | `SUNDAY_SERVICE_VALUE_REPORT` also: segment advance **only** in Sunday Service; panel has no advance UI |
| Per-event finance UI | **Not described** in `MODULE_EXPLAINER_CATALOG`, `EVENT_CONNECTIVITY_AUDIT`, or `NAVIGATION_SIMPLIFICATION_PLAN` | Implemented: Events workspace **Budget** tab + `BudgetsModule` **Event finance** tab (implementation-only surface) |
| Sidebar Sunday group | `NAVIGATION_SIMPLIFICATION_PLAN` target: Events, Sunday Service, Attendance (**3 items**) | `SUNDAY_EVENTS_HARDENING_REPORT` P2: Church Structure still in Sunday group *"for pilot"*; Visitors move documented separately |
| Communication for events | `REAL_WORLD_OPERATIONS_PLAYBOOK`: *"communication campaign (Communication hub)"* in event checklist | `SUNDAY_EVENTS_HARDENING_REPORT`: Communication tab **removed** from workspace; *"lifecycle notifications backend-only"* |
| `EVENT_CONTRACTS.md` | Lists `EventCreated`, `RegistrationOpened`, `EventApproved` | Does not define UI lifecycle buttons or status enum |

**Recommendation:** Product owner must pick canonical tab id (`planning` vs `services` vs `worship-services`) and whether Service events appear on Events calendar tab before code changes.

---

## 3. Finance & budget — what documents actually say

### 3.1 Budget / fund allocation / expenses in Events

**`EVENT_CONNECTIVITY_AUDIT.md` Phase 7 (authoritative for Events create UI):**

> Removed from create UI: ticketed/free/invite chips, **budget**, **expense allocation**, financial lead, fake publish toggle, approvals card, misleading footer copy.

**`EVENT_CONNECTIVITY_AUDIT.md` field matrix:**

> Ticketed / budget / approvals | — | — | **Removed from create UI**

**Conclusion from docs:** Events module must **not** expose event-local budget planning, fund allocation widgets, or expense allocation on create/setup. Ticketing/paid registration also removed (Phase 4).

### 3.2 Actual vs planned / P&L / vouchers

**`MODULE_EXPLAINER_CATALOG.md` — Budgets module:**

> **What:** Funds, annual budgets, and **budget vs actual by ministry**.  
> **Examples:** Review building fund vs actual; check youth ministry spend.

**`MODULE_EXPLAINER_CATALOG.md` — Finance module:**

> **What:** Accounting — **vouchers**, ledger, reconciliation, reports.

**What official docs do NOT say:**

- No doc describes an Events workspace **Budget** tab.
- No doc describes **Budgets → Event finance** tab or per-event P&L list.
- No doc describes posting vouchers **to an eventId** from the Events UI (API exists in code at `POST/GET /finance/events/:eventId/accounting*` but is not in `EVENT_CONNECTIVITY_AUDIT` or `API_CONTRACTS.md`).
- No doc defines **planned budget vs actual spend at event level** — only **ministry-level** budget vs actual in Budgets module explainer.

**`SUNDAY_SERVICE_UX_REPORT.md` (Sunday Operations row):**

> Check-in, volunteers, **finance hooks on event record**

This is the only Sunday-adjacent doc hint that finance ties to events; it does not specify UI, allocation, or planned amounts.

---

## 4. Document truth table (every Event feature)

Legend: **Mismatch?** Yes = documented intent ≠ current behavior. Partial = mostly aligned with gaps. N/A = doc silent.

| Feature | Document says | Current implementation | Mismatch? | Required action |
|---------|---------------|------------------------|-----------|-----------------|
| **Events module purpose** | *"Everything on the calendar — services, conferences, classes, and outreach"*; drives volunteers, attendance, comms (`MODULE_EXPLAINER_CATALOG`) | Events tab subtitle: *"Conferences, outreach, and special gatherings"*; **Service type excluded** from list and create | **Yes** | Either amend explainer to split worship services to Worship Services tab, or show Service events on Events calendar per explainer |
| **Events sidebar entry** | CORE; weekly use (`MODULE_ESSENCE_REPORT`) | Sidebar **Operations**: Events, Sunday Service, Attendance | Partial | Nav simplification target (3 items) largely met; group label still **Operations** not **Sunday & Events** per NAV plan |
| **Events top-level tabs** | NAV: add tab **`planning`** (WorshipPlanningModule) + keep **`services`** alias; ESSENCE: **`services`** tab inside Events | Tabs: **Events** \| **Worship Services** (`worship-services`); no `planning` tab id; `WorshipPlanningRedirect` → Worship Services | **Yes** | Align tab ids/labels to chosen canonical doc (`planning` vs `services` vs `worship-services`); update NAV alias table or implementation |
| **Worship Planning module (`worship`)** | REDUNDANT; MERGE → Events planning tab or dashboard shortcut; HIDE sidebar (`MODULE_ESSENCE_REPORT`) | No sidebar entry; `?module=worship` redirects to Events → Worship Services | Partial | Doc says `tab=planning`; implementation uses `worship-services`. WorshipPlanningModule calendar-of-all-events UX **not embedded** — replaced by SundayServicesModule |
| **Worship services alias (`services`)** | MERGE done; tab `events?tab=services` (`MODULE_ESSENCE_REPORT`, NAV) | Alias maps to `events?tab=worship-services`, sub-tab `schedule` | Partial | Preserve bookmark: ensure `tab=services` resolves; document canonical tab name |
| **Event Overview (workspace)** | Events drive volunteers, attendance, comms in one record (`MODULE_EXPLAINER_CATALOG`) | Overview shows metrics, public registration count, lifecycle badge, transition buttons (non-Service) | Partial | Comms not visible on overview (backend-only per hardening) |
| **Sessions** | Attendance linkage manual; create check-in in workspace (`EVENT_CONNECTIVITY_AUDIT` Phase 3) | Sessions tab: create session, open Attendance with `eventId` + session id (`attendanceNavigation`) | **No** | — |
| **Registrations** | Public RSVP in `opsConfig.public.registrations[]`; capacity; duplicate email block; **no** separate table yet (`EVENT_CONNECTIVITY_AUDIT`) | Registrations tab reads `getEventPublicProfile(ev.opsConfig).registrations` | **No** | Future gaps (waitlist, EventRegistration model) documented as not implemented — OK |
| **Registrations — waitlist** | **Not implemented — hidden** (`EVENT_CONNECTIVITY_AUDIT` remaining gaps) | No waitlist UI | **No** | Implement only if product adds to docs |
| **Registrations — paid tickets** | **Hidden**; free RSVP only (Phase 4) | No ticketing UI | **No** | — |
| **Registrations → attendance** | Manual; registrations **not** auto-attendance rows (`EVENT_CONNECTIVITY_AUDIT`) | No auto check-in on register | **No** | — |
| **Volunteers (workspace)** | Events drive volunteers (`MODULE_EXPLAINER_CATALOG`); assign in Volunteers module (playbooks) | Read-only list + **Assign in Volunteers** deep link; no in-workspace assign/edit | Partial | Docs imply driving volunteers from event; assignment is external module only |
| **Budget (Events workspace tab)** | **Removed from create UI**; no doc for workspace Budget tab (`EVENT_CONNECTIVITY_AUDIT` Phase 7) | Non-Service events: **Budget** tab shows income/expense/net from `GET events/:id/workspace` → `AccountingService.getEventAccountingStatement`; hidden when all zeros; Service events hide unless finance data | Partial | Tab exists without doc authority. Either document read-only voucher totals on event, or remove tab per strict Phase 7 spirit |
| **Fund allocation (event-level)** | **Removed** — expense allocation removed from create UI (`EVENT_CONNECTIVITY_AUDIT`) | No allocation UI on event | **No** | Do not re-add without doc change |
| **Event expenses (planned)** | Not in Events UI per Phase 7 cleanup | No planned expense entry on event | **No** | — |
| **Actual vs planned (event)** | Budgets module: **ministry-level** budget vs actual only (`MODULE_EXPLAINER_CATALOG`) | No event-level planned budget anywhere | **No** | Do not build event planned-budget widgets unless docs add requirement |
| **P&L (event)** | Finance = vouchers/ledger (`MODULE_EXPLAINER_CATALOG`); event P&L UI **not specified** | Events Budget + Reports tabs show net from posted vouchers; Budgets → **Event finance** tab lists all events (undocumented) | Partial | Document event P&L surfaces in MODULE_EXPLAINER or Budgets section, or remove undocumented Event finance tab |
| **Voucher ↔ event relationship** | Finance vouchers generically (`MODULE_EXPLAINER_CATALOG`); UX report mentions *"finance hooks on event record"* | API: `POST/GET finance/events/:eventId/accounting*`; workspace loads statement; no UI to **post** voucher from Events | Partial | Docs silent on posting path; treasurers use Finance desk link only |
| **Reports (workspace)** | Hardening: loads attendance, CSV export (`SUNDAY_EVENTS_HARDENING_REPORT`) | Reports tab: attendance export + finance net summary | **No** | — |
| **Workflow / lifecycle** | `EVENT_CONTRACTS`: EventCreated, EventApproved, RegistrationOpened; connectivity: lifecycle → notifications | Full status enum + transition buttons on Overview (non-Service); Workflow tab describes state | Partial | Service events: **no transitions in workspace** but playbook says confirm status APPROVED/ACTIVE for worship services |
| **Live Ops (Events workspace)** | VALUE report: LiveEventOpsPanel in Events; advance **only** in Sunday Service; merge recommended later | Live tab: redirect card → **Open Sunday Service**; `LiveEventOpsPanel` **never imported** | Partial | Matches "advance only in Sunday Service"; does **not** match UX report surface map implying panel is active |
| **Live Ops (Sunday Service)** | Live cockpit; segment advance, timer, emergency (`SUNDAY_SERVICE_VALUE_REPORT`, CLARITY, OPERATIONS) | `SundayModeModule`: Service flow / Serving team / Alerts; advance via `live-ops/advance`; empty run sheet message + link to Worship Services | Partial | OPERATIONS guide still says **Run sheet** tab and **Sunday Mode** — copy drift vs clarity pass |
| **Public registration** | Publish ON/OFF, public API, register form, capacity (`EVENT_CONNECTIVITY_AUDIT` Phases 2–3) | Create/setup: `EventPublicPublishingFields`; public pages via website routes | Partial | **Campus picker on create** documented as future gap — still missing |
| **Public website / publishing** | 5-step publishing workflow (`EVENT_CONNECTIVITY_AUDIT` Phase 5) | Implemented on create/setup + public routes | **No** | Add campus picker when doc gap closed |
| **Attendance (canonical)** | Attendance module = canonical check-in; Events may link/export (`MODULE_ESSENCE_REPORT`, hardening) | Standalone Attendance module; Events sessions link with `eventId` | **No** | — |
| **Images (event banner)** | Upload `POST /upload?scope=events&eventId=`; banner on public cards (`EVENT_CONNECTIVITY_AUDIT`) | `EventPublicPublishingFields` + upload scope | **No** | Verify E2E only |
| **Status changes** | Lifecycle status on Event; registration gating (`EVENT_CONNECTIVITY_AUDIT`) | Transition API + buttons; Service type **suppresses** transitions in workspace | **Yes** | Allow worship service status transitions in Worship Services or workspace per REAL_WORLD playbook |
| **Communication** | EventCreated + lifecycle + EventRegistrationCompleted notifications (`EVENT_CONNECTIVITY_AUDIT` Phase 6); campaigns **not** wired from event create | Backend worker notifications; workspace Communication tab **removed**; REAL_WORLD checklist mentions Communication hub manually | Partial | Align REAL_WORLD playbook with hardening (remove per-event campaign step or document manual hub step) |
| **Files / attachments** | Event image only in connectivity audit; no general file cabinet on event | Banner image only; no general event files tab | N/A | No doc requirement for general files |
| **Run sheet (planning)** | Stored `Event.runSheet`; edited via run-sheet API; location: Sunday & Services / Events services (`EVENT_CONNECTIVITY_AUDIT`, CLARITY) | `ServicePlanPanel` in Worship Services → Plan; empty default (no synthetic segments); PUT `events/:id/run-sheet` | Partial | EVENT_CONNECTIVITY still says "Sunday & Services" — update doc or label |
| **Run sheet (live)** | Sunday Service: advance segments, timer (`SUNDAY_OPERATIONS_GUIDE`, VALUE report) | `LiveOpsService.asRunSheet`: **no synthetic fallback**; advance throws if empty; Sunday Service empty state | **No** | Matches post-hardening intent |
| **Service Events (creation)** | Sunday Service requires `type: Service` (`MODULE_EXPLAINER_CATALOG`); hardening: cannot create Service from Events | Created in **Worship Services** tab only; Events create: Special + SmallGroup only | Partial | Consistent with hardening; conflicts with Events explainer "services on calendar" |
| **Service Events (workspace tabs)** | Planning in Events/Worship Services; live in Sunday Service (CLARITY, VALUE) | Service workspace: Overview, Sessions, Volunteers, Run sheet only; banner links to plan + Sunday Service | **No** | — |
| **Visitors & event overlap** | Hardening: canonical visitor path Outreach; attendance syncs (`SUNDAY_EVENTS_HARDENING_REPORT`) | Visitors under **Identity** group in sidebar; attendance visitor → outreach sync | Partial | NAV plan did not specify Identity vs People group name |
| **Church Structure** | MERGE → Settings → structure tab; HIDE sidebar (`MODULE_ESSENCE_REPORT`, NAV) | `structure` module redirects to Settings; no Structure in Events sidebar | **No** | — |
| **Budgets module (org-wide)** | Funds, annual budgets, budget vs actual **by ministry** (`MODULE_EXPLAINER_CATALOG`); NAV: merge under Finance tab | Separate sidebar **Budgets** item; tabs: Funds, Budget workspace (vs-actual), **Event finance** (undocumented) | Partial | NAV target: Finance → budgets tab not fully merged; Event finance tab lacks doc |
| **Finance module merge** | NAV: Budgets + Vendors under Finance tabs | Finance, Budgets, Vendors remain **separate sidebar items** | **Yes** | Implement NAV §3.2 or amend NAV plan for pilot |
| **Domain events (`EVENT_CONTRACTS`)** | EventBus events + replay via Admin Center | Worker + notifications exist; replay in settings/workflow-monitor | N/A | Contract doc — no UI gap table row beyond workflow tab link |
| **Realtime (`EVENT_CONTRACTS`)** | `service:update`, `attendance:update`, etc. | Sunday Service uses `useRealtimeOps`; Events workspace does not subscribe on Live redirect tab | Partial | Acceptable if Live tab is redirect-only |
| **Home / Command Center** | Sunday overview, today's services, open Sunday Service (UX report, CLARITY) | `OperationsCommandCenter` on dashboard; shortcuts vary by role | Partial | Pastor shortcuts improved in clarity pass; verify against UX report P1 |
| **Timer parsing (MM:SS)** | Not in user docs (implementation detail) | `parseDurationSeconds` in `liveOps.ts` — 05:00 = 5 minutes | N/A | Doc gap only if operator guide should document duration format |
| **Emergency broadcast** | Sunday Mode → Emergency alert (`SUNDAY_OPERATIONS_GUIDE`) | Sunday Service Alerts / emergency API | Partial | OPERATIONS uses old module name |
| **Agenda sessions (multi-block)** | VALUE matrix: Events Live has SortableAgendaSessions | Not exposed in Sunday Service UI; may exist in unwired LiveEventOpsPanel | Partial | Doc mentions capability on Events side; unwired |
| **Event delete** | Hardening P1 deferred: API exists, no UI (`SUNDAY_EVENTS_HARDENING_REPORT`) | No delete in Events UI | **No** | Documented deferral |
| **Email confirmation to registrant** | Future gap (`EVENT_CONNECTIVITY_AUDIT`) | Not implemented | **No** | — |
| **Dedicated EventRegistration model** | Future gap | JSON array in opsConfig | **No** | — |
| **Academy / module explainers** | Events example: VBS + Sunday 9 AM workspace (`MODULE_EXPLAINER_CATALOG`) | `moduleExplainers.ts` mirrors catalog | Partial | Explainer still says services on Events calendar |

---

## 5. Navigation & alias gap summary

| Doc requirement (`NAVIGATION_SIMPLIFICATION_PLAN`) | Current state |
|-----------------------------------------------------|---------------|
| Sunday & Events: Events, Sunday Service, Attendance only | **Met** (3 items under Operations) |
| Worship Planning → Events `tab=planning` | **Not met** — uses `worship-services`; no `planning` string in codebase |
| `?module=worship` → `events&tab=planning` | **Not met** — → `worship-services` |
| `?module=services` → `events&tab=services` | **Partial** — resolves to `worship-services` + session sub-tab `schedule` |
| Budgets → Finance `tab=budgets` | **Not met** — Budgets remains top-level sidebar module |
| Vendors → Finance `tab=vendors` | **Not met** |
| Church Structure → Settings `tab=structure` | **Met** (redirect) |
| Visitors under People & Care | **Partial** — under Identity group with Outreach label |

---

## 6. Priority gaps for implementation (after doc lock)

Ordered by **document authority**, not UX preference.

### P0 — Doc contradictions (pick one truth first)

1. **Service events on Events calendar** — `MODULE_EXPLAINER_CATALOG` vs `SUNDAY_EVENTS_HARDENING_REPORT`.
2. **Worship tab naming** — `planning` / `services` / `worship-services` across NAV, ESSENCE, and aliases.
3. **Service event lifecycle transitions** — `REAL_WORLD_OPERATIONS_PLAYBOOK` expects APPROVED/ACTIVE on worship services; workspace suppresses transitions for Service type.

### P1 — Documented behavior not fully implemented

| ID | Gap | Doc quote |
|----|-----|-----------|
| G-01 | Campus picker on event create | `EVENT_CONNECTIVITY_AUDIT` remaining gaps: *"`campusId` picker on create form"* |
| G-02 | `tab=planning` alias | `NAVIGATION_SIMPLIFICATION_PLAN` §4.1 |
| G-03 | Finance sidebar merge (Budgets/Vendors tabs under Finance) | `NAVIGATION_SIMPLIFICATION_PLAN` §3.2, §4.1 |
| G-04 | Copy alignment: Sunday Mode → Sunday Service in OPERATIONS + REAL_WORLD guides | `SUNDAY_SERVICE_CLARITY_REPORT` §1 |
| G-05 | SUNDAY_OPERATIONS tab names: Run sheet → Service flow | `SUNDAY_SERVICE_CLARITY_REPORT` §1 |

### P2 — Implementation without doc authority (do not expand; clarify or remove)

| ID | Gap | Notes |
|----|-----|-------|
| G-06 | Events workspace **Budget** tab | No explainer; Phase 7 removed budget from **create** — read-only actuals need doc sentence |
| G-07 | Budgets **Event finance** tab | Not in MODULE_EXPLAINER Budgets section |
| G-08 | `LiveEventOpsPanel` unwired | VALUE report lists it as Events surface; redirect-only Live tab is intentional alternative — **document choice** |
| G-09 | In-workspace volunteer assignment | Docs say "drive volunteers"; only deep link exists |

### P3 — Documented future gaps (explicitly not required now)

Waitlist, paid ticketing, EventRegistration table, auto-attendance on register, registrant email, per-event landing slug builder (`EVENT_CONNECTIVITY_AUDIT` §Remaining gaps).

---

## 7. Finance decision matrix (for product sign-off)

| Question | Official answer from docs |
|----------|---------------------------|
| Should Events **create/setup** show budget or fund allocation? | **No** — removed (`EVENT_CONNECTIVITY_AUDIT` Phase 7) |
| Should Events show **planned** budget vs **actual** spend? | **No doc requirement** — Budgets module is **ministry-level** budget vs actual |
| Where should treasurers see event money? | **Not specified in user docs** — Finance vouchers module generally; implementation adds event statement API |
| Should event P&L include only **posted vouchers**? | Implied by Finance module accounting model; not stated for events explicitly |
| Fund allocation at event level? | **Removed** from Events UI |

**Implementation note (factual, not recommendation):** Current code shows **posted voucher totals only** on Events Budget tab when non-zero, and lists events on Budgets → Event finance. Neither surface is quoted in `MODULE_EXPLAINER_CATALOG` or `EVENT_CONNECTIVITY_AUDIT`.

---

## 8. Conclusion

The Events domain is **partially aligned** with official documentation:

- **Aligned:** Public publishing/registration pipeline, registration storage model, attendance session linkage, Service-type planning split (per hardening), Sunday Service as live-only cockpit with segment advance, run sheet editing in Worship Services, removal of ticket/budget/allocation from event create, Communication tab removal (per hardening).
- **Misaligned:** Navigation tab ids (`planning`/`services` vs `worship-services`), Finance/Budgets sidebar merge, Events calendar vs Service-type exclusion, Service lifecycle transitions in workspace, operator guide naming (Sunday Mode / Run sheet tab).
- **Undocumented implementation:** Events workspace Budget tab, Budgets Event finance tab, event accounting API consumption in workspace.

**No implementation should proceed until P0 doc contradictions (§6) are resolved and finance UI surfaces are either documented or removed.**

---

## 9. Files referenced (implementation verification)

| Area | Primary files |
|------|----------------|
| Events module | `src/modules/events/EventsModule.tsx` |
| Event workspace | `src/components/events/EventWorkspace.tsx` |
| Worship Services | `src/modules/sunday-services/SundayServicesModule.tsx`, `ServicePlanPanel.tsx` |
| Sunday Service live | `src/modules/sunday/SundayModeModule.tsx`, `src/server/services/LiveOpsService.ts` |
| Navigation | `src/lib/adminNavigation.ts`, `src/components/layout/AppShell.tsx` |
| Budgets / finance | `src/modules/budgets/BudgetsModule.tsx`, `src/server/services/AccountingService.ts` |
| Unwired live panel | `src/components/events/LiveEventOpsPanel.tsx` (no imports) |

---

*End of report — audit only, no code changes.*
