# Production Pilot Status Report

**Generated:** 2026-05-20 (manual snapshot)  
**Command:** `npm run pilot:validate`

## Summary

| Step | Status |
|------|--------|
| stabilization:gate | PASS |
| test:pilot (40 specs) | PASS |
| e2e/hr-operations (15 specs) | PASS |
| simulate:hr | PASS (0 failed; payroll WARN if no structures) |

**Overall: PILOT GATES PASS** — platform is in live production pilot mode on locked V1 architecture.

## Regression commands

```powershell
npm run stabilization:gate
npm run test:pilot
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test e2e/hr-operations.spec.ts
npm run simulate:hr
npm run simulate:church
npm run pilot:validate
```

## VPS checklist (production)

| Item | Required |
|------|----------|
| HTTPS reverse proxy | Yes |
| `REDIS_URL` | Strongly recommended |
| MinIO or persistent uploads | Recommended |
| `npm run backup:tenant` schedule | Yes |
| Cashfree webhook URL (if giving live) | Yes |

See [PILOT_SUPPORT.md](./PILOT_SUPPORT.md).

## Active monitors (dev)

| ID | Item |
|----|------|
| S-051 | Redis unset — sync queue fallback |
| S-052 | MinIO unset — local `/uploads` fallback |

These are expected in local dev; must be configured on VPS.
