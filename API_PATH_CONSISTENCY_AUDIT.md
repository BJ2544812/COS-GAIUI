# Frontend API Path Consistency Audit

**Date:** 2026-05-19  
**Trigger:** Finance → Receipts showed `API route not found` despite partial prior fix.

---

## 1. Root cause

| Layer | Issue |
|-------|--------|
| **Primary** | Requests built with base URL missing `/v1` (e.g. `http://host:4002/api`) → Express catch-all returns `{ error: "API route not found" }` |
| **Secondary** | Production builds defaulted to `http://localhost:4002/api/v1` instead of same-origin `/api/v1` when served behind Express |
| **Receipts tab** | Used only `GET finance/documents/registry?docType=receipt`; on older/stale servers without that route, Receipts failed while other finance tabs could work |
| **Stale server** | Long-running `dev:server` without restart did not load new routes (`documents/registry`, dual `/api` mount) |

**Not the issue:** Missing business logic — `GET /api/v1/finance/receipts` and `GET /api/v1/finance/documents/registry` are registered in `finance.routes.ts`.

---

## 2. Stale endpoints / patterns found

| Location | Before | After |
|----------|--------|-------|
| `apiConfig.ts` | Weak `/api` → `/api/v1` only | Full `normalizeApiBaseUrl()` + browser `defaultApiBaseUrl()` → `/api/v1` |
| `apiClient.ts` | Inline URL concat | `resolveApiUrl(path)` for all requests |
| `authSession.ts` | Manual base + `/auth/login` | `resolveApiUrl('auth/login')` |
| `memberApi.ts` | 3× manual `API_BASE_URL` + fetch | `resolveApiUrl(...)` |
| `SettingsModule.tsx` | Raw env upload URL | `resolveApiUrl('upload')` |
| `PublicDonationPage.tsx` | Manual concat | `resolveApiUrl(path)` |
| `PublicWebsitePage.tsx` | Manual concat | `resolveApiUrl(...)` |
| `PublicSermonDetailPage.tsx` | Manual concat | `resolveApiUrl(...)` |
| `websiteSharedBlocks.tsx` | Hardcoded `/api/v1/...` | `resolveApiUrl(...)` |
| `AuthModule.tsx` | `/api/auth/login` | `loginWithCredentials()` |
| `FinanceModule` Receipts | `documents/registry?docType=receipt` only | **`finance/receipts`** (stable list API) |

---

## 3. Modules affected

- **Finance:** Receipts, Document Registry, voucher PDFs (via `resolveApiUrl`)
- **Giving:** already used `apiClient` (unchanged)
- **Settings:** upload
- **Members:** profile image, documents upload
- **Public site:** website + donation pages
- **Auth:** login path

---

## 4. Central API layer (required usage)

```typescript
// src/lib/apiConfig.ts
export function normalizeApiBaseUrl(url: string): string
export function defaultApiBaseUrl(): string  // '/api/v1' in browser
export function resolveApiUrl(path: string): string

// src/lib/apiClient.ts
export async function apiRequest(path, init)  // uses resolveApiUrl
export async function apiDownloadBlob(path)   // uses resolveApiUrl
```

**Rule:** No `fetch(\`${API_BASE_URL}/...\`)` — use `resolveApiUrl` or `apiRequest`.

---

## 5. Finance Receipts fix (functional)

**Finance → Receipts** now calls:

`GET finance/receipts?limit=&offset=&search=&from=&to=`

Maps rows to registry table shape; PDF actions use `finance/receipts/:id/pdf`.

**Finance → Document Registry** still uses:

`GET finance/documents/registry?docType=...`

With fallback to `finance/receipts` if registry returns 404 on “all” view only.

---

## 6. Server hardening

`src/server/index.ts`:

```typescript
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);  // legacy /api/finance/... without v1
```

**Restart required:** `npm run dev:server` after pull.

---

## 7. Network verification

| URL | Expected |
|-----|----------|
| `GET /api/v1/finance/receipts` | 401 without token, 200 with auth |
| `GET /api/v1/finance/documents/registry` | 401 without token, 200 with auth |
| `GET /api/finance/receipts` (legacy) | Same after dual mount + server restart |

---

## 8. Manual walkthrough checklist

After **restart API + hard refresh browser**:

- [ ] Finance → **Receipts** — list loads, no red banner
- [ ] Finance → **Document Registry** — list loads
- [ ] Finance → **Vouchers** — registry + View
- [ ] Preview / Download / Print on a receipt row
- [ ] Batch PDF (first 15)
- [ ] Filters + Apply + Reset
- [ ] Giving → All gifts → receipt download icon

---

## 9. Playwright

| Suite | Result |
|-------|--------|
| `e2e/finance-document-registry.spec.ts` | 3/3 (Registry, **Receipts**, preview) |
| Full `npm run test:pw` | Run after server restart |

---

## 10. Operator actions

1. Stop old API process on port 4002.
2. `npm run dev:server`
3. `npm run dev` (or use existing Vite on 3001)
4. Hard refresh browser (Ctrl+Shift+R).
5. Confirm `.env` does **not** set `VITE_API_BASE_URL` to `.../api` without `v1`.

---

*End of audit.*
