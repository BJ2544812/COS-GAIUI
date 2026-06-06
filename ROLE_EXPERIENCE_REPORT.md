# Role Experience Report — Browser Truth

**Date:** 6 June 2026  
**Method:** Live login as each role at `http://127.0.0.1:3001`  
**Credentials:** `LOGIN_MATRIX.md` — staff `demo123`, admin `admin123`  
**Artifact:** `scratch/truth-discovery-roles.json`

**Phase 0 re-validation:** 6 June 2026 — after P0 stabilization fixes (no UI redesign)

---

## Phase 0 — P0 Fix Validation

| P0 item | Fix | Browser result |
|---------|-----|----------------|
| Volunteer Coordinator landing | `landingModule: volunteers`; Volunteers added to sidebar | ✓ Lands `/admin?module=volunteers` — Playwright 13/13 |
| Youth Pastor landing | `landingModule: events`; youth-specific Sunday copy when opened from nav | ✓ Lands `/admin?module=events` — Playwright 13/13 |
| Test artifacts on Home | `operationalEventFilter` on API + Home command center | ✓ Admin Home: no "Usability Sunday" / "Frontend Validation" entries |
| Member giving inconsistency | YTD aggregate + demo seed donations for Meera Kurian | ✓ Portal: Recent giving **12,700** + "giving statement ready" (consistent) |
| QR check-in placeholder | Working `QRCodeSVG` → `/member-login`; "Coming soon" removed | ✓ Kiosk toggle shows scannable QR + My Church copy |

**Automated regression:** `npx playwright test e2e/role-experience.spec.ts` — **13/13 passed**

---

## Roles Tested

| Role | Username | Password | Login result |
|------|----------|----------|--------------|
| Administrator | admin | admin123 | ✓ |
| Senior Pastor | pastor | demo123 | ✓ |
| Pastor (Associate) | associate | demo123 | ✓ |
| Worship Leader | worship | demo123 | ✓ |
| Youth Pastor | youth | demo123 | ✓ — lands Events |
| Finance Officer | finance | demo123 | ✓ |
| Treasurer | accountant | demo123 | ✓ (no dedicated Treasurer role in seed) |
| Counter Team | counter | demo123 | ✓ |
| Volunteer Coordinator | volunteers | demo123 | ✓ — lands Volunteers |
| Staff | staffdesk | demo123 | ✓ |
| Member | member | demo123 | ✓ via `/member-login` → `/portal` |

---

## Administrator (`admin`)

### Where do they land?
`/admin?module=dashboard` — **Home (operations lens)**

### What do they see?
- Heading: **Church leadership**
- Full sidebar: 22 modules across 7 groups
- Setup progress 7/8, onboarding checklist, demo walkthrough prompts
- Operations home: real services/events only — **test usability events filtered from This week**
- Upcoming events show legitimate calendar items (Sunday Worship, Prayer Meeting, Youth Fellowship, etc.)

### What can they do?
Everything — all modules, Church Admin, Roles & Access, Finance, HR, Website, Activity Log.

### Confusing?
- Evaluator widgets on Home ("Show me what to test next", "Explore Ultimate Church OS")
- Product name inconsistency (Kingdom OS vs Ultimate Church OS)
- Too many equal-weight stat cards

### Beautiful?
- Comprehensive command center when test data removed
- Quick ops bar (Sunday, Check-in, People, Alerts)

### Ugly?
- ALL CAPS labels
- Setup progress still visible after go-live

### Should NOT be visible?
- Pilot UAT credentials on login page (to all users)
- Internal voucher source codes (`gcc-v2`)

### Missing?
- Nothing access-wise — role is all-powerful

### Breaks?
- Nothing — full access works

---

## Senior Pastor (`pastor`)

### Where do they land?
`/admin?module=dashboard` — **Home (pastoral lens)**

### What do they see?
- Heading: **Pastoral leadership**
- Subtitle: Church health, people, ministry, stewardship
- Tabs: My day, Overview, This week, People & care
- Follow-up priority list (inactive members, guests without tasks)
- Stats: attendance/giving signals (49, ₹2,30,410)
- Sidebar: 15 items — **no Finance module, no Settings**

### What can they do?
Members, Small Groups, Pastoral Care, Outreach, Events, Sunday, Attendance, Sermons, Communications, Notifications, Giving (view), HR, Home, Reports, Training.

### Confusing?
- Setup progress widget still visible to pastor
- "49" repeated three times in stat area — unclear labels
- Giving access without Finance — OK but no giving detail depth

### Beautiful?
- Pastoral follow-up priority list with human names and reasons
- People & care tab focus

### Ugly?
- ERP-style MY DAY / OVERVIEW tabs

### Should NOT be visible?
- Setup/evaluator cards after church is live
- HR & Staff (debatably — pastors may want volunteer staff view only)

### Missing?
- Cannot access Settings/Structure (may need read-only church config)
- No dedicated pastoral care queue module entry — buried in Home

### Breaks?
- Nothing observed

