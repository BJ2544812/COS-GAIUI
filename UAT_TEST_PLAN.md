# Ultimate Church OS — UAT Test Plan

**Purpose:** Human acceptance testing before production pilot.  
**Environment:** Run `npm run seed:launch` on UAT database; use demo passwords below.  
**Pass criteria:** Steps complete without data loss, blocking errors, or wrong-role access.

---

## Demo credentials

| Role | Username | Password |
|------|----------|----------|
| Platform admin | `admin` | `admin123` |
| All church demo roles | see role name below | `demo123` |
| Member | `member` | `demo123` |

Staff URLs: `/login` → church office · Members: `/member-login` → `/portal`

---

## 1. Senior Pastor UAT

**Account:** `pastor` / `demo123`

| # | Step | Expected result | Pass? |
|---|------|-----------------|-------|
| 1 | Log in | Lands on **Home**; pastoral title visible | |
| 2 | Open **Pastoral Care** from sidebar or first-day card | Care desk loads; cases/tasks visible | |
| 3 | Open **Members** | Directory loads; search works | |
| 4 | Open **Giving** | Gift list or entry screen loads | |
| 5 | Open **Reports** (if visible) | Analytics loads | |
| 6 | Confirm **Finance** not in primary sidebar | No finance desk in reduced nav (URL may still work if typed) | |
| 7 | Open **Guide** walkthrough (header) | Walkthrough panel opens | |

---

## 2. Church Administrator UAT

**Account:** `churchadmin` / `demo123`

| # | Step | Expected result | Pass? |
|---|------|-----------------|-------|
| 1 | Log in | **Home** with “Church operations” and **first-day** four steps | |
| 2 | Sidebar shows Operations-focused items only | No HR / Workforce / Pathways clutter | |
| 3 | Step 1 → **Events** | Events list loads | |
| 4 | **Attendance** | Sessions/check-in available | |
| 5 | **Volunteers** | Assignments or empty state with guidance | |
| 6 | **Communications** | Hub loads | |
| 7 | **Settings** | Church settings editable | |
| 8 | Dismiss first-day card | Card hides on reload | |

---

## 3. Finance Manager UAT

**Account:** `finance` / `demo123`

| # | Step | Expected result | Pass? |
|---|------|-----------------|-------|
| 1 | Log in | Lands on **Finance** (vouchers tab) | |
| 2 | Record or view a **voucher** | Saves without error | |
| 3 | Open **Giving** | Donations list loads | |
| 4 | Open **Budgets** | Budget workspace loads | |
| 5 | Open **Vendors & Payroll** | Vendor list loads | |
| 6 | Run a **report** or trial balance (if configured) | API/UI responds | |

---

## 4. Accountant UAT

**Account:** `accountant` / `demo123`

| # | Step | Expected result | Pass? |
|---|------|-----------------|-------|
| 1 | Log in | **Finance** desk; “Accounting desk” home title | |
| 2 | Sidebar limited to finance modules | No HR, volunteers, or pastoral care in nav | |
| 3 | First-day steps visible | Four accounting steps on Home | |
| 4 | Create/view voucher | Works | |
| 5 | Open **Giving** | Read access OK | |
| 6 | Confirm cannot access HR URL intentionally | Blocked or empty if no `manage_hr` | |

---

## 5. HR Manager UAT

**Account:** `hradmin` / `demo123`

| # | Step | Expected result | Pass? |
|---|------|-----------------|-------|
| 1 | Log in | **HR & Staff** module | |
| 2 | View employee / member HR profile | Loads | |
| 3 | Submit or approve **leave** (if data exists) | Workflow responds | |
| 4 | Open **Workforce** directory | Staff list loads | |

---

## 6. Volunteer Coordinator UAT

**Account:** `volunteers` / `demo123`

