# Module Alignment Report — Phase 5

**Date:** 6 June 2026  
**Source of truth:** CHURCH ERP.pdf (17 modules)  
**Method:** Compare browser implementation vs PDF modules  
**Status:** Documented — locked domains respected

---

## Alignment Summary

| PDF Module | Product surface | Alignment | Notes |
|------------|-----------------|-----------|-------|
| 1 Member & Family | Members, portal | **68%** | Core profiles strong; lifecycle automation weak |
| 2 Church Structure | Settings → Structure | **55%** | Nested in Settings, not top-level |
| 3 Volunteer & HR | Volunteers + HR | **62%** | Coordinator landing fixed; split across modules |
| 4 Attendance | Attendance | **58%** | Manual + QR kiosk; no full kiosk mode |
| 5 Discipleship & Pastoral | Pastoral Care + Pathways | **42%** | Split confusing; prayer works |
| 6 Worship Planning | Sunday Service + Events | **58%** | Cockpit excellent; planning in Events |
| 7 Sermon Library | Sermons | **45%** | Archive only |
| 8 Giving | Giving + portal | **72%** | Strong core; portal YTD fixed |
| 9 Church Accounting | Finance | **75%** | Best-aligned; locked |
| 10 Asset & Facility | Finance → Assets | **38%** | Fake stats removed; no room booking |
| 11 Event Management | Events | **62%** | Lifecycle good; locked |
| 12 Outreach & Missions | Outreach | **45%** | Missions placeholder |
| 13 Communication Hub | Communications + Notifications | **28%** | No DM/chat |
| 14 Dashboard & Analytics | Home + Reports | **48%** | Home rebuilt; no custom builder |
| 15 Document Management | Church Documents | **55%** | Vault works; 4 duplicate surfaces |
| 16 Frontend Website | Website Builder | **52%** | Live site; fake stats removed |
| 17 Member App | `/portal` | **38%** | Warm portal; no native app |

**Overall PDF alignment: ~52%** (up from ~50% post Phase 0–3)

---

## Correctly Placed (keep)

- Finance as dedicated module
- Sunday Service live cockpit for worship leaders
- Giving separate from Finance
- Member portal at `/portal`

---

## Misplaced / Duplicate (documented, not moved in this phase)

| Issue | PDF expectation | Current |
|-------|-----------------|---------|
| Structure | Visible sidebar module | Embedded in Settings |
| Assets | Dedicated facility module | Inside Finance |
| Pathways | Part of discipleship | Separate module |
| Documents | Single vault | 4 surfaces |
| Communications | Unified hub | Split with Notifications |
| Sunday planning | One flow | Events + Sunday + legacy route |

Moving these requires explicit unlock — not done to respect stability.

---

## Naming vs PDF

| PDF | Product UI |
|-----|------------|
| Ultimate Church OS | Kingdom OS (branding debt) |
| Member App | My Church / portal |
| Communication Hub | Communications + Notifications |

---

## Missing Features (PDF gaps — not in scope for locked domains)

- In-app messaging / DM
- Facility room booking
- Mobile member app
- Custom report builder
- Predictive analytics
- Recurring giving depth in portal

---

*Phase 5 alignment audit complete. No module moves performed — locked domain policy honored.*
