# Login Matrix — Grace Community Church

**After:** `npm run clean:install`  
**Tenant ID:** `default-tenant-id` (or your `VITE_TENANT_ID`)

---

## Administrator

| Username | Password | Role | Member name | Landing | Primary responsibilities |
|----------|----------|------|-------------|---------|------------------------|
| `admin` | `admin123` | Super Admin | — (not linked) | Dashboard | Full system access, setup, all modules |

---

## Leadership & staff (`demo123`)

| Username | Password | Role | Member name | Landing | Primary responsibilities |
|----------|----------|------|-------------|---------|------------------------|
| `pastor` | `demo123` | Senior Pastor | Ravi Nair | Dashboard (Pastoral) | Church health, care, events, giving overview |
| `associate` | `demo123` | Associate Pastor | David Kurian | Dashboard (Pastoral) | Pastoral care, events, members |
| `youth` | `demo123` | Youth Pastor | Anita George | Sunday Mode | Youth events & attendance |
| `churchadmin` | `demo123` | Church Administrator | Sarah Thomas | Dashboard (Operations) | Members, events, attendance, comms |
| `worship` | `demo123` | Worship Pastor | Thomas Menon | Sunday Mode | Worship services & teams |
| `finance` | `demo123` | Finance Manager | James Joseph | Finance | Donations, vouchers, payroll, reports |
| `accountant` | `demo123` | Accountant | Daniel Nair | Finance | Vouchers, giving, budgets |
| `hradmin` | `demo123` | HR Manager | Susan Joseph | HR | Staff records, payroll |
| `volunteers` | `demo123` | Volunteer Coordinator | Kevin Joseph | Events / Volunteers | Volunteer assignments |
| `secretary` | `demo123` | Communications Manager | Rachel Thomas | Communication | Campaigns, documents |
| `groupleader` | `demo123` | Small Group Leader | Priya Paul | Members / Groups | Home group leader |
| `staffdesk` | `demo123` | Staff | Philip Thomas | Events | Front-desk events & members |
| `events` | `demo123` | Ministry Leader | Joshua George | Events | Event operations |
| `campus` | `demo123` | Campus Admin | Arjun Varughese | Dashboard | Campus coordination |

---

## Member portal

| Username | Password | Role | Member name | Landing | Primary responsibilities |
|----------|----------|------|-------------|---------|------------------------|
| `member` | `demo123` | Member | Meera Kurian | Member portal | Personal giving, prayer, events, profile |

*Portal user email: `portal@gracecommunity.in` (login username `member`).*

---

## Quick validation

```bash
npm run validate:roles   # API on http://127.0.0.1:4002
```

---

## Public website (no login)

- Published pages from CMS (`flagship-v2` template)  
- Organization: Grace Community Church, Chennai  
- Same visual design as template; content from database  

---

*Human UAT: use this matrix for role walkthroughs. See `ROLE_MATRIX.md` for module detail.*
