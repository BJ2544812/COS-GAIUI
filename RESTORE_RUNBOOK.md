# Kingdom Church OS — Restore Runbook

**Mode:** Production pilot (V1 locked)  
**Prerequisite:** A validated backup is not complete until this runbook has been executed successfully on a non-production clone at least once.

---

## Backup types

| Type | Tool | Contents |
|------|------|----------|
| Tenant JSON manifest | `npm run backup:tenant` or Admin Center → Deployment | Settings, pages, member summary, events summary |
| Full database | `pg_dump` / managed Postgres snapshot | All tenants, accounting, members, HR |
| Upload objects | MinIO bucket snapshot or `uploads/` volume copy | Logos, receipts, staff documents |
| Redis | Optional RDB/AOF copy | Queues only — not required for accounting restore |

---

## 1. Validate export (automated)

```powershell
npm run backup:validate
```

Review [BACKUP_VALIDATION_REPORT.md](./BACKUP_VALIDATION_REPORT.md).

---

## 2. PostgreSQL restore (disaster recovery)

**On a clean Postgres instance (staging first):**

```bash
# Stop API to prevent writes
docker compose -f docker-compose.production.yml stop app

# Restore from dump (example)
pg_restore -d church_erp --clean --if-exists backup.dump

# Or SQL:
psql -d church_erp -f backup.sql

# Migrate if restoring older dump onto newer code
npm run db:migrate

# Start API
docker compose -f docker-compose.production.yml up -d app
```

Verify:

```bash
curl http://127.0.0.1:4002/health/ready
npm run stabilization:gate
```

---

## 3. JSON manifest restore (settings + website pages)

**Admin UI:** Admin Center → Deployment → Restore (upload JSON).

**API:** `POST /api/v1/deploy/restore` with manifest body (requires `manage_settings`).

Restores:

- Tenant settings keys
- Website `pageData` slugs

Does **not** restore members, vouchers, or HR records — use database restore for those.

---

## 4. MinIO / uploads restore

1. Stop API.
2. Restore MinIO bucket data to the same `MINIO_*` paths, **or** copy files into Docker volume `uploads_data`.
3. Start API and upload a test logo in Settings.

---

## 5. Rollback after bad deploy

1. Stop traffic (maintenance mode in Admin Center).
2. Redeploy previous container image / `dist` artifact.
3. Restore DB snapshot if migrations ran on bad build.
4. `npm run stabilization:gate` and `npm run test:pilot` against restored stack.

---

## 6. Post-restore checklist

- [ ] Admin login works (`/health/ready` = 200)
- [ ] Tenant branding and settings visible
- [ ] Public website loads
- [ ] Finance ledger balances unchanged (spot-check)
- [ ] HR employment profiles present (if applicable)
- [ ] `npm run test:pilot` on staging URL

---

## Related

- [PILOT_SUPPORT.md](./PILOT_SUPPORT.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [BACKUP_VALIDATION_REPORT.md](./BACKUP_VALIDATION_REPORT.md)
