# Kingdom Church OS — Deployment Readiness

Production-oriented deployment, website, member portal, and commercialization foundations.

## First-time install

1. Copy `.env.example` → `.env` and set `DATABASE_URL`, `JWT_SECRET`, optional `REDIS_URL` and `MINIO_*`.
2. Run `npm run dev:prepare` (migrations + Prisma generate).
3. Start API: `npm run dev:server` — open app; if no tenant exists, the **Setup Wizard** runs infrastructure validation then creates the first tenant.
4. Optional sample data: `npm run seed` (idempotent per tenant).

## Deployment API (`/api/v1/deploy`)

| Route | Auth | Purpose |
|-------|------|---------|
| `GET /setup-status` | Public | Whether installer should run |
| `GET /version` | Public | Package version + recent migrations |
| `GET /infrastructure` | Tenant header | DB, Redis, MinIO, Socket, workers |
| `GET /onboarding` | Auth | Setup checklist from live data |
| `POST /backup` | `manage_settings` | Tenant JSON backup |
| `POST /restore` | `manage_settings` | Merge settings + pages from backup |
| `POST /demo/activate` | `manage_settings` | Demo walkthrough flag |
| `GET /license` | `manage_settings` | Module entitlements |

## Member portal

- Route: `/portal` (authenticated).
- API: `GET /api/v1/member-portal/summary` — requires user linked to a `Member` record.

## Public website

- SEO via `usePublicSeo` on public pages (title, description, Open Graph).
- Live stream banner when `organization.livestreamUrl` is set on home.
- Sermon archive: speaker/series filters; series from `[series:Name]` in sermon description.

## Backup CLI

```bash
npm run backup:tenant
# or
TENANT_ID=your-tenant npx tsx src/server/scripts/backup-tenant.ts ./backups/tenant.json
```

## Validation

```bash
npm run lint
npm run verify:runtime
npm run db:check
npm run test:pw -- e2e/deployment-launch.spec.ts e2e/communication-launch.spec.ts
```

See also [LAUNCH_READINESS.md](LAUNCH_READINESS.md) for communication, outreach, digests, and launch validation.

## System admin

**Admin Center → Deployment** — version, license modules, download backup.

Dashboard shows **Ministry onboarding** checklist until complete.
