# Demo Church Realism Report — Grace Community Church

**Date:** 2026-06-02  
**Seed commands:** `npm run seed:demo-church` then `npm run seed:demo-roles`  
**Reset:** `DEMO_CHURCH_RESET=1 npm run seed:demo-church`

---

## Part 1 — Church story (single identity)

| Element | Content |
|---------|---------|
| **Name** | Grace Community Church |
| **Founded** | 1998, Anna Nagar, Chennai |
| **Tagline** | Growing in faith, serving with compassion. |
| **Vision** | A caring Chennai community where every person can know Christ, grow in discipleship, and serve the city with compassion. |
| **Mission** | Gather for worship, nurture families in small groups, send members through outreach and missions. |
| **History** | Stored in `settings.church_story` (see `src/server/scripts/demo-church/churchIdentity.ts`) |
| **Campuses** | Grace Main (Church Lane) · Grace North (Kilpauk) |
| **Service times** | 9:00 AM · 11:00 AM · 5:00 PM (Youth) |

### Leadership & staff (member + HR + payroll linked)

| Person | Role | Member email | Login |
|--------|------|--------------|-------|
| Ravi Nair | Senior Pastor | ravi.nair@gracecommunity.in | `pastor` |
| David Kurian | Associate Pastor | david.kurian@gracecommunity.in | `associate` |
| Sarah Thomas | Church Administrator | sarah.thomas@gracecommunity.in | `churchadmin` |
| James Joseph | Finance Manager | james.joseph@gracecommunity.in | `finance` |
| Anita George | Youth Pastor | anita.george@gracecommunity.in | `youth` |
| Thomas Menon | Worship Leader | thomas.menon@gracecommunity.in | `worship` |

Password for staff UAT: `demo123` (or `DEMO_ROLE_PASSWORD`).

### Ministries

Worship & Arts · Youth · Children's · Outreach & Missions · Pastoral Care — each `Ministry` row linked to main campus.

### Small groups

| Group | Leader | Day |
|-------|--------|-----|
| Grace Home Group — Anna Nagar | Priya Paul | Thursday |
| Grace Home Group — Kilpauk | Arjun Varughese | Wednesday |
| Young Adults — City Center | Joshua George | Friday |
| Married Couples — Church Lane | David Kurian | Saturday |

Members are `SmallGroupMember` rows (LEADER / PARTICIPANT).

---

## Part 2 — Connected data map

```
Tenant (Grace Community Church)
├── Campuses (2)
├── Members (28) ──┬── Families (10)
│                  ├── Attendance (26 sessions × ~18–22 each)
│                  ├── Donations (6 months income)
│                  ├── Prayer requests
│                  ├── Care cases (3)
│                  └── Portal user → Meera Kurian
├── Staff (6) ─────┬── EmploymentProfile
│                  ├── PayrollStructure
│                  └── PayrollRun × 6 months (accrual + bank payment)
├── Ministries (5) ← volunteer MemberResponsibility
├── Events (9) ────┬── AttendanceSession (Sunday → ev-sunday)
│                  ├── Donations (VBS registration fees)
│                  └── Volunteers (MemberResponsibility entityId = event)
├── Campaigns (4 funds)
├── GL accounts + vouchers (6 months expenses)
├── Sermons (6, published)
├── CommunicationCampaign (3) → Delivery (5 members each)
├── Documents (3 institutional)
├── Website PageData (flagship-v2, personalized, published)
└── Users (demo roles) → memberId where unique
```

**No intentional orphan seed rows** — IDs use stable prefix `gcc-v2-` for idempotent upserts.

**Evidence paths**

- Identity: `src/server/scripts/demo-church/churchIdentity.ts`
- Seeder: `src/server/scripts/demo-church/seedGraceCommunity.ts`
- Entry: `src/server/scripts/seed-demo-church-v2.ts`
- Roles: `src/server/scripts/seed-demo-roles.ts`

---

## Part 3 — Accounting story (6 months)

