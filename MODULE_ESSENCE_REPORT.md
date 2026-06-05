# Module Essence Audit

**Product:** Ultimate Church OS (UCOS)  
**Date:** 2026-06-01  
**Objective:** Identify modules that weaken product clarity — **no deletions in this pass**  
**Success criteria:** Sidebar reflects what most churches use regularly; advanced capability stays reachable without clutter.

---

## How to read this document

| Field | Meaning |
|-------|---------|
| **Essence** | CORE = weekly ministry ops; SECONDARY = monthly or role-specific; ADVANCED = admin / power users; REDUNDANT = overlaps another surface |
| **Action** | **KEEP** = deserves primary nav (now or after rename); **MERGE** = fold into parent module/tab; **HIDE** = settings / “More” / role-gated, not default sidebar; **REMOVE** = future candidate to drop route (only aliases / empty shells) |

**Evidence base:** `AppShell.tsx` sidebar (`GROUPS`), `CANONICAL_ADMIN_MODULES` + `MODULE_ALIASES` (`adminNavigation.ts`), `MODULE_STATUS_BY_ID` (`moduleRegistry.ts`), `getRoleExperience()` (`roleExperience.ts`), `App.tsx` render switch, prior `STAFF_MODULE_CONSOLIDATION_REPORT.md` and `SUNDAY_SERVICE_VALUE_REPORT.md`.

**Current sidebar:** **31** items across **7** groups — high for a “normal” church admin.

**Target sidebar (recommended):** **12–15** primary items + profile in header + “Advanced” drawer.

---

## Essence summary matrix

| Essence tier | Count (sidebar today) | Examples |
|--------------|----------------------|----------|
| **CORE** | 8 | Home, Members, Events, Sunday Service, Attendance, Giving, Volunteers, Communications |
| **SECONDARY** | 11 | Families, Pastoral Care, Small Groups, Outreach, Finance, Budgets, HR, Sermons, Website, Reports, Notifications |
| **ADVANCED** | 9 | Structure, Assets, Documents, Vendors, Pathways, Academy, Change History, Activity Log, Church Admin / Roles |
| **REDUNDANT** | 3+ nav + aliases | Worship Planning (ops), duplicate admin/audit surfaces, legacy alias ids |

---

## Ideal primary sidebar (proposal)

For **most churches** (single campus, &lt; 500 members, no full-time HR):

| # | Label | Module id | Notes |
|---|--------|-----------|--------|
| 1 | Home | `dashboard` | Operations / pastoral lens |
| 2 | Members | `members` | Tabs: Families, Pathways (optional) |
| 3 | Volunteers | `volunteers` | |
| 4 | Events | `events` | Tabs: All events, **Worship services**, link to Sunday Service |
| 5 | Sunday Service | `sunday-mode` | Live Sunday only — or tab under Events if nav count must drop |
| 6 | Attendance | `attendance` | |
| 7 | Pastoral Care | `discipleship` | |
| 8 | Giving | `giving` | |
| 9 | Finance | `finance` | Tabs: Budgets, Vendors & payroll |
| 10 | Communications | `communication` | Tab: Inbox (notifications) |
| 11 | Website | `website` | Pages, forms, media as tabs |
| 12 | Reports | `analytics` | |
| 13 | Settings | `settings` | Tabs: Church profile, Roles, Structure, Assets, Documents, Audit |

**Hide from default sidebar (keep routes):** HR (staff churches via role), Small Groups (leaders via role), Outreach, Academy, Activity Log, Church Admin (merge into Settings), standalone Notifications, Worship Planning, Structure, Assets, Documents, Budgets, Vendors as top-level items.

---

## Per-module audit

Legend: **W** = weekly church use, **M** = monthly, **A** = admin-only typical.

---

### Home — `dashboard`

| Question | Answer |
|----------|--------|
| Weekly? | **Yes** — pastors, admins, ops coordinators |
| Monthly? | Yes |
| Admin only? | No — any staff with analytics/ops permissions |
| Tab inside another? | No — it is the shell |
| Sidebar? | **Yes** |
| Duplicate? | Overlaps **Reports** for charts; distinct as “this week” command center |

| Essence | **CORE** |
|---------|----------|
| **Action** | **KEEP** |

---

### My Profile — `profile`

