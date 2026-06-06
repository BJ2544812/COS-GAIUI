# Global UX Cleanup Report — Phase 4

**Date:** 6 June 2026  
**Scope:** Line-by-line UX pass on Home, pastoral panels, staff desk, login  
**Status:** Complete (primary surfaces)

---

## ERP / Developer Language Removed or Softened

| Surface | Before | After |
|---------|--------|-------|
| Home ops header | "This week at church" (6-stat ERP grid) | "What needs attention" (compact) |
| Pastor panel | "Follow-up priority" | "People who need follow-up" |
| Volunteer load | "Heavy serving load" | "Volunteers serving heavily" |
| Personal Home | "ACTION ITEMS" uppercase | "Your tasks today" |
| View toggles | ALL CAPS tracking labels | Sentence-case tabs |
| Stat labels | "Total members (status)" | "Members" / "Giving this period" |
| AppShell | "Explore Ultimate Church OS" | Hidden from production header |
| Login | Pilot UAT credentials | Removed |

---

## Locked Domains — Not Redesigned

Per campaign rules, these received **bug/data fixes only** (Phase 0 + artifact filters):

- People & Care (Members growth badge fix)
- Events (test filter)
- Sunday Service (youth copy)
- Attendance (QR kiosk)
- Giving (removed fake export button)
- Finance (unchanged layout — 12 tabs remain)

---

## Duplicate Actions Reduced

| Removed duplicate | Reason |
|-------------------|--------|
| Personal Home task list × 3 | Single task card |
| Personal Home events × 2 | Single upcoming list |
| Executive stat row below pastoral panel | Pastor gets 2 stats only |
| MinistryIntelligenceStrip on compact Home | Duplicated executive API |
| Shortcut cards vs sidebar | Staff quick links minimized |

---

## Empty States Improved

- Tasks: "Nothing urgent right now"
- Events: "No events scheduled yet"
- Notifications analytics: campaign guidance copy
- Website stats: editor prompt
- Assets maintenance: schedule CTA

---

## Remaining ERP Noise (P2 backlog)

- ALL CAPS labels in Members table headers, Finance tabs, Event workspace
- "Registry", "payload", "lifecycle" in module internals
- Finance 12-tab workspace density
- Event workspace 6-tab structure
- Settings embeds full Structure module

These require module-by-module passes without violating locked-domain redesign rule.

---

## Browser Spot Checks

- Pastor Home: human-readable headings ✓
- Staff Home: no "LOCAL ONLY — NOT SYNCED" ✓
- Login: no credential leak ✓

---

*Phase 4 complete on Home + pastoral + login surfaces. Deep module copy pass deferred to post-pilot.*
