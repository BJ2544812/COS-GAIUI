# Role Matrix — Grace Community Church (Ultimate Church OS)

**Environment:** Post `npm run clean:install`  
**Password (staff roles):** `demo123` unless `DEMO_ROLE_PASSWORD` is set  

---

| Role | Purpose | Landing page | Primary modules | Permissions summary | Typical tasks |
|------|---------|--------------|-----------------|----------------------|---------------|
| **Super Admin** | Full platform control | Dashboard → Operations | All modules | All `manage_*` + voucher approve/post | Tenant setup, permissions, any module |
| **Senior Pastor** | Pastoral & church-wide leadership | Dashboard → Executive (Pastoral lens) | People, Care, Events, Giving, Analytics | Members, discipleship, communication, analytics, events, giving, outreach | Review attendance, care cases, giving summary, member health |
| **Associate Pastor** | Pastoral support | Dashboard → Pastoral | People, Care, Events | Members, discipleship, events, attendance | Follow up members, events, prayer/care |
| **Youth Pastor** | Youth ministry | Sunday Mode | Sunday Mode, Events, Attendance, Members | Members, events, attendance, discipleship | Youth events, attendance, discipleship |
| **Church Administrator** | Day-to-day church ops | Dashboard → Operations | Events, Attendance, Members, Volunteers, Comms | Members, events, attendance, analytics, settings, communication | Members, families, events, communications |
| **Worship Pastor** | Worship & services | Sunday Mode | Sunday Mode, Events, Attendance, Worship | Events, attendance | Service planning, teams, attendance |
| **Finance Manager** | Stewardship & accounting | Finance → Vouchers | Giving, Finance, Budgets, HR (payroll) | Finance, giving, HR, approve/post vouchers | Donations, vouchers, payroll, reports |
| **Accountant** | Accounting desk | Finance → Vouchers | Finance, Giving, Budgets | Finance, giving | Vouchers, ledger, reconciliations |
| **HR Manager** | Staff & payroll | HR | HR, Workforce, Members | HR, members, finance (read) | Employment, leave, payroll structures |
| **Volunteer Coordinator** | Volunteers & events | Volunteers / Events | Members, Events, Attendance | Members, events, attendance | Assign volunteers, event staffing |
| **Communications Manager** | Comms & documents | Communication | Communication, Documents, Members | Communication, documents, members, outreach | Campaigns, announcements |
| **Small Group Leader** | Cell group leader | Members / Groups | Members, Attendance, Discipleship | Members, attendance, discipleship | Group attendance, pastoral notes |
| **Staff** | Front desk | Events | Members, Events | Members, events | Registration, member lookup |
| **Ministry Leader** | Event ministry lead | Events | Events, Attendance | Events, attendance | Event setup, run sheets |
| **Campus Admin** | Multi-campus ops | Dashboard | Members, Events, Settings | Members, events, analytics, settings | Campus coordination |
| **Member** | Congregation portal | Member portal (not staff ERP) | Portal: Giving, Events, Prayer, Profile | Portal-only (no staff modules) | Giving history, prayer, profile |

---

## Navigation groups (by archetype)

| Archetype | Sidebar emphasis |
|-----------|------------------|
| Pastor | Identity, Insights, Operations, Engagement |
| Church Admin | Operations, Identity, Engagement |
| Finance | Finance, Insights |
| HR | Identity, Finance (payroll) |
| Member | Portal home (separate route) |

---

## Permission keys reference

`manage_members`, `manage_events`, `manage_attendance`, `manage_finance`, `manage_giving`, `manage_hr`, `manage_discipleship`, `manage_communication`, `manage_documents`, `manage_website`, `manage_settings`, `manage_analytics`, `manage_outreach`, `manage_assets`, `approve_voucher`, `post_voucher`

---

*Generated for Human UAT — Grace Community Church clean install.*