| Question | Answer |
|----------|--------|
| Weekly? | Members yes; staff occasionally |
| Monthly? | Yes |
| Admin only? | No |
| Tab inside another? | Header / portal — not sidebar |
| Sidebar? | **No** (header avatar today) |
| Duplicate? | No |

| Essence | **CORE** (access), not sidebar |
|---------|--------------------------------|
| **Action** | **KEEP** (header); not sidebar |

---

### Members — `members`

| Question | Answer |
|----------|--------|
| Weekly? | **Yes** |
| Monthly? | Yes |
| Admin only? | No — pastors, coordinators |
| Tab inside another? | Parent for Families / Pathways |
| Sidebar? | **Yes** |
| Duplicate? | No — system of record for people |

| Essence | **CORE** |
|---------|----------|
| **Action** | **KEEP** |

---

### Families — `families`

| Question | Answer |
|----------|--------|
| Weekly? | Some churches weekly; many monthly |
| Monthly? | **Yes** |
| Admin only? | Often office staff |
| Tab inside Members? | **Yes** — natural fit |
| Sidebar? | Weak as standalone (`partial` status) |
| Duplicate? | Extends Members, not separate domain |

| Essence | **SECONDARY** |
|---------|---------------|
| **Action** | **MERGE** → Members tab |

---

### Volunteers — `volunteers`

| Question | Answer |
|----------|--------|
| Weekly? | **Yes** for ops / Sunday |
| Monthly? | Yes |
| Admin only? | Coordinators + pastors |
| Tab inside another? | Could be Events sub-tab; roster is cross-event |
| Sidebar? | **Yes** |
| Duplicate? | **VolunteerOpsBoard** also in Sunday Service / Events live ops — data same, UI contextual |

| Essence | **CORE** (Sunday-heavy churches) |
|---------|----------------------------------|
| **Action** | **KEEP** |

---

### HR & Staff — `hr` (alias: `workforce` → directory tab)

| Question | Answer |
|----------|--------|
| Weekly? | HR / payroll churches only |
| Monthly? | **Yes** where used |
| Admin only? | **Mostly** (`manage_hr`) |
| Tab inside another? | Could live under Members → Staff |
| Sidebar? | Staff churches yes; small churches no |
| Duplicate? | Payroll **runs** also in Vendors & Finance |

| Essence | **ADVANCED** (SECONDARY for staffed churches) |
|---------|------------------------------------------------|
| **Action** | **KEEP** capability; **HIDE** default sidebar for small churches; role-gate |

---

### Small Groups — `small-groups`

| Question | Answer |
|----------|--------|
| Weekly? | Group leaders yes; church-wide admin monthly |
| Monthly? | **Yes** |
| Admin only? | Leaders + discipleship staff |
| Tab inside another? | Pastoral Care or Members |
| Sidebar? | Role allow-list only for leaders |
| Duplicate? | Attendance overlap for group meetings |

| Essence | **SECONDARY** |
|---------|---------------|
| **Action** | **KEEP** for leaders; **HIDE** from default admin sidebar |

---

### Growth Pathways — `pathways`

| Question | Answer |
|----------|--------|
| Weekly? | Rare |
| Monthly? | **Sometimes** |
| Admin only? | Discipleship / pastors |
| Tab inside another? | **Yes** — Pastoral Care or Members |
| Sidebar? | No for typical church |
| Duplicate? | Overlaps discipleship journey concepts |

| Essence | **ADVANCED** |
|---------|--------------|
| **Action** | **MERGE** → Pastoral Care or Members tab; **HIDE** sidebar |

---

### Pastoral Care — `discipleship`

| Question | Answer |
|----------|--------|
| Weekly? | Pastors **yes** |
| Monthly? | Yes |
| Admin only? | Pastoral staff |
| Tab inside another? | Could merge Members — but deserves visibility for pastors |
| Sidebar? | **Yes** for pastoral roles |
| Duplicate? | Prayer in Communications hub — related, different workflow |

| Essence | **SECONDARY** (CORE for senior pastor) |
|---------|---------------------------------------|
| **Action** | **KEEP** |

---

### Events — `events`

| Question | Answer |
|----------|--------|
| Weekly? | **Yes** |
| Monthly? | Yes |
| Admin only? | No |
| Tab inside another? | Parent; **Worship services** = `services` alias tab |
| Sidebar? | **Yes** |
| Duplicate? | Worship Planning, Sunday Service share event data |

| Essence | **CORE** |
|---------|----------|
| **Action** | **KEEP** |

