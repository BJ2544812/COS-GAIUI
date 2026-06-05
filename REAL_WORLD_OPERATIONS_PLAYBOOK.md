# Kingdom Church OS — Real-World Operations Playbook

Operational checklists for live ministry use. Architecture is locked; these steps use production features only.

## Sunday preparation checklist

1. **Friday–Saturday:** Command Center → review volunteer gaps and upcoming services (use campus filter if multi-site).
2. **Worship Services:** Confirm run sheet segments and service status is APPROVED or ACTIVE.
3. **Volunteers:** Assign roles for Sunday service; resolve shortages flagged on Command Center.
4. **Attendance:** Create or open today’s service session before doors open.
5. **Sunday morning:** Open **Sunday Mode** → select today’s service → start segment timer when worship begins.
6. **During service:** Team tab for presence; Attendance module for check-in; Emergency alert only for true escalations.
7. **After service:** Complete final segment; close attendance session; review Command Center activity.

## Event operations checklist

1. Create event → REVIEW → APPROVED → open registration when ready.
2. Assign volunteers and communication campaign (Communication hub).
3. Open attendance session linked to `eventId` for multi-session events.
4. Post-event: outreach follow-ups; export operational report from Admin Center if needed.

## Incident recovery checklist

1. **Admin Center → Incidents** — note category (worker, backup, workflow, redis).
2. Fix root cause (DB, Redis, env, code deploy).
3. **Replay failed workflows** when failures are safe to retry.
4. Resolve incident in UI after verification.
5. Re-run `npm run verify:go-live` before returning to live ops.

## Deployment recovery checklist

1. Stop traffic to bad instance; restore previous build artifact if rollback required.
2. `npm run db:migrate` on target (never skip in production without DBA review).
3. `npm run deploy:production` or manual: migrate → generate → build → health → verify.
4. Confirm Redis + workers: check logs for `[Worker] Domain event worker started`.
5. Smoke: `npm run verify:stabilization` and critical E2E (`e2e/sunday-operations.spec.ts`).

## Low-infrastructure mode

| Missing | Behavior |
|---------|----------|
| Redis | Sync event processing; incident warns in Admin Center |
| MinIO | Uploads degrade; core ERP continues |
| Slow network | Command center cached 25s; retry buttons on Sunday Mode |

## Role quick reference

| Role | Primary surfaces |
|------|------------------|
| Pastor | Dashboard pastoral lens, care, discipleship |
| Worship lead | Sunday Mode, Worship Services, volunteers |
| Volunteer coord | Volunteers, Command Center gaps |
| Admin | Admin Center, settings, incidents, deployment |
| Finance | Finance / Giving / HR payroll (not Sunday live ops) |
| HR admin | HR Command Center, onboarding pipeline, leave policies |

See also: `SUNDAY_OPERATIONS_GUIDE.md`, `DEPLOYMENT.md`, `PRODUCTION_READINESS_REPORT.md`.
