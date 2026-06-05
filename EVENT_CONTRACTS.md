# Kingdom Church OS — Event Contracts

Locked event-driven architecture. This document describes contracts for operators and integrators.

## Domain events (`EventBus` / `eventLog`)

| Event | Entity | Typical triggers |
|-------|--------|------------------|
| `MemberCreated` | Member | New member record |
| `EventCreated` | Event | Draft event |
| `EventApproved` | Event | Approval workflow |
| `RegistrationOpened` | Event | Registration enabled |
| `DonationReceived` | Donation | Giving posted |
| `OperationalRefresh` | Tenant | Ops cache invalidation signal |
| `CommunicationCampaignSent` | Campaign | Bulk send completed |
| `FollowUpCompleted` | OutreachFollowUp | Outreach task done |

**Status lifecycle:** `PENDING` → `PROCESSED` | `FAILED` (BullMQ retries when Redis configured)

**Replay:** Admin Center → Incidents or `POST /api/v1/platform/workflows/replay-failed`

## Realtime events (`socket.io`)

Scoped by `tenantId`, optional `eventId` / `serviceId` / `role`.

| Event constant | Purpose |
|----------------|---------|
| `service:update` | Live ops / run sheet |
| `ops:refresh` | Command center refresh |
| `volunteer:update` | Volunteer board |
| `attendance:update` | Check-in stream |
| `event:status` | Lifecycle change |
| `notification:new` | In-app notification |
| `presence:update` | Operator presence |

**Auth:** JWT on socket handshake (same as REST).

## Analytics events (`analyticsEvent`)

Append-only `analyticsEvent` rows for dashboards. Distinct from workflow `eventLog`.

## Integration adapters

See `src/server/integrations/types.ts` and `GET /api/v1/platform/integrations` for registered provider slots (email, SMS, WhatsApp, analytics, SSO).