---

### Worship services — `services` (alias → `events?tab=services`)

| Question | Answer |
|----------|--------|
| Weekly? | **Yes** (planning) |
| Monthly? | Yes |
| Admin only? | Worship / ops |
| Tab inside Events? | **Already** (`ServicesModule` in Events) |
| Sidebar? | **No** — should not be separate |
| Duplicate? | **Yes** — Events tab + Worship Planning list |

| Essence | **REDUNDANT** as module id |
|---------|----------------------------|
| **Action** | **MERGE** (done via alias); **REMOVE** from any future sidebar list |

---

### Sunday Service — `sunday-mode`

| Question | Answer |
|----------|--------|
| Weekly? | **Yes** (Sunday) |
| Monthly? | N/A |
| Admin only? | Ops / worship (`manage_events`) |
| Tab inside another? | Could be Events → “Live” tab; unique segment UI |
| Sidebar? | **Yes** for ops roles; optional hide for pastors using Home |
| Duplicate? | **Partial** — `LiveEventOpsPanel` in Events |

| Essence | **CORE** (live); **SECONDARY** (planning elsewhere) |
|---------|-----------------------------------------------------|
| **Action** | **KEEP** (see `SUNDAY_SERVICE_VALUE_REPORT.md`) |

---

### Attendance — `attendance`

| Question | Answer |
|----------|--------|
| Weekly? | **Yes** |
| Monthly? | Yes |
| Admin only? | No — counters, group leaders |
| Tab inside another? | Could link from Events; canonical check-in here |
| Sidebar? | **Yes** |
| Duplicate? | Event attendance views in Events detail — read-only/export |

| Essence | **CORE** |
|---------|----------|
| **Action** | **KEEP** |

---

### Worship Planning — `worship`

| Question | Answer |
|----------|--------|
| Weekly? | Worship leaders — but same as Events calendar |
| Monthly? | Yes |
| Admin only? | Ministry staff |
| Tab inside another? | **Yes** — Events or Worship services tab |
| Sidebar? | **Weak** — extra hop (`partial` status) |
| Duplicate? | **Yes** — lists events; run sheet in Services; no unique API |

| Essence | **REDUNDANT** |
|---------|---------------|
| **Action** | **MERGE** → Events (planning tab) or dashboard shortcut; **HIDE** sidebar |

---

### Visitors & Outreach — `outreach` (alias: `missions`)

| Question | Answer |
|----------|--------|
| Weekly? | Guest follow-up churches yes |
| Monthly? | **Typical** |
| Admin only? | Often assimilation team |
| Tab inside another? | Members or Pastoral Care |
| Sidebar? | Optional |
| Duplicate? | `missions` id is alias only |

| Essence | **SECONDARY** |
|---------|---------------|
| **Action** | **KEEP** route; **HIDE** default sidebar or group under People |

---

### Church Structure — `structure`

| Question | Answer |
|----------|--------|
| Weekly? | No |
| Monthly? | Rare |
| Admin only? | **Yes** |
| Tab inside another? | **Settings** |
| Sidebar? | No |
| Duplicate? | Ministries vs Volunteers assignments |

| Essence | **ADVANCED** |
|---------|--------------|
| **Action** | **HIDE** sidebar; **MERGE** → Settings tab |

---

### Giving — `giving`

| Question | Answer |
|----------|--------|
| Weekly? | **Yes** (finance / counters) |
| Monthly? | Yes |
| Admin only? | Finance + pastors (view) |
| Tab inside another? | Could merge Finance — but congregations expect “Giving” |
| Sidebar? | **Yes** |
| Duplicate? | Finance ledger linkage — complementary |

| Essence | **CORE** |
|---------|----------|
| **Action** | **KEEP** |

---

### Finance — `finance`

| Question | Answer |
|----------|--------|
| Weekly? | Finance staff **yes** |
| Monthly? | Treasurers |
| Admin only? | **Mostly** |
| Tab inside another? | Parent for vouchers; related to Budgets/Vendors |
| Sidebar? | **Yes** for finance roles |
| Duplicate? | HR payroll vs Vendors payroll — different workflows |

| Essence | **CORE** (finance roles); **ADVANCED** (others) |
|---------|-------------------------------------------------|
| **Action** | **KEEP** |

---

### Budgets — `budgets` (alias: `funds` tab)

