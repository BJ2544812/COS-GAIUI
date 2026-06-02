# Production UX Cleanup Report

**Program:** Ultimate Church OS — Production Language & UX Cleanup  
**Date:** 1 June 2026  
**Scope:** Church-facing copy, navigation labels, dashboard widgets, and role-first impressions (no new features or API changes).

---

## Summary

The platform was functionally complete but still read like an ERP / BI / developer console in places. This pass renames high-traffic surfaces, softens status badges, aligns navigation with church vocabulary, and narrows role dashboards so pastors, administrators, finance, volunteers, and members see familiar language first.

**Validation:** Run `npm run lint` and `npm run build` after pull. Spot-check Home (operations view), Reports, Church Admin, and member portal login.

---

## Items Renamed

### Navigation (`churchProductCopy.ts`, `AppShell.tsx`)

| Before | After |
|--------|--------|
| Identity (group) | People & Care |
| Operations (group) | Sunday & Events |
| Finance (group) | Giving & Finance |
| Engagement (group) | Messages & Media |
| Insights & Audit (group) | Home & Reports |
| Platform (group) | Church Settings |
| Compliance Documents | Church Documents |
| Audit Trail | Change History |
| Admin Center | Church Admin |
| Academy | Training |
| Workforce (sidebar item) | Staff Directory |

### Home / operations desk (`OperationsCommandCenter.tsx`)

| Before | After |
|--------|--------|
| Operations command center | This week at church |
| Operational intelligence | This week's watchlist |
| Avg readiness · predictive signals | Overall preparation · items to keep an eye on |
| Volunteer shortage risk / Burnout risk / … | Volunteer gaps / Team fatigue / Sunday prep / Behind schedule |
| watch / ok | Needs attention / Looks good |
| Upcoming operations | Upcoming events |
| Workflow queue | Pending tasks |
| Service readiness and team status | How prepared each service is and who is serving |

### Church overview (`ExecutiveInsightPanel.tsx`, `MinistryIntelligenceStrip.tsx`)

| Before | After |
|--------|--------|
| Executive ministry view | Church overview |
| Predictive signals | Items to watch |
| Engagement score / Service readiness / Operational alerts | People connected / Sunday prepared / Open reminders |
| Ministry intelligence | Church snapshot |
| Readiness N% | Sunday prep N% |

### Dashboard (`DashboardModule.tsx`)

| Before | After |
|--------|--------|
| Personal / Executive / Operations (tabs) | My day / Overview / This week |
| Executive / Finance / Pastoral / Operations (lenses) | Church overview / Giving & finance / People & care / This week |
| Operational summary | At a glance |
| Open full analytics | Open reports |
| Audit and approvals | Approvals & history |
| Event readiness | Upcoming events |

### Status badges (`operationalStatus.ts`, `OpsStatusBadge.tsx`)

| Internal | Display |
|----------|---------|
| READY | Ready |
| WARNING | Needs attention |
| BLOCKED | Not ready |
| IN_PROGRESS | In progress |
| LIVE | Live now |

### Modules

| Module | Before | After |
|--------|--------|--------|
| Analytics | Analytics | Reports |
| Audit logs | Audit Registry | Change history |
| Workflow monitor | Workflow Monitor | Activity log |
| Communications | Communication command center | Communications |
| Church admin | System admin center / Platform health / Governance / … | Church admin / System status / Church setup / … |
| Finance | Smart Alerts | Finance reminders |
| Documents filter | Governance | Leadership & policies |
| Events workspace | Workflow monitor | Activity log |

### Member portal

| Before | After |
|--------|--------|
| personalized ministry data | attendance, giving, groups, and more |

---

## Items Removed (from default experience)

| Item | Action |
|------|--------|
| **Executive** dashboard lens (Senior Pastor) | Hidden — pastors see **People & care** and **This week** only |
| **Executive** lens (Finance Manager) | Hidden — treasurers see **Giving & finance** only |
| **Executive** lens (HR) | Hidden — HR sees **This week** operations home |

*APIs and internal lens keys unchanged; only `visibleLenses` in `roleExperience.ts` was tightened.*

---

## Items Hidden

No modules were removed from the codebase. Visibility continues to follow **permissions** and **role `sidebarAllowList`** (unchanged from role-polish work). Corporate widgets remain available to **super_admin** with church-friendly labels.

---

## Items Simplified

