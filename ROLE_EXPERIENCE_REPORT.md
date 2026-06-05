# Ultimate Church OS — Role Experience & Permission Rationalization Report

**Date:** 2026-06-01  
**Program:** Role Experience & Permission Rationalization (Phases 1–14)  
**Principle:** Permissions gate access; **experience** shapes what each role sees first.

---

## Executive summary

The platform now applies a **role-centric experience layer** (`src/lib/roleExperience.ts`) on top of existing RBAC. Each staff login receives:

- A **role-appropriate landing module** (not generic `/admin`)
- A **dashboard tuned** to their lens (pastoral, finance, operations)
- **Navigation group ordering** focused on their daily work
- **Quick-action bar** shortcuts for their role
- **Church-friendly labels** (no engineering badges)

Demo accounts were renamed and expanded to match real church titles. Full matrices and gaps are below.

---

## Phase 1 — Role inventory

### Roles in product (seed + templates)

| Church role | Demo user | Password | Archetype |
|-------------|-----------|----------|-----------|
| Super Admin | `admin` | admin123 | super_admin |
| Senior Pastor | `pastor` | demo123 | senior_pastor |
| Church Administrator | `churchadmin` | demo123 | church_admin |
| Worship Pastor | `worship` | demo123 | ministry_leader |
| Volunteer Coordinator | `volunteers` | demo123 | volunteer_coordinator |
| Finance Manager | `finance` | demo123 | finance |
| HR Manager | `hradmin` | demo123 | hr |
| Communications Manager | `secretary` | demo123 | communications |
| Ministry Leader (events) | `events` | demo123 | ministry_leader |
| Campus Admin | `campus` | demo123 | church_admin |
| Member (congregant) | — | — | member_portal |

### Roles requested but not separate DB templates yet

| Role | Status |
|------|--------|
| Associate Pastor | Map to Senior Pastor or Ministry Leader via Permissions UI |
| Youth Pastor | Same as Worship Pastor / Ministry Leader |
| Accountant | Same as Finance Manager |
| Small Group Leader | Ministry Leader permissions subset |
| Staff (generic) | `Staff` template in alternate seed |
| Guest | Public website only (no login) |

---

## Phase 2 — Role experience matrix (login → daily use)

| Role | Lands on | Dashboard view | Dashboard lens | Quick bar |
|------|----------|----------------|----------------|-----------|
| Super Admin | Home | Operations | Executive (+ all lenses) | Sunday ops default |
| Church Administrator | Home | Operations | Operations | Events / Sunday |
| Senior Pastor | Home | Executive | Pastoral | Care / people |
| Finance Manager | Finance → Vouchers | Executive | Finance | Giving / Finance |
| HR Manager | HR & Staff | Personal | Operations | HR / Staff |
| Worship / Ministry Leader | Sunday Service | Operations | Operations | Live / check-in |
| Volunteer Coordinator | Volunteers | Operations | Operations | Team / Sunday |
| Communications | Communications | Personal | Operations | Comms / alerts |
| Member (portal-only) | `/portal` | — | — | Hidden |

---

## Phase 3 — Senior Pastor experience

**Intent:** Church health, people, ministry, stewardship.

| Area | Implementation |
|------|----------------|
| Visibility | Members, pathways, pastoral care, giving, events, attendance, analytics |
| Landing | Home dashboard, **Pastoral** lens auto-selected |
| Nav order | Identity → Insights → Operations → Finance |
| Shortcuts | Members, pastoral care, giving, events |

**Permissions (demo):** `manage_members`, `manage_discipleship`, `manage_communication`, `manage_analytics`, `manage_attendance`, `manage_events`, `manage_giving`

**Gap:** No dedicated “high-level finance only” permission — treasurer detail hidden unless `manage_finance` granted.

---

## Phase 4 — Church Administrator experience

**Intent:** Full operations — events, attendance, volunteers, communications.

| Area | Implementation |
|------|----------------|
| Landing | Home, **Operations** command view |
| Nav order | Operations group first |
| Quick bar | Sunday, attendance, events, volunteers |

**Demo user:** `churchadmin` — `manage_settings` + events + members + attendance

---

## Phase 5 — Finance experience

**Intent:** Not overwhelmed by ministry modules; finance-first.

| Area | Implementation |
|------|----------------|
| Landing | **Finance** tab vouchers |
| Nav order | **Finance** group first |
| Dashboard | Finance lens; executive giving stats only |
| Quick bar | Giving, Finance, Budgets, Payroll |

**Gap:** Budget vs live voucher actuals (known platform limitation).

---

## Phase 6 — HR experience

**Intent:** Staffing desk first.

| Area | Implementation |
|------|----------------|
| Landing | **HR & Staff** |
| Nav order | Identity (HR) before operations |
| Quick bar | HR, Staff directory, People |

**Gap:** Offboarding wizard, leave approval notifications (operational readiness items).

---

## Phase 7 — Ministry leader experience