| Question | Answer |
|----------|--------|
| Weekly? | No |
| Monthly? | **Yes** |
| Admin only? | Finance |
| Tab inside another? | **Yes** — Finance |
| Sidebar? | No as separate top-level |
| Duplicate? | Finance module overlap |

| Essence | **SECONDARY** |
|---------|---------------|
| **Action** | **MERGE** → Finance tab; **HIDE** sidebar |

---

### Vendors & Payroll — `vendors`

| Question | Answer |
|----------|--------|
| Weekly? | Finance ops sometimes |
| Monthly? | **Yes** |
| Admin only? | **Yes** |
| Tab inside another? | **Yes** — Finance |
| Sidebar? | No for small churches |
| Duplicate? | HR payroll structures vs accounting runs |

| Essence | **ADVANCED** |
|---------|--------------|
| **Action** | **MERGE** → Finance tab; **HIDE** sidebar |

---

### Church Assets — `assets`

| Question | Answer |
|----------|--------|
| Weekly? | No |
| Monthly? | Rare |
| Admin only? | **Yes** |
| Tab inside another? | Finance or Settings |
| Sidebar? | No |
| Duplicate? | Documents module |

| Essence | **ADVANCED** |
|---------|--------------|
| **Action** | **HIDE** sidebar; **MERGE** → Settings / Finance |

---

### Church Documents — `documents`

| Question | Answer |
|----------|--------|
| Weekly? | No |
| Monthly? | Sometimes |
| Admin only? | Office / HR |
| Tab inside another? | Settings or HR |
| Sidebar? | No |
| Duplicate? | Assets, HR staff docs |

| Essence | **ADVANCED** |
|---------|--------------|
| **Action** | **HIDE** sidebar; **MERGE** → Settings or HR tab |

---

### Sermons — `sermons` (alias: `content`)

| Question | Answer |
|----------|--------|
| Weekly? | Comms / media sometimes |
| Monthly? | **Yes** |
| Admin only? | Media team |
| Tab inside another? | Website or Events |
| Sidebar? | Optional |
| Duplicate? | Website content, Events notes |

| Essence | **SECONDARY** |
|---------|---------------|
| **Action** | **MERGE** → Website tab; **HIDE** sidebar |

---

### Communications — `communication`

| Question | Answer |
|----------|--------|
| Weekly? | **Yes** |
| Monthly? | Yes |
| Admin only? | Comms team + pastors |
| Tab inside another? | Parent for campaigns; prayer wall |
| Sidebar? | **Yes** |
| Duplicate? | **Notifications** overlap |

| Essence | **CORE** |
|---------|----------|
| **Action** | **KEEP** |

---

### Notifications — `notifications`

| Question | Answer |
|----------|--------|
| Weekly? | **Yes** (read inbox) |
| Monthly? | Yes |
| Admin only? | All staff |
| Tab inside another? | **Yes** — Communications “Inbox” + header bell |
| Sidebar? | **No** — bell + quick ops enough |
| Duplicate? | **Yes** — system alerts vs Communication campaigns |

| Essence | **REDUNDANT** as sidebar item |
|---------|-------------------------------|
| **Action** | **MERGE** → Communications tab + header; **HIDE** sidebar |

---

### Website — `website` (aliases: `pages`, `forms`, `media-library`, `landing-pages`, `seo`, `mobile`)

| Question | Answer |
|----------|--------|
| Weekly? | Comms / web volunteer |
| Monthly? | **Typical** |
| Admin only? | Often |
| Tab inside another? | Single Website workspace with tabs |
| Sidebar? | **One** entry |
| Duplicate? | Split aliases already map to tabs |

| Essence | **SECONDARY** |
|---------|---------------|
| **Action** | **KEEP** one sidebar item; aliases **MERGE** (already) |

---

### Reports — `analytics` (alias: `engagement`)

| Question | Answer |
|----------|--------|
| Weekly? | Pastors scan; finance monthly deep dive |
| Monthly? | **Yes** |
| Admin only? | Leadership |
| Tab inside another? | Home lens overlap |
| Sidebar? | **Yes** for leaders |
| Duplicate? | Home executive view |

| Essence | **SECONDARY** (CORE for leadership read) |
|---------|-------------------------------------------|
| **Action** | **KEEP**; consider **MERGE** with Home as “Reports” tab long-term |

---

### Academy / Training — `academy`

