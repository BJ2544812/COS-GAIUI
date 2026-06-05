# Ultimate Church OS — Pilot Church Package

**Purpose:** Everything a first pilot church needs for human UAT, staff training, and go-live.  
**Engineering status:** Validation complete — use this package for people and process, not for another technical audit.

---

## Package contents

| Document | Audience | Use when |
|----------|----------|----------|
| [UAT_TRACKING_DASHBOARD.md](./UAT_TRACKING_DASHBOARD.md) | Project lead, vendor | Tracking UAT progress and sign-off |
| [UAT_TEST_PLAN.md](../../UAT_TEST_PLAN.md) | Testers | Step-by-step test scripts (repo root) |
| [DEFECT_LOG.md](./DEFECT_LOG.md) | All testers | Log issues found in UAT |
| [RESOLUTION_LOG.md](./RESOLUTION_LOG.md) | Engineering | Track fixes and releases |
| [PASTOR_GUIDE.md](./PASTOR_GUIDE.md) | Senior Pastor | Training & daily use |
| [ADMINISTRATOR_GUIDE.md](./ADMINISTRATOR_GUIDE.md) | Church Administrator | Operations training |
| [TREASURER_GUIDE.md](./TREASURER_GUIDE.md) | Finance Manager / Treasurer | Stewardship & finance |
| [MEMBER_GUIDE.md](./MEMBER_GUIDE.md) | Congregation | Member portal |
| [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) | Admin + IT | Before first login |
| [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md) | Leadership | Launch day |
| [BACKUP_CHECKLIST.md](./BACKUP_CHECKLIST.md) | Admin + IT | Ongoing protection |

**Browser guides (Academy links):** Also published at `/guides/*.md` after deploy (see `public/guides/`).

---

## Pilot timeline (suggested)

| Week | Activity |
|------|----------|
| 0 | Complete **Setup checklist** on UAT/staging |
| 1 | Role-based **UAT** using tracking dashboard |
| 2 | Staff **training** with role guides |
| 3 | Soft launch (limited modules) |
| 4 | **Go-live** with leadership sign-off |

---

## Technical contacts

- Staff login: `https://<your-domain>/login`
- Member login: `https://<your-domain>/member-login`
- Church office: `https://<your-domain>/admin`
- Public site: `https://<your-domain>/`

For a **demo rehearsal**, IT may run `npm run seed:launch` on a non-production database only.

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Senior Pastor | | | |
| Church Administrator | | | |
| Treasurer | | | |
| Project lead | | | |
