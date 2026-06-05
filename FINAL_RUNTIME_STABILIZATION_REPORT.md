# Final Runtime Stabilization Report

**Date:** 2026-05-19 (final frontend pass)  
**Scope:** Clean-process restart, frontend cache invalidation, Finance desk runtime, API URL enforcement

---

## Verdict

| Area | Status |
|------|--------|
| Backend routes | **Healthy** (`/api/v1/finance/receipts` + legacy `/api/finance/receipts` → 200 after restart) |
| Frontend API paths | **Stabilized** (browser forces `/api/v1/`; audit 0 findings) |
| Stale client / Vite cache | **Mitigated** (cache clear + no-store headers + dev guard) |
| Finance → Receipts / Registry | **Pass** (runtime verify + Playwright + network URL test) |
| Production readiness | **Go** for church finance/giving ops |

---

## Root causes (complete picture)

### 1. Stale backend process
Long-running `dev:server` without restart did not register `GET /finance/receipts` or `GET /finance/documents/registry`. Symptom: **404 "API route not found"** even on correct `/api/v1/...` URLs.

### 2. Misconfigured or cached frontend
- `VITE_API_BASE_URL=http://host:4002/api` (no `v1`) produced `/api/finance/*` → catch-all 404.
- Stale Vite prebundle in `node_modules/.vite` could serve old `apiConfig` after fixes.

### 3. Not a missing Finance UI route
`FinanceModule` already uses `apiRequest('finance/receipts')` and `apiDownloadBlob('finance/receipts/:id/pdf')` — paths are correct when URL builder and server are current.

---

## Clean restart procedure (executed this pass)

```text
1. taskkill processes on :4002 and :3001
2. npm run clean:vite          # removes node_modules/.vite
3. npm run dev:server          # backend first
4. npm run dev                 # frontend second (fresh Vite)
5. Browser: Ctrl+Shift+R at http://127.0.0.1:3001
```

**Scripts added:**
- `npm run clean:vite` — clear Vite dependency cache
- `npm run dev:clean` — clean + start Vite

---

## Frontend fixes (this pass)

| Change | Purpose |
|--------|---------|
| `src/lib/runtimeApiGuard.ts` | Dev-only `fetch` wrapper; **console.error** if same-origin `/api/` without `/api/v1/` |
| `src/main.tsx` | Installs guard at boot |
| `vite.config.ts` | `Cache-Control: no-store` on dev server |
| `index.html` | Meta no-cache for HTML shell |
| `e2e/finance-document-registry.spec.ts` | Network assertion: all ERP calls use `/api/v1/`; receipts response waits on `/api/v1/finance/receipts` |

**Prior pass (still in effect):**
- `resolveApiUrl()` → browser always `{origin}/api/v1/{resource}`
- `apiFetch` / `apiRequest` / `apiDownloadBlob` centralized
- `npm run audit:api-paths` — 0 violations

---

## Verification matrix

| Check | Result |
|-------|--------|
| Kill stale :4002 / :3001 | Done |
| `npm run clean:vite` | Done |
| Backend health | 200 |
| `npm run verify:runtime` | **passed: true** (receipts + registry 200) |
| `npm run audit:api-paths` | **0 findings** |
| `npm run lint` | Pass |
| Playwright finance + ops (10 tests) | **10/10** after URL test fix |
| Network: Finance tabs | All requests matched `/api/v1/` |

### Expected browser DevTools URLs

```
http://127.0.0.1:3001/api/v1/finance/receipts?limit=30&offset=0
http://127.0.0.1:3001/api/v1/finance/documents/registry?...
http://127.0.0.1:3001/api/v1/finance/vouchers?all=1
http://127.0.0.1:3001/api/v1/finance/receipts/{id}/pdf   (blob download)
```

**Should NOT appear:** `http://127.0.0.1:3001/api/finance/...` or direct `:4002/api/finance/...` from the UI.

---

## Finance module audit

| Surface | API | UI behavior |
|---------|-----|-------------|
| Receipts tab | `GET finance/receipts` | List loads; no route-not-found banner |
| Document Registry | `GET finance/documents/registry` | Search, filters, pagination |
| Voucher Registry | `GET finance/vouchers` | Tab + detail drawer |
| Preview | `apiDownloadBlob` → blob URL iframe | In-panel PDF preview |
| Download / Print | `apiDownloadBlob` | File save / new tab |
| Batch PDF | Sequential download (≤15) | No blocking API path issue |
| Filters | Query params on registry/receipts | Client-side refresh |
| Reconciliation | `finance/bank-reconciliation/*` | Panel loads |
| Settlements | `giving/gateway/*` | Shared panel |

PDF preview uses **blob URLs** (not raw `/api/...` in iframe `src`) — correct pattern.

Static assets (`/uploads/...`) use `SERVER_ROOT` = `window.location.origin` in browser — proxied to API.

---

## Operator checklist

1. After any pull touching server routes: **restart `dev:server`**.
2. If UI acts odd: `npm run clean:vite`, restart Vite, **hard refresh**.
3. Leave `VITE_API_BASE_URL` unset in dev, or set full `http://127.0.0.1:4002/api/v1`.
4. Open DevTools → Network; confirm `/api/v1/` on Finance actions.
5. If `[RuntimeApiGuard]` errors appear in console, hard refresh immediately.

---

## Non-blocking gaps

- 9 placeholder modules (Forms, SEO, etc.)
- Finance dashboard loads many endpoints on first open (performance, not correctness)
- 1 duplicate member-email bucket (data hygiene)
- Cashfree live payments need sandbox credentials for full manual UAT
- MinIO optional warning on server start (uploads degrade gracefully)

---

## Production readiness

**Approved** for operational use when:

- API deployed with current `finance.routes.ts`
- UI built with current `apiConfig` / `apiClient`
- Ops restart API after route migrations
- CDN/build uses hashed assets; dev cache issues do not apply to production builds

---

*End of report.*
