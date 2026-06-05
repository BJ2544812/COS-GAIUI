# UAT & Pilot Program — Start Here

**Mode:** Human UAT and pilot deployment only. No further engineering audits unless UAT finds defects.

---

## Quick links

| Need | Document |
|------|----------|
| **Track UAT progress** | [docs/pilot-church/UAT_TRACKING_DASHBOARD.md](docs/pilot-church/UAT_TRACKING_DASHBOARD.md) |
| **Run test scripts** | [UAT_TEST_PLAN.md](UAT_TEST_PLAN.md) |
| **Log a bug** | [docs/pilot-church/DEFECT_LOG.md](docs/pilot-church/DEFECT_LOG.md) |
| **Engineering fixes** | [docs/pilot-church/RESOLUTION_LOG.md](docs/pilot-church/RESOLUTION_LOG.md) |
| **Pilot package index** | [docs/pilot-church/README.md](docs/pilot-church/README.md) |

---

## Pilot Church Package (training & go-live)

| Guide / checklist | Path |
|-------------------|------|
| Pastor Guide | [docs/pilot-church/PASTOR_GUIDE.md](docs/pilot-church/PASTOR_GUIDE.md) |
| Administrator Guide | [docs/pilot-church/ADMINISTRATOR_GUIDE.md](docs/pilot-church/ADMINISTRATOR_GUIDE.md) |
| Treasurer Guide | [docs/pilot-church/TREASURER_GUIDE.md](docs/pilot-church/TREASURER_GUIDE.md) |
| Member Guide | [docs/pilot-church/MEMBER_GUIDE.md](docs/pilot-church/MEMBER_GUIDE.md) |
| Setup Checklist | [docs/pilot-church/SETUP_CHECKLIST.md](docs/pilot-church/SETUP_CHECKLIST.md) |
| Go-Live Checklist | [docs/pilot-church/GO_LIVE_CHECKLIST.md](docs/pilot-church/GO_LIVE_CHECKLIST.md) |
| Backup Checklist | [docs/pilot-church/BACKUP_CHECKLIST.md](docs/pilot-church/BACKUP_CHECKLIST.md) |

**Hosted copies (after deploy):** `/guides/pastor.md`, `administrator.md`, `treasurer.md`, `member-portal.md`

---

## Engineering baseline (already complete)

Do not re-run full platform audits. Re-validate only when a defect fix ships:

- [FINAL_RELEASE_CANDIDATE_REPORT.md](FINAL_RELEASE_CANDIDATE_REPORT.md)
- [ROLE_POLISH_REPORT.md](ROLE_POLISH_REPORT.md)
- `npm run lint` · `npm run build` · `npm run test:pw:ci`

---

## UAT Support mode (current)

**Status:** [docs/pilot-church/UAT_SUPPORT_STATUS.md](docs/pilot-church/UAT_SUPPORT_STATUS.md)  
**Open defects:** 0 (awaiting pilot tester entries in DEFECT_LOG)

## Operating rules

1. **Log every UAT issue** in DEFECT_LOG (Blocker / Major / Minor).  
2. **Engineering fixes only** what UAT finds — no new features in pilot phase.  
3. **Retest** after each RESOLUTION_LOG entry.  
4. **Go-live** only after UAT_TRACKING_DASHBOARD sign-off and GO_LIVE_CHECKLIST.  

---

## Success = a real church can…

- [ ] Complete setup on their environment  
- [ ] Train pastor, admin, treasurer, and members  
- [ ] Run a Sunday with attendance and giving  
- [ ] Use member portal  
- [ ] Back up and recover data  
- [ ] Sign leadership go-live approval  
