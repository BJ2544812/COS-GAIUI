# Kingdom OS — Known limitations

Honest scope for external testers. Items listed here are **known**; reporting them is still useful if behavior worsens or copy is misleading.

Visual/design: the **public flagship website** layout and cinematic styling are **approved and locked** for this test cycle.

---

## Module readiness (2026 rationalization)

Deprecated module IDs (e.g. `forms`, `missions`, `funds`) redirect to canonical modules via URL aliases — see `src/lib/adminNavigation.ts`.

Staff sidebar no longer shows engineering readiness badges (Beta/Soon).

**Do test:** Website Builder (all digital sub-views), Members, Giving, Finance (including **New voucher**), Events (Events + Services tab), Sermons, Dashboard, Settings, Permissions, Admin Center.

---

## Disabled or incomplete actions

### Website builder

| Item | Behavior |
|------|----------|
| **SEO audit** | Button disabled; copy states diagnostics are not connected. Page-level SEO fields in builder may still be edited manually. |
| **Public SEO module** | Placeholder (see above). |

### Finance

| Item | Behavior |
|------|----------|
| **Voucher entry** | May show **Voucher Entry Unavailable** when posting path is disabled for the tenant/state. |
| **Download PDF / Print** | Toolbar buttons disabled on some views. |
| **Full ledger view** | May show **Full Ledger View Unavailable**. |
| **Budget ↔ voucher linkage** | Budget tracking is **not** wired to live vouchers inside Finance; use Budgets module where enabled, or ledger/exports for audit. |
| **Campus/branch charts** | Not wired; use ledger and exports. |

### Giving

| Item | Behavior |
|------|----------|
| **Public Razorpay E2E** | Automated tests cover admin donation recording and API persistence, **not** full Razorpay Checkout UI. Test payments manually with test keys. |
| **Razorpay without keys** | Public giving fails with explicit error (`RAZORPAY_NOT_CONFIGURED`); not a silent success. |

### Exports / reporting

Some **finance reporting exports** (PDF/print/advanced ledger) are disabled or stubbed as noted above. CSV/operational lists may still work in modules marked operational.

---

## Architectural / environment notes

| Topic | Detail |
|-------|--------|
| **Two URLs** | `/` = public website; `/admin` = ERP. Bad JWT on `/` does not redirect to login (by design). |
| **Tenant ID** | Frontend sends `x-tenant-id` from `VITE_TENANT_ID`; must match seeded tenant. |
| **Two processes** | UI (3001) and API (4002) must both run locally. |
| **MinIO** | Optional; uploads may warn if MinIO is down. |
| **Redis** | Optional; Razorpay webhooks process synchronously if queue is not configured. |
| **Razorpay key mode** | Test keys (`rzp_test_`) required in non-production; live keys rejected if `RAZORPAY_MODE=test`. |

---

## What is in scope for this test

- Member intake, profiles, families, volunteers, pathways, shepherd care logs  
- Events, attendance portal  
- Admin giving record + history persistence  
- Finance ledger viewing (within disabled-action constraints above)  
- Sermons CRUD  
- Website public pages + builder save/preview  
- Restore flagship website (layout reset only)  
- Login, logout, session reload, connectivity error UI on login  
- Public prayer submit, public giving **with** configured test keys  

---

## Regression signals (treat as bugs)

- White screen on any listed **in-scope** route  
- Dead sidebar item in **operational** modules (not placeholder list)  
- Data lost after reload on successful save  
- Public giving shows success without server verification  
- Login loop or redirect storm on `/admin`  
- API 5xx on routine GETs after fresh seed  
- Playwright suite fails on a clean `dev:prepare` + `seed` + dual-server setup  

---

## Related docs

- [STARTUP.md](./STARTUP.md) — install, ports, commands  
- [TESTER_GUIDE.md](./TESTER_GUIDE.md) — credentials, Razorpay, reset flagship, demo re-seed  
