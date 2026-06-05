# Kingdom Church OS — Recovery Guide (v1.0)

Procedures for backup, restore, maintenance, and incident recovery.

## Backup layers

### 1. PostgreSQL (authoritative data)

```bash
docker exec church-erp-postgres pg_dump -U postgres church_erp > backup-$(date +%F).sql
```

Store off-site. Test restore quarterly on a staging instance.

### 2. Application tenant backup (settings + website pages)

From **System admin center → Deployment**:

- **Download backup** — JSON export of tenant settings and published website pages.
- Does **not** replace full database backup for members, finance, or attendance.

### 3. Uploads volume

Back up `uploads/` (PDFs, signatures, logos) with your object storage or volume snapshots.

## In-app tenant restore

1. Admin center → Deployment → **Restore from JSON**.
2. Confirm the dialog — merges settings and published pages only.
3. Download a fresh backup before restoring.

API: `POST /api/v1/deploy/restore` (requires `manage_settings`).

## Maintenance mode

Enable from **Operator toolkit** when performing upgrades:

- Non-admin staff APIs return **503** with a friendly message.
- Admins retain access for verification.
- Disable maintenance after health checks pass.

## Redis / worker recovery

| Symptom | Action |
|---------|--------|
| Workflows stuck pending | Confirm Redis `REDIS_URL`; restart worker container |
| Failed workflow events | Admin center → replay failed workflows (confirmed) |
| Realtime disconnected | Clients auto-reconnect; verify JWT and Socket.IO path |

## Database migration upgrades

1. Enable maintenance mode.
2. `npm run db:migrate`
3. Restart API and worker.
4. `npm run verify:v1`
5. Disable maintenance mode.

## Incident response

1. **Admin center → Incidents** — review open incidents, failed workflows, queue depth.
2. Export diagnostics from **Operator toolkit** for support.
3. Flush command-center cache if stale aggregates persist after recovery.

## Stale locks

Workflow replay and worker restart clear most stale locks. If a Sunday ops lock persists, coordinate via command center presence before forcing unlock.

## Validation after recovery

```bash
npm run verify:v1
npm run test:pw -- e2e/v1-signoff.spec.ts
```

## Related

- [DEPLOYMENT.md](DEPLOYMENT.md)
- [ADMIN_GUIDE.md](ADMIN_GUIDE.md)
- [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md)
