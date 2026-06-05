# Kingdom Church OS — Release Candidate Report

**Version:** Superseded by v1.0 — see [V1_SIGN_OFF_REPORT.md](V1_SIGN_OFF_REPORT.md) (package `1.0.0`)  
**Status:** Release-candidate (historical)

## Executive summary

Kingdom Church OS is an enterprise-grade, church-ready operating system with locked architecture: event-driven workflows, tenant-isolated finance, realtime Sunday operations, deployment automation, and commercial onboarding foundations.

## Architecture (unchanged)

- Multi-tenant PostgreSQL + Prisma
- Domain `EventBus` + BullMQ worker (`EVENT_WORKER_CONCURRENCY`)
- Socket.IO realtime with JWT
- Repository-isolated modules, append-only audit trails

## Release candidate deliverables

| Phase | Outcome |
|-------|---------|
| UI polish | Shared `opsUi` tokens, `ConfirmDialog`, operational guidance banners |
| Commercial | License badge in shell, maintenance mode, demo reset, branding email fields |
| Safety | Confirmed campaign send, confirmed workflow replay |
| Search | Expanded global search (volunteers, prayer, outreach, workflows) + recent modules |
| Operator toolkit | Cache flush, diagnostics export, maintenance toggle |
| Integrations | Adapter contracts + registry (`/platform/integrations`) |
| Docs | `EVENT_CONTRACTS.md`, `API_CONTRACTS.md`, playbooks (prior phases) |

## Security posture

- Auth + RBAC unchanged
- Maintenance mode blocks non-admin staff APIs
- Rate limits (auth, public, communication) from go-live phase
- Sensitive exports require `manage_analytics` / `manage_settings`

## Scalability posture

- DB indexes on Event, Attendance, EventLog, Notification
- Command center + intelligence caching
- Configurable worker concurrency

## Validation commands

```bash
npm run lint
npm run verify:go-live
npm run verify:stabilization
npm run verify:release
npm run test:pw -- e2e/release-candidate.spec.ts
npm run deploy:production
```

## Future roadmap

See `FUTURE_ROADMAP.md` — external observability, payment metering, native apps, SSO providers.

---

*Generated for commercial release candidate finalization.*
