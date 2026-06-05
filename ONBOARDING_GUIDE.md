# Kingdom Church OS — Onboarding Guide (v1.0)

First-time setup for a new church tenant.

## 1. Installation (technical)

Follow [DEPLOYMENT.md](DEPLOYMENT.md):

1. Configure `.env` (database, JWT, Redis).
2. Run `npm run db:migrate`.
3. Start API + worker + frontend (`npm run dev` or Docker production stack).
4. Run `npm run verify:v1` to confirm the stack is healthy.

## 2. First login

1. Open the staff application URL.
2. Sign in with the administrator account created during seed or installer.
3. Confirm the **license** badge appears in the shell (deployment metadata).

## 3. Church identity

1. Open **Settings** (or Admin center → Church branding).
2. Set church name, logo, primary colors, and contact email.
3. Publish the public website homepage from **Website**.

## 4. Structure

1. Add **campuses** if multi-site.
2. Configure **ministry structure** and serving roles.
3. Import or add core **members** and families.

## 5. First Sunday

1. Create a **service event** in Events (or worship planning).
2. Build the **run sheet** for Sunday Mode.
3. Assign **volunteers** to the service.
4. Run a rehearsal in Sunday Mode before live Sunday.

## 6. First external-facing flows

1. Verify **public website** (homepage, giving, livestream links).
2. Test **member portal** login with a test member.
3. Send a test **communication** campaign to a small segment before church-wide broadcast.

## 7. Operational readiness

| Check | Where |
|-------|--------|
| Command center loads | Operations |
| Incidents panel empty or acknowledged | Admin center |
| Backup configured | Admin center → Deployment |
| Feature flags reviewed | Admin center → Flags |

## 8. Demo reset (sandbox only)

In non-production demos, **Operator toolkit → Demo reset** clears operational demo data. Never use on a live congregation database.

## Next steps

- [OPERATOR_HANDBOOK.md](OPERATOR_HANDBOOK.md) — daily operations
- [SUNDAY_OPERATIONS_GUIDE.md](SUNDAY_OPERATIONS_GUIDE.md) — live Sunday
- [ADMIN_GUIDE.md](ADMIN_GUIDE.md) — governance and security
