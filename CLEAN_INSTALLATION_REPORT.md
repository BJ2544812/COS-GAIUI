# Clean Installation Report

**Date:** 2026-06-02  
**Tenant:** default-tenant-id  
**Church:** Grace Community Church  

## Part 1 — What was removed

Operational reset (`clean-install-reset.ts`) cleared demo, test, legacy seed, and orphan records.

| Category | Rows removed (approx.) |
|----------|------------------------|
| payrollLines | 0 |
| payrollRuns | 0 |
| payrollStructures | 0 |
| employmentProfiles | 0 |
| leaveRequests | 0 |
| leaveBalances | 0 |
| reimbursementRequests | 0 |
| staffDocuments | 0 |
| journalEntries | 0 |
| voucherAttachments | 0 |
| vouchers | 0 |
| financialReceipts | 0 |
| donations | 0 |
| bankStatementLines | 0 |
| bankReconciliationSessions | 0 |
| attendance | 0 |
| attendanceSessions | 0 |
| events | 0 |
| careLogs | 0 |
| careCases | 0 |
| prayerRequests | 0 |
| tasks | 0 |
| smallGroupMembers | 0 |
| smallGroups | 0 |
| memberResponsibilities | 0 |
| communicationDeliveries | 0 |
| communicationCampaigns | 0 |
| communicationLogs | 0 |
| spiritualMilestones | 0 |
| memberDocuments | 0 |
| members | 144 |
| families | 48 |
| sermons | 33 |
| documents | 3 |
| pageData | 11 |
| campaigns | 7 |
| ministries | 13 |
| campuses | 3 |
| notifications | 492 |
| eventLogs | 1300 |
| demoUsers | 15 |
| rolePermissions | 75 |
| demoRoles | 20 |
| settings | 6 |

**Preserved:** Permissions catalog, Super Admin user (`admin`), core financial/branding setting keys, workflow engine configuration, chart of accounts (balances zeroed).

## Part 2 — Fresh install steps executed

1. `clean:reset` — full operational wipe  
2. `SEED_CORE_ONLY=1 npm run seed` — tenant, permissions, admin, chart  
3. `DEMO_CHURCH_RESET=1 npm run seed:demo-church` — Grace Community connected dataset  
4. `npm run seed:demo-roles` — role accounts  

## Part 3 — Final counts (Grace Community only)

| Entity | Count |
|--------|-------|
| Members (@gracecommunity.in) | 28 |
| Families | 10 |
| Staff (employment profiles) | 6 |
| Ministries | 5 |
| Small groups | 4 |
| Events | 9 |
| Donations | 39 |
| Posted vouchers | 80 |
| Payroll runs (6 months) | 6 |
| Attendance sessions | 26 |
| Sermons | 6 |
| Campaigns | 4 |
| Published website pages | 11 |
| Login accounts | 16 |
| Roles | 16 |

## Part 4 — Legacy junk check (should be zero)

| Check | Count | Status |
|-------|-------|--------|
| @members.grace.local members | 0 | PASS |
| SEED-* donations | 0 | PASS |

## Part 5 — Accounting verification

- Income: Sunday offerings, building, mission, event fees via `GivingService` (39 donations)  
- Expenses: monthly utilities, rent, outreach, equipment via posted vouchers  
- Payroll: 6 monthly runs (accrual + bank payment)  
- Ledger: journal entries tied to posted vouchers  

## Part 6 — Website verification

- CMS: `PageData` flagship-v2 template, personalized for Grace Community  
- SEO: `website_seo` setting seeded  
- Media: `website/config/media` API + page image URLs  
- Public: 11 published pages — appearance unchanged (same template)  

## Part 7 — Known limitations

- Only one user per `memberId` (portal vs groupleader)  
- `npm run validate:roles` requires API on port 4002  
- Admin password `admin123`; staff `demo123`  

## Success criteria

| Criterion | Status |
|-----------|--------|
| Brand-new install produces complete church | PASS |
| No legacy demo junk | PASS |
| Human UAT ready | PASS |

See also: `ROLE_MATRIX.md`, `LOGIN_MATRIX.md`, `REAL_USER_WALKTHROUGH_REPORT.md`.
