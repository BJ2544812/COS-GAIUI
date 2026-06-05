# Staff Module Consolidation Report

**Product:** Ultimate Church OS (UCOS)  
**Date:** 2026-06-01  
**Scope:** HR & Staff vs Staff Directory — navigation, UI, data, and overlap analysis  
**Backend:** No API or schema changes in this review

---

## Executive summary

**Staff Directory is not a separate module.** It is a duplicate sidebar entry (`workforce`) that routes to the same React component as **HR & Staff** (`hr`): `WorkforceModule.tsx`. Both paths render identical screens with the same tabs; the only differences today are nav label, permission gate, and which internal tab opens by default (neither entry sets a tab — both land on **Overview**).

**Recommendation:** One canonical module — **HR & Staff** — with **Staff Profiles** as the directory tab (rename tab label to **Staff directory** for clarity). Remove duplicate navigation. Alias legacy `workforce` URLs to `hr?tab=directory`. Allow `manage_members` (without `manage_hr`) to open the module for directory/self-service only; keep sensitive tabs gated in UI as today.

---

## 1. Module inventory

| User-facing label | Route / module id | Component | Sidebar permission (declared) | App access gate |
|-------------------|-------------------|-----------|-------------------------------|-----------------|
| Staff Directory | `workforce` | `WorkforceModule` | `manage_members` | `manage_members` |
| HR & Staff | `hr` | `WorkforceModule` (same) | `manage_members` (listed) | **`manage_hr` only** |
| Members | `members` | `MembersModule` | `manage_members` | `manage_members` |
| Volunteers | `volunteers` | `VolunteersModule` | `manage_members` | `manage_members` |
| Vendors & Payroll | `vendors` | Finance payroll runs | `manage_finance` | `manage_finance` |

There is **no** `StaffDirectoryModule.tsx` or separate API namespace for “directory.”

---

## 2. Purpose

### HR & Staff (`hr` / `WorkforceModule`)

Church **paid and employed staff** operations: employment profiles, org hierarchy, leave and balances, payroll structures (finance-gated), reimbursements, onboarding/recruitment pipeline (HR admin), performance reviews, staff documents, training records, and employee self-service (leave, reimbursements, documents).

**Audience:** HR admin, finance manager, pastors with leave-approval rights, staff viewing their own records.

### Staff Directory (`workforce` — duplicate entry)

**Intended** purpose in product copy: quick lookup of staff contact and role information.

**Actual** implementation: same module as HR & Staff; no directory-only view or reduced tab set when entered via `workforce`.

### Members (related, not duplicate)

**Congregation CRM** — all people (visitors, members, leaders, staff as `growthStage`). Not limited to employment.

### Volunteers (related, not duplicate)

**Serving assignments** and volunteer health — operational Sunday coverage, not HR employment records.

---

## 3. Data sources

All HR UI data is loaded from **`/hr/*` REST endpoints** inside `WorkforceModule` (`loadAllHRData`):

| Domain | API (representative) |
|--------|----------------------|
| Command center stats | `GET /hr/command-center` |
| Employment profiles (directory) | `GET/POST/PUT/DELETE /hr/employment-profiles` |
| Leave | `GET/POST /hr/leave-requests`, balances, conflicts |
| Documents | `GET /hr/documents` |
| Onboarding / recruitment / performance | `GET /hr/onboarding`, `/hr/recruitment`, `/hr/performance` (HR admin) |
| Training | `GET /hr/training` |
| Reimbursements | `GET /hr/reimbursements` |
| Payroll structures | `GET /hr/payroll-structures` (finance/HR gated) |
| Payroll run generation | `POST /hr/payroll/runs/generate` |
| Settings / policies | `GET/PUT /hr/settings` |

**Persistence:** Prisma `employmentProfile` (and related HR models) linked to `Member` (`workforceClass`, `employmentType`, `department` updated on profile create — see `HRController`).

**Staff Directory does not use a separate data source** — it is the `employment-profiles` list on the **Staff Profiles** tab.

**Members module** uses `members` APIs; overlap is conceptual (same person may appear in both) not duplicate storage.

---

## 4. Features (internal tabs)

`WorkforceModule` tabs (`activeTab`):

| Tab key | UI label | Primary features |
|---------|----------|------------------|
| `dashboard` | Overview | HR command-center counts, quick actions, pending leave/reimbursements/onboarding |
| `directory` | Staff Profiles | Searchable employment profile list, profile detail, add staff |
| `hierarchy` | Org hierarchy | Department / reporting structure |
| `leaves` | Leave | Requests, approval, conflict warnings vs service events |
| `payroll` | Payroll | Salary structures (finance manager / HR) |
| `reimbursements` | Reimbursements | Submit and approve expense claims |
| `pipeline` | Onboarding | Recruitment pipeline (HR admin) |
| `performance` | Performance | Reviews (HR admin) |
| `self_service` | My HR | Employee-facing leave, reimbursements, documents |

Module header is always **“HR & Staff”** regardless of entry route.

---

## 5. Unique functionality (by area)

