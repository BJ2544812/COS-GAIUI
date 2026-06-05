# Pilot Church — Setup Checklist

**Complete before staff UAT and training.**  
**Owner:** Church Administrator + IT partner  
**Environment:** Staging first, then production

---

## Phase 1 — Infrastructure

| # | Task | Owner | Done | Date |
|---|------|-------|------|------|
| 1.1 | PostgreSQL provisioned; `DATABASE_URL` set | IT | ☐ | |
| 1.2 | API server running (`/health` returns OK) | IT | ☐ | |
| 1.3 | Web app served (HTTPS recommended) | IT | ☐ | |
| 1.4 | `REDIS_URL` set (recommended for background jobs) | IT | ☐ | |
| 1.5 | Object storage (MinIO/S3) for uploads | IT | ☐ | |
| 1.6 | Run `prisma migrate deploy` on target database | IT | ☐ | |
| 1.7 | Run initial seed **only if greenfield** (`npm run seed`) — **not** on production with live data | IT | ☐ | |
| 1.8 | JWT secret and tenant ID configured | IT | ☐ | |
| 1.9 | CORS / domain allowlist for church URL | IT | ☐ | |

---

## Phase 2 — Church identity

| # | Task | Owner | Done | Date |
|---|------|-------|------|------|
| 2.1 | Sign in as platform admin; complete setup wizard if shown | Admin | ☐ | |
| 2.2 | **Settings** → Organization: legal name, address, phone, email | Admin | ☐ | |
| 2.3 | Upload logo and brand colors | Admin | ☐ | |
| 2.4 | Set timezone and currency | Admin | ☐ | |
| 2.5 | Verify public website shows church name (`/`) | Admin | ☐ | |

---

## Phase 3 — Chart of accounts & finance baseline

| # | Task | Owner | Done | Date |
|---|------|-------|------|------|
| 3.1 | Review chart of accounts in **Settings** / Finance | Treasurer | ☐ | |
| 3.2 | Configure giving funds / campaigns | Treasurer | ☐ | |
| 3.3 | Enter opening balances (if migrating) | Treasurer | ☐ | |
| 3.4 | Test one gift + one voucher in **staging** | Treasurer | ☐ | |
| 3.5 | Payment gateway (Cashfree/etc.) sandbox test if online giving | Treasurer | ☐ | |

---

## Phase 4 — People data

| # | Task | Owner | Done | Date |
|---|------|-------|------|------|
| 4.1 | Import or enter core member list | Admin | ☐ | |
| 4.2 | Create families / households | Admin | ☐ | |
| 4.3 | Create small groups; assign leaders | Admin | ☐ | |
| 4.4 | Link staff users to member profiles | Admin | ☐ | |

---

## Phase 5 — Staff accounts (production)

| # | Task | Role created | Username | Done |
|---|------|--------------|----------|------|
| 5.1 | Senior Pastor | Pastor | | ☐ |
| 5.2 | Church Administrator | Admin | | ☐ |
| 5.3 | Treasurer | Finance | | ☐ |
| 5.4 | Volunteer coordinator | Volunteers | | ☐ |
| 5.5 | Communications | Secretary | | ☐ |
| 5.6 | HR (if used) | HR | | ☐ |
| 5.7 | Issue **member** portal accounts (batch or self-signup policy) | Admin | ☐ | |

**Do not use demo passwords (`demo123`) in production.**

---

## Phase 6 — Sunday & communications ready

| # | Task | Owner | Done | Date |
|---|------|-------|------|------|
| 6.1 | Create next Sunday event | Admin | ☐ | |
| 6.2 | Create attendance session for Sunday | Admin | ☐ | |
| 6.3 | Assign key volunteers | Coordinator | ☐ | |
| 6.4 | Publish one test announcement | Comms | ☐ | |
| 6.5 | Publish one sermon (optional) | Admin | ☐ | |

---

## Phase 7 — UAT readiness

| # | Task | Owner | Done | Date |
|---|------|-------|------|------|
| 7.1 | Distribute [UAT_TRACKING_DASHBOARD.md](./UAT_TRACKING_DASHBOARD.md) | Lead | ☐ | |
| 7.2 | Assign testers per [UAT_TEST_PLAN.md](../../UAT_TEST_PLAN.md) | Lead | ☐ | |
| 7.3 | Open [DEFECT_LOG.md](./DEFECT_LOG.md) | Lead | ☐ | |
| 7.4 | Schedule UAT week | Lead | ☐ | |

---

## Setup sign-off

| Role | Name | Date |
|------|------|------|
| Church Administrator | | |
| Treasurer | | |
| IT partner | | |

**Ready for UAT:** ☐ Yes ☐ No
