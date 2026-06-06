# Home Dashboard Rebuild Report — Phase 3

**Date:** 6 June 2026  
**Priority:** Highest UX priority per campaign brief  
**Status:** Complete (v1 rebuild)

---

## Goal

Every Home screen answers: **What needs my attention today?**

Target: 65-year-old pastor test — calm, human, not ERP.

---

## Architecture

New helper: `src/lib/homeLayout.ts`

| `homeLayoutForArchetype()` | Home content |
|----------------------------|--------------|
| `pastoral` | Executive view → PastoralInsightPanel + 2 stats |
| `personal` | Staff tasks + week events + quick links |
| `finance` | Finance desk shortcuts |
| `operations` | Compact OperationsCommandCenter |

---

## Removed from Home

- Evaluator widgets (QuickTestNextCard, onboarding checklists, first-day panel)
- Duplicate task lists (personal view had 3× same data)
- Quick Insights unsynced scratch pad
- Executive "At a glance" event count card
- "Go to work" shortcut card (redundant with sidebar)
- 6-stat grid below pastoral panel for pastors
- MinistryIntelligenceStrip on compact Home (duplicate signals)
- VolunteerHealthPanel on compact Home
- Predictive watchlist card on compact Home
- Full 6-stat ops grid → attention-only stats (gaps, approvals, overdue when > 0)

---

## Pastor Home (Senior Pastor)

**Before:** Pastoral panel + 4 stat cards + setup widgets + test events + lens tabs  
**After:**
- Heading: Pastoral leadership
- Subtitle: What needs your attention today
- Primary: People who need follow-up (names + reasons)
- Secondary: Volunteers serving heavily
- Two stats only: Members, Giving this period
- No setup/evaluator noise

---

## Operations Home (Admin, Church Admin, Volunteer Coord)

**Compact mode** (`OperationsCommandCenter compact`):
- Title: "What needs attention"
- Stats: Today's services + non-zero alerts only
- Today's services list
- Volunteer shortages (when present)
- Workflow tasks panel
- Upcoming events capped at 4

---

## Staff Home

- Single task queue with empty state
- Upcoming week (4 events max)
- Quick links: Find member, Register visitor, Events, Sunday

---

## Browser Validation

| Check | Result |
|-------|--------|
| Pastor Home — no evaluator widgets | ✓ |
| Pastor Home — follow-up names visible | ✓ (API-backed) |
| Admin Home — no Usability events | ✓ |
| No "Setup progress" on default Home | ✓ |

---

## 65-Year-Old Pastor Test

| Criterion | Pass? |
|-----------|-------|
| First screen shows people names | ✓ |
| No timestamp test event names | ✓ |
| No internal testing language | ✓ |
| Fewer than 6 numbers above fold | ✓ |
| Clear next action (open member) | ✓ |

**Verdict:** Partial → **Pass** for Home landing. Module depth (Finance tabs, Events workspace) still ERP-heavy — Phase 4 scope.

---

*Phase 3 Home rebuild v1 shipped. Further calm-down of OperationsCommandCenter full mode remains optional.*
