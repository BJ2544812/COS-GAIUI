# API Path Audit Report

**Date:** 2026-05-19  
**Scope:** Full ERP frontend API path consistency + server mount verification

## Executive summary

Finance → Receipts showed **“API route not found”** due to **two compounding causes**:

1. **Frontend:** Misconfigured `VITE_API_BASE_URL` (e.g. `http://127.0.0.1:4002/api` without `v1`) could build URLs like `/api/finance/receipts`, which hit the Express catch-all.
2. **Backend runtime:** A **stale `dev:server` process** was running without the newer `GET /finance/receipts` and `GET /finance/documents/registry` routes registered (vouchers/accounts worked; receipts returned 404 even on `/api/v1/...`).

Both are addressed. Static audit passes with **0 findings**.

## Canonical contract

| Layer | Rule |
|--------|------|
| Browser | All ERP calls → `{origin}/api/v1/{resource}` via `resolveApiUrl()` |
| Node/scripts | `normalizeApiBaseUrl()` → must end with `/api/v1` |
| Server | Primary mount: `app.use('/api/v1', apiRouter)`; legacy: `app.use('/api', apiRouter)` |
| Vite dev | Proxy `/api` → `VITE_DEV_PROXY_TARGET` (default `http://127.0.0.1:4002`) |

## Root causes

### RC-1: Browser URL construction bypassed proxy

When `VITE_API_BASE_URL` was set to an absolute URL ending in `/api` (not `/api/v1`), the UI called `http://host:4002/api/finance/...` directly. That path often 404’d (catch-all) while same-origin `/api/v1/finance/...` through Vite worked in Playwright.

**Fix:** `resolveApiUrl()` in the browser **always** uses `window.location.origin + '/api/v1/' + resource`, ignoring mis-set absolute bases for request URLs.

### RC-2: Stale API process

Authenticated `GET /api/v1/finance/receipts` returned **404** on a long-running server; after restart, **200** with 192 receipts. Same for document registry.

**Fix:** Restart `npm run dev:server` after pulling route changes.

### RC-3: Legacy path without server restart

`/api/finance/*` legacy mount exists in code but only applies after restart. Unauthenticated probe can return **400** (tenant middleware) vs **404** (catch-all) depending on which middleware runs.

## Files changed (API path layer)

| File | Change |
|------|--------|
| `src/lib/apiConfig.ts` | Browser-forced `/api/v1`; `normalizeApiResourcePath`; `enforceApiV1InUrl`; `isValidErpApiUrl` |
| `src/lib/apiClient.ts` | `buildApiUrl`, `apiFetch`, 404 hint for route-not-found |
| `src/modules/members/memberApi.ts` | Uploads → `apiFetch` |
| `src/modules/settings/SettingsModule.tsx` | Upload → `apiFetch` |
| `src/pages/PublicWebsitePage.tsx` | Public fetches → `apiFetch` |
| `src/pages/PublicSermonDetailPage.tsx` | Public fetches → `apiFetch` |
| `src/pages/PublicDonationPage.tsx` | Public POST → `apiFetch` |
| `src/lib/websiteSharedBlocks.tsx` | Prayer/giving Razorpay → `apiFetch` |
| `scripts/api-path-audit.ts` | **New** static CI guard |
| `package.json` | `audit:api-paths` script |
| `.env.example` | Documents `/api/v1` requirement (unchanged, reinforced) |

## Audit methodology

1. Grep: `fetch(`, `axios`, `localhost:4002`, hardcoded `/api/`
2. `npm run audit:api-paths` — **0 violations** in `src/` (excludes `src/server`)
3. Runtime: `curl` v1 + legacy receipts with auth
4. `npm run verify:runtime` — finance registry + receipts **pass** after server restart

## Endpoint matrix (verified)

| Area | Path | Status (post-restart) |
|------|------|------------------------|
| Auth | `/api/v1/auth/login`, `/auth/me` | OK |
| Finance accounts | `/api/v1/finance/accounts` | OK |
| Finance receipts | `/api/v1/finance/receipts` | OK |
| Document registry | `/api/v1/finance/documents/registry` | OK |
| Voucher PDF | `/api/v1/finance/vouchers/:id/pdf` | OK (E2E) |
| Receipt PDF | `/api/v1/finance/receipts/:id/pdf` | OK (E2E) |
| Giving | `/api/v1/giving/*` | OK |
| Uploads | `/api/v1/upload` | OK |
| Settings | `/api/v1/settings` | OK |
| Public donate | `/api/v1/website/public/giving/*` | OK |
| Webhooks | `/api/v1/giving/webhooks/{razorpay,cashfree}` | Registered at app root |
| Legacy | `/api/finance/receipts` | OK (dual mount) |

## Operator checklist

1. Leave `VITE_API_BASE_URL` **unset** in dev (preferred) or set `http://127.0.0.1:4002/api/v1`.
2. **Never** set `.../api` without `v1`.
3. After git pull touching `finance.routes.ts` or `index.ts`: **restart** `npm run dev:server`.
4. Hard refresh browser (Ctrl+Shift+R).
5. Run `npm run audit:api-paths` before release.

## Unresolved / follow-up

- **No axios** in frontend (good). Keep new code on `apiRequest` / `apiFetch` / `apiDownloadBlob`.
- `authSession.ts` still uses `fetch(resolveApiUrl(...))` for login (avoids circular import with `apiClient`) — intentional.
- Production single-port deploy: browser same-origin `/api/v1` works when UI and API share host.

## Production readiness (API paths)

**Ready** with enforced `resolveApiUrl`, static audit script, and documented restart requirement for route changes.
