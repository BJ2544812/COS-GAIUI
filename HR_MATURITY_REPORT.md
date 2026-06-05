# HR Domain Maturity Report — Kingdom Church OS V1

**Date:** 2026-05-20 (pilot stabilization pass)  
**Mode:** Real staff operations — no ERP expansion  
**Validation:** `npm run simulate:hr` · `e2e/hr-operations.spec.ts` · `npm run stabilization:gate`

---

## Executive summary

HR is **pilot-ready** for church staff operations. The subsystem integrates with members, finance, and ministry scheduling without redesigning core architecture. Remaining gaps are documented as V1.5 polish (payslip PDF, dedicated staff-only RBAC scope, applicant hire conversion).

| Area | Readiness | Evidence |
|------|-----------|----------|
| Operational HR | **Ready** | 38-step simulation, 0 failed |
| Payroll foundations | **Ready** (config required) | API generate; WARN until structures exist in UI |
| Staffing / conflicts | **Ready** | Conflict scanner + approval block + `forceApprove` |
| Compensation security | **Ready** | Pastor/campus 403; UI masks payslips for non-finance |
| Self-service | **Ready** (linked users) | `seed:demo-roles` links users↔members by email |
| Onboarding / recruitment | **Partial** | HR-admin tabs; API + dashboard widgets |
| Regression vs V1 | **Passing** | `stabilization:gate` green |

---

## Phase 1 — Real HR user testing

### 1.1 Role matrix

| Role | HR nav | Leave approve | Payroll | Pipeline |
|------|--------|---------------|---------|----------|
| HR Admin | ✓ | ✓ | ✓ | ✓ |
| Finance Admin | ✓ | ✓ | ✓ | ✓ |
| Pastor | ✓ | ✓ | ✗ | ✗ |
| Campus / Dept head | ✓ | ✓ | ✗ | ✗ |
| Secretary | ✓ | ✓ | ✗ | ✗ |
| Worship Leader | ✗ | ✗ (403) | ✗ | ✗ |
| Platform Admin | ✓ | ✓ | ✓ | ✓ |

**Regular staff (no `manage_*`):** Not in V1 RBAC — use secretary demo or link user email to member; self-service requires `hr` read permission today. V1.5: scoped `staff_portal` permission without full member admin.

### 1.2 Leave workflows

| Flow | Status |
|------|--------|
| Request | ✓ API + UI |
| Approve | ✓ balance `used` increments (sim: used=3) |
| Deny | ✓ simulation + E2E API |
| Conflict scan | ✓ structured `hasConflict` |
| Overlap / ministry | ✓ `scanLeaveConflicts`; approve blocked unless `forceApprove` |

### 1.3 Payroll workflows

| Flow | Status |
|------|--------|
| Compensation structures | ✓ Finance UI + API |
| Payroll run generate | ✓ `POST /hr/payroll/runs/generate` |
| Voucher linkage | ✓ via AccountingService from HR approve reimburse / payroll |
| Visibility | ✓ Finance tab + API |
| Security | ✓ 403 for pastor/campus on payroll structures |

---

## Phase 2 — UX & operational calm

| Item | Done this pass |
|------|----------------|
| Command center stats | Loads `/hr/command-center` counts |
| Pending leave panel | Count + approve/deny actions |
| Upcoming leave sidebar | Approved leave next 14 days (all roles) |
| Onboarding/recruitment sidebar | HR-admin only |
| Self-service payslip masking | Non-finance sees `***` |
| Member link hint | Banner when user not linked to member |
| Staff profile compensation note | Finance/HR only |

---

## Phase 3 — Regression & security

### 3.1 Security

- Compensation: `hrSecurity.ts` + route `hrFinance` guards
- Documents: HR manager for upload/delete; read via `hrRead`
- Export: No bulk compensation export endpoint in V1
- Worship: 403 on HR APIs (expected)

### 3.2 Regression

Run before each HR fix:

```bash
npm run stabilization:gate
npm run simulate:hr
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test e2e/hr-operations.spec.ts
npm run test:pilot
```

### 3.3 Playwright (15 tests)

Admin smoke, settings API, role visibility (7 roles), leave deny API, reimbursement API, conflict scanner API.

---

## Phase 4 — Stabilization backlog (V1.5)

| Priority | Item |
|----------|------|
| P1 | Configure payroll structures in Finance/HR UI then re-run payroll generate |
| P1 | Link all staff logins to `User.memberId` for self-service |
| P2 | Payslip PDF from payroll run lines |
| P2 | Dedicated staff self-service permission (no `manage_members`) |
| P3 | Applicant → member hire conversion |
| P3 | Campus-scoped leave approval queue |

---

## Stabilization fixes (cumulative)

| ID | Summary |
|----|---------|
| S-057 | Payroll wizard → `hr/payroll/runs/generate` |
| S-058 | Conflict badges from `conflictSnapshot` |
| S-059 | `forceApprove` UX on 409 |
| S-060 | `isHrAdmin` vs `isLeaveApprover` split |
| S-061 | Finance HR nav via `manage_finance` |
| S-062 | Command center loads server counts; calmer dashboard |
| S-063 | Self-service payslip masking + member link banner |
| S-064 | `seed:demo-roles` links users to members by email |

---

## Related docs

- [HR_OPERATIONAL_REPORT.md](./HR_OPERATIONAL_REPORT.md)
- [STABILIZATION_BUG_LOG.md](./STABILIZATION_BUG_LOG.md)
- [PILOT_SUPPORT.md](./PILOT_SUPPORT.md)
- [TESTER_GUIDE.md](./TESTER_GUIDE.md)
