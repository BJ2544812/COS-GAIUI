# Role Experience Refinement Report — Phase 2

**Date:** 6 June 2026  
**Method:** Browser + Playwright + `roleExperience.ts` updates  
**Status:** Complete

---

## Design Principle

Each role lands on work that matches their identity. No role should see another role's primary desk on login.

---

## Role Landing Matrix (verified)

| Role | Lands on | Home when opened | Identity |
|------|----------|------------------|----------|
| Administrator | Home (operations) | Compact ops attention view | Church leadership |
| Senior Pastor | Home (pastoral) | Follow-up queue + 2 stats | Pastoral leadership |
| Associate Pastor | Home (pastoral) | Same pastoral lens | Pastoral leadership |
| Worship Leader | Sunday Service | N/A (cockpit is home) | Ministry operations |
| Youth Pastor | Events | Compact ops view | Youth ministry |
| Finance Officer | Finance vouchers | Finance lens if Home | Finance & stewardship |
| Treasurer | Finance vouchers | Finance-focused Home | Accounting desk |
| Counter Team | Attendance | Compact ops (if Home) | Check-in focused |
| Volunteer Coordinator | Volunteers | Volunteer gaps on Home | Volunteers & teams |
| Staff | Home (personal) | Tasks + visitor link | Church office |
| Member | `/portal` | Warm portal | My church |

**Playwright:** 13/13 pass

---

## Changes by Persona

### Senior Pastor
- `focusedHome: true` — single pastoral Home, no My day / This week tabs
- Subtitle: "What needs your attention today"
- Home shows `PastoralInsightPanel` only + Members + Giving stats (not 6-stat ERP grid)
- Lens pills hidden on pastoral Home

### Staff Desk
- Personal Home simplified: tasks, upcoming events, quick links
- Shortcuts include **Register a visitor** (`outreach`)

### Finance / Treasurer
- Lands Finance module; Home shows finance desk shortcuts only when accessed
- No member directory noise on landing

### Counter Team
- Lands Attendance; QR kiosk operational (Phase 0)
- Home ops view compact — not full command center overload

### Youth Pastor
- Lands Events (not Sunday worship cockpit)
- Youth-specific Sunday copy when Sunday opened from nav

### Volunteer Coordinator
- Lands Volunteers module; Volunteers in sidebar

### Member Portal
- Giving YTD consistent with statement notification (Phase 0)
- Warm, readable card layout preserved

---

## Terminology Softening

| Before | After |
|--------|-------|
| Follow-up priority | People who need follow-up |
| Heavy serving load | Volunteers serving heavily |
| Action Items (ALL CAPS) | Your tasks today |

---

## Remaining Phase 2+ Opportunities (not blocking)

- Dedicated youth Home tile for Youth Fellowship
- Counter team: full-screen kiosk mode
- Volunteer congregation login (not in seed)
- Associate pastor differentiation from senior pastor nav

---

*Phase 2 complete for demo roles. Role landings and Home personas verified in browser.*