| Question | Answer |
|----------|--------|
| Weekly? | No |
| Monthly? | Onboarding only |
| Admin only? | **Yes** |
| Tab inside another? | Settings or Help |
| Sidebar? | No |
| Duplicate? | External docs |

| Essence | **ADVANCED** |
|---------|--------------|
| **Action** | **HIDE** sidebar |

---

### Change History — `audit-logs`

| Question | Answer |
|----------|--------|
| Weekly? | No |
| Monthly? | Compliance sometimes |
| Admin only? | **Yes** |
| Tab inside another? | Settings / Church Admin |
| Sidebar? | No |
| Duplicate? | Activity Log |

| Essence | **ADVANCED** |
|---------|--------------|
| **Action** | **HIDE** sidebar; **MERGE** with Activity Log under Settings |

---

### Activity Log — `workflow-monitor` (alias: `event-admin`)

| Question | Answer |
|----------|--------|
| Weekly? | No |
| Monthly? | Debugging |
| Admin only? | **Yes** |
| Tab inside another? | Church Admin |
| Sidebar? | No |
| Duplicate? | **Yes** — audit-logs + admin-center issues |

| Essence | **ADVANCED** |
|---------|--------------|
| **Action** | **MERGE** → Settings “System”; **HIDE** sidebar |

---

### Settings — `settings` (alias: `tenant-settings`)

| Question | Answer |
|----------|--------|
| Weekly? | Rare |
| Monthly? | **Yes** |
| Admin only? | **Yes** |
| Tab inside another? | Platform root |
| Sidebar? | **Yes** (one gear) |
| Duplicate? | Church Admin overlap |

| Essence | **CORE** (admin access) |
|---------|-------------------------|
| **Action** | **KEEP** (consolidate advanced into sub-tabs) |

---

### Church Admin — `admin-center` (aliases: `feature-flags`, `integrations`)

| Question | Answer |
|----------|--------|
| Weekly? | No |
| Monthly? | Platform ops |
| Admin only? | **Yes** |
| Tab inside another? | **Settings** |
| Sidebar? | No |
| Duplicate? | **Yes** — Settings + Permissions |

| Essence | **ADVANCED** |
|---------|--------------|
| **Action** | **MERGE** → Settings; **HIDE** sidebar |

---

### Roles & Access — `permissions`

| Question | Answer |
|----------|--------|
| Weekly? | No |
| Monthly? | When staffing changes |
| Admin only? | **Yes** |
| Tab inside another? | **Settings** |
| Sidebar? | No |
| Duplicate? | Church Admin governance |

| Essence | **ADVANCED** |
|---------|--------------|
| **Action** | **MERGE** → Settings tab; **HIDE** sidebar |

---

## Alias-only modules (no standalone sidebar component)

| Module id | Routes to | Essence | Action |
|-----------|-----------|---------|--------|
| `workforce` | `hr?tab=directory` | REDUNDANT | **MERGE** (done) |
| `services` | `events?tab=services` | REDUNDANT | **MERGE** (done) |
| `missions` | `outreach` | REDUNDANT | **MERGE** (done) |
| `funds` | `budgets?tab=funds` | REDUNDANT | **MERGE** (done) |
| `content` | `sermons` | REDUNDANT | **MERGE** (done) |
| `engagement` | `analytics` | REDUNDANT | **MERGE** (done) |
| `event-admin` | `workflow-monitor` | REDUNDANT | **MERGE** (done) |
| `pages`, `forms`, `media-library`, `landing-pages`, `seo`, `mobile` | `website` tabs | REDUNDANT | **MERGE** (done) |
| `feature-flags`, `integrations`, `tenant-settings` | admin/settings | REDUNDANT | **MERGE** (done) |

**Action for all:** **REMOVE** from any future canonical sidebar list only — keep redirects.

---

## Modules that weaken clarity today (priority list)

| Rank | Issue | Modules involved |
|------|--------|------------------|
| 1 | **Two planning paths for Sunday** | Worship Planning, Events, Worship services tab, Sunday Service |
| 2 | **Inbox in two places** | Notifications sidebar + Communications + header bell |
| 3 | **Finance scattered** | Giving, Finance, Budgets, Vendors, Assets, Documents (6 sidebar) |
| 4 | **Platform triple** | Settings, Church Admin, Roles & Access, Activity Log, Change History |
| 5 | **People sprawl** | Members, Families, Volunteers, HR, Small Groups, Pathways (6 in Identity) |
| 6 | **Partial modules on nav** | Families, Volunteers, Worship, Communication (`partial` in registry) |

