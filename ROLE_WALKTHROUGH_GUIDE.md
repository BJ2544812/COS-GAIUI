# Role Walkthrough Guide — Explore Ultimate Church OS

Use **Explore Ultimate Church OS** from the header (**Explore** button) or **Academy → Explore by role**. Each tour has four beats per stop:

1. **What this role does** (once at the top)
2. **Open the correct module** (Go button)
3. **Perform a realistic task** (instruction)
4. **Why it matters** (ministry outcome)

Progress is stored per browser. Estimated times are per role track.

---

## Senior Pastor (~5 minutes)

**What this role does:** Shepherd the congregation — see church health, care for people, steward resources, and stay ready for Sunday.

| # | Stop | Task | Why |
|---|------|------|-----|
| 1 | View church health dashboard | Open **Home** and scan the pastoral lens — attendance, giving, ministry signals. | Leadership starts with a truthful weekly picture. |
| 2 | Review attendance trends | Open **Attendance** or **Reports** and compare recent Sunday participation. | Gathering patterns reveal engagement and pastoral contact needs. |
| 3 | Review pastoral care cases | Open **Pastoral Care** and read open cases and follow-ups. | Care keeps trust when multiple pastors share load. |
| 4 | Review Sunday service readiness | Open **Sunday Service** — worship, teams, attention items. | Sunday is the church rhythm; readiness reduces chaos. |
| 5 | Review giving summary | Open **Giving** for recent gifts and trends (not voucher entry). | Generosity reflects spiritual health and funds mission. |

**Demo login:** `pastor` / `demo123`

---

## Church Administrator (~8 minutes)

**What this role does:** Keep daily operations moving — events, volunteers, attendance, communications, and settings.

| # | Stop | Task | Why |
|---|------|------|-----|
| 1 | Operations home | Open **Home** (operations view) — this week’s services and gaps. | Administrators coordinate from one weekly picture. |
| 2 | Plan an event | Open **Events**, create or open a service; review setup checklist. | Most activity flows through event records. |
| 3 | Sunday service desk | Open **Sunday Service** and select today’s worship gathering. | Service day needs one live cockpit. |
| 4 | Volunteer teams | Open **Volunteers** and confirm roles for upcoming service. | Serving teams are the backbone of Sunday. |
| 5 | Church settings | Open **Settings** — org profile and key defaults. | Correct settings keep receipts and reports accurate. |

**Demo login:** `churchadmin` / `demo123`

---

## Finance Manager (~10 minutes)

**What this role does:** Record gifts, manage the ledger, approve spending, and report to leadership and auditors.

| # | Stop | Task | Why |
|---|------|------|-----|
| 1 | Record gifts | Open **Giving** — record or review donations. | Stewardship begins with accurate gift entry. |
| 2 | Finance desk | Open **Finance → Vouchers** — create or open a draft voucher. | Expenses must be documented before payment. |
| 3 | Approve voucher | Open **Approvals** (if permitted) — pending vouchers. | Separation of duties protects the church. |
| 4 | Budgets & funds | Open **Budgets** — fund balances vs plan. | Leadership allocates by ministry and project. |
| 5 | Reconciliation | Open **Finance → Reconciliation** — scan unmatched lines. | Bank and ledger must agree for trustworthy statements. |

**Demo login:** `finance` / `demo123`

---

## HR Manager (~7 minutes)

**What this role does:** Manage paid staff — employment records, leave, documents, and payroll handoff to finance.

| # | Stop | Task | Why |
|---|------|------|-----|
| 1 | HR overview | Open **HR & Staff** — dashboard counts. | Staff operations affect Sunday quality and compliance. |
| 2 | Staff directory | **Staff directory** tab — open one employment profile. | Job data must stay current for payroll. |
| 3 | Leave requests | Open **Leave** — review pending requests. | Coverage planning protects Sundays and office hours. |
| 4 | Payroll with finance | Open **Vendors & Payroll** or finance payroll runs. | Payroll must match HR and post to the ledger. |

**Demo login:** `hradmin` / `demo123`

---

## Volunteer Coordinator (~6 minutes)

**What this role does:** Fill teams for Sunday and events, track check-in, and support leaders on service day.

| # | Stop | Task | Why |
|---|------|------|-----|
| 1 | Volunteer roster | Open **Volunteers** — filter by upcoming event. | Clear rosters prevent gaps at doors and platform. |
| 2 | Sunday service teams | **Sunday Service → Teams** for today’s service. | Live visibility shows who is present or missing. |
| 3 | Attendance check-in | Open **Attendance** — run or review today’s session. | Counts encourage volunteers and inform pastors. |
| 4 | Event workspace | Open **Events** detail for roster edits. | Special events use the same volunteer engine as Sunday. |

**Demo login:** `volunteers` / `demo123`

---

## Small Group Leader (~5 minutes)

**What this role does:** Lead a home group — know members, record attendance, escalate pastoral needs.

| # | Stop | Task | Why |
|---|------|------|-----|
| 1 | Your group | Open **Small Groups** — select your roster. | Discipleship happens in consistent community. |
| 2 | Member care | Open **Members** — review group participants. | Leaders often spot pastoral needs first. |
| 3 | Group attendance | Open **Attendance** — record or review group meeting. | Patterns show who may be drifting. |
| 4 | Pastoral handoff | Open **Pastoral Care** — log or view a care note (as permitted). | Serious needs should reach pastors with context. |

**Demo login:** `groupleader` / `demo123`

---

## Member (~4 minutes)

**What this role does:** Stay connected — profile, giving, groups, and schedule through the member portal.

| # | Stop | Task | Why |
|---|------|------|-----|
| 1 | Your portal | Open **member portal** — review profile. | Members own contact info and see activity. |
| 2 | Give online | Visit **giving page** (test mode if enabled). | Digital giving supports consistent stewardship. |
| 3 | Church website | Open **public home** — service times. | Members invite friends to the same info visitors see. |

**Demo login:** `member` / `demo123`

---

## Quick test suggestions by role

The **Show me what to test next** card on Home and Academy uses your login to suggest the next tour stop, then checklist items:

| Role | Typical “test next” path |
|------|---------------------------|
| Pastor | Sunday Service → Attendance → Pastoral care → Giving |
| Finance | Record gift → Voucher → Approve → Budget |
| Church admin | Events → Sunday Service → Volunteers → Settings |

---

*In-app source: `src/lib/walkthroughs.ts` · UI: `WalkthroughPanel.tsx` · Academy module.*
