# Real User Walkthrough Report

**Date:** 2026-06-02
**Tenant:** default-tenant-id
**Church:** Grace Community Church

## Data presence

| Entity | Count |
|--------|-------|
| Members (@gracecommunity.in) | 28 |
| Donations | 39 |
| Payroll runs | 6 |

## Role API walkthrough

| Role | Login | Endpoints OK | Notes |
|------|-------|--------------|-------|
| Admin | PASS | 2/3 | 1 fail |
| Senior Pastor | PASS | 3/4 | 1 fail |
| Church Administrator | PASS | 3/3 | OK |
| Associate Pastor | PASS | 2/3 | 1 fail |
| Youth Pastor | PASS | 2/2 | OK |
| Worship Pastor | PASS | 2/2 | OK |
| Finance Manager | PASS | 3/4 | 1 fail |
| Accountant | PASS | 1/2 | 1 fail |
| HR Manager | PASS | 2/2 | OK |
| Volunteer Coordinator | PASS | 2/2 | OK |
| Communications Manager | PASS | 1/2 | 1 fail |
| Small Group Leader | PASS | 1/2 | 1 fail |
| Staff | PASS | 2/2 | OK |
| Member Portal | PASS | 0/3 | 3 warn |

## Public website

| Check | Status |
|-------|--------|
| GET public/home | PASS |
| GET public/settings (SEO) | PASS |

## Detail

### Admin (`admin`)

- **/members**: PASS — 28 rows
- **/analytics/summary**: FAIL — HTTP 404
- **/website/pages**: PASS — 11 rows

### Senior Pastor (`pastor`)

- **/members**: PASS — 28 rows
- **/care/cases**: FAIL — HTTP 404
- **/events**: PASS — 9 rows
- **/giving/donations**: PASS — 39 rows

### Church Administrator (`churchadmin`)

- **/members**: PASS — 28 rows
- **/events**: PASS — 9 rows
- **/attendance/sessions**: PASS — 26 rows

### Associate Pastor (`associate`)

- **/members**: PASS — 28 rows
- **/care/cases**: FAIL — HTTP 404
- **/events**: PASS — 9 rows

### Youth Pastor (`youth`)

- **/members**: PASS — 28 rows
- **/events**: PASS — 9 rows

### Worship Pastor (`worship`)

- **/events**: PASS — 9 rows
- **/attendance/sessions**: PASS — 26 rows

### Finance Manager (`finance`)

- **/finance/summary**: FAIL — HTTP 404
- **/finance/vouchers**: PASS — 80 rows
- **/finance/payroll/runs**: PASS — 6 rows
- **/giving/donations**: PASS — 39 rows

### Accountant (`accountant`)

- **/finance/vouchers**: PASS — 80 rows
- **/finance/ledger**: FAIL — HTTP 404

### HR Manager (`hradmin`)

- **/hr/employment-profiles**: PASS — 6 rows
- **/finance/payroll/runs**: PASS — 6 rows

### Volunteer Coordinator (`volunteers`)

- **/members**: PASS — 28 rows
- **/events**: PASS — 9 rows

### Communications Manager (`secretary`)

- **/communication/campaigns**: FAIL — HTTP 404
- **/documents**: PASS — 3 rows

### Small Group Leader (`groupleader`)

- **/members**: PASS — 28 rows
- **/groups**: FAIL — HTTP 404

### Staff (`staffdesk`)

- **/members**: PASS — 28 rows
- **/events**: PASS — 9 rows

### Member Portal (`member`)

- **/auth/me**: WARN — ok
- **/events**: WARN — 403 forbidden
- **/care/prayer**: WARN — 403 forbidden