---

## Action rollup (KEEP / MERGE / HIDE / REMOVE)

| Module | KEEP | MERGE | HIDE | REMOVE |
|--------|:----:|:-----:|:----:|:------:|
| dashboard | ✓ | | | |
| profile | ✓ | | | |
| members | ✓ | | | |
| families | | ✓ → Members | ✓ | |
| volunteers | ✓ | | | |
| hr | ✓ | | ✓ default | |
| small-groups | ✓ | | ✓ default | |
| pathways | | ✓ → Pastoral/Members | ✓ | |
| discipleship | ✓ | | | |
| events | ✓ | | | |
| services | | ✓ (alias) | | ✓ sidebar |
| sunday-mode | ✓ | (optional → Events live) | | |
| attendance | ✓ | | | |
| worship | | ✓ → Events | ✓ | |
| outreach | ✓ | | ✓ optional | |
| structure | | ✓ → Settings | ✓ | |
| giving | ✓ | | | |
| finance | ✓ | | | |
| budgets | | ✓ → Finance | ✓ | |
| vendors | | ✓ → Finance | ✓ | |
| assets | | ✓ → Settings | ✓ | |
| documents | | ✓ → Settings/HR | ✓ | |
| sermons | | ✓ → Website | ✓ | |
| communication | ✓ | | | |
| notifications | | ✓ → Communication | ✓ | ✓ nav |
| website | ✓ | | | |
| analytics | ✓ | | | |
| academy | | ✓ → Help/Settings | ✓ | |
| audit-logs | | ✓ → Settings | ✓ | |
| workflow-monitor | | ✓ → Settings | ✓ | |
| settings | ✓ | absorb admin | | |
| admin-center | | ✓ → Settings | ✓ | |
| permissions | | ✓ → Settings | ✓ | |
| workforce | | ✓ (alias) | | ✓ nav |
| missions, funds, content, engagement, etc. | | ✓ (alias) | | ✓ nav |

**REMOVE** in this table means **remove from sidebar / canonical nav only**, not delete code or APIs.

---

## Recommended navigation tiers (implementation later)

### Tier 1 — Sidebar (regular use)

`dashboard`, `members`, `volunteers`, `events`, `sunday-mode`, `attendance`, `discipleship`, `giving`, `communication`, `finance` (role-gated), `website` (role-gated), `analytics` (role-gated)

### Tier 2 — “More” or role-expanded

`outreach`, `small-groups`, `hr`, `sermons` (if not under Website)

### Tier 3 — Settings → Advanced

`structure`, `assets`, `documents`, `budgets`, `vendors`, `permissions`, `admin-center`, `audit-logs`, `workflow-monitor`, `academy`

---

## Role vs clutter

`roleExperience.ts` already uses `sidebarAllowList` for focused roles (accountant, volunteer coordinator, youth pastor). **Extend that pattern** instead of showing all 31 items to every admin:

- **Senior pastor:** Home, Members, Pastoral Care, Giving, Events, Sunday Service (shortcut), Reports  
- **Church admin:** Home, Members, Events, Attendance, Volunteers, Communications, Settings  
- **Finance:** Giving, Finance (+ budgets/vendors tabs), Reports  
- **HR:** HR, Members, Finance vendors link  

This achieves simpler feel **without removing modules**.

---

## Conclusion

UCOS capability is broad; **clarity suffers from sidebar parity** — every submodule gets equal visibility. Most churches need **~12 primary modules**; the rest should be **MERGE** (tabs/aliases) or **HIDE** (settings / role gates).

**Do not REMOVE** live features (Sunday segment driver, HR, finance depth). **Do REMOVE** duplicate **navigation entries** and consolidate **Worship Planning**, **Notifications**, **platform admin**, and **finance satellites** into parents.

**No code changes in this audit** — use this report to sequence a navigation-only consolidation pass aligned with `adminNavigation.ts`, `AppShell.tsx`, and `roleExperience.ts`.

---

## Related documents

- `STAFF_MODULE_CONSOLIDATION_REPORT.md` — HR / Staff Directory  
- `SUNDAY_SERVICE_VALUE_REPORT.md` — Sunday Service vs Events  
- `SUNDAY_SERVICE_CLARITY_REPORT.md` — Sunday UX copy  
- `churchProductCopy.ts` — label source of truth
