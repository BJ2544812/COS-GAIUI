# Kingdom Church OS — Documentation Index (v1.0)

Central index for operators, administrators, and deployers.

## Getting started

| Document | Audience | Purpose |
|----------|----------|---------|
| [STARTUP.md](STARTUP.md) | Developers | Local dev boot, ports, seed |
| [ONBOARDING_GUIDE.md](ONBOARDING_GUIDE.md) | Church admins | First login, branding, first Sunday |
| [TESTER_GUIDE.md](TESTER_GUIDE.md) | QA / testers | E2E flows, credentials, modules |

## Operations

| Document | Audience | Purpose |
|----------|----------|---------|
| [OPERATOR_HANDBOOK.md](OPERATOR_HANDBOOK.md) | Staff / coordinators | Day-to-day module usage |
| [SUNDAY_OPERATIONS_GUIDE.md](SUNDAY_OPERATIONS_GUIDE.md) | Sunday team | Sunday Mode, live ops |
| [REAL_WORLD_OPERATIONS_PLAYBOOK.md](REAL_WORLD_OPERATIONS_PLAYBOOK.md) | Leadership | Scenarios under pressure |

## Administration & deployment

| Document | Audience | Purpose |
|----------|----------|---------|
| [ADMIN_GUIDE.md](ADMIN_GUIDE.md) | System admins | RBAC, flags, governance |
| [DEPLOYMENT.md](DEPLOYMENT.md) | DevOps | Docker, env, migrations |
| [RECOVERY_GUIDE.md](RECOVERY_GUIDE.md) | DevOps / admins | Backup, restore, incidents |

## Architecture & contracts

| Document | Audience | Purpose |
|----------|----------|---------|
| [API_CONTRACTS.md](API_CONTRACTS.md) | Integrators | API shapes, errors, pagination |
| [EVENT_CONTRACTS.md](EVENT_CONTRACTS.md) | Engineers | Domain & realtime events |
| [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) | All | Documented gaps |

## Release & quality

| Document | Audience | Purpose |
|----------|----------|---------|
| [docs/MODULE_LOCKS.md](docs/MODULE_LOCKS.md) | Engineers / product | **Platform lock status**, reopen rules, future-work protocol |
| [docs/KNOWN_BACKLOG.md](docs/KNOWN_BACKLOG.md) | Engineers / product | Deferred enhancements (not blockers) |
| [V1_SIGN_OFF_REPORT.md](V1_SIGN_OFF_REPORT.md) | Stakeholders | v1.0 sign-off summary |
| [RELEASE_CANDIDATE_REPORT.md](RELEASE_CANDIDATE_REPORT.md) | Stakeholders | RC deliverables |
| [PRODUCTION_READINESS_REPORT.md](PRODUCTION_READINESS_REPORT.md) | Stakeholders | Go-live hardening |
| [FUTURE_ROADMAP.md](FUTURE_ROADMAP.md) | Product | Post-v1 evolution |

## Runtime activation

| Document | Purpose |
|----------|---------|
| [RUNTIME_ACTIVATION_REPORT.md](RUNTIME_ACTIVATION_REPORT.md) | Live route probes, READY/WARNING/BLOCKED |

```bash
npm run runtime:clean
npm run dev:server:fresh
npm run verify:v1
npm run report:runtime
```

## Validation commands

```bash
npm run lint
npm run verify:v1
npm run test:pw -- e2e/v1-signoff.spec.ts
npm run deploy:production
```
