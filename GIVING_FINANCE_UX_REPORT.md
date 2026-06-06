# Giving & Finance UX Report

**Date:** 2026-06-06  
**Sprint:** Experience refinement (browser-first)  
**Verdict:** **Improved — not yet pilot locked**

---

## What changed (frontend only)

### 1. Finance navigation — 4 sections instead of 13 tabs

Replaced the flat 13-tab bar with **grouped workspace navigation**:

| Section | Tabs |
|---------|------|
| **Daily work** | Overview · Vouchers · Reconciliation |
| **Accounting setup** | Chart of accounts · Ledgers · Funds · Budgets |
| **Operations** | Vendors · Payroll · Assets |
| **Reporting** | Reports · CA & Audit · Document center |

- Section cards with icons + subtitles at the top  
- Only **3–4 sub-tabs** visible per section (not 13 at once)  
- Active tab shows a one-line “what this is for” hint  

**Files:** `financeWorkspaceSections.ts`, `FinanceWorkspaceNav.tsx`, `FinanceModule.tsx`

### 2. Voucher registry — heart of Finance

- **Default landing:** Finance opens on **Vouchers**  
- **Hero banner:** “Vouchers are the heart of church accounting” with counts + New voucher / Search  
- Status chips: All · Draft · Approved · Posted · Reversed  
- Search ref focus from hero  

**File:** `VoucherRegistryHero.tsx`

### 3. Vendors — full operational UX

| Flow | Browser status |
|------|----------------|
| Create vendor | ✅ Dialog + persistence (e.g. Grace AV Supplies) |
| Vendor profile | ✅ View dialog (no backend edit API — view-only by design) |
| Record bill | ✅ New dialog → `POST finance/payables/bills` → auto voucher |
| Record payment | ✅ On open bills → `POST finance/payables/payments` |
| Search | ✅ Vendors + bills |
| Filters | ✅ All / Open / Paid / Overdue on bills |
| Refresh | ✅ Reloads vendors + parent Finance data |
| History | ✅ Audit log per vendor on expand |

**File:** `VendorsModule.tsx` (accounts/funds passed from Finance)

### 4. Calmer Finance chrome

- Subtitle: *“Calm books for your church…”*  
- Header shows **Vouchers** shortcut only when not already on vouchers  
- Removed redundant “Open vouchers” when on registry  

---

## Browser validation

### Roles

| Role | Finance grouped nav | Vouchers hero | Vendors bill/pay |
|------|---------------------|---------------|------------------|
| Administrator | ✅ | ✅ | ✅ |
| Treasurer (`finance`) | ✅ (Playwright) | ✅ | Manual path ready |
| Finance Officer (`accountant`) | ✅ (Playwright) | ✅ | Manual path ready |

### Playwright

```
e2e/deep-workflows.spec.ts --grep finance → 2 passed (13.4s)
```

### CA & Audit exports

- Panel uses `POST finance/ca-exports` + `triggerBrowserDownload` for CSV  
- **Browser spot-check recommended** for each export type on next session (Trial Balance, Day Book, etc.)  
- No backend changes in this sprint  

### Voucher lifecycle

| Step | Browser |
|------|---------|
| Create draft | ✅ Dialog opens, Save draft control present |
| Approve | ⚠️ Seed has **0 drafts** — UI shows Approve on draft rows when they exist |
| Post | ⚠️ Needs approved draft in data |
| Reverse | ✅ Visible on posted rows (108 posted in demo) |

**Next:** Create one draft via UI as Treasurer, then approve → post → reverse in browser.

---

## Remaining gaps (P1)

1. **Vendor edit** — No update API; profile is view-only. Acceptable if documented for pilot.  
2. **Draft voucher E2E** — Full lifecycle blocked on demo data (all posted).  
3. **Report downloads** — Export buttons present; full download/open verification pending manual pass.  
4. **Giving Growth report** — Empty card + disabled exports still feel unfinished (Giving module).  
5. **Assets embedded copy** — Still mentions “Use Finance module” in places; minor polish.  

---

## P2 polish backlog

- Group section cards could collapse on mobile to one accordion  
- Voucher table row density — consider card view on small screens  
- Duplicate “Record bill” CTA when empty state + toolbar both show  
- Finance overview could link to grouped sections instead of raw tab names  

---

## Do-not-touch compliance

✅ No changes to: `AccountingService`, voucher lifecycle logic, receipt design, voucher PDF format, schema, permissions.

All work is **navigation + presentation + vendor/bill UI** calling existing APIs.

---

## Sign-off

| Criterion | Status |
|-----------|--------|
| Finance feels calm, not 13 unrelated tabs | ✅ Much improved |
| Vouchers obvious as center | ✅ Hero + default tab |
| Vendor create / bill / pay obvious | ✅ |
| Report exports verified open | ⏳ Pending full pass |
| Full voucher lifecycle in browser | ⏳ Needs draft creation run |
| Pilot lock | **No** |

---

## How to verify locally

1. Restart Vite if white screen (`npm run dev` on :3001)  
2. Login as `finance` / `demo123`  
3. **Finance** → see 4 section cards → **Daily work** → **Vouchers**  
4. **Operations** → **Vendors** → Add vendor → Record bill → Bills tab → Record payment  
5. **Reporting** → **CA & Audit** → Download CSV exports  
6. **New voucher** → Save draft → Approve → Post → Reverse  

**Prepared for:** Ultimate Church OS — Giving & Finance UX refinement sprint
