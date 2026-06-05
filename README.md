<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Kingdom OS (development)

Local ministry operations app: API (`npm run dev:server`), Vite UI (`npm run dev`), Prisma + Postgres.

## Run locally

**Prerequisites:** Node.js, Postgres, `DATABASE_URL` in `.env`

1. `npm install` (uses `.npmrc` with `legacy-peer-deps=true` for optional peer conflicts in this workspace)
2. `npx prisma migrate deploy` (or `db push` per your workflow)
3. `npm run seed` (align `VITE_TENANT_ID` with the seeded tenant)
4. `npm run dev:server` and `npm run dev` in two terminals

Optional dev cleanup (duplicate members by email, same tenant): `ALLOW_DEV_DB_NORMALIZE=1 npm run db:dev-normalize`

## UI smoke tests (Playwright)

1. Start API + Vite (`npm run dev:server` and `npm run dev` in two terminals), with DB seeded and `VITE_TENANT_ID` matching the admin tenant.
2. Install browser binaries once: `npm run pw:install` (or `npx playwright install chromium` from this repo so versions match `package.json`)
3. Run: `npm run test:pw`

CI (starts servers automatically): `CI=1 npm run test:pw`

## Version 1.0

- **Sign-off report:** [V1_SIGN_OFF_REPORT.md](V1_SIGN_OFF_REPORT.md)
- **Documentation index:** [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
- **Production gate:** `npm run verify:v1` (requires API on port 4002 with full route set)
