# Module Locks

**Platform status:** Six domains **PILOT LOCKED** (2026-06-06)  
**Rule:** Do not reopen locked domains for ideas or redesigns. Use `docs/KNOWN_BACKLOG.md` for future enhancements.

---

## Current platform status — PILOT LOCKED

| Domain | Scope |
|--------|--------|
| **People & Care** | Members · Small Groups · Pastoral Care · Visitors & Outreach |
| **Events** | One Event = One Workspace |
| **Sunday Service** | Live cockpit (segment, timer, advance, alerts) |
| **Attendance** | Sessions, check-ins, headcounts, exports |
| **Giving** | Donation recording, growth reporting, member giving |
| **Finance** | Vouchers, vendors, CA exports, ledgers, month-end |

**Unlocked domains** (HR, Communications, Website CMS, Settings, etc.) are where new feature effort belongs until church feedback or production incidents require a locked-domain fix.

---

## Future work protocol

Every change to a domain — before lock or when reopening under qualified criteria — must follow:

1. **Read documentation** — module guides, lock reports, API contracts
2. **Compare implementation** — code matches documented behavior
3. **Browser validation** — exercise real flows in the browser (never skip)
4. **Fix UX** — address what staff actually see and do
5. **Re-test** — same roles, same paths, in the browser again
6. **Freeze** — update `MODULE_LOCKS.md` and move enhancements to `KNOWN_BACKLOG.md`

**The browser is the source of truth.** Automated tests support validation; they do not replace it.

---

These modules passed live browser validation and are frozen for pilot. Stability takes priority over experimentation.

---

## PEOPLE & CARE

**STATUS: PILOT LOCKED**

Includes: Members · Small Groups · Pastoral Care · Visitors & Outreach

---

## EVENTS

**STATUS: PILOT LOCKED**

One Event = One Workspace (Overview · People · Schedule / Worship Planning · Finance · Reports · Workflow).

---

## SUNDAY SERVICE

**STATUS: PILOT LOCKED**

Live cockpit only — segment, timer, advance, alerts, emergency actions. No planning on this screen.

---

## ATTENDANCE

**STATUS: PILOT LOCKED**

Canonical owner of sessions, check-ins, headcounts, and exports. Events and Sunday Service deep-link here only.

---

## GIVING

**STATUS: PILOT LOCKED**

Donation recording, growth reporting, and member-facing giving flows. Frozen after browser trust validation.

---

## FINANCE

**STATUS: PILOT LOCKED**

Vouchers, vendors, CA exports, ledgers, and month-end reporting. Frozen after finance trust sprint (`FINANCE_TRUST_REPORT.md`).

**Preserve (do not redesign):**

* Receipt design
* Voucher design
* Voucher lifecycle (draft → approve → post → reverse)
* `AccountingService`
* Permissions model

Future work must **not** redesign Finance — only fix qualified issues per reopen rules below.

---

## RULE

A locked module may only be reopened when:

* A user discovers a problem.
* Data is incorrect.
* A workflow fails.

**Not** because we think of a better idea.

---

## Do NOT reopen locked modules for

* Personal preference
* UI experimentation
* Architecture redesign
* Additional features
* “While we’re in there” refactors

---

## Reopen ONLY for

1. **Real bugs** — something breaks in the browser for church staff
2. **Data integrity issues** — wrong counts, lost assignments, incorrect persistence
3. **Actual church feedback** — pilot users report a blocker or confusion that stops real work
4. **Production incidents** — outage, security, or data-loss risk

---

## Before changing locked code

1. Confirm the issue meets one of the four reopen criteria above.
2. Log the defect (see `docs/pilot-church/DEFECT_LOG.md` or production incident process).
3. Fix the smallest change that resolves the reported problem.
4. Re-verify in the **browser** with the affected role(s).
5. Do not bundle enhancements — move those to `docs/KNOWN_BACKLOG.md`.

---

## Related documents

* `FRONTEND_LOCK_REPORT.md` — Sunday & Events validation evidence
* `FINANCE_TRUST_REPORT.md` — Giving & Finance trust sprint sign-off
* `GIVING_FINANCE_FRONTEND_LOCK_REPORT.md` — Giving & Finance lock criteria
* `docs/KNOWN_BACKLOG.md` — deferred enhancements (not blockers)