| Area | Unique to HR module | Also in Members / elsewhere |
|------|---------------------|-----------------------------|
| Employment profile CRUD | Yes | Member record exists separately; HR links via `memberId` |
| Leave + balances + Sunday conflict | Yes | — |
| Payroll structures + run generation | Yes (HR UI); **payroll runs** also in Vendors & Payroll | Finance module |
| Reimbursements → vouchers | Yes | Finance vouchers |
| Onboarding / recruitment / performance | Yes | — |
| Staff documents | Yes | General `documents` module for church assets |
| Volunteer scheduling | — | Volunteers + Events |
| All-congregation directory | — | Members (filters by growth stage) |

---

## 6. Overlap analysis

### HR & Staff vs Staff Directory

| Dimension | Overlap |
|-----------|---------|
| Component | **100%** — same `WorkforceModule` |
| Data | **100%** — employment profiles |
| Tabs | **100%** — no route-based tab selection |
| User confusion | **High** — two nav items, one screen |

### HR & Staff vs Members

| Dimension | Overlap |
|-----------|---------|
| Person identity | Same `Member` row |
| Staff listing | Members can filter `growthStage: Staff`; HR uses `employmentProfile` |
| Contact info | Duplicated display; HR is authoritative for **job** data |
| Workflows | Different — pastoral care vs employment lifecycle |

### HR payroll tab vs Vendors & Payroll

| Dimension | Overlap |
|-----------|---------|
| Payroll execution | HR can **generate** runs; Finance **vendors** module processes runs |
| Intentional split | Compensation setup (HR) vs accounting execution (Finance) — document, do not merge |

---

## 7. Dependencies

- **Auth:** `manage_hr` (full HR), `manage_members` (leave approvers / directory viewers in component logic), `manage_finance` (payroll tab).
- **Members:** Required to create employment profiles (`memberId`).
- **Events:** Leave conflict detection references service events.
- **Finance:** Reimbursements and payroll structures tie to chart of accounts / vouchers.
- **Role experience:** `hr` archetype lists both `hr` and `workforce` in `modulePriority`, `quickOps`, and `dashboardShortcuts` — reinforces duplication.
- **Navigation:** `CANONICAL_ADMIN_MODULES` in `adminNavigation.ts` includes both ids; `churchProductCopy.ts` maps `workforce` → “Staff Directory”, `hr` → “HR & Staff”.

---

## 8. Is Staff Directory a separate module?

**No.** It is a **second nav label** for the same module.

### Recommended information architecture

```
HR & Staff                    ← single sidebar item (module id: hr)
├── Overview                  ← dashboard tab
├── Staff directory           ← directory tab (rename from “Staff Profiles”)
├── Org hierarchy
├── Leave
├── Payroll                   ← finance-gated
├── Reimbursements
├── Onboarding / Performance  ← HR admin
└── My HR                     ← self_service tab
```

Legacy bookmarks: `?module=workforce` → `?module=hr&tab=directory`.

---

## 9. Consolidation plan (frontend only)

### Completed / recommended changes

1. **Remove** `workforce` from canonical sidebar list (`AppShell.tsx`, `CANONICAL_ADMIN_MODULES`).
2. **Alias** `workforce` → `{ module: 'hr', tab: 'directory' }` in `MODULE_ALIASES`.
3. **Pass** `initialTab` from `adminTab` into `WorkforceModule` (session key `ucos_hr_active_tab`).
4. **Unify access:** `canAccessModule('hr')` → `manage_hr` **or** `manage_members`; sidebar `canSeeItem('hr')` same.
5. **Update** `roleExperience` HR archetype: drop `workforce` from priority/quickOps; use `hr` only.
6. **Rename** tab button “Staff Profiles” → “Staff directory” (optional copy pass).
7. **Keep** `workforce` in `ERPModule` type and App switch as fallback redirect via `normalizeAdminModule` (no breaking deep links).

### Out of scope (no change)

- Backend routes, Prisma models, seed data.
- Merging Members or Volunteers into HR.
- Merging Finance payroll runs into HR tab.

---

## 10. Permission matrix (post-consolidation)

| Permission | Can open HR & Staff | Typical tabs visible |
|------------|---------------------|----------------------|
| `manage_hr` | Yes | All HR admin tabs |
| `manage_members` only | Yes | Overview, Staff directory, hierarchy, leave (approver), self_service; payroll/pipeline gated |
| `manage_finance` | Yes (if also events/members as configured) | Payroll tab |
| Neither | No | — |

Previously, `manage_members`-only users could use **Staff Directory** (`workforce`) but were **denied** **HR & Staff** (`hr`) at the App shell — an inconsistent split that consolidation fixes.

---

## 11. Testing checklist

- [ ] User with `manage_hr`: single nav item; all tabs work.
- [ ] User with `manage_members` only: sees HR & Staff; lands on directory when using old `workforce` link.
- [ ] HR archetype quick ops: no duplicate Staff + HR buttons.
- [ ] `?module=workforce` URL redirects to HR directory tab.
- [ ] Employment profile CRUD, leave approval, payroll generation unchanged.
- [ ] Member profile links to HR (if any) still resolve.

---

## 12. Conclusion

Consolidation is **low risk** because the codebase already implemented one module twice in navigation. The canonical surface is **`hr` / HR & Staff** with **Staff directory** as a tab, not a sibling module. Removing duplicate nav improves clarity without touching backend workflows or data.
