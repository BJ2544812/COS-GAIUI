# Kingdom Church OS — Launch Readiness

Operational communication ecosystem, outreach follow-up, prayer/care coordination, scheduled digests, backup automation, and validation gates for production launch.

## Communication command center

**Module:** Communication → Command center, Compose, Prayer & care, Delivery log

**APIs (`manage_communication`):**

| Endpoint | Purpose |
|----------|---------|
| `GET /communication/hub` | Dashboard + campaign list + analytics |
| `POST /communication/hub/audience/preview` | Audience size from live filters |
| `POST /communication/hub/campaigns` | Create campaign |
| `POST /communication/hub/campaigns/:id/send` | Deliver multi-channel |

**Channels:** `in_app` (real notifications), `email` / `sms` / `whatsapp` (provider abstraction — logged/queued until SMTP/SMS/WhatsApp env is set).

**Audience filters:** campus, volunteer role, growth stage, ministry, engagement score, attendance window, event attendance.

## Outreach & follow-up

**Module:** Outreach

| Endpoint | Purpose |
|----------|---------|
| `GET /outreach/dashboard` | Stats, contacts, follow-up queue |
| `POST /outreach/visitors` | Register first-time or repeat visitor |
| `POST /outreach/follow-ups/:id/complete` | Complete follow-up |
| `POST /outreach/scan/missed-attendance` | Queue missed-attendance follow-ups |

Integrates with **tasks**, **notifications**, and **domain events** (`VisitorRegistered`, `FollowUpCompleted`).

## Prayer & care

**APIs (`manage_discipleship`):**

| Endpoint | Purpose |
|----------|---------|
| `GET /care/dashboard` | Care cases + pastoral prayer load |
| `GET /care/prayer` | Prayer list (RBAC-filtered) |
| `POST /care/prayer/:id/assign` | Pastoral assignment |
| `PATCH /care/prayer/:id` | Status, urgency, testimony |

Confidentiality uses existing `ConfidentialityLevel` enum; pastoral/admin roles see restricted requests.

## Scheduled operations

When the database is connected at boot:

- **Digests** every 12h (`daily_ops` per tenant) → `OperationalDigest` + in-app notification
- **Backups** every 24h → `BackupRun` records with size verification
- **Failed event replay** every 15m via `EventBus.replayFailedEvents()`

Manual digest generation: `POST /api/v1/digests/generate-all` (`manage_settings`).

## Backup & recovery

| Endpoint | Purpose |
|----------|---------|
| `GET /deploy/backups` | Backup run history |
| `POST /deploy/backups/run` | On-demand scheduled backup |
| `POST /deploy/backups/verify` | Integrity check on latest run |
| `POST /deploy/backup` | Full JSON manifest export |
| `POST /deploy/restore` | Settings + pages restore |

CLI: `npm run backup:tenant`

## Validation checklist

```bash
npm run db:migrate
npm run lint
npm run verify:runtime
npm run test:pw -- e2e/communication-launch.spec.ts e2e/deployment-launch.spec.ts
```

## Sunday operations (quick reference)

1. **Sunday Mode** — live service coordination
2. **Attendance** — check-in (offline buffer supported)
3. **Outreach** — register guests → auto follow-up queue
4. **Communication** — service reminders via campaigns (`in_app` channel)
5. **Command center** — readiness + volunteer boards

## Demo & onboarding

- Dashboard **Ministry onboarding** checklist (`GET /deploy/onboarding`)
- **Demo mode:** `POST /deploy/demo/activate` + `npm run seed`
- Member portal: `/portal`

## Guides

- [DEPLOYMENT_READINESS.md](DEPLOYMENT_READINESS.md) — installer, infrastructure, first tenant
- [STARTUP.md](STARTUP.md) — local dev boot (if present)
