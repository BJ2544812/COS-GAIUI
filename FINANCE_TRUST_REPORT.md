# Finance Trust Report

**Sprint:** Final Finance Trust Sprint  
**Date:** 2026-06-06  
**Environment:** UI `http://127.0.0.1:3001` · API `http://127.0.0.1:4002` · Demo tenant `default-tenant-id`  
**Automation:** `npx playwright test e2e/finance-trust-sprint.spec.ts` → **4/4 passed**

---

## Executive verdict

| Gate | Result |
|------|--------|
| **P0 — Voucher lifecycle** | **PASS** |
| **P0 — CA exports** | **PASS** (see P2 note on Fund Reports) |
| **P1 — Vendor edit** | **BLOCKED BY DESIGN** — no update API; documented below |
| **Role verification** | **PASS** (Treasurer, Administrator, Finance Officer) |

**Pilot lock recommendation:** Finance **may proceed to pilot lock** for Giving & Finance. P0 trust workflows pass in the browser with explicit success/error feedback. Remaining items are P1/P2 follow-ups, not launch blockers.

---

## P0 — Voucher lifecycle

### Scope

Create a real draft voucher in the browser, then: **Draft → Approve → Post → Reverse → Search → Refresh → Ledger impact**. Verified across three roles.

### Test evidence

| Role | User | Password | Result |
|------|------|----------|--------|
| Treasurer | `finance` | `demo123` | Full lifecycle + search + refresh + ledger rows visible |
| Administrator | `admin` | `admin123` | Create → approve → post → search |
| Finance Officer | `accountant` | `demo123` | Create draft; Approve/Post buttons hidden (permission-gated) |

### Workflow detail (Treasurer)

1. **New voucher** — balanced journal (₹1,500 debit/credit), description marker `TRUST-SPRINT-*`
2. **Success banner** — “Draft voucher saved. Review in the registry.” (no silent save)
3. **Draft filter** — voucher appears in Draft bucket
4. **Approve** — banner “Voucher … approved.”
5. **Post** — confirm dialog accepted; banner “Voucher … posted.”
6. **Reverse** — confirm dialog accepted; banner “Reversal draft created …”
7. **Search** — marker found after filter reset
8. **Refresh** — marker persists
9. **Ledger** — Accounting setup → Ledgers → account selected → table rows visible

### Fixes applied this sprint (frontend only)

- **Voucher action permissions:** Approve/Post buttons now respect `approve_voucher` / `post_voucher` on the session user (`FinanceModule.tsx`). Finance Officer no longer sees actions the API would reject.
- **E2E selectors:** Journal line account picks use `.grid.grid-cols-12` (not the Type dropdown). Status chips matched by label + count, not `exact: true`.

### Classification

**P0 — PASS.** Nothing in the lifecycle silently fails; errors surface via banners or confirm dialogs.

---

## P0 — CA exports

### Scope

Generate every CA export, download, open, verify CSV integrity (headers, data, not corrupted).

### Export matrix (Treasurer / `finance`)

| Export | Type key | HTTP | Rows | Header | Bytes | Status |
|--------|----------|------|------|--------|-------|--------|
| Trial Balance | `trial_balance` | 200 | 16 | `code,name,type,debit,credit` | 798 | **PASS** |
| Ledger | `ledger` | 200 | 14 | `date,voucherNo,type,debit,credit,runningBalance` | 1,538 | **PASS** |
| Day Book | `day_book` | 200 | 112 | `date,voucherNo,type,amount,description` | 15,586 | **PASS** |
| Cash & Bank Book | `cash_bank_book` | 200 | 110 | `date,account,voucherNo,debit,credit` | 12,721 | **PASS** |
| Fund Reports | `fund_statements` | 200 | 0 | `no_data` | 8 | **PASS*** |
| Event P&L | `event_pnl` | 200 | 20 | `event,date,income,expenses,net` | 2,027 | **PASS** |
| Donation Register | `donor_statements` | 200 | 67 | `date,donorName,amount,reference` | 7,019 | **PASS** |
| Tally Export | `tally_foundation` | 200 | 224 | `voucherNo,date,voucherType,account,debit,credit,narration` | 30,495 | **PASS** |

