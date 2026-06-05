# Kingdom Church OS — API Contracts

## Base URL

- Staff API: `/api/v1`
- Health: `GET /health` (no tenant)
- Setup: `GET /api/v1/deploy/setup-status` (no auth)

## Headers

| Header | Required | Notes |
|--------|----------|-------|
| `Authorization` | Staff routes | `Bearer <jwt>` |
| `x-tenant-id` | Tenant routes | UUID |
| `x-correlation-id` | Optional | Echoed in logs / errors |

## Success response

```json
{
  "status": "success",
  "data": { }
}
```

## Error response

```json
{
  "status": "error",
  "error": "human_readable_code_or_message",
  "message": "optional detail"
}
```

HTTP status codes: `400` validation, `401` auth, `403` RBAC, `503` maintenance mode.

## Pagination (list endpoints)

Where supported, use `?limit=` and `?offset=` query params. Default limits apply per repository.

## Versioning

- Path prefix `/api/v1` is stable for this release candidate.
- Breaking changes require a new major path (`/api/v2`).

## Operator endpoints (settings admin)

| Method | Path |
|--------|------|
| POST | `/platform/operator/cache-flush` |
| GET | `/platform/operator/diagnostics` |
| GET | `/platform/operator/diagnostics/export` |
| GET | `/platform/search?q=` |
| GET | `/platform/incidents` |
| POST | `/platform/workflows/replay-failed` |

## Deployment

| Method | Path |
|--------|------|
| GET/PUT | `/deploy/maintenance` |
| POST | `/deploy/demo/activate` |
| POST | `/deploy/demo/reset` |
| GET | `/deploy/license` |
