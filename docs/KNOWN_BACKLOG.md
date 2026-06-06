# Known Backlog

**Purpose:** Enhancements and polish deferred after pilot locks (Sunday & Events · Giving & Finance).  
**Rule:** Items here are **not blockers**. Do not reopen locked domains (`docs/MODULE_LOCKS.md`) to work on these unless bundled with a qualified bug fix. **Focus new effort on unlocked domains** unless a locked-domain issue meets reopen criteria.

Last updated: 2026-06-06

---

## Sunday & Events — deferred polish (P2)

### Seed & display data

| Item | Module | Notes |
|------|--------|-------|
| Legacy **5:30 AM** service times in picker | Sunday Service / Events | Old seeded events stored in UTC; **new** worship services default to 9:00 AM local. Fix via seed refresh or migration script — not a UI change. |

### Navigation & deep links

| Item | Module | Notes |
|------|--------|-------|
| **Assign volunteers** Home quick action | Dashboard → Volunteers | Works via deep-link + pre-filled event; canonical path is Events → People → Manage in Volunteers. Could route directly to event People tab. |
| **Volunteer gaps** dashboard cards | Dashboard | Link to Volunteers module with event context; could open Events → People instead for single entry point. |
| Volunteers module when no event context | Volunteers | Board shows all assignments; event-scoped view only after arriving from Events. Acceptable for pilot. |

### Copy & labels

| Item | Module | Notes |
|------|--------|-------|
| **View activity log** on Workflow tab | Events | Admin/audit language; acceptable for administrators. Could rename to church-friendly “Activity history” if feedback requests it. |
| Readiness badges (“Not ready · 0%”) on Home | Dashboard | Operational scoring language; not incorrect, but dense for first-time pastors. |

### UX convenience (non-blocking)

| Item | Module | Notes |
|------|--------|-------|
| Fullscreen mode prominence | Sunday Service | Spec mentions fullscreen; verify discoverability if churches ask. |
| Event setup form type catalog | Events → Edit details | Create form has 8 church types; setup/edit still uses canonical Service / Special / SmallGroup — labels OK, could align picker UX. |
| Non-service Schedule **Add session** flow | Events → Schedule | Creates session via API; could add inline naming modal like Attendance module. |
| Export polish on Reports tab | Events | CSV export works when data exists; empty-state messaging could be friendlier. |
| Bookmarkable URLs without admin shell | Events | `?module=events&event=&tab=` works; public/share links out of scope for pilot. |

### Code hygiene (do not touch during freeze)

| Item | Notes |
|------|-------|
| Legacy `ServicesModule` / `defaultRunSheet()` | Redirects to Events; dead paths remain in repo. Remove in a post-pilot cleanup sprint, not during lock. |
| `VolunteersModule` as deep-link destination | Not in sidebar; intentional. Consolidation is backlog only if churches find it confusing. |

---

## Giving & Finance — deferred enhancements

### P1

| Item | Module | Notes |
|------|--------|-------|
| **Vendor update API** | Finance → Vendors | Only `POST /vendors` and `GET /vendors` exist today. Edit UI blocked until backend exposes `PUT`/`PATCH`. Not a pilot blocker — create, bills, and payments work. |

### P2

| Item | Module | Notes |
|------|--------|-------|
| **Empty Fund Reports demo data** | Finance → CA & Audit | `fund_statements` export returns valid `no_data` CSV when no fund rows exist for the period. Seed fund activity or add date-range UI for CA realism — enhancement only. |

---

## People & Care — deferred (not validated in lock sprint)

| Item | Notes |
|------|-------|
| Member profile polish | Locked module — backlog only unless user-reported defect. |
| Pastoral Care workflow depth | Pilot scope; expand after church feedback. |

---

## How to promote an item from backlog

1. Church staff or pilot UAT reports pain — not internal preference.
2. Confirm it is **not** already covered by locked-module behavior.
3. If it requires locked-module code, treat as **enhancement** and schedule **after** pilot unless it qualifies under `MODULE_LOCKS.md` reopen rules.
4. Remove or update the row here when shipped.

---

## References

* `FRONTEND_LOCK_REPORT.md` — Sunday & Events validation evidence
* `FINANCE_TRUST_REPORT.md` — Giving & Finance trust sprint and pilot-lock sign-off
* `GIVING_FINANCE_UX_REPORT.md` — UX sprint notes (pre-lock)
* `docs/MODULE_LOCKS.md` — freeze policy
