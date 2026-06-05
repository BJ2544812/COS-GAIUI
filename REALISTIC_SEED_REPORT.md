# Realistic Seed Data Report — Grace Community Church (v2)

**Date:** 2026-06-01  
**Script:** `npm run seed:demo-church` → `src/server/scripts/seed-demo-church-v2.ts`  
**Staff roles:** `npm run seed:demo-roles` → `src/server/scripts/seed-demo-roles.ts`  
**Reset:** `DEMO_CHURCH_RESET=1 npm run seed:demo-church`

**Last run:** Successful (exit 0). Console: 28 members, member portal `member` / `demo123`.

---

## Population summary

| Entity | Target | Seeded |
|--------|--------|--------|
| Members | 20–30 | **28** (`@gracecommunity.demo`) |
| Families | 8–10 | **9** (pairs linked via `familyId`) |
| Volunteers | 8–10 | **10** (`memberResponsibility`: Greeter / Usher) |
| Events | Realistic church calendar | **11** (see list below) |
| Donations | Meaningful history | **24** via `GivingService.recordDonation` (GL-linked) |
| Prayer requests | — | **12** + 1 portal sample |
| Notifications | — | **8** staff + **3** portal |
| Sermons | — | **6** (“Walking in Grace” series) |
| Small group | — | **Grace Home Group — Anna Nagar** |
| Attendance session | — | **Sunday Worship Service — 9:00 AM** + portal check-ins |
| Campaigns | — | General, Building, Mission Support, Benevolence |
| Expense vouchers | — | **4** drafted → approved → **posted** to ledger |

---

## Events (realistic names)

1. Sunday Worship Service  
2. Wednesday Prayer Meeting  
3. Youth Fellowship Night  
4. Leadership Training  
5. Baptism Service  
6. Church Anniversary  
7. Marriage Seminar  
8. Christmas Outreach  
9. Good Friday Service  
10. Easter Celebration  
11. Vacation Bible School  

Statuses: `APPROVED`, dated relative to seed run (past/future via `days` offset).

---

## Organization & contact (realistic)

- **Name:** Grace Community Church  
- **Address:** 42 Church Lane, Anna Nagar, Chennai 600040  
- **Phone:** +91 44 2616 7890  
- **Email:** office@gracecommunity.in  
- **Service times:** 9:00 AM • 11:00 AM • 5:00 PM (Youth)  
- **Campuses:** Grace Main + Grace North  

---

## Staff demo accounts (`seed:demo-roles`)

| Role | Username | Password |
|------|----------|------------|
| Senior Pastor | `pastor` | `demo123` |
| Associate Pastor | `associate` | `demo123` |
| Youth Pastor | `youth` | `demo123` |
| Worship Pastor | `worship` | `demo123` |
| Finance Manager | `finance` | `demo123` |
| HR Manager | `hradmin` | `demo123` |
| Church Administrator | `churchadmin` | `demo123` |
| Communications | `secretary` | `demo123` |
| Small Group Leader | `groupleader` | `demo123` |
| Member (portal) | `member` | `demo123` |

Override password: `DEMO_ROLE_PASSWORD` / `DEMO_MEMBER_PASSWORD` env vars.

---

## Finance seed detail

**Chart (sample):** Cash, HDFC Church Account, Tithes & Offerings, Building Fund revenue, Staff Salaries, Utilities, Event Expenses, Equipment, Accounts Payable.

**Posted expenses (examples):**

- Monthly electricity & water — ₹18,500  
- Staff payroll — ₹125,000  
- Sound equipment maintenance — ₹22,000  
- Youth Fellowship refreshments — ₹4,500  

Workflow events observed: `VoucherApproved`, `TransactionPosted`.

---

## Website seed

- Applies **flagship-v2** template to tenant `PageData`  
- Sets **all pages published** (`isPublished: true`)  
- Public site should read DB content (same visual as template)

---

## Member realism

- Indian Christian name pool (Ravi, Priya, Thomas, etc.)  
- Phones: `98xxxxxxxx` pattern  
- Growth stages: Visitor → Regular → Member → Leader  
- Baptism milestones for qualifying members  
- Family linking: two members per household for first 9 families  

---

## What was removed / avoided

- No new random junk strings beyond tagged prayer/notification content (`[gcc-v2]`)  
- Removed duplicate organization upsert that overwrote Chennai address with Bengaluru  
- Replaced `[Demo]` event names and session/group labels with production-friendly titles  

---

## Commands

```bash
npm run seed          # base tenant + admin
npm run seed:demo-church
npm run seed:demo-roles
# Full reset of demo-tagged members/events:
DEMO_CHURCH_RESET=1 npm run seed:demo-church
```
