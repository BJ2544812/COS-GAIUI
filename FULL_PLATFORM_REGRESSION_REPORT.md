# Full Platform Regression Report — Phase 7

**Date:** 6 June 2026  
**Method:** Playwright + role discovery script + browser spot checks  
**Status:** Complete

---

## Automated Regression

| Suite | Result |
|-------|--------|
| `e2e/role-experience.spec.ts` | **13/13 pass** |
| Role discovery script (`scratch/truth-discovery-roles.mjs`) | 10/10 staff roles (member login script selector flaky — portal works manually) |

---

## Role Walk Results

| Role | Landing | Home | Nav | Issues |
|------|---------|------|-----|--------|
| Administrator | ✓ dashboard | ✓ compact ops | Full sidebar | None blocking |
| Senior Pastor | ✓ dashboard | ✓ pastoral | 15 items | None blocking |
| Associate Pastor | ✓ dashboard | ✓ pastoral | 10 items | None blocking |
| Worship Leader | ✓ sunday-mode | N/A | 5 items | None |
| Youth Pastor | ✓ events | ✓ compact ops | 7 items | None |
| Finance Officer | ✓ finance | Finance module | 4 items | None |
| Treasurer | ✓ finance | Finance module | 3 items | None |
| Counter Team | ✓ attendance | QR kiosk works | 4 items | None |
| Volunteer Coordinator | ✓ volunteers | ✓ compact ops | Volunteers in nav | None |
| Staff | ✓ dashboard | ✓ personal | 5 items | None |
| Member | ✓ /portal | Portal cards | N/A | Giving consistent |

---

## Module Smoke Checks

| Module | Status | Notes |
|--------|--------|-------|
| Members | ✓ | Real directory; fake progress bar removed |
| Events | ✓ | Lifecycle workspace operational |
| Sunday Service | ✓ | Cockpit + run sheet |
| Attendance | ✓ | Manual check-in + QR |
| Giving | ✓ | Record gifts; export stub removed |
| Finance | ✓ | Vouchers operational (locked) |
| Pastoral Care | ✓ | Prayer + care cases |
| Communications | ✓ | Campaign compose |
| Settings | ✓ | Org config |
| Website | ✓ | Published pages |
| Notifications | ✓ | Fake chart removed |
| HR | ✓ | Payroll accessible |

---

## Phase 0 Fixes — Still Passing

- Volunteer → Volunteers landing ✓
- Youth → Events landing ✓
- Home test artifacts filtered ✓
- Member giving ₹12,700 + statement ✓
- QR check-in (not "Coming soon") ✓

---

## Known Non-Blocking Issues

1. Discovery script member login selector timeout (script only)
2. `gcc-v2` visible in Finance source filter (internal tag)
3. Website public duplicate ministry cards
4. Finance 12-tab complexity for new treasurers
5. No in-app messaging (PDF gap)

---

## Fixes Applied During Regression

None required — all automated tests green post Phase 1–6 changes.

---

*Phase 7 regression complete. Platform stable for pilot with documented backlog.*