| # | Step | Expected result | Pass? |
|---|------|-----------------|-------|
| 1 | Log in | **Volunteers** module | |
| 2 | Sidebar shows volunteers, events, attendance, Sunday only | No HR/finance | |
| 3 | First-day card → **Volunteer desk** | Module loads | |
| 4 | **Assign Role** (if empty) | Modal works; assignment appears | |
| 5 | **Sunday Mode** | Run sheet loads | |
| 6 | **Attendance** | Check-in UI loads | |

---

## 7. Youth Pastor UAT

**Account:** `youth` / `demo123`

| # | Step | Expected result | Pass? |
|---|------|-----------------|-------|
| 1 | Log in | **Sunday Mode** or youth-titled home | |
| 2 | Title shows **Youth ministry** | Not generic “Ministry operations” only | |
| 3 | Sidebar: Sunday, events, attendance, worship | No finance/HR | |
| 4 | First-day steps → **Events** | Youth events visible | |
| 5 | **Worship planning** | Module loads | |

---

## 8. Worship Pastor UAT

**Account:** `worship` / `demo123`

| # | Step | Expected result | Pass? |
|---|------|-----------------|-------|
| 1 | Log in | **Sunday Mode** | |
| 2 | **Worship planning** | Set list / planning UI | |
| 3 | **Events** | Service events visible | |

---

## 9. Communications Manager UAT

**Account:** `secretary` / `demo123`

| # | Step | Expected result | Pass? |
|---|------|-----------------|-------|
| 1 | Log in | **Communications** | |
| 2 | Create or view **announcement** | Saves / lists | |
| 3 | **Notifications** | Inbox loads | |
| 4 | **Website** (if permitted) | Builder loads | |

---

## 10. Small Group Leader UAT

**Account:** `groupleader` / `demo123`

| # | Step | Expected result | Pass? |
|---|------|-----------------|-------|
| 1 | Log in | **Small Groups** | |
| 2 | First-day card visible | Four group-leader steps | |
| 3 | See group or helpful empty state | Message explains church office assignment | |
| 4 | **Attendance** for group | Check-in loads | |
| 5 | **Pastoral Care** | Care notes accessible | |

---

## 11. Staff UAT

**Account:** `staffdesk` / `demo123`

| # | Step | Expected result | Pass? |
|---|------|-----------------|-------|
| 1 | Log in | **Church office** home with first-day steps | |
| 2 | Sidebar: members, events, notifications, Sunday | No finance/HR clutter | |
| 3 | **Members** → find a person | Profile opens | |
| 4 | **Events** | Calendar/list loads | |
| 5 | Personal home shows tasks/events snapshot | Not blank screen | |

---

## 12. Member UAT

**Account:** `member` / `demo123` at `/member-login`

| # | Step | Expected result | Pass? |
|---|------|-----------------|-------|
| 1 | Log in | **My Church** portal | |
| 2 | **Prayer requests** — submit | Success message | |
| 3 | **Giving history** | List or empty state | |
| 4 | **My groups** | Group or guidance text | |
| 5 | **Recent sermons** | List or empty | |
| 6 | **Give online** link | `/donate` loads | |

---

## 13. Cross-cutting checks (any admin)

| # | Step | Expected result | Pass? |
|---|------|-----------------|-------|
| 1 | `npm run lint` / deployed build | No console white-screen on `/admin` | |
| 2 | Sign out / sign in | Session restores correctly | |
| 3 | **Academy** + guide links | `/guides/*.md` opens | |
| 4 | Mobile width sidebar | Menu opens/closes | |

---

## Defect logging template

```
Role:
Step #:
Expected:
Actual:
Severity: Blocker / Major / Minor
Screenshot:
```

---

## UAT sign-off

| Stakeholder | Role tested | Date | Pass / Fail |
|-------------|-------------|------|-------------|
| | Senior Pastor | | |
| | Church Administrator | | |
| | Finance | | |
| | HR | | |
| | Volunteers | | |
| | Member | | |

**Release to pilot:** All **Blocker** and **Major** defects resolved or waived in writing.
