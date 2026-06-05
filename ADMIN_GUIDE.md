# Kingdom Church OS — Administrator Guide (v1.0)

For church system administrators and platform operators.

## Access model

- **RBAC** — permissions are role-based; finance and settings require explicit grants.
- **Tenant isolation** — every API call is scoped by `x-tenant-id` and JWT.
- **Audit** — sensitive actions append to audit logs (Admin center → Audit).

## System admin center

| Tab | Purpose |
|-----|---------|
| Health | Service probes, database, queue |
| Incidents | Open incidents, failed workflows, backup runs |
| Operator toolkit | Cache flush, diagnostics, maintenance, demo reset |
| Governance | License, campuses, users overview |
| Feature flags | Toggle module availability per tenant |
| Audit | Searchable audit trail |
| Exports | Analytics and compliance exports (permission-gated) |
| Deployment | Backup download, JSON restore, infrastructure |

## Destructive actions (confirmation required)

- Campaign broadcast send
- Workflow failed-event replay
- Tenant JSON restore
- Demo reset (sandbox)
- Maintenance mode enable

All use `ConfirmDialog` with clear consequences.

## Feature flags

Disable modules your church does not use yet to reduce operator noise. Flags take effect on next navigation; no architecture change required.

## Integrations

View registered adapters at `/api/v1/platform/integrations`. Provider credentials belong in environment variables, not the database. See [API_CONTRACTS.md](API_CONTRACTS.md).

## Security checklist

- [ ] `JWT_SECRET` set (long random, production only)
- [ ] Default admin password changed after install
- [ ] HTTPS termination in front of API
- [ ] Rate limits active (auth, public website, communication)
- [ ] Backups scheduled and verified

## Performance operations

- Command center and intelligence endpoints are cached — use **Flush ops cache** after major data imports.
- Worker concurrency via `EVENT_WORKER_CONCURRENCY`.
- Scale reads with PostgreSQL replicas (future); v1.0 is single-primary.

## Validation

```bash
npm run verify:v1
```

## Related

- [RECOVERY_GUIDE.md](RECOVERY_GUIDE.md)
- [DEPLOYMENT.md](DEPLOYMENT.md)
- [EVENT_CONTRACTS.md](EVENT_CONTRACTS.md)
