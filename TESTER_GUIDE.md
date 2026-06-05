# Kingdom OS — Tester guide

Handoff for external testers. This build is **feature-complete for core church operations**; some sidebar modules are placeholders. **Do not expect visual redesign** during the test window—the public flagship website layout is locked.

## Quick links

| What | URL |
|------|-----|
| Public website (home) | http://127.0.0.1:3001/ |
| Public pages | `/about`, `/ministries`, `/sermons`, `/events`, `/giving`, `/prayer`, `/contact` |
| Staff login | http://127.0.0.1:3001/login |
| Admin (ERP) | http://127.0.0.1:3001/admin |

Full setup: **[STARTUP.md](./STARTUP.md)**  
Pilot / VPS: **[PILOT_SUPPORT.md](./PILOT_SUPPORT.md)**  
Known gaps: **[KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md)**

---

## Startup (summary)

1. Copy `.env` from `.env.example`; set `DATABASE_URL` and `VITE_TENANT_ID=default-tenant-id`.
2. `docker compose up -d postgres` (or use your own Postgres).
3. `npm install && npm run dev:prepare && npm run seed`
4. Terminal A: `npm run dev:server` (port **4002**)
5. Terminal B: `npm run dev` (port **3001**)

## Test credentials

| Field | Value |
|-------|--------|
| Username | `admin` |
| Password | `admin123` |
| Tenant ID (env) | `default-tenant-id` (`VITE_TENANT_ID` in `.env`) |

### Role-based UAT (production rollout)

After `npm run seed`, run `npm run seed:demo-roles`. All demo accounts use password **`demo123`** (unless `DEMO_ROLE_PASSWORD` is set in env).

| Role | Username |
|------|----------|
| Pastor | `pastor` |
| Worship leader | `worship` |
| Volunteer coordinator | `volunteers` |
| Finance admin | `finance` |
| HR admin | `hradmin` |
| Church secretary | `secretary` |
| Event manager | `events` |
| Campus admin | `campus` |

Use these to verify sidebar visibility and workflows match each ministry role. See **[PRODUCTION_ROLLOUT_REPORT.md](./PRODUCTION_ROLLOUT_REPORT.md)**.

Login page shows org branding (**Staff Access**). After sign-in, the shell header shows **KINGDOM OS**.

If login fails:

1. Confirm `npm run seed` completed successfully.
2. Confirm `VITE_TENANT_ID` in `.env` matches the seeded tenant (`default-tenant-id`).
3. Confirm API is running on port 4002.

## What to test (priority)

### Core ERP (admin)

- **Dashboard** — loads stats after login  
- **Members** — intake, profile, compliance/declaration  
- **Families / Volunteers / Pathways / Shepherd** — create or edit, reload page, confirm persistence  
- **Events / Attendance** — create event, open attendance portal  
- **Giving (admin)** — record donation; check recent history  
- **Finance** — ledger views; note voucher entry may be disabled (see limitations)  
- **Sermons** — create/edit message  
- **Website builder** — edit page, save, preview public site  
- **Settings / Permissions** — load without errors  
- **HR Command Center** (`nav-hr`) — leave, reimbursements; Finance sees payroll tab  

### Public website

- Navigate all main pages from header/footer.  
- **Giving** — flow should only show success after server verification (not on client-only success).  
- **Prayer** — submit form; expect confirmation message.  
- Broken images should fall back without layout collapse.

### Session / runtime

- Login → reload → still in admin.  
- Logout → returns to login.  
- Invalid session: visit `/admin` with cleared or bad token → should land on login, not a white screen.  
- Public home `/` with a bad token in localStorage should still render the public site.

---

## Razorpay (staging / test mode)

Public giving uses **Razorpay Checkout** when keys are configured for the tenant.

### Configure (admin)

1. Sign in → **Settings** → **Payment Gateway** section.  
2. Enter Razorpay **test** keys (`rzp_test_…` prefix).  
3. Save settings.  
4. Server expects **test** mode in non-production (`RAZORPAY_MODE` unset or `test` in `.env`).

| Setting (UI) | Purpose |
|--------------|---------|
| Key ID | Razorpay API key id |
| Key Secret | Server-side secret (never expose in frontend) |
| Webhook Secret | Optional; for webhook signature verification |

### What testers should verify

- Without keys: public giving shows a clear error (not fake success).  
- With test keys: complete a small test payment; confirm donation appears in **Giving → Recent History** and accounting linkage where enabled.  
- Duplicate payment id: server should treat idempotent references safely (`razorpay:…` reference pattern).

### What is not automated

- Full live Razorpay checkout is **not** covered in Playwright (requires gateway + keys). Validate manually in staging.

Webhook URL (if testing webhooks): configure in Razorpay dashboard to your deployed API; local testing usually relies on the **verify** callback after checkout.

---

## Demo data reset

Use when the database is messy or you need a clean baseline.

### Soft re-seed (keeps DB, refreshes demo content)

```bash
npm run seed
```

Idempotent expanded demo for tenant `VITE_TENANT_ID` / `default-tenant-id`. Re-run after schema changes if `dev:prepare` was applied.

### Dev duplicate cleanup (optional)

Merges duplicate members by email within a tenant:

```bash
set ALLOW_DEV_DB_NORMALIZE=1
npm run db:dev-normalize
```

PowerShell: `$env:ALLOW_DEV_DB_NORMALIZE='1'; npm run db:dev-normalize`

### Full reset (nuclear)

1. Stop API/UI.  
2. Drop and recreate Postgres database (or `docker compose down -v` for postgres volume—**destroys all data**).  
3. `npm run dev:prepare`  
4. `npm run seed`  
5. Restart `dev:server` and `dev`.

---

## Restore flagship website

Resets **website pages, navigation, and section layouts** to the approved cinematic flagship template. Does **not** delete sermons, events, donations, members, or org settings.

### Steps

1. Sign in as a user with **manage website** permission (default `admin`).  
2. Open **Website** (sidebar: Website Builder).  
3. Either:  
   - **Overview** → scroll to **Site Maintenance** → **Reset Website to Flagship**, or  
   - **Visual Builder** → left sidebar **Site Ops** tab → **Reset Website to Flagship**  
4. Confirm the dialog (warns that pages/layout reset; operational data kept).  
5. Wait for reload; open public site at http://127.0.0.1:3001/ to verify.

API: `POST /api/v1/website/templates/restore-flagship` (authenticated).

---

## Automated tests (for QA leads)

| Command | When |
|---------|------|
| `npm run test:pw` | Local: API on 4002 + UI on 3001 must already be running |
| `npm run test:pw:ci` | CI: starts servers automatically |
| `npm run verify:runtime` | API health + module GET smoke |
| `npm run verify:go-live` | Production readiness (incidents, queue, command center) |
| `npm run verify:stabilization` | Sunday/portal/campus ops paths |
| `npm run lint` | TypeScript check |

Current baseline: **35/35** Playwright tests when dev stack is healthy.

---

## Reporting issues

Include:

1. URL and module name  
2. Steps to reproduce  
3. Expected vs actual  
4. Browser/OS  
5. Whether API/UI terminals show errors  
6. Screenshot or short screen recording for UI issues  

Mark **blocker** vs **cosmetic**—cosmetic issues on the locked public flagship should not block release unless they break function (dead link, crash, data loss).

---

## Placeholder modules (do not file as “broken” without reading)

See **[KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md)** for: Forms, Landing Pages, Media Library, Missions, Pages, Feature Flags, Integrations, Tenant Settings, SEO scaffold modules, and disabled finance/SEO actions.
