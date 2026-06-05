# Frontend Operational QA Report

**Date:** 2026-05-19  
**Scope:** ERP modules — navigation, finance/giving workflows, public surfaces, stability

## Test execution summary

| Suite | Result |
|-------|--------|
| `npm run lint` | Pass |
| `npm run audit:api-paths` | **0 findings** |
| `npm run verify:runtime` | **Pass** (after API restart) |
| `npm run test:pw` | **58/58 pass** (~4.6 min) |
| Targeted finance E2E | **4/4 pass** (registry + receipts + phase1) |

Playwright exercises real UI clicks; runtime verify exercises authenticated API mirrors of module loads.

## Module operational status

| Module | Tabs / actions exercised | Status |
|--------|--------------------------|--------|
| Dashboard | Stats, finance desk links | OK |
| Members | Directory, import, profile | OK (smoke + deep) |
| Families | Household create | OK |
| Volunteers | Role assignment, reload | OK |
| Giving | History, donations, campaigns | OK |
| Finance | Vouchers, **Receipts**, Registry, Reconciliation, Settlements, Reports | OK (fixed) |
| Budgets | Fund vs actual | OK (nav sweep) |
| Vendors | Bills, payroll list | OK (nav sweep) |
| Assets | Registry | OK |
| Audit | Logs, CA export | OK (nav sweep) |
| Events | Create, accounting statement | OK |
| Settings | Sections, file upload | OK |
| Website | Builder, public pages | OK |
| Public donate | Cashfree/Razorpay paths | OK (public E2E) |

## Finance UX (operational)

### Before
- Receipts / Document Registry showed **“API route not found”** when API was stale or URLs lacked `/v1`.
- Technical error copy with no recovery hint.

### After
- **Receipts** tab: dedicated `DocumentCenterPanel` → `GET finance/receipts`.
- **Document Registry**: `GET finance/documents/registry` with receipt fallback on legacy 404.
- **Voucher Registry** tab label; PDF preview/download/print/batch on registry rows.
- **Settlements** / **Reconciliation** panels wired to giving/finance APIs.
- 404 messages append restart/hard-refresh guidance.

### Finance tab map (church-operable)

| Tab | Purpose |
|-----|---------|
| Dashboard | Month snapshot, approvals queue |
| Vouchers | Draft → approve → post lifecycle |
| Receipts | Donation receipt PDFs |
| Settlements | Gateway settlement import/post |
| Reconciliation | Bank statement sessions |
| Reports | Trial balance, CA exports |
| Approvals | Pending approval queue |
| Document Registry | Unified voucher + receipt PDF hub |
| Financial Years | Year close |
| Accounts | Chart of accounts |

## Giving UX

- Simplified tabs; settlement status references Finance.
- Donation receipt PDF via `apiDownloadBlob('giving/donations/:id/receipt/pdf')`.
- Gateway reconciliation panel shared with Finance settlements.

## Public surfaces

- `/website/*` pages load via `apiFetch` (same-origin `/api/v1`).
- `/donate` Cashfree flow uses `apiFetch` for order/verify/estimate-fee.
- Razorpay blocks on public giving section updated similarly.

## UX maturity fixes (this pass)

| Item | Action |
|------|--------|
| API error on 404 | Actionable message (restart API + hard refresh) |
| Scattered `fetch` + manual headers | Consolidated to `apiFetch` where possible |
| Upload flows | Settings + member/family images use `apiFetch` |
| Dev-only API logging | `[ApiConfig]` + `API CALL:` in dev |

## Known gaps (not blocking stabilization)

| Gap | Notes |
|-----|-------|
| Placeholder modules | Forms, Landing Pages, Media Library, Missions, Pages, Feature Flags, Integrations, Tenant Settings, SEO |
| Finance `fetchEverything` | Loads many endpoints on mount — acceptable for desk; could lazy-load per tab later |
| Duplicate member emails | 1 bucket flagged in runtime verify |
| Manual full click-through | Playwright covers primary paths; exhaustive modal/dropdown sweep not human-run in this session |

## Operator validation (manual, 5 min)

1. Login → **Finance** → **Receipts** — table loads (no red banner).
2. **Document Registry** — search + Preview on a row.
3. **Vouchers** — open a posted voucher → PDF if available.
4. **Giving** → record or view donation → receipt download.
5. Hard refresh once after deploy.

## Production readiness (frontend ops)

**Ready** for finance/giving desk use with restarted API and standard dev two-process layout (3001 UI + 4002 API).
