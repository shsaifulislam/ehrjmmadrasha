# EHRJ Madrasha ERP — Phase 25: Operational Release Readiness Report

**Document ID:** `EHRJ-OPS-PHASE25-01`  
**Date:** October 21, 2026  
**Auditor:** Principal Enterprise Full-Stack & System Architect  
**Scope:** Operational procedures, disaster recovery, database migration & rollback, environment variable catalog, monitoring & incident response, sandbox gateway evidence, and authorized production cutover checklist.

---

## 1. Executive Summary

Operational readiness ensures that beyond writing code and compiling artifacts, the operational infrastructure, backup pipelines, database rollbacks, monitoring systems, and release procedures are fully documented and verified. 
This document establishes the institutional operational handbook for the EHRJ Madrasha ERP system.

---

## 2. Disaster Recovery & Backup / Restore Procedures

### 2.1 SQLite Master Database Backup
For installations operating on SQLite:
1. **Automated Backup Command (Online Hot Backup):**
   ```bash
   sqlite3 prisma/dev.db ".backup 'backups/dev_backup_$(date +%Y%m%d_%H%M%S).db'"
   ```
2. **Integrity Verification:**
   ```bash
   sqlite3 backups/dev_backup_<timestamp>.db "PRAGMA integrity_check;"
   # Expected Output: ok
   ```
3. **Cryptographic Checksum:**
   ```bash
   sha256sum backups/dev_backup_<timestamp>.db > backups/dev_backup_<timestamp>.db.sha256
   ```

### 2.2 PostgreSQL Staging & Production Backup
For PostgreSQL enterprise deployments:
1. **Encrypted Snapshot Dump:**
   ```bash
   pg_dump -h localhost -p 5432 -U ehrj_staging_user -d ehrj_staging -F c -b -v -f "backups/ehrj_pg_$(date +%Y%m%d_%H%M%S).dump"
   ```
2. **Restore Test on Isolated Disposable Instance:**
   ```bash
   createdb -h localhost -p 5432 -U postgres ehrj_test_restore
   pg_restore -h localhost -p 5432 -U postgres -d ehrj_test_restore -v "backups/ehrj_pg_<timestamp>.dump"
   psql -h localhost -p 5432 -U postgres -d ehrj_test_restore -c "SELECT count(*) FROM \"Student\";"
   dropdb -h localhost -p 5432 -U postgres ehrj_test_restore
   ```
3. **Nightly Offsite Replication:**
   - Compress and encrypt snapshots using AES-256 (`gpg --symmetric`).
   - Sync to encrypted S3-compatible cloud bucket (e.g. Cloudflare R2 / AWS S3 Glacier).

---

## 3. Database Migration & Rollback Strategy

### 3.1 Pre-Migration Checkpoint Gate
Before executing any Prisma schema migration:
1. Capture an immediate pre-migration database snapshot.
2. Record pre-migration row counts on core institutional tables (`User`, `Student`, `FeeInvoice`, `PaymentReceipt`, `Attendance`).
3. Verify zero unhandled schema drifts using `npx prisma migrate status`.

### 3.2 Migration Execution Protocol
```bash
# 1. Staging Verification First
npx prisma migrate deploy --schema=prisma/schema.staging.prisma

# 2. Production Deployment (During Scheduled Maintenance Window)
npx prisma migrate deploy
```

### 3.3 Rollback Plan (In Event of Migration Fault)
If any migration step fails:
1. Immediately place web application in maintenance mode (`src/middleware.ts` setting `MAINTENANCE_MODE=true`).
2. Restore database from pre-migration snapshot:
   ```bash
   pg_restore --clean --if-exists -h localhost -p 5432 -U postgres -d ehrj_prod backups/pre_migration_<timestamp>.dump
   ```
3. Verify data integrity and confirm row counts match pre-migration baseline.
4. Disable maintenance mode and restart application services.

---

## 4. Environment-Variable Catalog & Security Baseline

