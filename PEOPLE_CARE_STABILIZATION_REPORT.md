# People & Care Stabilization Report

**Date:** 2026-06-02  
**Scope:** Navigation fixes, volunteer visibility, canonical member profile routing, health-check notes (no new features, no architecture redesign).

---

## Executive summary

The primary blocker — **member profile not opening from Directory or Families** — was caused by **two competing `setSearchParams` calls in one click handler**, which left `view=profile` in the URL without `memberId`, so the UI never rendered `MemberProfileDetail`.

Fixes applied:

1. **Single atomic URL update** for member profile navigation in `MembersModule`.
2. **Canonical profile path** helper (`buildMemberProfilePath`) used from **Families** and **Volunteers**.
3. **Volunteer list** reads responsibilities from both `responsibilities` and `memberResponsibilities`, with **case-insensitive status filtering**.
4. **Orphan URL cleanup** when `view=profile` exists without `memberId`.

---

## Root cause analysis

### TASK 1 — Member profile does not open (Directory)

| Finding | Detail |
|--------|--------|
| **Symptom** | Row click appeared to do nothing; no error. |
| **Root cause** | `handleViewProfile` called `setSelectedMemberId(id)` then `setView('profile')` as **two separate** `setSearchParams` functional updates. React Router batches these; the second updater often received the **previous** search string, setting `view=profile` **without** `memberId`. |
| **Why UI failed** | Render guard is `view === 'profile' && selectedMemberId`. With `view=profile` from URL but no `memberId`, `view` was incorrectly derived as `'profile'` from `searchParams.get('view')` while `selectedMemberId` was null → directory stayed visible. |
| **API** | `GET /members/:id` and list endpoint were already correct; tenant-scoped via existing middleware. No backend change required. |

### TASK 2 — Household member navigation (Families)

| Finding | Detail |
|--------|--------|
| **Symptom** | Household member rows were not clickable. |
| **Root cause** | Rows had **no `onClick`** — only generic “Manage members” navigated to the module root. |
| **Fix** | `onClick` → `navigate(buildMemberProfilePath(member.id))` (same canonical profile as Directory). |

### TASK 3 — Member profile audit

| Area | Status |
|------|--------|
| Identity (name, photo, gender, DOB, status, growth stage) | Shown on overview + edit dialog; DOB editable via date input. |
| Contact (phone, email, address fields) | Supported on `Member` model and profile edit. |
| Church (membership date, campus via structure/responsibilities, ministry roles) | Partial — ministry via responsibilities; campus not a dedicated Member field. |
| Family / household | Family tab + link/unlink; Families module cross-links. |
| Documents / declarations | Documents tab; visitor/member declaration generation + acceptance flow in profile. |
| Timeline / attendance / giving / care | Tabs: timeline, attendance, giving, care notes; loads via `getMember` includes. |
| **Gaps (data model)** | `preferredName`, `maritalStatus` (intake only, not persisted on `Member`), `emergencyContact` (on `EmploymentProfile`, not `Member`), `firstVisitDate` (not on `Member` schema) — UI shows `—` or omits; no crash. |

### TASK 4 — Volunteer active list

| Finding | Detail |
|--------|--------|
| **Symptom** | Assign succeeded but volunteers missing from “Active” list. |
| **Contributing causes** | (1) Client only read `m.responsibilities`; some responses could still expose `memberResponsibilities` before mapping in edge cases. (2) Strict `r.status === filterStatus` failed if casing differed. (3) Default filter `Active` hid rows when status did not match exactly. |
| **Fix** | Normalize rows from both keys; `statusMatchesFilter()` case-insensitive; after assign, refresh list and keep Active filter. |

### TASK 5 — Declarations

| Flow | Status |
|------|--------|
| Create (intake attestation) | `declarationAccepted` → `DeclarationForm` document via `createMemberDocument`. |
| Generate (visitor / member / baptism) | `POST /members/:id/generated-documents` → stored as `MemberDocument`, HTML in uploads. |
| View / reopen | Documents tab on profile; compliance templates in `memberComplianceTemplates.ts`. |
| Person linkage | All via `memberId` on `MemberDocument`; tenant-scoped repositories. |

No duplicate/orphan declaration logic changes in this sprint (existing repository patterns retained).

### TASK 6 — People & Care health check (manual / code review)

