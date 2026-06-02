# Final Language Review — Ultimate Church OS

**Date:** 1 June 2026  
**Scope:** Final user-facing terminology pass before human UAT (builds on `PRODUCTION_UX_CLEANUP_REPORT.md`).

---

## Executive summary

A full search was run for corporate, ERP, and developer language across `src/modules`, `src/components`, and `src/pages`. High-traffic surfaces were updated; internal API paths, TypeScript types, and server-only scripts were left unchanged.

**Build check:** `npm run lint` (tsc) should pass after pull.

**UAT recommendation:** **Proceed with human UAT** using the role matrix below. Remaining jargon is mostly in Church Admin (technical admins), printed statutory document headers (80G/12A), and code identifiers not shown in normal workflows.

---

## Remaining terminology removed (this pass)

### Workforce (`WorkforceModule.tsx`)

| Before | After |
|--------|--------|
| Command center header (comment/copy) | Staff desk |
| Staff Operations badge | Staff desk |
| Active Headcount | Active staff |
| Pastor Executive (org chart) | Leadership team |
| Other Operational Needs | Other ministry needs |
| Failed to load command center operations | Could not load staff desk overview |
| Tenant Leave Policies | Leave policy defaults |
| tenant settings (subtitle) | Settings for your church |

### Finance & giving

| Location | Before | After |
|----------|--------|--------|
| Attendance | Audit Pack | Export records |
| Giving | Download Audit Pack | Export for accountant |
| Giving | audit workpapers (copy) | Finance & Change history |
| Giving | Full Audit History Unavailable | Full giving history export coming soon |
| Finance | Smart Alerts / audit chain / audit exceptions | Finance reminders / approval history / items to review |
| Finance | CA & audit exports | Accountant exports |
| Finance | Approval & Audit History | Approvals & change history |
| Budgets | Operational fund transparency… | Fund transparency… |

### Profile & security (`ProfileModule.tsx`)

| Before | After |
|--------|--------|
| Identity Details | Your details |
| Global Administrator / Super Admin | Church staff / Staff |
| Permissions Granted / Global Modules | Areas you can access / modules |
| RBAC / multi-factor isolated session tokens | Role-based access (plain language) |
| Permission Audit / Database Seed | Access review / Permissions updated |
| Security Audit | Sign-in activity |
| API Access / Developer Tokens | Integrations / For technical admins |

### Settings (`SettingsModule.tsx`)

| Before | After |
|--------|--------|
| Operational Defaults | Church workflows |
| Strict Audit Logging / SOC-2 | Keep a detailed change log (treasurer-friendly) |
| operational logs | activity logs |

### Reports (`AnalyticsModule.tsx`)

| Before | After |
|--------|--------|
| Operational signals | What to watch |
| predictive AI (subtitle) | Simple comparisons… no AI predictions |

### Change history & activity (`AuditLogsModule`, `WorkflowMonitoringModule`)

| Before | After |
|--------|--------|
| Donor Compliance (group) | Donor records |
| Compliance Warnings | Attention items |
| Real-time audit stream of domain events | Live stream of finance and system changes |
| Financial Audit Console | Open finance desk |
| Workflow Monitor / domain event log | Activity log / Recent background tasks |

### Church Admin (`SystemAdminCenterModule.tsx`)

| Before | After |
|--------|--------|
| Platform health / Governance (tabs) | *(prior pass)* System status / Church setup |
| Operational incidents | System issues |
| Failed domain events | Failed background tasks |
| Production operator tools | Advanced tools |
| Tenant-scoped operational toggles | Turn features on or off for this church |
| Compliance audit trail | Change records |
| Restore tenant backup | Restore church backup |
| ministryIntelligence flag label | Church snapshot on Home |
| executiveDashboard flag label | Church overview on Home |

### Documents & members

| Before | After |
|--------|--------|
| Compliance & Print Registry | Church documents & printing |
| File Intelligence / Audit History | File details / Change history |
| GDPR & Compliance (sidebar) | Privacy & records |
| Identity Compliance / Compliance tab | Verification records / Records |
| Ministry Compliance Office (PDF header) | Church records • India |
| For Institutional Ministry Compliance Use Only | For church office use only |

### Other modules

| Module | Change |
|--------|--------|
| Communications | RBAC → access role; Command center tab → Overview |
| Events | governance process → church approval process; lifecycle subtitle simplified |
| Event workspace | Operational notes → Team notes; domain events → plain notifications copy |
| Discipleship | Operational view → pastoral tasks subtitle |
| Vendors | Operational AP → Vendors, bills, and payroll |
| Structure | operational settings → church settings |
| Worship | Operational links → Quick links |
| Login | Ministry Operating System → Church management; Identity label → Username; Ecosystem Offline → Cannot reach church office |

---

## Remaining terminology retained (with justification)