| Income (via `GivingService.recordDonation` + GL) | Frequency |
|--------------------------------------------------|-----------|
| Sunday offerings (General Fund) | 4 weeks × 6 months |
| Building Fund | Monthly |
| Mission Support | Monthly |
| Event registration (VBS) | Every other month |

| Expense (posted Payment vouchers) | Frequency |
|-----------------------------------|-----------|
| Payroll (accrual Journal + bank Payment via `payPayrollRun`) | Monthly, 6 staff |
| Utilities | Monthly |
| Internet & telecom | Monthly |
| Facility rent | Monthly |
| Outreach / maintenance / AV / youth refreshments | Rotating |

**Last seed run:** 39 donation postings, 6 payroll months, 26 Sunday attendance sessions.

---

## Part 4 — Payroll story

- **Structures:** Each staff member has `PayrollStructure` → salary expense `4010`, payable `2010`.
- **Runs:** `AccountingService.createPayrollRun` for each of last 6 calendar months (skipped if period exists).
- **Payment:** `payPayrollRun` from HDFC Church Account `1020`.
- **Finance UI:** Login as `finance` / `demo123` → Finance → Payroll runs / vouchers / ledger.

---

## Part 5 — Event story

| Event | Registration | Volunteers | Attendance / payments |
|-------|--------------|------------|------------------------|
| Sunday Worship Service | — | Ushers, greeters | 26 sessions linked via `eventId` |
| Wednesday Prayer | — | — | — |
| Youth Fellowship | — | Youth host | Refreshment expense in GL |
| Leadership Training | Open | — | — |
| Baptism Service | Open | — | — |
| Marriage Seminar | Open | — | — |
| Christmas Outreach | Open | Outreach team | — |
| Easter Celebration | — | — | Past-dated |
| Vacation Bible School | Open | Registration desk | Donations with `eventId` |

---

## Part 6 — Website CMS (summary)

See **WEBSITE_CMS_FINAL_REPORT.md**. Template applied, copy personalized to Grace Community story, all pages published. Media tab now lists real `imageUrl` values from page JSON (no placeholder grid).

---

## Part 7 — Frontend mocks removed (this pass)

| Location | Change |
|----------|--------|
| `WebsiteModule` Forms tab | Removed fake “N New Submissions” counts |
| `WebsiteModule` Media tab | Shows images extracted from saved page sections |

Prior pass (still in effect): Documents vault API, prayer API, profile access log, public stats/footer from CMS/settings.

---

## Part 8 — Role walkthrough

| Role | User | Sees |
|------|------|------|
| Senior Pastor | `pastor` | Members, care cases, prayer, events, analytics — Ravi Nair profile |
| Church Admin | `churchadmin` | Sarah Thomas — events, attendance, settings |
| Finance | `finance` | James Joseph — 6 months gifts, payroll, expenses, vouchers |
| HR | `hradmin` | Susan Joseph — employment profiles, payroll structures |
| Volunteer coord. | `volunteers` | Kevin Joseph — event/ministry responsibilities |
| Member | `member` | Meera Kurian — portal giving, attendance, prayers |

**Portal login:** `member` / `demo123` (user email `portal@gracecommunity.in`, linked to Meera Kurian).

---

## Success criteria

| Criterion | Status |
|-----------|--------|
| Believable single church | Yes — one story, Chennai context, named families |
| Connected records | Yes — see diagram above |
| 6 months accounting | Yes — offerings, funds, payroll, expenses |
| Role realism | Yes — users linked to member profiles |
| Public site unchanged visually | Yes — same flagship template; copy from DB |

---

## Remaining notes

1. Run `DEMO_CHURCH_RESET=1 npm run seed:demo-church` when switching from old `@gracecommunity.demo` data.
2. `memberId` on `User` is globally unique — only one login per member (portal uses Meera; groupleader uses Priya).
3. Simulation script (`npm run simulate:church`) still tags its own events (`hif-ecopark-sim`) — does not affect Grace seed.
