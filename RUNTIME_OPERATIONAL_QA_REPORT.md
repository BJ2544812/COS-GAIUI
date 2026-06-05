# Kingdom OS — Runtime Operational QA Report

**Date:** 2026-05-19 (updated — full API path consistency pass)  
**Mode:** Strict frontend + integration bug elimination  
**Scope:** No architecture expansion — stability and wiring only

**See also:** [API_PATH_CONSISTENCY_AUDIT.md](API_PATH_CONSISTENCY_AUDIT.md)

---

## 1. Runtime bugs found

| ID | Symptom | Root cause | Severity |
|----|---------|------------|----------|
| R1 | Finance → Document Registry: **“API route not found”** | Base URL missing `/v1` → `/api/finance/...` hits Express 404 catch-all | **Critical** |
| R2 | Finance → **Receipts** same error | Same base URL bug; tab only called `documents/registry?docType=receipt` | **Critical** |
| R3 | Settings upload, public pages, member uploads | Manual `API_BASE_URL` / hardcoded `/api/v1` bypass | High |
| R4 | `AuthModule` used `/api/auth/login` | No `v1` segment | Medium |
| R5 | Stale `dev:server` process | Old code without latest routes / dual `/api` mount | Medium |

**Verified:** `GET /api/v1/finance/receipts` and `GET /api/v1/finance/documents/registry` return **401** without auth (routes exist). `GET /api/finance/receipts` returns **404** until server restart with dual mount — **client normalization is the real fix**.

---

## 2. API mismatches fixed

### Client (`src/lib/apiConfig.ts`)

- Added `normalizeApiBaseUrl()` — if env ends with `/api`, append `/v1`.
- Prevents `VITE_API_BASE_URL=http://localhost:4002/api` from breaking all `apiRequest` calls.

### Server (`src/server/index.ts`)

- Mount `apiRouter` at **`/api`** as well as **`/api/v1`** so legacy `/api/finance/...` URLs work after server restart.

### Settings upload (`SettingsModule.tsx`)

- Uses `API_BASE_URL` from `apiConfig` (normalized) instead of raw env.

### Auth (`AuthModule.tsx`)

- Login uses `loginWithCredentials()` → correct `/api/v1/auth/login`.

### Documentation (`.env.example`)

- Explicit warning: do not set base URL to `.../api` without `v1`.

---

## 3. Broken workflows fixed

| Workflow | Fix |
|----------|-----|
| Document Registry load | Correct API base + legacy server mount |
| Document preview / download / batch PDF | Same base URL as registry (`finance/vouchers/:id/pdf`, `finance/receipts/:id/pdf`) |
| Settings image upload | Normalized base URL |

---

## 4. Download / PDF issues

- Registry PDF paths were already correct relative to `API_BASE_URL`.
- Failure mode was **404 HTML/JSON** from wrong host path, not PDF generation.
- After fix: preview uses `apiDownloadBlob` against `/api/v1/finance/.../pdf`.

**Action for operators:** Restart API server after pulling (`npm run dev:server`) so `/api` legacy mount is active.

---

## 5. Registry issues fixed

- **Document Registry** tab calls `GET finance/documents/registry` with filters (`docType`, `search`, `status`, dates, pagination).
- E2E added: `e2e/finance-document-registry.spec.ts` — asserts no “API route not found” on tab load.
- Runtime verify: added `Finance document registry` step to `runtime-boot-verify.ts`.

---

## 6. Manual walkthrough findings (representative)

| Module | Load | API errors | Notes |
|--------|------|------------|-------|
| Finance → Document Registry | OK after fix | Was 404 on misconfigured base | Primary reported bug |
| Finance → Vouchers | OK | None in smoke | Registry + filters |
| Finance → Reconciliation | OK | None | Session workflow |
| Finance → Settlements | OK | None | Import/post |
| Giving → All gifts | OK | None | Receipt download per row |
| Dashboard | OK | None | Copy softened |
| Settings → Payment gateway | OK | Upload path fixed | |
| Login | OK | Uses `/api/v1` via authSession | |

**Recommended manual pass (post-restart):** click Preview + Download on first registry row; run Apply/Reset filters; paginate if >30 docs.

---

## 7. Remaining weak points

1. **Server restart required** for `/api` legacy mount — client normalization alone fixes most dev/prod env typos.
2. **No Playwright test** for every module button (expanded finance registry only).
3. **Mobile 375px** — still manual.
4. **AuthModule** rarely used vs `LoginPage` — fixed defensively.
5. **Close bank recon session** — UI button not added.

---

## 8. Performance observations

- Document registry: paginated `limit=30`; no extra backend added.
- Misconfigured 404s fail fast (no retry storm).

---

## 9. Final Playwright results

| Suite | Result |
|-------|--------|
| `e2e/finance-document-registry.spec.ts` | **2/2 pass** (after test fix) |
| Full `npm run test:pw` | Run after API restart — expect **57/57** with new spec |
| `npm run lint` | **Pass** |

---

## 10. Production runtime stability assessment

| Criterion | Status |
|-----------|--------|
| Primary finance registry workflow | **Fixed** (wiring) |
| Defensive API base handling | **In place** |
| Legacy URL compatibility | **Server mount** (needs deploy/restart) |
| Automated regression for registry | **New E2E** |
| Trust based on Playwright alone | **Insufficient** — this pass adds integration + root-cause fix |

**Verdict:** The Document Registry failure was an **integration/path bug**, not missing business logic. With normalized `API_BASE_URL`, legacy `/api` mount, and server restart, the ERP should load registries and PDF actions without “API route not found.” Continue module-by-module manual QA for buttons not yet covered by E2E.

---

*Files touched: `apiConfig.ts`, `server/index.ts`, `SettingsModule.tsx`, `AuthModule.tsx`, `runtime-boot-verify.ts`, `e2e/finance-document-registry.spec.ts`, `.env.example`*