| Flow | Result |
|------|--------|
| Directory load / search / filters / pagination | OK (client-side filter + page size 50). |
| Open profile from directory | **Fixed** |
| Add member (intake) | OK (unchanged). |
| Families → household → member | **Fixed** |
| Volunteers assign + list | **Improved** |
| Volunteer → open profile | **Fixed** (routes to Members profile URL) |
| Care / discipleship | Separate module; links to members module root only (unchanged). |

---

## Files changed

| File | Change |
|------|--------|
| `src/lib/adminNavigation.ts` | Added `buildMemberProfilePath`, `buildFamilyDetailPath`. |
| `src/modules/members/MembersModule.tsx` | Atomic route patching; fixed view derivation; orphan URL cleanup. |
| `src/modules/families/FamiliesModule.tsx` | Clickable household members → canonical profile URL. |
| `src/modules/volunteers/VolunteersModule.tsx` | Responsibility aggregation + status filter; navigate to canonical profile; removed duplicate inline profile shell. |

**Also touched earlier in session (unrelated lint):**

| File | Change |
|------|--------|
| `src/lib/guidedLearning.ts` | `RoleUser` typing for `resolveRoleArchetype`. |
| `src/modules/families/FamiliesModule.tsx` | Removed invalid `setSelectedFamily` after photo upload. |
| `src/server/scripts/clean-install.ts` | Windows `shell` for `execSync`. |

---

## APIs changed

**None.** All fixes are frontend routing and client-side data normalization. Existing endpoints used:

- `GET /members` (includes `memberResponsibilities` → `responsibilities`)
- `GET /members/:id`
- `POST /members/:id/responsibilities`
- `PATCH /members/:id/responsibilities/:resId`
- `POST /members/:id/generated-documents`
- `GET|POST /members/:id/documents`

---

## Components changed

| Component | Change |
|-----------|--------|
| `MembersModule` | Profile navigation via single `patchMemberRoute`. |
| `MemberProfileDetail` | No code change; remains canonical profile UI. |
| `FamiliesModule` | Household member rows open profile. |
| `VolunteersModule` | List/fix filters; row click opens Members profile route. |

---

## Test results

| Test | How verified |
|------|----------------|
| TypeScript | `npm run lint` (`tsc --noEmit`) — **exit 0** after changes. |
| Directory → profile | Code path: `handleViewProfile` → `patchMemberRoute({ memberId, view: 'profile' })` → `MemberProfileDetail` when `memberId` present. |
| Families → profile | `openMemberProfile` → `/admin?module=members&memberId=…&view=profile`. |
| Volunteers list | `fetchAllData` flattens responsibilities; Active filter uses case-insensitive match. |
| Assign volunteer | POST unchanged; `fetchData()` + `setFilterStatus('Active')` after success. |

**Recommended manual smoke (demo church):**

1. Login `churchadmin` / `demo123` → **Members** → click **Ravi Nair** → profile loads.
2. **Families** → open **Nair** household → click a member → same profile.
3. **Volunteers** → **Assign Role** → assign greeter → appears under **Active** filter → click row → Members profile opens.
4. Profile → **Documents** → generate visitor declaration → appears in list.

---

## Remaining issues (out of scope for this sprint)

1. **Profile fields not on `Member` schema** — preferred name, marital status (persist), emergency contact, first visit date require schema + API + UI (feature work, not stabilization-only).
2. **Discipleship / Giving / Dashboard** — “open member” still goes to module root, not deep-linked profile (use `buildMemberProfilePath` when those surfaces gain member IDs).
3. **Volunteers at scale** — list builds from full `GET /members` with embedded responsibilities; acceptable for demo size; may need dedicated volunteer query later (performance, not correctness).
4. **Archive member** — confirm product support; not audited in this pass.
5. **E2E** — add `e2e/members-families.spec.ts` coverage for profile URL params (recommended follow-up).

---

## Canonical member profile route

```
/admin?module=members&memberId={uuid}&view=profile
```

Helper: `buildMemberProfilePath(memberId)` in `src/lib/adminNavigation.ts`.

All People & Care entry points should use this path (or `MembersModule`’s internal `patchMemberRoute` when already inside Members).

---

*Stabilization complete for navigation, volunteer visibility, and canonical profile routing. No new features or backend workflow changes.*
