# Accounting Validation Report — Ultimate Church OS

**Date:** 2026-06-01  
**Tenant:** `default-tenant-id` (from env / seed)

---

## Validation methods used

| Method | Result |
|--------|--------|
| **Seed-driven E2E** (`seed-demo-church-v2`) | 24 donations with GL accounts; 4 expense vouchers approved + posted |
| **Operational simulation** (`npm run simulate:church`) | **52 PASS**, **1 WARN**, **0 FAIL** (API on `127.0.0.1:4002`) |
| **TypeScript** (`npm run lint`) | Pass |

Full simulation output written to: `FULL_OPERATIONAL_SCENARIO_REPORT.md`

---

## End-to-end flows

### 1. Donation received → receipt → ledger

| Step | Mechanism | Status |
|------|-----------|--------|
| Donation recorded | `GivingService.recordDonation` in seed (24×) | **Pass** (seed run) |
| Debit/credit accounts | Cash/bank → Tithes & Offerings | **Pass** |
| Simulation offering | `simulate:church` creates tagged offering with GL linkage | **Pass** |
| Persists in ledger list | Simulation step “Donation persists in ledger list” | **Pass** |

### 2. Fund / campaign allocation

| Step | Status |
|------|--------|
| Campaigns: General, Building, Mission Support, Benevolence | **Seeded** |
| Donations linked to General Fund campaign | **Pass** |

### 3. Voucher approved → expense posted → ledger

| Step | Status |
|------|--------|
| `AccountingService.createVoucherDraft` | **Pass** (4 vouchers) |
| `approveVoucher` | **Pass** (workflow events emitted) |
| `postVoucherToLedger` | **Pass** |
| Audit trail | `FinancialAuditLog` + EventBus `VoucherApproved` / `TransactionPosted` | **Observed in seed logs** |

**Sample expense descriptions:** utilities, payroll, sound equipment, youth event refreshments.

### 4. Reports & budget surfaces

| Surface | Simulation | Status |
|---------|------------|--------|
| Chart of accounts | 35 accounts | **Pass** |
| Budget workspace API | — | **Pass** |
| Vendor workspace API | — | **Pass** |
| Assets registry | — | **Pass** |
| Compliance documents list | — | **Pass** |

### 5. Giving / gateway

| Surface | Status |
|---------|--------|
| Public giving campaigns API | **Pass** (simulate) |
| Cashfree config surface | **Pass** (simulate) |

---

## Simulated church-life script (finance excerpt)

```
✓ [6 Finance] Chart of accounts — 35 accounts
✓ [6 Finance] Offering recorded with GL linkage
✓ [6 Finance] Donation persists in ledger list
✓ [6 Finance] Vendor workspace API
✓ [6 Finance] Budget workspace API
✓ [6 Finance] Assets registry
✓ [6 Finance] Compliance documents list
✓ [6 Finance] Cashfree gateway config surface
```

**Warning (non-blocking):** Redis not configured — background queue runs synchronously (pilot VPS note).

---

## Manual UAT script (recommended)

1. Login as `finance` / `demo123`.  
2. **Giving** → confirm 24+ donations; generate receipt for one row.  
3. **Finance** → open voucher list → confirm 4 posted payment vouchers from seed descriptions.  
4. **Reports** → trial balance / fund summary — balances reflect gifts and expenses.  
5. Create new donation in UI → verify ledger line and receipt PDF/link.  
6. Create draft expense voucher → approve → post → confirm account balances and audit log entry.

---

## Integrity checks

| Check | Result |
|-------|--------|
| Double-entry on vouchers | Enforced by `assertValidDoubleEntry` at draft creation |
| Posted vouchers update balances | `postVoucherToLedger` + FY sequencing |
| Donations touch GL when accounts passed | Seed uses explicit debit/credit account IDs |
| Workflow hooks | EventBus publishes on approve/post |

---

## Remaining concerns

1. **Human UI path** for full donate→receipt→allocate→pay should be spot-checked once in Finance module during UAT (seed + API simulation do not click every button).  
2. **Budget impact** numbers depend on budget definitions existing for the FY — verify after seed if budget lines are empty.  
3. **Restricted fund overspend** rules apply when funds are configured — demo seed uses standard accounts/campaigns.  
4. Run simulation with API up: `npm run dev` (or server on port 4002) then `npm run simulate:church`.

---

## Related commands

```bash
npm run seed:demo-church    # gifts + posted expenses
npm run simulate:church     # 52 API checks (needs running API)
npm run lint                # typecheck
```
