# Church Administrator Guide — Ultimate Church OS

**For:** Church Administrator, Operations Manager, Office Manager  
**Sign in:** Church office → `/login`

---

## Your home screen

You land on **Home** titled **Church operations** with a **first-day checklist**:

1. Review upcoming **Events**  
2. Prepare **Attendance** sessions  
3. Check **Volunteer** rosters  
4. Send a **Communications** update  

The sidebar shows operations modules only — HR and finance clutter is hidden (those teams use their own logins).

---

## What you own day to day

| Module | Purpose |
|--------|---------|
| **Events** | Create, approve, schedule gatherings |
| **Sunday Service** | Live run sheet for Sunday |
| **Attendance** | Sessions and check-in |
| **Volunteers** | Roles and assignments |
| **Members / Families** | Directory and households |
| **Communications** | Announcements and campaigns |
| **Settings** | Church name, branding, organization info |
| **Website** | Public pages (if enabled) |

---

## Setup you lead (once)

Work through [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) with IT:

- Church name and address in **Settings**  
- Logo and branding  
- Service times on website  
- Staff accounts and roles (**Roles & Access**)  

---

## Weekly operations

| Day | Tasks |
|-----|--------|
| Mon–Wed | Events, volunteer assignments, comms draft |
| Thu | Attendance sessions for Sunday |
| Fri | Final volunteer list; test Sunday Mode |
| Sun | Support check-in; monitor Sunday Mode |
| Mon | Close attendance session; export if needed |

---

## Key workflows

### New event

1. **Events** → Create  
2. Set date, type, campus  
3. Publish / approve per your policy  

### Sunday check-in

1. **Attendance** → open or create Sunday session  
2. Check in members (or support kiosk flow)  
3. Close session after service  

### Volunteer team

1. **Volunteers** → assign roles to members  
2. Confirm in **Sunday Service** run sheet  

### Church-wide message

1. **Communications** → announcement or campaign  
2. Confirm delivery is **in-app** (email/SMS per your deployment)  

---

## Staff accounts

1. **Settings** or **Roles & Access**  
2. Create user → assign church role (Pastor, Treasurer, etc.)  
3. Link to **Member** profile when they are also in the directory  

**Demo rehearsal only:** `npm run seed:demo-roles` on non-production DB.

---

## Help

- **Guide** walkthrough in header  
- **Academy** → Church operations track  
- `/guides/church-administrator.md` on your site  

---

## UAT

[UAT_TEST_PLAN.md](../../UAT_TEST_PLAN.md) §2 — Church Administrator.
