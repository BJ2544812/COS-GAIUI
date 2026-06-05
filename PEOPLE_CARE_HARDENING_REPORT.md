# People & Care Hardening Report

**Date:** 2026-06-05  
**Scope:** Members, declarations, prayer workflow, Pastoral Care — production hardening only (no new modules, no architecture redesign).

---

## 1. Member Save Audit

Automated audit: `npx tsx scratch/member-save-audit.ts` — **13/13 PASS**

| Field | Save | Retrieve | Update | Status |
|-------|------|----------|--------|--------|
| name | ✓ | ✓ | — | PASS |
| email | ✓ | ✓ | — | PASS |
| phone | ✓ | ✓ | — | PASS |
| dob | ✓ | ✓ | ✓ (partial) | PASS |
| membershipDate | ✓ | ✓ | — | PASS |
| gender | ✓ | ✓ | — | PASS |
| addressLine1 | ✓ | ✓ | — | PASS |
| city | ✓ | ✓ | — | PASS |
| pan | ✓ | ✓ | — | PASS |
| growthStage | ✓ | ✓ | ✓ | PASS |
| addressLine2 | — | ✓ | ✓ | PASS |
| DB sync (dob) | ✓ | ✓ | — | PASS |

### Root cause fixed

`normalizeDates()` in `MemberService` was overwriting `dob` and `membershipDate` with `null` on **partial updates** (e.g. growth stage only), clearing stored dates.

**Fix:** Only normalize date fields when explicitly present in the update payload.

### UX hardening

- Edit dialog uses explicit `buildMemberUpdateFromEditForm()` payload (no stray form keys).
- Post-save **re-fetch + field verification** before showing success.
- **Success and failure banners** on profile (no silent failures).
- Growth stage quick-save now surfaces errors and reloads from API.

---

## 2. Declaration Workflow Verification

### Corrected lifecycle

| Step | Action | Backend |
|------|--------|---------|
| 1 | Generate declaration | `POST /members/:id/generated-documents` → `lifecycle:Generated` |
| 2 | Blank signature blocks in HTML | `memberComplianceTemplates.ts` — no pre-filled names |
| 3 | Download / Print | `PATCH .../documents/:id/lifecycle` → `Downloaded` |
| 4 | Physical signing | Off-system (print) |
| 5 | Upload signed copy | `POST /members/:id/documents` with `parentDocumentId` → `UploadedSigned` |
| 6 | Staff verification | `PATCH .../lifecycle` action `verified` → `Verified` |

### Signature policy

- **Removed** auto-inserted member, witness, and pastor names from signature areas.
- Signature blocks show blank lines + `Date: _______________________` for ink signing.
- Baptism certificate officiant/witness rows are blank (seal remains institutional only).

### Print layout polish (A4)

- Blank signature spacing with dashed guide lines
- Print instruction note (“Sign in ink after printing…”)
- Page-break guards on signatures, registry table, footer
- Hindi declaration block spacing preserved

---

## 3. Prayer Request Workflow Verification

### Status model (implemented)

`OPEN` → `IN_PRAYER` → `FOLLOW_UP` → `ANSWERED` → `CLOSED` → `ARCHIVED`

### API endpoints

| Action | Method | Path |
|--------|--------|------|
| List | GET | `/care/prayer` |
| Detail + timeline | GET | `/care/prayer/:id` |
| Create | POST | `/care/prayer` |
| Edit | PATCH | `/care/prayer/:id` |
| Assign | POST | `/care/prayer/:id/assign` |
| Follow-up note | POST | `/care/prayer/:id/follow-up` |
| Mark answered | POST | `/care/prayer/:id/answered` |
| Close | POST | `/care/prayer/:id/close` |
| Archive | POST | `/care/prayer/:id/archive` |

### Timeline

`PrayerRequestActivity` records: CREATED, ASSIGNED, FOLLOW_UP, ANSWERED, CLOSED, ARCHIVED, STATUS_CHANGED, UPDATED.

UI: **Pastoral Care → Prayer Requests** — split panel with queue, detail, timeline, assign, follow-up, answered testimony, close/archive.

### Schema migration

`prisma/migrations/20260605120000_prayer_request_hardening` — adds `title`, `followUpNotes`, `PrayerRequestActivity`, normalizes legacy `Active` → `OPEN`.

---

## 4. People & Care Lockdown Review

| Area | Navigation | Data source | Status |
|------|------------|-------------|--------|
| Members | Sidebar: Members | `/members` API | ✓ Real |
| Member profile save | Edit dialog | PUT `/members/:id` | ✓ Fixed |
| Declarations | Records tab | Generated HTML + lifecycle | ✓ Fixed |
| Small Groups | Sidebar | `/structure/small-groups` | ✓ Real |
| Pastoral Care | Sidebar | `/care/*`, discipleship v2 | ✓ Real |
| Prayer requests | Care → Prayer tab | `/care/prayer` | ✓ Completed |

**No mock/placeholder data** in hardened paths — all persistence verified against PostgreSQL.

---

## 5. Remaining Bugs

| ID | Severity | Item |
|----|----------|------|
| PC-01 | Low | `addressLine2` not in edit form UI (backend supports it) |
| PC-02 | Low | Family assignment via edit uses family dropdown — create-new-family from edit not exposed |
| PC-03 | Info | Declaration PDF is browser Print-to-PDF (HTML), not server PDF engine — by design |

---

## 6. Remaining UX Improvements

- Toast notifications instead of inline banners for save success
- Prayer request filters (status, assignee, priority) on queue
- Bulk archive for closed prayer requests
- Declaration batch print from Documents module

---

## 7. Production Readiness Assessment

| Capability | Ready? | Notes |
|------------|--------|-------|
| Member create/edit persistence | **Yes** | Audit 13/13 |
| DOB timezone safety | **Yes** | Noon UTC + partial-update fix |
| Declaration generate → sign → upload | **Yes** | Full lifecycle |
| Prayer request operations | **Yes** | CRUD + timeline |
| Pastoral Care command center | **Yes** | Existing + prayer panel |
| Small Groups | **Yes** | Unchanged, API-backed |

**Overall People & Care readiness: PRODUCTION-READY** for pilot church onboarding with known low-priority gaps above.

---

## Verification commands

```bash
npx tsx scratch/member-save-audit.ts
npx tsx scratch/member-persistence-verify.ts
npm run lint
```

Restart API after pull: `npm run dev:server`