1. **Focused home roles** (church admin, volunteer coordinator, youth pastor, accountant, staff desk, small group leader) still land on **This week at church** — no Personal / Executive / Operations toggle clutter.
2. **MinistryIntelligenceStrip** — shorter badges (“Watch” / “Good”) and “Church snapshot” header.
3. **VolunteerHealthPanel** — “Volunteer care”, “Need rest”, “Typical attendance”.
4. **PastoralInsightPanel** — “Heavy serving load” instead of “Ministry stress”.
5. **Operational guidance** — points to Church Admin → Issues and Activity log instead of “Replay failed workflows” jargon.

---

## Screens Improved

| Screen | Roles | Improvement |
|--------|-------|-------------|
| Home — operations | Admin, volunteers, ministry | Week-at-a-glance language |
| Home — overview | Super admin, leadership | Church overview + items to watch |
| Home — pastoral lens | Pastor | People & care (unchanged structure, softer adjacent copy) |
| Sidebar | All staff | Group headers + document/audit/admin labels |
| Reports | Finance, leadership | Module title matches nav “Reports” |
| Change history | Treasurer, admin | Plain subtitle; CA exports retained |
| Activity log | Admin | Task-oriented subtitle |
| Communications | Comms lead | Overview tab, no “command center” |
| Church Admin | Technical admin | Church-facing tab names |
| Member portal | Members | Simpler link-your-profile message |
| Event workspace | Event planners | Approvals & history wording |

---

## Remaining Recommendations

### High value (next pass)

1. **Workforce module** — Header still references “command center” in places; align with Staff Directory language.
2. **Finance / Giving** — Replace “Audit Pack”, “Approval & Audit History” with “Export records” / “Approval history” where treasurers see them.
3. **Attendance** — “Audit Pack” button → “Export attendance records”.
4. **Profile module** — “Permission Audit” / “Security Audit” → “Access review” / “Sign-in activity”.
5. **Settings** — “Strict Audit Logging” → “Keep a detailed change log”.
6. **E2E tests** — Update selectors if any assert old strings (e.g. “Operations command center”, “Executive”).

### Medium value

7. **Website builder defaults** — Sample copy still says “Kingdom OS” / “ERP”; pilot churches should replace via Website module.
8. **Email templates** (`EmailService.ts`) — Product name “Kingdom OS” in password reset; consider “Your church portal” per tenant.
9. **Document browser** — “Audit History” section title in `DocumentsModule.tsx`.
10. **Analytics risk tab** — Review “risk signals” copy for treasurer-friendly “attention items”.

### Low / intentional deferrals

11. **Internal API paths** (`/operations/command-center`, etc.) — keep for stability.
12. **Type names** (`ExecutiveDashboard`, `OperationalInsights`) — code-only.
13. **Super admin** — Still sees full lens set and Church Admin; appropriate for platform operators.

---

## Files Touched (primary)

- `src/lib/churchProductCopy.ts` — nav labels, group labels, dashboard lens labels  
- `src/lib/operationalStatus.ts` — display labels for badges  
- `src/lib/roleExperience.ts` — lens visibility for pastor / finance / HR  
- `src/lib/adminNavigation.ts` — breadcrumbs use `navLabel`  
- `src/components/layout/AppShell.tsx`  
- `src/components/operations/*` — command center, badges, guidance  
- `src/components/intelligence/*` — overview panels and strip  
- `src/modules/dashboard/DashboardModule.tsx`  
- `src/modules/analytics/AnalyticsModule.tsx`  
- `src/modules/audit/AuditLogsModule.tsx`  
- `src/modules/workflow/WorkflowMonitoringModule.tsx`  
- `src/modules/platform/SystemAdminCenterModule.tsx`  
- `src/modules/communication/CommunicationModule.tsx`  
- `src/modules/finance/FinanceModule.tsx`  
- `src/modules/documents/DocumentsModule.tsx`  
- `src/components/events/EventWorkspace.tsx`  
- `src/pages/MemberPortalPage.tsx`  

---

## Success Criteria Check

| Audience | Status |
|----------|--------|
| Pastor | Improved — pastoral lens + church overview wording; executive BI tab removed |
| Church administrator | Improved — “This week at church”, People & Care nav |
| Finance | Improved — finance lens only; Reports title; finance reminders |
| Volunteer coordinator | Improved — operations home, volunteer care panel |
| Member | Improved — portal link message; no ERP terms on main portal |

The product should now read as a **Church Operating System** in daily use, with advanced technical surfaces relabeled where church staff encounter them.

---

*End of report.*
