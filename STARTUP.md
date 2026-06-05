# Kingdom OS — Local startup

Operational steps to run the app on a developer or tester machine. No UI changes are required for this process.

## Prerequisites

- **Node.js** 18+ (20 LTS recommended)
- **npm** (comes with Node)
- **PostgreSQL** 15+ (local install or Docker)
- **Git** clone of this repository

Optional (not required for core testing):

- **Redis** — Razorpay webhooks can run synchronously without it
- **MinIO** — file uploads may warn if unreachable; core flows still work
- **Playwright Chromium** — `npm run pw:install` (once per machine)

## 1. Environment file

```bash
cp .env.example .env
```

Edit `.env` at the repo root. Minimum for local dev:

| Variable | Example | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql://postgres:password@localhost:5432/church_erp` | Postgres connection |
| `VITE_TENANT_ID` | `default-tenant-id` | Must match seeded tenant (see [TESTER_GUIDE.md](./TESTER_GUIDE.md)) |

Leave **`VITE_API_BASE_URL` unset** in dev so the UI uses Vite’s proxy to the API (`/api/v1`).

Optional:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `4002` | API listen port |
| `JWT_SECRET` | dev fallback | Session signing |
| `VITE_DEV_PROXY_TARGET` | `http://127.0.0.1:4002` | Only if API is not on 4002 |
| `RAZORPAY_MODE` | `test` (non-production) | Must match Razorpay key prefix (`rzp_test_` vs `rzp_live_`) |

If login fails with valid credentials, confirm `VITE_TENANT_ID` matches the tenant created by `npm run seed` (see `.env.example` note about `default-tenant` vs `default-tenant-id`).

## 2. Database (first time or after schema change)

**Postgres via Docker (recommended):**

```bash
docker compose up -d postgres
```

Host port **5432**, database name default `church_erp` (see `docker-compose.yml`).

**Apply migrations and generate Prisma client:**

```bash
npm install
npm run dev:prepare
```

(`dev:prepare` = `prisma migrate deploy` + `prisma generate`)

**Seed demo data and admin user:**

```bash
npm run seed
```

Expected console output includes: **`admin` / `admin123`**.

## 3. Required ports

| Port | Service | URL |
|------|---------|-----|
| **3001** | Vite frontend (strict default in config) | http://127.0.0.1:3001 |
| **4002** | Express API | http://127.0.0.1:4002 |
| **5432** | PostgreSQL | `DATABASE_URL` |
| **6380** | Redis (optional, Docker maps 6380→6379) | Only if `REDIS_URL` is set |
| **9000** | MinIO (optional) | Only if using uploads against MinIO |

Use **127.0.0.1** in the browser on Windows if `localhost` behaves inconsistently.

## 4. Run the application (two terminals)

**Terminal A — API:**

```bash
npm run dev:server
```

If you see partial 404s on `/deploy/*` or `/platform/*` while `/events` works, a **stale API process** is still bound to port 4002:

```bash
npm run runtime:clean
npm run dev:server:fresh
```

On boot the API verifies all V1 routes and **exits** if any critical group is missing (`/health/routes` must report `ready`). Validate with:

```bash
npm run verify:v1
```

Wait for: `Kingdom OS API listening on http://127.0.0.1:4002`

**Terminal B — UI:**

```bash
npm run dev
```

Wait for Vite on **http://127.0.0.1:3001**

### Quick health checks

- API: http://127.0.0.1:4002/health → `status: healthy`
- Public site: http://127.0.0.1:3001/
- Staff login: http://127.0.0.1:3001/login
- Admin shell (after login): http://127.0.0.1:3001/admin

## 5. Verify runtime (optional)

With both servers running:

```bash
set RUNTIME_VERIFY_UI_BASE=http://127.0.0.1:3001
npm run verify:runtime
```

On PowerShell:

```powershell
$env:RUNTIME_VERIFY_UI_BASE='http://127.0.0.1:3001'
npm run verify:runtime
```

Expect `"passed": true` in the JSON summary.

## 6. Playwright (automated smoke)

**Requires API + UI already running** (steps 4–5).

One-time browser install:

```bash
npm run pw:install
```

Run full suite (35 tests, ~3–6 minutes):

```bash
npm run test:pw
```

Uses `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001` (set in `package.json`).

**CI mode** (starts API + Vite automatically; dynamic UI port):

```bash
npm run test:pw:ci
```

Optional env for login tests:

| Variable | Default |
|----------|---------|
| `E2E_USER` | `admin` |
| `E2E_PASS` | `admin123` |

## 7. Typecheck

```bash
npm run lint
```

Runs `tsc --noEmit` (no separate ESLint script in this repo).

## Troubleshooting

| Symptom | Check |
|---------|--------|
| `ECONNREFUSED` on 3001 | Start `npm run dev` |
| `ECONNREFUSED` on 4002 | Start `npm run dev:server` |
| Login works in UI but API calls fail | Proxy: API must be on 4002; see `VITE_DEV_PROXY_TARGET` |
| `Port 4002 is already in use` | Stop old `dev:server` or set `PORT=` in `.env` |
| Playwright all fail immediately | Dev servers not running; use `npm run test:pw` only with 3001+4002 up |
| Prisma / wrong DB port | Stale `DATABASE_URL` in system env; ensure `.env` wins (see `.env.example`) |

## Related docs

- [TESTER_GUIDE.md](./TESTER_GUIDE.md) — credentials, URLs, Razorpay, reset flows  
- [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) — placeholder modules and disabled UI
