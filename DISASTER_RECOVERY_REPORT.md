# Disaster Recovery Report

**Generated:** 2026-05-24T09:12:13.244Z
**Started:** 2026-05-24T09:05:00.706Z
**Command:** `npm run drill:restore`
**Tenant:** default-tenant-id

## Summary

**DRILL PASSED** — restore confidence acceptable for pilot production rollout.

| Metric | Value |
|--------|-------|
| Required checks passed | 29/29 |
| Warnings | 1 |
| Members (fingerprint) | 63 |
| Vouchers | 33 |
| HR profiles | 3 |
| PostgreSQL dump | D:\COS-GAIUI\scratch\drill\pg-1779613543581.sql |

## Checklist

| Phase | Check | Status | Detail |
|-------|-------|--------|--------|
| boot | Health endpoint | PASS | connected |
| boot | Readiness /health/ready | WARN | HTTP 500 |
| postgres | Fingerprint captured | PASS | {"members":63,"users":9,"vouchers":33,"events":22,"employmentProfiles":3,"failedEvents":0,"settings":12} |
| postgres | PostgreSQL dump file | PASS | 427.0 KB |
| postgres | Dump contains core tables | PASS |  |
| tenant | Tenant JSON export | PASS | 63 members |
| uploads | Uploads directory snapshot | PASS | 18 files → D:\COS-GAIUI\scratch\drill\uploads-1779613544145 |
| minio | MinIO initialization | PASS | default bucket |
| tenant | Tamper page title | PASS |  |
| tenant | Restore page title from manifest | PASS | 11 pages |
| tenant | Settings preserved after restore | PASS |  |
| postgres | Operational fingerprint unchanged after JSON restore | PASS |  |
| auth | Admin login | PASS |  |
| auth | JWT session /auth/me | PASS |  |
| rbac | Demo login: pastor | PASS |  |
| rbac | Demo login: finance | PASS |  |
| rbac | Demo login: hradmin | PASS |  |
| hr | HR command center | PASS |  |
| finance | Chart of accounts | PASS |  |
| finance | Approval queue | PASS |  |
| finance | Trial balance report | PASS |  |
| workflow | Platform incidents | PASS |  |
| queue | Queue metrics | PASS | {"mode":"synchronous","waiting":0,"active":0,"failed":0,"completed":0,"delayed":0} |
| workflow | Workflow replay endpoint | PASS |  |
| websocket | Socket.IO polling handshake | PASS | HTTP 200 |
| validation | stabilization:gate | PASS |  |
| validation | test:pilot | PASS |  |
| validation | hr-operations | PASS |  |
| validation | sunday-operations | PASS |  |
| validation | simulate:hr | PASS |  |

## Post-drill validation

```powershell
npm run stabilization:gate
npm run test:pilot
npx playwright test e2e/hr-operations.spec.ts
npx playwright test e2e/sunday-operations.spec.ts
```

## Sign-off

S-069 may be marked FIXED after ops lead reviews this report on staging.

See [RESTORE_RUNBOOK.md](./RESTORE_RUNBOOK.md).
