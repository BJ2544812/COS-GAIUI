# Data Integrity Report — Ultimate Church OS

**Date:** 2026-06-01  
**Scope:** Frontend dummy data audit, backend wiring, UAT readiness  
**Constraint:** No public website visual/UX redesign.

---

## Executive summary

| Metric | Result |
|--------|--------|
| P0 screens converted to API/backend | 4 of 4 |
| Major admin modules API-driven | Yes (dashboard, giving, members, analytics, operations) |
| Public website content source | `PageData` + org settings when seeded; client fallbacks preserve appearance when empty |
| Seed realism | `npm run seed:demo-church` — 28 members, 9 families, 11 events, 24 gifts, 4 posted expense vouchers |
| TypeScript (`npm run lint`) | Pass |

---

## Conversions completed (this program)

| Screen / area | Previous source | Replacement source | Status |
|---------------|-----------------|-------------------|--------|
| **Documents → Secure Vault** | Static `DOCS` array; hardcoded signatory/member defaults | `GET /api/v1/documents`; form defaults from `settings.organization` + selected member | **Done** |
| **Documents → Compliance templates** | Fake “Benson Jacob” defaults | `buildFormDefaults()` from settings + `listMembers()` | **Done** |
| **Pastoral care → Prayer intake** | `setTimeout` mock submit | `POST /api/v1/care/prayer` (`PrayerCareService`) | **Done** |
| **Profile → Security** | Fabricated access-log rows | Removed; copy points to Change history | **Done** |
| **Public site → Impact stats** | Hardcoded 4 stat cards | `config.stats` from CMS when ≥4 items; same default numbers if absent | **Done** |
| **Public site → Hero CTAs** | Fixed button labels | `config.buttonText` / `secondaryButtonText` with same defaults | **Done** |
| **Public site → Footer** | Partially static tagline/times | `orgSettings` from public settings API | **Done** |
| **Public site → Loading** | “Grace Community” hardcoded | Organization name from settings | **Done** |

---

## Screen inventory (backend-driven vs residual frontend)

| Screen | Current source | Notes | Status |
|--------|----------------|-------|--------|
| Dashboard (all lenses) | `/tasks`, `/events`, `/analytics`, `/finance/summary` | Empty states when API returns none | **API** |
| Members / families | Member APIs + Prisma | — | **API** |
| Giving | Donations, campaigns, receipts APIs | — | **API** |
| Finance / accounting | Vouchers, ledger, budgets APIs | Seed adds posted expenses | **API** |
| Events | Event APIs + seed | Realistic names in `seed-demo-church-v2` | **API** |
| Attendance | Session APIs | Sunday session renamed in seed | **API** |
| Analytics / reports | Analytics + report endpoints | — | **API** |
| Operations command center | Ops APIs | — | **API** |
| Member portal | Portal APIs | `member` / `demo123` after seed | **API** |
| Discipleship / care | Care + prayer APIs | Prayer intake wired | **API** |
| Documents vault | `GET documents` | Upload/generate uses API | **API** |
| Website admin (page editor) | `WebsiteService` / `PATCH website/pages/:slug` | Section JSON in DB | **API** |
| **Public website (empty DB)** | `getFallbackSections()` in `PublicWebsitePage.tsx` | Preserves flagship look; not CMS-editable until template applied | **Fallback** (by design) |
| **Public shared blocks** | Unsplash `IMAGE_FALLBACKS` when `imageUrl` empty | Visual unchanged; URLs editable in CMS | **Fallback images** |
| **Website → Media Library tab** | Placeholder grid `[1..6]` | No upload wiring | **Gap** |
| **Website → SEO tab** | Local inputs only | Not persisted to `PageData` / settings | **Gap** |
| **Website → Forms tab** | “New Submissions” badge uses `i*3+1` | Decorative only | **Gap** |
| **Website → Landing pages** | Empty state UI | Campaign pages not implemented | **Gap** |
| Module registry placeholders | `missions`, `mobile`, `seo`, etc. | Intentional “coming soon” routes | **N/A** |

---

## Public website data flow (verified pattern)

```
Administrator → Website module → PATCH /api/v1/website/pages/:slug
              → PageData (PostgreSQL)
              → publish flag → isPublished: true
Public visitor  → GET /api/v1/website/public/pages/:slug
              → normalizeWebsiteSections()
              → Same React blocks (no layout change)
```

**Seed path:** `WebsiteService.applyTemplate('flagship-v2')` + `pageData.updateMany({ isPublished: true })`.

---

## Recommended UAT checks (data integrity)

1. Log in as `admin`, open **Website**, edit home hero title, save, publish — confirm public URL shows new title.
2. Open **Documents** vault — list should match DB only (no phantom rows).
3. Submit prayer from **Pastoral care** intake — row appears in prayer list API.
4. Run `npm run seed:demo-church` then `npm run seed:demo-roles` for realistic tenants.

---

## Remaining concerns

1. **Media Library** and **global SEO** tabs in Website module are UI-only; images are edited per-section via URL field (paste or external host). Bucket upload exists at `POST /api/v1/upload` but is not bound to the Media tab.
2. **Client fallbacks** on the public site still render demo copy/images when CMS fields are blank — appearance is intentional; operators should run demo church seed or apply template so content is DB-backed.
3. **Simulation script** (`npm run simulate:church`) creates its own tagged events (`hif-ecopark-sim`) separate from `gcc-v2` seed — both can coexist; reset demo church with `DEMO_CHURCH_RESET=1` if needed.

---

## Files touched (data integrity)

- `src/modules/documents/DocumentsModule.tsx`
- `src/modules/care/PrayerIntakeSheet.tsx` (+ server prayer route/service)
- `src/modules/profile/ProfileModule.tsx`
- `src/lib/websiteSharedBlocks.tsx`
- `src/pages/PublicWebsitePage.tsx`
- `src/server/scripts/seed-demo-church-v2.ts`