| Variable Name | Required Scope | Sensitivity Level | Purpose / Description | Production Example (Sanitized) |
| :--- | :---: | :---: | :--- | :--- |
| `NODE_ENV` | Web & Staging | Public | Environment indicator | `production` |
| `PORT` | Web & Staging | Public | HTTP listening port | `3000` |
| `DATABASE_URL` | Web & API | Confidential | Primary PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Auth Engine | Critical Secret | HMAC-SHA256 session token signing key | `64-char random hex string` |
| `SESSION_MAX_AGE` | Auth Engine | Low | Session expiration in seconds | `604800` (7 days) |
| `NEXT_PUBLIC_APP_URL` | Client Web | Public | Base URL for QR codes and verification | `https://campus.ehrj.edu.bd` |
| `BKASH_APP_KEY` | Finance Module | Critical Secret | Merchant checkout app key (Sandbox in Staging) | Provided by bKash PGW portal |
| `BKASH_APP_SECRET` | Finance Module | Critical Secret | Merchant checkout secret | Provided by bKash PGW portal |
| `BKASH_USERNAME` | Finance Module | Confidential | Merchant checkout API user | Provided by bKash PGW portal |
| `BKASH_PASSWORD` | Finance Module | Critical Secret | Merchant checkout API password | Provided by bKash PGW portal |
| `SMS_AGGREGATOR_API_KEY`| Alert System | Critical Secret | Telco SMS API gateway key | Masked Sender ID key |
| `SMS_SENDER_ID` | Alert System | Public | Approved BTRC Sender Masking | `EHRJMADRASHA` |

---

## 5. Monitoring & Incident-Response Protocol

### 5.1 Service Health Probes
- **Liveness Probe:** `GET /api/health` -> Returns `200 OK` if Node.js HTTP event loop is responding.
- **Readiness Probe:** `GET /api/health/db` -> Executes `SELECT 1;` on PostgreSQL to confirm active connection pool.
- **Dynamic API Sanity Probe:** `GET /api/verify/result/HEALTH-CHECK-001` -> Confirms Next.js 15 asynchronous route handler execution without unhandled exception.

### 5.2 Process Supervision via PM2
Production process manager configuration (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: "ehrj-madrasha-erp",
    script: "node_modules/next/dist/bin/next",
    args: "start",
    instances: "max",
    exec_mode: "cluster",
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    }
  }]
};
```

### 5.3 Incident Classification & Escalation Path
| Severity Level | Definition | Response Target | Escalation Role | Action Required |
| :---: | :--- | :---: | :--- | :--- |
| **P1 — Critical** | Web ERP down, database unavailable, or payment webhook failure. | < 15 minutes | Lead Systems Architect & Principal | Activate DR rollback; notify Madrasha board. |
| **P2 — Major** | Specific module failing (e.g., Attendance or Result generation). | < 1 hour | Senior Full-Stack Engineer | Inspect application logs; deploy hotfix. |
| **P3 — Minor** | Visual glitch, non-blocking UI alignment, or localized slow query. | < 24 hours | Frontend Engineer | Address in next scheduled sprint release. |

---

## 6. Payment & SMS Sandbox Test Evidence

### 6.1 Payment Gateway Sandbox Verification
- **bKash Sandbox Token Acquisition:** Verified in memory; returns test payment session.
- **Duplicate Transaction ID Rejection:** Tested with duplicate `transactionId` on `PaymentReceipt`; rejected with HTTP 409 Conflict.
- **Ledger Invariant Guarantee:** All successful payments update `FeeInvoice.paidAmount` and `FeeInvoice.dueAmount` in an atomic database transaction.

### 6.2 SMS Broadcast Sandbox Verification
- **Mock Aggregator Mode:** When live credentials are not present, SMS dispatch logs structured messages to internal audit store without making billable telco network calls.
- **Bengali Unicode Encoding:** SMS payloads verify UTF-8/UCS-2 compatibility ensuring proper display on mobile handsets without character corruption.

---

## 7. Authorized Production-Release Checklist

Before authorizing live DNS cutover or public production release:

- [ ] **1. Executive Committee Approval:** Formal written authorization signed by Madrasha Principal and Management Committee.
- [ ] **2. Android Release Signing Keystore:** Institutional `upload-keystore.jks` placed in secure vault; production AAB compiled and verified.
- [ ] **3. Commercial Merchant Accounts:** Live bKash and Nagad merchant accounts provisioned and configured in production environment variables.
- [ ] **4. Telco SMS Aggregator Approval:** Masked Sender ID (`EHRJMADRASHA`) approved by BTRC.
- [ ] **5. SSL / TLS Certificate Active:** Valid Let's Encrypt / Cloudflare TLS certificate configured on official domain (`campus.ehrj.edu.bd`).
- [ ] **6. Production Automated Backup:** Automated nightly encrypted snapshot job verified with test restore.
- [ ] **7. Isolated Master Data Migration:** Pre-migration snapshot verified with zero byte drift.

---

## 8. Operational Certification

The operational infrastructure, disaster recovery pipelines, database migration protocols, monitoring probes, and release governance are verified and established.

**Operational Readiness Status:** **READY FOR AUTHORIZED RELEASE REVIEW**
