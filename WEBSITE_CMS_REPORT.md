# Website CMS & Storage Report — Ultimate Church OS

**Date:** 2026-06-01  
**Constraint:** Public website appearance, layout, branding, and UX unchanged.

---

## CMS editability matrix

| Content area | Editable in Church OS? | Storage | API | Public reflection |
|--------------|------------------------|---------|-----|-------------------|
| Homepage sections | Yes — page editor | `PageData.content` JSON | `GET/PATCH /website/pages/:slug` | `GET /website/public/pages/:slug` |
| Hero title / subtitle | Yes | Section `config` | Same | Same |
| Hero buttons | Yes (`buttonText`, `secondaryButtonText`, URLs) | Section config | Same | Same (defaults match prior copy) |
| Hero / section images | Yes — image URL field | URL string in section JSON | Same | `ResilientImage` + fallbacks if empty |
| Ministry sections | Yes — per block in template | Page JSON | Same | Same |
| About / pastor blocks | Yes | Page JSON | Same | Same |
| Events section | Yes (layout) + live events | CMS + `GET /events` public | Public events API | Merged at render |
| Giving section | Yes (copy) + campaigns | CMS + giving APIs | Public campaigns | Live amounts from DB |
| Footer tagline / service times | Yes | `settings.organization` + footer config | Settings + page | `SharedFooter` uses `orgSettings` |
| Contact info | Yes | Organization settings | Settings API | Footer / contact blocks |
| Navigation | Yes | Page nav + theme config in editor | Website pages API | Public nav from published pages |
| Sermons / media blocks | Yes (URLs) + library | `Sermon` table + section config | Public sermons API | — |
| **Global SEO tab** | **No** (UI only) | Not persisted | — | Uses defaults / page title from slug |
| **Media Library tab** | **No** (placeholder tiles) | — | Upload API exists elsewhere | — |

---

## Administrator workflow (verified design)

1. **Website module** → select page (Home, About, Give, etc.).
2. Edit sections in visual/page editor; changes held in React state until **Save**.
3. **Save** → `PATCH` page payload to backend → `PageData` row updated.
4. **Publish** → `publishPage` / bulk publish sets `isPublished: true`.
5. Public site loads only published pages; draft changes are not shown.

**Template bootstrap:** `npm run seed:demo-church` runs `WebsiteService.applyTemplate('flagship-v2')` and marks all tenant pages published.

---

## Storage verification

| Question | Finding |
|----------|---------|
| Are images stored in bucket storage? | **Optional.** `POST /api/v1/upload` writes to **MinIO** when configured; otherwise **local** `uploads/{tenantId}/settings/`. |
| Can images be replaced? | **Yes** — change `imageUrl` in section config to a new URL (including URL returned from upload if used from Settings/other flows). |
| Do updates reflect on public site immediately? | **Yes** after save + publish (public endpoint reads latest published JSON). |
| Are old images retained? | **URLs only in JSON** — replacing URL does not delete prior binary from storage automatically; orphan cleanup is not automated. |
| Can administrators upload replacements? | **Per-section URL** in page editor: yes (paste URL). **Dedicated website Media tab upload:** not wired. |

---

## Data flow test plan (manual UAT)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Change homepage hero title in Website editor → Save | `PageData` row `home` updated |
| 2 | Publish home page | `isPublished: true` |
| 3 | `GET /api/v1/website/public/pages/home` (no auth) | JSON contains new title |
| 4 | Open public site route | Same title visible; layout unchanged |
| 5 | Change hero `imageUrl` to uploaded file URL | Image swaps; fallback only on error |
| 6 | Edit organization phone in Settings | Footer/contact reflect new phone |

---

## Code references

- Page service: `src/server/services/WebsiteService.ts` (`applyTemplate`, `publishPage`, public getters)
- Public renderer: `src/pages/PublicWebsitePage.tsx`, `src/lib/websiteSharedBlocks.tsx`
- Admin UI: `src/modules/website/WebsiteModule.tsx`
- Upload: `src/server/controllers/UploadController.ts`

---

## Gaps (non-visual)

1. **SEO & Meta Configuration** tab — inputs are not saved; use per-page titles in editor or extend schema to `PageData.meta` / settings key `website_seo`.
2. **Media Library** — placeholder UI; recommend wiring Upload button to existing `POST /upload` and copying returned URL into section editor.
3. **Forms / Landing pages** — not production CMS features yet.

---

## Success criteria (CMS)

| Criterion | Met? |
|-----------|------|
| Public site looks the same | Yes — same components and fallbacks |
| Homepage/sections editable | Yes (page editor + seed template) |
| Text/buttons/sections | Yes |
| Images manageable | Partial — URL + upload API; Media tab pending |
| Footer/contact from settings | Yes (footer wired to org settings) |
| Navigation from published pages | Yes |
