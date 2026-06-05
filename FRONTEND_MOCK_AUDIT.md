# Frontend Mock Audit — Ultimate Church OS

**Date:** 2026-06-02  
**Scope:** Production UI (`src/modules`, `src/pages`, `src/lib` used by live app)  
**Method:** Pattern scan + classification + targeted fixes

---

## Summary

| Category | Found | Removed / Fixed | Retained (valid) |
|----------|-------|-----------------|------------------|
| Hardcoded metrics (production) | 2 | 2 | 0 |
| Placeholder form counts | 1 | 1 | 0 |
| Fake media grid | 1 | 1 | 0 |
| Non-persisted SEO UI | 1 | 1 | 0 |
| Document template fallbacks | 4 | 4 | 0 |
| Loading skeleton arrays | 2+ | 0 | 2 (retained) |
| Public site fallbacks | 1 file | 0 | 1 (retained) |
| Image URL fallbacks (Unsplash) | 1 lib | 0 | 1 (retained) |
| Academy catalog | 1 | 0 | 1 (retained) |
| Seed / simulation scripts | many | 0 | N/A (not production UI) |

---

## Fixes applied (this pass)

| File | Location | Action | Backend source |
|------|----------|--------|----------------|
| `WorkflowMonitoringModule.tsx` | Health cards | Replaced fake uptime/latency with `admin/events/stats` pending/processed/failed | `GET /api/v1/admin/events/stats` |
| `WebsiteModule.tsx` | Media tab | Upload → `POST /upload`, register → `POST /website/config/media`, delete, list | MinIO/local + `website_media` setting |
| `WebsiteModule.tsx` | SEO tab | Controlled fields + `PUT /website/config/seo` | `settings.website_seo` |
| `WebsiteModule.tsx` | Forms tab | Removed `i*3+1` fake submission badges | N/A — links to Forms module |
| `DocumentsModule.tsx` | Member picker defaults | Removed `visitor@grace.local` / `98450` defaults | Selected member API fields |
| `ComplianceDocuments.tsx` | Print preview empty fields | Show `—` instead of fake email/phone | User-entered form values |
| `PublicWebsitePage.tsx` | SEO hook | Uses `settings.seo` from public API | `GET /website/public/settings` |
| `publicSeo.ts` | Meta tags | Keywords + robots noindex when disabled | CMS SEO payload |

---

## Retained with reason

| File | Item | Type | Reason |
|------|------|------|--------|
| `PublicWebsitePage.tsx` | `getFallbackSections()` | Fallback | Only when `PageData` empty; Grace seed publishes template so production uses DB. Preserves visual design. |
| `websiteSharedBlocks.tsx` | `IMAGE_FALLBACKS`, `DEFAULT_IMPACT_STATS` | Fallback | Used when CMS `imageUrl` / `stats` empty; seed fills `stats_bar` from church story. Same appearance. |
| `FinanceModule.tsx`, `GivingModule.tsx` | `[1,2,3]` skeleton divs | Loading UI | Shown only while `loading===true`; replaced by API data after fetch. |
| `AcademyModule.tsx` | `ACADEMY_TRACKS` | Static curriculum | Intentional in-app training catalog (not operational data). |
| `PlaceholderModule.tsx` | Placeholder copy | Module stub | Unregistered routes only. |
| `auth/demoUser.ts` | `DEMO_SESSION_USER` | Dev auth | Not used in production build path when real login required. |

---

## Module verification (data source)

| Module | Primary API / source | Mock status |
|--------|----------------------|-------------|
| Members | `GET /members` | API |
| Families | `GET /families` | API |
| Volunteers | Member responsibilities + members | API |
| Small groups | `GET /church-structure/small-groups` | API |
| Attendance | `GET /attendance/sessions` | API |
| Giving | `GET /giving/donations` | API |
| Finance | `GET /finance/summary`, vouchers, payroll | API |
| Payroll | `GET /finance/payroll/runs` | API |
| Assets | Assets API | API |
| Events | `GET /events` | API |
| Website admin | `GET /website/pages` | API |
| Reports / Analytics | Analytics endpoints | API |
| Portal (member) | `auth/me`, events, giving via member context | API |
| Academy | Static catalog + localStorage progress | Static by design |
| Discipleship | Care/prayer APIs | API |
| Documents vault | `GET /documents` | API |
| Communications | Campaign APIs | API |
| Workflow monitor | `admin/events` + stats | API (fixed) |

---

## Patterns searched (no production hits)

- `mockData`, `sampleData`, `placeholderData`, `demoStats`, `fakeStats`, `staticMetrics`, `hardcodedCounts` — **none in production modules**

---

## Items removed count

**11 production-facing mock/fake UI behaviors** addressed in this and prior integrity pass.

---

## Recommended UAT spot checks

1. Login `finance` → Finance dashboard shows non-zero monthly income from seeded history.  
2. Website → SEO → Save → reload → fields persist.  
3. Website → Media → Upload image → appears in grid → copy URL to hero section.  
4. Public site view-source → `meta description` matches saved SEO.
