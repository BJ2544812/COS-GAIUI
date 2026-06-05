# Frontend Manual QA Report

**Date:** 2026-05-19  
**Persona:** Church finance desk + admin operator  
**Environment:** Clean restart — backend `:4002`, Vite `:3001`, `node_modules/.vite` cleared

---

## Method

Automated **operator simulation** (Playwright clicking every Finance tab, recording network URLs) plus **runtime verify** and **code audit**. Human checklist below for your 10-minute sign-off in the browser.

This is intentionally broader than Playwright alone: network URL assertions and API health were validated independently.

---

## Clean runtime steps performed

| Step | Done |
|------|------|
| Stop backend (:4002) | Yes |
| Stop frontend (:3001) | Yes |
| `npm run clean:vite` | Yes |
| Start `npm run dev:server` | Yes |
| Start `npm run dev` | Yes |
| Vite `Cache-Control: no-store` | Enabled |
| Dev `RuntimeApiGuard` | Active |

---

## Finance desk — tab-by-tab

| Tab / action | Expected | Automated result |
|--------------|----------|------------------|
| Open Finance | Heading "Finance", no error banner | Pass |
| **Receipts** | "Donation receipts" copy; table or empty state | Pass; **no** "API route not found" |
| **Document Registry** | Search bar + PDF actions | Pass |
| **Vouchers** | Voucher list / registry | Pass |
| **Reconciliation** | Bank reconciliation panel | Pass |
| **Settlements** | Gateway settlement panel | Pass |
| Tab switching | No white screen; prior errors clear | Pass |
| Preview (first row) | iframe blob preview or skip if empty | Pass (no route error) |
| Search + Enter | Reload registry | Code path OK |
| Date filters | Query params sent | Code path OK |

### Network URL rule (verified)

All Finance ERP requests observed:

```
✓ http://127.0.0.1:3001/api/v1/finance/receipts
✓ http://127.0.0.1:3001/api/v1/finance/documents/registry
✓ http://127.0.0.1:3001/api/v1/finance/vouchers
✗ (none) http://127.0.0.1:3001/api/finance/...
```

---

## Giving desk

| Action | Result |
|--------|--------|
| Open Giving | Pass (operational QA sweep) |
| Recent donations table | Pass (smoke) |
| Donation persist + reload | Pass (deep workflow) |
| Receipt PDF download path | `apiDownloadBlob('giving/donations/:id/receipt/pdf')` → `/api/v1/...` |

---

## Public / donate

| Surface | Result |
|---------|--------|
| Public homepage | Pass |
| Public giving page | Pass |
| `/donate` page loads | Pass (operational QA) |
| Public API calls | `apiFetch('website/public/...')` → `/api/v1/...` |

Cashfree **live charge** not executed (requires merchant keys); order/verify routes are wired to `/api/v1/website/public/giving/*`.

---

## Cross-module navigation

| Module | Smoke / sweep |
|--------|----------------|
| Dashboard | Pass |
| Members / Families | Pass |
| Volunteers / Structure | Pass |
| Events | Pass |
| Settings | Pass |
| Website builder | Pass |
| Sidebar sweep (no dead nav) | Pass |

---

## Issues found and resolution

| Issue | Type | Resolution |
|-------|------|------------|
| Receipts 404 after code pull | Stale backend | Restart `dev:server` |
| Wrong `/api/finance` from UI | Stale bundle / bad env | `resolveApiUrl` browser lock + `clean:vite` |
| Playwright URL test flaky | Test timing | Wait for `/api/v1/finance/receipts` response |
| MinIO stderr on boot | Ops noise | Optional; uploads still degrade gracefully |

**No open P0 frontend runtime failures** after clean restart.

---

## Your 10-minute manual sign-off

1. Login → **Finance** → **Receipts** — confirm rows load.
2. **Document Registry** → **Preview** on one PDF.
3. **Download** same PDF.
4. **Vouchers** → open one voucher detail.
5. **Reconciliation** — confirm panel text (not placeholder).
6. **Giving** → open recent donation → receipt if button visible.
7. DevTools → Network → filter `finance` → every URL must contain **`/api/v1/`**.
8. **Ctrl+Shift+R** once — repeat Receipts (confirms no stale bundle).

If step 7 shows `/api/finance/` without `v1`, check console for `[RuntimeApiGuard]` and hard refresh.

---

## Stale cache guidance

| Symptom | Fix |
|---------|-----|
| Old error after deploy | `npm run clean:vite`, restart Vite, hard refresh |
| Guard console errors | Same + confirm `.env` has no bare `.../api` |
| 404 on receipts with correct URL | Restart backend (routes not loaded) |

---

## Remaining non-blocking gaps

- Placeholder modules (9) — not finance-critical
- Batch PDF limited to 15 sequential downloads (by design)
- Finance initial load fetches many endpoints (acceptable; lazy-load future improvement)
- Duplicate email bucket in seed data

---

## Production readiness (frontend)

**Stable** for church finance and giving workflows with clean two-process dev and documented restart/cache procedure.

---

*End of manual QA report.*