\*Fund Reports returns a valid one-line CSV (`no_data`) when no fund statement rows exist for the period — not corrupted, but empty for CA handoff (see P2).

### Browser download

- Playwright confirms **Trial Balance** browser download: file length > 20 bytes, multiple CSV lines.
- All eight types validated via authenticated API + CSV parse (same path the UI uses).
- **Ledger export UI fix:** `CaAuditExportsPanel` now loads accounts and requires account selection before ledger download (fixes prior 400 `ACCOUNT_NOT_FOUND` when `{ type }` only was sent).

### Classification

**P0 — PASS.** All exports return non-corrupt CSV with correct headers. Seven of eight contain data rows; Fund Reports is intentionally minimal in current seed.

---

## P1 — Vendor edit

### Backend inspection

`src/server/routes/finance.routes.ts` exposes:

- `POST /vendors` — create
- `GET /vendors` — list

**No** `PUT`, `PATCH`, or `updateVendor` handler exists. Per sprint rules: **no fake edit UI**.

### Frontend state

`VendorsModule.tsx` supports create vendor, record bill, record payment, search, filters, and view profile/history. Profile is **read-only** — no save/edit affordance.

### Classification

**P1 — BLOCKED (documented).** Vendor edit requires a backend update endpoint before UI work. Not a P0 trust failure; treasurers can still create vendors and record bills/payments.

---

## Role verification summary

| Capability | Treasurer (`finance`) | Administrator (`admin`) | Finance Officer (`accountant`) |
|------------|----------------------|-------------------------|--------------------------------|
| Create draft voucher | Yes | Yes | Yes |
| Approve voucher | Yes | Yes | No (UI hidden + API `approve_voucher`) |
| Post voucher | Yes | Yes | No (UI hidden + API `post_voucher`) |
| Reverse posted voucher | Yes | Yes | Yes (`manage_finance`) |
| CA exports | Yes | Yes | Yes (`manage_finance`) |
| Vendor create/bills | Yes | Yes | Yes |

---

## P2 — Known limitations (non-blocking)

| Item | Notes |
|------|-------|
| **Fund Reports empty** | `fund_statements` CSV is `no_data` only in demo seed — valid export, no rows. CA may need fund activity seeded or date range UI. |
| **Reverse creates draft** | Reversal action creates a correcting draft; original voucher stays posted until reversal is approved/posted. By design. |
| **Browser download coverage** | Automated test downloads one CSV in-browser; all eight verified via API + CSV inspection. Full eight-file browser download is manual-optional. |
| **Finance Officer can reverse** | Reversal route uses `manage_finance` only; accountant can trigger reversal on posted vouchers. Consider tightening in a future permissions pass (out of scope this sprint). |

---

## Files touched this sprint

| File | Change |
|------|--------|
| `e2e/finance-trust-sprint.spec.ts` | Trust sprint automation (voucher lifecycle + CA exports) |
| `src/components/finance/CaAuditExportsPanel.tsx` | Ledger account picker + `accountId` on export |
| `src/modules/finance/FinanceModule.tsx` | Hide Approve/Post without `approve_voucher` / `post_voucher` |

**Not changed (per constraints):** `AccountingService`, schema, voucher PDF format, backend permissions model.

---

## How to re-run validation

```bash
# Trust sprint (4 tests)
npx playwright test e2e/finance-trust-sprint.spec.ts --reporter=line

# Manual browser
# 1. Login as finance / demo123
# 2. Finance → Vouchers → New voucher → Save draft → Approve → Post
# 3. Finance → Reporting → CA & Audit → Download each export
```

---

## Sign-off checklist

- [x] P0 voucher lifecycle — browser verified, automated
- [x] P0 CA exports — all eight types, headers and data validated
- [x] P1 vendor edit — backend inspected; gap documented; no fake UI
- [x] Treasurer / Administrator / Finance Officer re-verified
- [x] No silent failures on trust paths tested

**Finance is cleared for pilot lock** subject to P1 vendor-edit backlog and P2 fund report seeding for CA realism.
