# Pilot Church — Backup Checklist

**Goal:** Protect people, financial, and operational data from loss.  
**Owner:** Church Administrator + IT

---

## What to back up

| Data | Where in product | Method |
|------|------------------|--------|
| Full tenant (members, finance, settings) | Admin Center | Tenant backup export |
| Database (all churches on server) | Server | PostgreSQL dump (IT) |
| Uploaded files | Object storage | Storage replication / snapshot |
| Configuration | Secrets vault | IT export (no secrets in email) |

---

## Before UAT

| # | Task | Done | Date | Stored where |
|---|------|------|------|--------------|
| 1 | Snapshot database after setup | ☐ | | |
| 2 | Document `DATABASE_URL` and restore procedure | ☐ | | |
| 3 | Test restore on non-production once | ☐ | | |

---

## Before go-live

| # | Task | Done | Date | Stored where |
|---|------|------|------|--------------|
| 4 | Full tenant backup export | ☐ | | |
| 5 | PostgreSQL dump | ☐ | | |
| 6 | Verify backup file opens / checksum | ☐ | | |

---

## Ongoing schedule (recommended)

| Frequency | Task | Owner | Done |
|-----------|------|-------|------|
| Daily | Automated DB backup (IT) | IT | ☐ |
| Weekly | Tenant export to secure drive | Admin | ☐ |
| Before month-end | Extra backup before finance close | Treasurer | ☐ |
| Before upgrades | Backup + record version | IT | ☐ |

---

## In-product: tenant backup

1. Sign in as user with **Admin Center** access  
2. Open **Admin Center**  
3. Use **Backup** / export tenant data  
4. Save file to encrypted storage (not public cloud without encryption)  
5. Record filename and date in log below  

**CLI (IT):** `npm run backup:tenant` (from server with env configured)

---

## Backup log

| Date | Type (DB / tenant / files) | Performed by | Location | Verified restore |
|------|----------------------------|--------------|----------|------------------|
| | | | | ☐ |
| | | | | ☐ |
| | | | | ☐ |

---

## Restore drill (annual)

| # | Step | Done |
|---|------|------|
| 1 | Restore to isolated environment | ☐ |
| 2 | Sign in; spot-check members and one gift | ☐ |
| 3 | Document time to restore | ☐ |
| 4 | Update contact list for emergencies | ☐ |

**Quick drill script:** `npm run drill:restore:quick` (IT / vendor — non-production only)

---

## Incident contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Church administrator | | | |
| IT support | | | |
| Vendor support | | | |

---

## Sign-off

Backup process understood and scheduled: ☐ Yes  
**Owner signature:** __________________ **Date:** __________