| Term / pattern | Where | Why kept |
|----------------|--------|----------|
| **Executive** (internal) | `DashboardModule` view state, `ExecutiveInsightPanel` component name | Not shown as “Executive” to pastors (lens hidden); super admin sees **Church overview** |
| **predictive** (code) | API types, `data.predictive.*` | Not shown in UI; cards say “Items to watch”, “Volunteer gaps”, etc. |
| **governance** (tab id) | `SystemAdminCenterModule` route `tab=governance` | URL param only; label is **Church setup** |
| **intelligence** (folder/API) | `components/intelligence/*`, `/ministry-intelligence/*` | Developer paths; UI says Church snapshot / Church overview |
| **operational** (module status) | `AppShell` `status: 'operational'` | Badge for “partial” modules—not a user-facing sentence |
| **tenant** | Auth/session headers, server | Multi-church hosting; not on login or member portal |
| **ERPModule** | TypeScript | Code only |
| **Compliance** (statutory) | 80G, 12A, Donation Register, Trial Balance | Indian church accounting language treasurers expect |
| **CA Handoff** | Change history export group | Common label for chartered accountant exports |
| **Books of Account** | Change history | Standard accounting phrase |
| **Audit Ready** (demo file status) | Documents demo row | Describes file state for accountants |
| **Church Admin** advanced tools | Diagnostics JSON, cache flush, replay | Intentionally technical; audience is installer/IT, not pastors |
| **Kingdom OS** | `document.title`, email templates | Product name; login shows church name + “Church management” |
| **Grace Community** (login hero) | `LoginPage` | Demo church branding from seed |

---

## First impression test (by role)

| Role | First screen | Navigation | Top cards / actions | Understand immediately? |
|------|--------------|------------|------------------------|-------------------------|
| **Senior Pastor** | Home → **This week at church** (focused) | People & Care, Home & Reports | Sunday services, volunteer gaps, pastoral lens | **Yes** — no Executive BI tab |
| **Church Administrator** | Same operations home | Sunday & Events first | Events, attendance, members shortcuts | **Yes** |
| **Finance Manager** | Finance desk (vouchers) | Giving & Finance | Accountant exports, finance reminders | **Yes** — “Audit Pack” removed |
| **Volunteer Coordinator** | Volunteers / operations home | Sunday & Events, People & Care | Volunteer care, assign teams | **Yes** |
| **Member** | My Church portal | Minimal nav | Giving, events, prayer — plain copy | **Yes** |

**Staff login:** “Church management” + Staff Access + Username (not “Identity”).  
**Member login:** “Sign in to view your giving, events, and volunteer schedule.”

---

## Screens improved (this pass)

- Workforce — full desk header and HR copy  
- Attendance — export button  
- Giving — growth panel and history footer  
- Finance — vouchers, alerts, exports  
- Profile — security and activity cards  
- Settings — workflows and change log toggle  
- Reports — “What to watch” card  
- Change history & Activity log  
- Church Admin — issues, flags, records, backups  
- Documents — registry, privacy blurb, PDF headers  
- Member profile — records tab and verification  
- Communications, Events, Budgets, Vendors, Structure, Worship  
- Staff login page  

## Screens reviewed (no change or prior pass)

- Home / operations command center *(prior pass: “This week at church”)*  
- Dashboard overview lenses *(prior pass)*  
- Member portal *(prior pass + link message)*  
- Website builder *(some “operational” strings remain in builder-only UI—low priority for UAT)*  
- Permissions module *(role names are admin-facing)*  

---

## Search coverage (application-wide)

Searched in user-facing layers for: `command center`, `executive`, `predictive`, `governance`, `intelligence`, `operational`, `compliance`, `audit center`, `identity hub`, `tenant`, `platform`, `ERP`, `RBAC`, `domain event`, `workpaper`.

| Category | Result |
|----------|--------|
| **command center** | Removed from UI; API `/operations/command-center` unchanged |
| **executive** | UI labels → Church overview; code imports remain |
| **predictive** | UI only in friendly card labels |
| **governance** | UI → Church setup; events copy softened |
| **intelligence** | UI → Church snapshot / overview |
| **operational** | Reduced; module `status` and builder strings remain |
| **compliance** | Kept where statutory (80G, books of account); softened elsewhere |
| **tenant / platform** | Church Admin + server only |

**Server scripts** (`verify-*.ts`, simulations): unchanged (engineering tools).

---

## Final recommendation for UAT

1. **Go** — Run human UAT with the six role guides in `docs/pilot-church/` using demo credentials from `UAT_TEST_PLAN.md`.
2. **Focus areas** — Finance exports, Sunday flow, member portal link-your-profile, and Church Admin only with technical admins.
3. **Known deferrals** — Website builder metadata strings; Playwright tests may still assert old labels—update selectors if tests fail on copy.
4. **Defects** — Log copy issues in `docs/pilot-church/DEFECT_LOG.md`; treat confusing words as **UX defects**, not feature requests.

---

## Related documents

- `PRODUCTION_UX_CLEANUP_REPORT.md` — First production language program  
- `UAT_TEST_PLAN.md` — Role test scripts  
- `src/lib/churchProductCopy.ts` — Nav and lens label source of truth  

---

*End of final language review.*
