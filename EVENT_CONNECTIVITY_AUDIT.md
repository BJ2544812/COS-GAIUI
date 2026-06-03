# Event Management Connectivity & Public Website Integration

Audit and implementation summary (no new `Event` table columns; public settings live in `Event.opsConfig.public`).

## Phase 1 — Field audit matrix

| Field (UI) | DB | API | Admin UI | Public website | Registration | Communication |
|------------|-----|-----|----------|----------------|--------------|---------------|
| Event title | `Event.name` | POST/PUT `events` | List, setup, workspace | Name on calendar & detail | — | EventCreated payload |
| Event type | `Event.type` | POST/PUT | Create, setup | Badge on cards | — | — |
| Date | `Event.date` | POST/PUT | Create, setup | Date/time display | — | — |
| Location | `Event.location` | POST/PUT | Create, setup | Location line | — | — |
| Campus | `Event.campusId` | PUT (future) | — | `campusName` when linked | — | — |
| Staff notes | `Event.internalNotes` | PUT | Setup, workspace | **Not exposed** | — | — |
| **Publish to website** | `opsConfig.public.publishedToWebsite` | `publicProfile` on POST/PUT | Create, setup | **Filters** `/website/public/events` | — | — |
| **Public description** | `opsConfig.public.publicDescription` | `publicProfile` | Create, setup | Description on detail & cards | — | — |
| **Event image** | `opsConfig.public.bannerImageUrl` | Upload + `publicProfile` | Create, setup | Banner on detail & cards | — | — |
| Speaker / category | `opsConfig.public.speaker/category` | `publicProfile` | Create, setup | Detail header | — | — |
| **Online registration** | `public.acceptsRegistration` + `registrationOpen` | `publicProfile` | Create, setup | Register form when open | POST register API | EventRegistrationCompleted |
| Capacity | `opsConfig.public.capacity` | `publicProfile` | Create, setup | Spots remaining | Enforced on register | — |
| Lifecycle status | `Event.status` | POST transition | Workspace (non-service) | Registration gating | Open when REGISTRATION_OPEN etc. | Domain events → notifications |
| Ticketed / budget / approvals | — | — | **Removed from create UI** | — | — | — |
| Run sheet | `Event.runSheet` | run-sheet API | Sunday & Services | — | — | — |
| Live ops | `opsConfig` (live keys) | live-ops API | Sunday Service | — | — | — |

## Phase 2 — Website integration status

| Requirement | Status |
|-------------|--------|
| Publish ON → public API | **Done** — only `publishedToWebsite === true` |
| Publish OFF → hidden | **Done** |
| Event image upload | **Done** — `POST /upload?scope=events&eventId=` |
| Public description | **Done** |
| Date, time, location, campus, speaker, category | **Done** on detail API |
| Public event page | **Done** — `/events/:id` |
| Calendar links | **Done** — cards link to `/events/:id` |

## Phase 3 — Registration

| Item | Status |
|------|--------|
| Public register form | **Done** |
| Stored registrations | **Done** — `opsConfig.public.registrations[]` (no separate `EventRegistration` table in schema) |
| Capacity limit | **Done** |
| Duplicate email block | **Done** |
| Attendance linkage | Manual — create check-in session in workspace; registrations are not auto-attendance rows |
| Waitlist | **Not implemented** — hidden |
| Payment | **Not implemented** — ticketing UI removed |

## Phase 4 — Ticketing

**Hidden.** No ticketed-event toggle or payment flow. Online registration is free RSVP only.

## Phase 5 — Publishing workflow

1. **Events → Create event** (or Setup on existing event)
2. Fill title, type, date, location
3. Enable **Publish to website**, optional image upload, description, registration
4. **Save**
5. Event appears on public site (`event_list` sections + `/events/:id`)
6. Guest registers → stored + admin notification

## Phase 6 — Communication

| Trigger | Status |
|---------|--------|
| EventCreated | Existing notification (worker) |
| Lifecycle transitions | Existing notifications |
| EventRegistrationCompleted | **Added** — notification + EventBus |
| Email campaigns | Not wired from event create UI |

## Phase 7 — Cleanup

Removed from create UI: ticketed/free/invite chips, budget, expense allocation, financial lead, fake publish toggle, approvals card, misleading footer copy.

## APIs changed

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/website/public/events` | Published events only |
| GET | `/api/v1/website/public/events/:id` | Published event detail |
| POST | `/api/v1/website/public/events/:id/register` | Public RSVP |
| POST | `/api/v1/upload?scope=events&eventId=` | Event banner image |
| POST/PUT | `/api/v1/events` | Accepts `publicProfile` |

## Files changed (implementation)

- `src/lib/eventPublicProfile.ts`
- `src/server/services/EventPublicService.ts`
- `src/server/services/EventService.ts`
- `src/server/services/WebsiteService.ts`
- `src/server/repositories/EventRepository.ts`
- `src/server/controllers/WebsiteController.ts`
- `src/server/routes/website.routes.ts`
- `src/server/controllers/UploadController.ts`
- `src/server/events/eventWorker.ts`
- `src/components/events/EventPublicPublishingFields.tsx`
- `src/components/events/EventWorkspace.tsx`
- `src/modules/events/EventsModule.tsx`
- `src/pages/PublicEventDetailPage.tsx`
- `src/lib/websiteSharedBlocks.tsx`
- `src/App.tsx`

## Remaining gaps (future)

- Dedicated `EventRegistration` Prisma model and admin registration list
- Paid ticketing / gateway integration
- Waitlist when at capacity
- Auto-create attendance row on registration
- Email confirmation to registrant
- `campusId` picker on create form
- Public landing page builder per event (slug-based)