---

## Pastor — Associate (`associate`)

### Where do they land?
`/admin?module=dashboard` — pastoral lens (same as Senior Pastor)

### What do they see?
- Narrower sidebar: 10 items
- No Communications, Notifications, Outreach, Reports, Giving

### What can they do?
Members, Small Groups, Pastoral Care, Events, Sunday, Attendance, Sermons, HR, Home.

### Confusing?
- Nearly identical to Senior Pastor on Home but fewer nav items — unclear differentiation

### Beautiful / Ugly?
Same as Senior Pastor.

### Should NOT be visible?
HR & Staff — associate pastor rarely needs payroll access.

### Missing?
Outreach and Communications for follow-up-heavy associate role.

### Breaks?
Nothing.

---

## Worship Leader (`worship`)

### Where do they land?
`/admin?module=sunday-mode` — **Sunday Service cockpit** ✓ Excellent

### What do they see?
- Heading: **Sunday Service**
- Live service selector (test events filtered from picker)
- Run sheet, team readiness, live sync indicator
- Sidebar: Events, Sunday Service, Attendance, Sermons, Home (5 items)

### What can they do?
Run live service, select active worship service, manage teams, check-in flow, jump to Events.

### Confusing?
- Planning still requires leaving Sunday module for Events

### Beautiful?
- **Best role experience in product** — focused, operational, clear purpose
- "Your live-service control center" subtitle works

### Ugly?
- "Not ready · 0%" on some services without next-step guidance

### Should NOT be visible?
Test/draft usability services in production picker — **filtered in Phase 0**

### Missing?
Rehearsal schedule, setlist editor (PDF Module 6)

### Breaks?
Nothing — core Sunday flow works

---

## Youth Pastor (`youth`)

### Where do they land?
`/admin?module=events` — **Events workspace** ✓ (Phase 0 fix)

### What do they see?
- Heading: **Youth ministry** / Events calendar
- Subtitle: Youth events, attendance, and team coordination
- Sidebar: Events, Sunday Service, Attendance, Members, Pastoral Care, Home (7 items)
- If opened from nav: Sunday Service shows youth-specific intro copy (not worship-leader default)

### What can they do?
Manage youth events, attendance, member/pastoral follow-up, Sunday support when needed.

### Confusing?
- Youth event quick-access from Home still absent — must use Events module
- Sunday module still available with worship tooling — secondary path

### Beautiful?
Events workspace is appropriate landing for youth ministry coordination.

### Ugly?
N/A for landing — persona copy fixed when Sunday is opened.

### Should NOT be visible?
Worship-specific "live-service control center for today's worship" as default youth landing — **fixed**

### Missing?
Youth-specific dashboard tile on Home, youth group roster shortcut.

### Breaks?
**Resolved** — youth pastor no longer treated as worship pastor on login.

---

## Finance Officer (`finance`)

### Where do they land?
`/admin?module=finance&tab=vouchers` — **Finance vouchers** ✓

### What do they see?
- Heading: **Finance**
- Subtitle: "Calm books for your church"
- 119 vouchers, 7 awaiting review
- Sidebar: Giving, Finance, Home, HR (4 items)

### What can they do?
Full finance workspace, giving module, HR/payroll access, voucher approve/post.

### Confusing?
- 12 finance tabs — steep learning curve
- Lands on vouchers not overview — good for accountant, harsh for new treasurer

### Beautiful?
- Finance copy tone is excellent
- Voucher registry layout professional

### Ugly?
- Internal filter values visible
- Tab bar density

### Should NOT be visible?
Members, Events — correctly hidden ✓

### Missing?
Simple "today's offerings" view for non-accountant finance officer

### Breaks?
Nothing — finance workflow operational

---

## Treasurer (`accountant`)

### Where do they land?
`/admin?module=finance&tab=vouchers` — same as Finance Officer

### What do they see?
- Narrower sidebar: Giving, Finance, Home (3 items) — **no HR**

### What can they do?
Vouchers, giving, reports — no payroll HR tab.

### Confusing?
- No separate "Treasurer" role in seed — accountant used as proxy
- Identical landing to Finance Manager

### Beautiful / Ugly?
Same as finance.

### Should NOT be visible?
HR — correctly hidden for accountant ✓

### Missing?
Treasurer-specific simplified dashboard (PDF implies finance role variants)

### Breaks?
Nothing.

---

## Counter Team (`counter`)

### Where do they land?
`/admin?module=attendance` — **Attendance** ✓

### What do they see?
- TOTAL ATTENDANCES 697, open sessions
- Session list with test conferences **filtered**
- **Self check-in kiosk** toggle — scannable QR to `/member-login` (no "Coming soon")

### What can they do?
Create sessions, open check-in, visitor quick-entry, export, show QR kiosk for members.

### Confusing?
- Must open a session and toggle kiosk — QR not visible until session selected
- Must click session before check-in — extra step

### Beautiful?
- Check-in flow once inside session is clean
- Large touch-friendly inputs
- QR kiosk card with clear My Church instructions

