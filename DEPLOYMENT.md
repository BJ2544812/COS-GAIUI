# Church OS — Production Deployment Guide

Operational deployment for the Kingdom OS ERP stack (PostgreSQL, Redis, optional MinIO, Playwright PDF generation).

## 1. Prerequisites

- **Node.js** 18+ (22 LTS recommended)
- **Docker** & **Docker Compose** (production stack)
- **Playwright Chromium** on the API host (`npm run pw:install`) — required for voucher and donation receipt PDFs

## 2. Environment

Copy `.env.production.example` to `.env.production` (or `.env`) and set:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Auth token signing (long random string) |
| `REDIS_URL` | Queue / rate-limit (if worker enabled) |
| `PORT` | API port (default 4002 in dev) |
| `VITE_API_URL` | Public API base for built SPA |
| `MINIO_*` | Object storage (optional; uploads also use local `uploads/`) |

Run migrations before first boot:

```bash
npm run db:migrate
npm run seed   # optional dev/demo data
```

## 3. Docker production flow

**Recommended (V1 pilot):** use the hardened stack with healthchecks and nginx template:

```bash
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d
```

Copy `deploy/nginx.production.conf` to your VPS nginx site. It proxies:

- `/api` → API (default port **4002** in compose)
- `/uploads` → static uploads volume
- `/socket.io` → WebSocket (same upstream, upgrade headers)
- `/health/live`, `/health/ready` → readiness for orchestration

Services (see `docker-compose.production.yml`):

- **app** — API + static frontend + **in-process** BullMQ workers (no separate worker container in V1)
- **postgres** — primary database
- **redis** — job queue (AOF persistence in production compose)
- **minio** — S3-compatible attachments (optional)

Persist volumes: `postgres_data`, `uploads_data`, `redis_data`, `minio_data`.

Legacy `docker-compose.yml` may still list a **worker** service; that entry was removed from V1 because workers run inside the API process. Do not rely on `npm run start:worker` — it does not exist.

## 4. Backup & restore

**PostgreSQL**

```bash
docker exec church-erp-postgres pg_dump -U postgres church_erp > backup-$(date +%F).sql
# restore
cat backup.sql | docker exec -i church-erp-postgres psql -U postgres church_erp
```

**Uploads** (PDFs, signatures, logos):

```bash
docker cp church-erp-app:/app/uploads ./uploads-backup
```

Schedule daily DB dumps + weekly `uploads/` sync to off-site storage.

## 5. Monitoring & logging

- **Liveness:** `GET /health/live` (or via nginx `/health/live`)
- **Readiness:** `GET /health/ready` (503 if database unreachable)
- **App health:** `GET /api/v1/health` (tenant-aware checks when authenticated)
- Run `npm run verify:runtime` after deploy
- Run `npm run backup:validate` after backup policy changes → updates `BACKUP_VALIDATION_REPORT.md`
- Log API stderr to your host aggregator (JSON lines recommended)
- Alert on: migration failure, PDF generation errors, 5xx rate, disk full on `uploads/`

See also **[PRODUCTION_HARDENING_STATUS.md](./PRODUCTION_HARDENING_STATUS.md)** and **[RESTORE_RUNBOOK.md](./RESTORE_RUNBOOK.md)**.

### Graceful restart

The API handles **SIGTERM/SIGINT**: closes HTTP, drains BullMQ workers, disconnects Redis and Prisma.

```bash
docker compose -f docker-compose.production.yml restart app
# or rolling: docker compose -f docker-compose.production.yml up -d --no-deps app
```

After restart, confirm:

1. `npm run verify:runtime` (from CI or ops host with `DATABASE_URL`)
2. `GET /health/ready` returns 200
3. One login + Finance dashboard load

### SSL & domain

- Terminate TLS at nginx/Caddy/Traefik; use `deploy/nginx.production.conf` as the base
- Proxy to app on port **4002** (or match `PORT` in compose)
- Set `PUBLIC_API_URL=https://api.yourchurch.org` so Cashfree webhooks and receipt links use HTTPS
- Webhook path: `POST https://api.yourchurch.org/api/v1/giving/webhooks/cashfree`
- Point `VITE_API_URL` at the same public API base used by the SPA build

### Cashfree sandbox UAT (before go-live)

```bash
npm run uat:cashfree
```

Configure sandbox keys in **Settings → Online Giving**, then complete a real sandbox checkout on `/donate` and reconcile in **Giving → Settlement Recon**.

## 6. Local development

```bash
npm install
npm run dev:prepare
npm run dev:server    # API :4002
npm run dev           # Vite :3001
```

E2E: `npm run test:pw` (requires both servers; set `PLAYWRIGHT_BASE_URL` if Vite uses another port).

## 7. Security

- Never commit `.env` or secrets
- Restrict network access to Postgres/Redis
- Use HTTPS reverse proxy (nginx/Caddy) in production
- Rotate `JWT_SECRET` only with a planned session logout

---

*Legacy note: older docs referenced SQLite `church.db`. Current production path is PostgreSQL via Prisma.*