**Intent:** Events, Sunday, worship — not ERP complexity.

| Area | Implementation |
|------|----------------|
| Landing | **Sunday Service** |
| Quick bar | Live, check-in, events, worship |
| Hidden | Finance, platform admin (by permission) |

---

## Phase 8 — Member experience

| Area | Implementation |
|------|----------------|
| Route | `/portal` — separate from staff ERP |
| Staff link | “Church office” only if user has staff permissions |
| Pure members | “My church” header; no admin back-link |
| Data | Requires `User.memberId` linked to `Member` |

**Gap:** Dedicated member-only login surface (today uses same staff login).

---

## Phase 9 — Dashboard rationalization

| Dashboard | Who | What changed |
|-----------|-----|--------------|
| Home (operations) | Admin, ops roles | Role title + subtitle on dashboard |
| Home (executive) | Pastor, finance | Auto lens; filtered lens tabs |
| Home (personal) | HR, communications | Task-focused |
| Member portal | Members | Community layout (existing) |

“Command” tab renamed **Operations** on dashboard.

---

## Phase 10 — Navigation rationalization

| Mechanism | Behavior |
|-----------|----------|
| Permissions | Unchanged — `canSeeItem` still enforces access |
| Group order | Role-specific (`sortNavGroups`) |
| Documents | `manage_documents` OR `manage_assets` (secretary fix) |
| Badges | No Beta/Soon in nav (prior program) |

**Not done:** Separate physical sidebars per role (unnecessary duplication). Order + landing achieves focus.

---

## Phase 11 — Workflow review

| Workflow | Role targeting | Status |
|----------|----------------|--------|
| Voucher approve/post | Finance | Permission-gated |
| Prayer assignment notify | Pastoral / assignee | Implemented (event worker) |
| Leave approval | HR | API exists; UX polish pending |
| Sunday check-in | Ops / volunteers | Live |

**Recommendation:** Route notification types by role archetype in a future pass.

---

## Phase 12 — Product polish

- Role titles on dashboard (e.g. “Finance & stewardship”)
- Portal copy: “Church office” vs “My church”
- Operations vs Command terminology fixed

---

## Phase 13 — Testing

| Check | Command |
|-------|---------|
| Typecheck | `npm run lint` — **PASS** |
| Role landing E2E | `npx playwright test e2e/role-experience.spec.ts` — **7/7 PASS** (2026-06-01) |
| Production rollout roles | `e2e/production-rollout.spec.ts` |
| Smoke | `e2e/smoke.spec.ts` |

Re-seed demo roles after pull: `npm run seed:demo-roles`

---

## Phase 14 — Matrices

### Permission matrix (module keys)

| Module key | Modules |
|------------|---------|
| `manage_members` | Members, families, volunteers, pathways, pastoral care |
| `manage_events` | Events, Sunday, worship, sermons |
| `manage_attendance` | Attendance |
| `manage_finance` | Finance, budgets, vendors |
| `manage_giving` | Giving |
| `manage_hr` | HR & Staff |
| `manage_communication` | Communications, notifications, outreach |
| `manage_analytics` | Home, reports |
| `manage_settings` | Settings, structure, admin, permissions, website |
| `manage_documents` | Compliance documents (with assets) |

### Navigation matrix (visible if permitted)

See `AppShell.tsx` `GROUPS` + `canSeeItem`.

### Implemented improvements (this program)

1. `src/lib/roleExperience.ts` — archetypes, landing, nav order, quick ops
2. Post-login redirect by role (`LoginPage`, `App.tsx`)
3. Dashboard auto-view/lens + role shortcuts
4. Role-ordered sidebar groups
5. Role-specific `QuickOpsBar`
6. Documents permission fix for communications role
7. Member portal staff vs member chrome
8. Expanded `seed-demo-roles.ts` with church role names
9. `e2e/role-experience.spec.ts`

### Remaining gaps

| Priority | Item |
|----------|------|
| P1 | Associate / Youth pastor distinct templates |
| P2 | Member-only login URL |
| P3 | Notification routing by role |
| P4 | Role template wizard in Settings |
| P5 | Demo Church + Academy (deferred per program scope) |

---

## Success criteria

| Criterion | Met? |
|-----------|------|
| Senior Pastor feels leadership-focused | **Yes** (pastoral lens, people shortcuts) |
| Administrator feels operations-focused | **Yes** (ops view, events-first nav) |
| Finance feels accounting-focused | **Yes** (finance landing, finance-first nav) |
| HR feels staffing-focused | **Yes** (HR landing) |
| Ministry leaders avoid ERP clutter | **Yes** (Sunday landing, limited perms) |
| Members avoid ERP | **Mostly** (portal separate; shared login remains) |
| Role-centric vs module-centric | **Yes** (experience layer) |

---

## Related files

- `src/lib/roleExperience.ts`
- `OPERATIONAL_READINESS_REPORT.md`
- `src/server/scripts/seed-demo-roles.ts`
- `TESTER_GUIDE.md`