### Ugly?
N/A — placeholder removed in Phase 0

### Should NOT be visible?
Events module editing — has Events/Sunday in nav but role is check-in focused

### Missing?
Dedicated full-screen kiosk mode (PDF ideal); current QR opens member login for welcome-team handoff

### Breaks?
Nothing for manual check-in or QR display

---

## Volunteer Coordinator (`volunteers`)

### Where do they land?
`/admin?module=volunteers` — **Volunteers module** ✓ (Phase 0 fix)

### What do they see?
- Volunteer coordination workspace (not member directory)
- Sidebar includes **Volunteers** in Operations group
- Events, Sunday, Attendance, Members, Small Groups, Home also available

### What can they do?
Manage volunteer rosters, assignments, Sunday team coverage from dedicated module.

### Confusing?
- Coverage gaps still surfaced on Home — may duplicate Volunteers module views

### Beautiful?
Correct landing aligns role name with first screen.

### Ugly?
N/A — landing bug resolved.

### Should NOT be visible?
Full member directory as default landing — **fixed**

### Missing?
Assignment queue as Home widget; burnout/shortage alerts integrated into Volunteers landing

### Breaks?
**Resolved** — Playwright and browser confirm `/module=volunteers`

---

## Staff (`staffdesk`)

### Where do they land?
`/admin?module=dashboard` — **Home (office lens)**

### What do they see?
- Heading: **Church office**
- "Your first day" 4-step onboarding card
- Sidebar: Members, Pastoral Care, Events, Sunday, Home (5 items)

### What can they do?
Front-desk member lookup, events calendar, Sunday support view, alerts.

### Confusing?
- First-day card + operations home redundant
- Scratch pad "LOCAL ONLY — NOT SYNCED" visible — unfinished

### Beautiful?
First-day steps are helpful for genuine new staff.

### Ugly?
Setup progress still showing.

### Should NOT be visible?
Evaluator/test prompts.

### Missing?
Simple visitor registration shortcut on Home (must go to Outreach).

### Breaks?
Nothing.

---

## Member (`member` → Meera Kurian)

### Where do they land?
`/portal` — **Member portal** ✓

### What do they see?
- Heading: **Meera Kurian** — Chennai · Member
- Stats: 14 check-ins (90d), **12,700 recent giving**, 0 active roles
- Upcoming events (VBS, prayer, youth)
- Small group: Married Couples — Church Lane
- Sermons with Watch links
- Prayer request form + recent requests
- Notification: giving statement ready — **consistent with YTD total**

### What can they do?
Submit prayer, watch sermons, view events, link to public giving, sign out.

### Confusing?
- Submit prayer disabled until text entered — no hint
- Duplicate VBS notification cards

### Beautiful?
- **Warmest UI in product** — human, readable, church-appropriate
- Clear church identity header

### Ugly?
Empty active roles stat (0 roles) feels abandoned

### Should NOT be visible?
Staff admin links — correctly absent ✓

### Missing?
Messaging, volunteer schedule confirm, profile edit, self QR check-in completion, recurring giving, document download

### Breaks?
**Resolved** — giving total and statement notification now align

---

## Role Experience Scorecard

| Role | Landing correct? | Nav appropriate? | 5-sec comprehension? | Would enjoy? |
|------|------------------|------------------|----------------------|--------------|
| Administrator | ✓ | ✓ (too broad) | Partial (Home cleaner) | N/A |
| Senior Pastor | ✓ | Mostly ✓ | Partial | Partial |
| Associate Pastor | ✓ | Partial | Partial | Partial |
| Worship Leader | ✓✓ | ✓✓ | ✓ | Yes |
| Youth Pastor | **✓** | Partial | Partial | Partial |
| Finance Officer | ✓ | ✓ | Partial | Partial |
| Treasurer | ✓ | ✓ | Partial | Partial |
| Counter Team | ✓ | Partial | Partial | Partial |
| Volunteer Coord | **✓** | **✓** | Partial | Partial |
| Staff | ✓ | ✓ | ✓ | Yes |
| Member | ✓ | N/A (portal) | ✓ | Partial |

---

## Cross-Role Observations

1. **Best experience:** Worship Leader → Sunday Service cockpit  
2. **Phase 0 resolved:** Volunteer Coordinator → Volunteers; Youth Pastor → Events; Member giving; Home test artifacts; QR kiosk  
3. **Most improved needed (Phase 2+):** Youth Home shortcuts, Member portal depth, Pastor Home simplification  
4. **Role filtering works:** Finance cannot see Members; Pastor cannot see Settings  
5. **No Volunteer role** in seed — only Volunteer Coordinator (staff), not congregation volunteer login  

---

## Phase 0 Gate

**Status: PASS** — All five P0 items verified in browser and/or Playwright. Safe to proceed to Phase 1 (Dummy Data Cleanup) when approved.

---

*Browser-verified 6 June 2026. Phase 0 stabilization applied; reports updated post-fix.*
