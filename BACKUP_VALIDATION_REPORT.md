# Backup Validation Report

**Generated:** 2026-05-21T14:47:59.758Z
**Tenant:** default-tenant-id
**Command:** `npm run backup:validate`

## Summary

Exported **63** members, **22** events.

| Check | Status | Detail |
|-------|--------|--------|
| Export backup manifest | PASS |  |
| Field: format | PASS |  |
| Field: exportedAt | PASS |  |
| Field: tenantId | PASS |  |
| Field: tenant | PASS |  |
| Field: settings | PASS |  |
| Field: members | PASS |  |
| Field: events | PASS |  |
| Format kingdom-os-backup-v1 | PASS |  |
| Members array | PASS | 63 rows |
| Write sample file | PASS | D:\COS-GAIUI\scratch\backup-validate-1779374879756.json |
| Restore dry-run (automated) | FAIL/WARN | Manual restore required — follow RESTORE_RUNBOOK.md |

## Restore requirement

Automated export validation passed does **not** replace a full restore test.
Complete [RESTORE_RUNBOOK.md](./RESTORE_RUNBOOK.md) before calling backups production-ready.

## PostgreSQL

Schedule `pg_dump` of the tenant database in addition to JSON manifest export (`npm run backup:tenant`).
