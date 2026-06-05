# Accounting Integrity Report — Grace Community Church (6 months)

**Date:** 2026-06-02  
**Validation:** Seed execution + `npm run simulate:church` (51 pass, 0 fail)

---

## Chart of accounts (seeded)

| Code | Name | Type |
|------|------|------|
| 1010 | Cash in Hand | Asset |
| 1020 | HDFC Church Account | Asset |
| 2010 | Accounts Payable | Liability |
| 3010 | Tithes & Offerings | Revenue |
| 3020 | Building Fund | Revenue |
| 3030 | Mission Support | Revenue |
| 3040 | Event Registration Fees | Revenue |
| 4010 | Staff Salaries | Expense |
| 4020–4080 | Utilities, events, equipment, internet, rent, outreach, maintenance | Expense |

---

## Income chain (6 months)

| Type | GL credit | Mechanism | Count (last run) |
|------|-----------|-----------|------------------|
| Sunday offerings | 3010 | `GivingService.recordDonation` → debit 1020 | 24 weekly batches |
| Building Fund | 3020 | Monthly donation | 6 |
| Mission Support | 3030 | Monthly donation | 6 |
| VBS registration | 3040 | Donation + `eventId` | 3 |

**Chain:** Donation → GL receipt → ledger balance update → visible in Giving module / finance reports.

---

## Payroll chain (6 months)

| Step | Service | Result |
|------|---------|--------|
| 1 | `PayrollStructure` on 6 staff | Salary expense + payable accounts |
| 2 | `createPayrollRun` (per month) | Journal accrual: Dr 4010, Cr 2010 |
| 3 | `payPayrollRun` | Payment: Dr 2010, Cr 1020 |
| 4 | Audit | `FinancialAuditLog` + EventBus `VoucherApproved`, `TransactionPosted` |

**Periods:** Last 6 calendar months (skips if `PayrollRun` already exists for year/month).

---

## Expense chain (6 months)

Posted **Payment** vouchers (direct from bank, not accrual):

- Utilities (monthly)
- Internet (monthly)
- Rent (monthly)
- Outreach / maintenance / AV / youth refreshments (rotating)

Each: `createVoucherDraft` → `approveVoucher` → `postVoucherToLedger`.

---

## End-to-end scenario (treasurer UAT)

1. **Donation received** — Giving registry shows Sunday batches with donor names (e.g. Ravi Nair family).
2. **Receipt** — Generate receipt from Finance/Giving for any donation row.
3. **Fund allocated** — Building / Mission campaigns show dedicated credits.
4. **Voucher approved** — Finance → open expense voucher (utilities line).
5. **Expense paid** — Bank credited on posted payment vouchers.
6. **Ledger updated** — Chart of accounts balances reflect 6 months activity.
7. **Reports** — Trial balance / finance dashboards (login `finance` / `demo123`).
8. **Payroll** — HR/Finance → 6 payroll runs with lines for all staff.

---

## Simulation evidence

```
npm run simulate:church
✓ Chart of accounts
✓ Offering recorded with GL linkage
✓ Donation persists in ledger list
✓ Vendor / budget / assets APIs
```

Report file: `FULL_OPERATIONAL_SCENARIO_REPORT.md`

---

## Integrity controls observed

| Control | Implementation |
|---------|----------------|
| Double-entry | `assertValidDoubleEntry` on vouchers |
| Posted-only balances | `postVoucherToLedger` |
| Payroll uniqueness | `@@unique([tenantId, periodYear, periodMonth])` |
| Donation idempotency | `reference` field `gcc-v2-gift-YYYY-M-wN` |

---

## Success criteria

| Criterion | Status |
|-----------|--------|
| 6 months realistic history | Yes (seed) |
| Tithes, offerings, building, missions, event fees | Yes |
| Payroll, utilities, rent, outreach, etc. | Yes |
| Full chain donation → ledger | Yes |
| Treasurer believable demo | Yes — use Finance role walkthrough |

---

## Commands

```bash
npm run seed:demo-church
npm run seed:demo-roles
npm run simulate:church   # requires API on :4002
```
