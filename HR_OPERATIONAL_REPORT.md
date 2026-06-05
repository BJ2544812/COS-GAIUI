# HR Operational Simulation Report

**Generated:** 2026-06-01T14:36:12.244Z
**Tenant:** default-tenant-id
**Command:** `npm run simulate:hr`

## Summary

| Result | Count |
|--------|-------|
| PASS | 37 |
| WARN | 1 |
| FAIL | 0 |

## Steps

| Phase | Step | Status | Detail |
|-------|------|--------|--------|
| 0 Setup | Admin login | PASS |  |
| 1.1 Roles | HR Admin login | PASS |  |
| 1.1 Roles | HR Admin command-center | PASS | HTTP 200 |
| 1.1 Roles | HR Admin leave list | PASS | HTTP 200 |
| 1.1 Roles | HR Admin payroll access | PASS | empty structures |
| 1.1 Roles | Pastor login | PASS |  |
| 1.1 Roles | Pastor command-center | PASS | HTTP 200 |
| 1.1 Roles | Pastor leave list | PASS | HTTP 200 |
| 1.1 Roles | Pastor payroll denied/masked | PASS | 403 |
| 1.1 Roles | Finance Admin login | PASS |  |
| 1.1 Roles | Finance Admin command-center | PASS | HTTP 200 |
| 1.1 Roles | Finance Admin leave list | PASS | HTTP 200 |
| 1.1 Roles | Finance Admin payroll access | PASS | empty structures |
| 1.1 Roles | Campus Leader login | PASS |  |
| 1.1 Roles | Campus Leader command-center | PASS | HTTP 200 |
| 1.1 Roles | Campus Leader leave list | PASS | HTTP 200 |
| 1.1 Roles | Campus Leader payroll denied/masked | PASS | 403 |
| 1.1 Roles | Worship Leader login | PASS |  |
| 1.1 Roles | Worship Leader command-center | PASS | 403 expected (no HR read permission) |
| 1.1 Roles | Worship Leader leave list | PASS | 403 expected |
| 1.1 Roles | Worship Leader payroll denied/masked | PASS | 403 |
| 1.1 Roles | Platform Admin login | PASS |  |
| 1.1 Roles | Platform Admin command-center | PASS | HTTP 200 |
| 1.1 Roles | Platform Admin leave list | PASS | HTTP 200 |
| 1.1 Roles | Platform Admin payroll access | PASS | empty structures |
| 1.2 Lifecycle | Create member | PASS | e6842615-17a5-4ae6-bdff-9a349356fa33 |
| 1.2 Lifecycle | Employment profile | PASS |  |
| 1.2 Lifecycle | Leave balances allocated | PASS | 3 types |
| 1.2 Lifecycle | Leave request | PASS | clean |
| 1.2 Lifecycle | Leave approval | PASS | HTTP 200 |
| 1.2 Leave | Balance used after approval | PASS | used=3 |
| 1.2 Leave | Leave denial | PASS | HTTP 200 |
| 1.2 Lifecycle | Reimbursement request | PASS |  |
| 1.2 Lifecycle | Recruitment entry | PASS |  |
| 1.2 Lifecycle | Onboarding task | PASS |  |
| 3.1 Payroll | Generate payroll run | WARN | no active structures (configure in UI) |
| 1.3 Conflicts | Conflict scanner | PASS | structured report |
| 2 Settings | Tenant leave policy | PASS |  |

## Regression gate

```bash
npm run stabilization:gate
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test e2e/hr-operations.spec.ts
```
