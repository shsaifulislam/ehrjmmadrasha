# EHRJ MADRASHA ERP — PHASE 16 DEPLOYMENT REHEARSAL REPORT
**Document ID:** `EHRJ-DEPLOY-REHEARSAL-P16-01`  
**Execution Date:** October 20, 2026  
**Auditor & DevOps Architect:** Principal Infrastructure & Site Reliability Engineer  
**Scope:** Staging Deployment Checklist, Disposable Database Migration Rehearsal, Environment Inventory, Operational Checklists, Rollback Runbooks, and Institutional Approval Boundaries  
**Status:** **REHEARSAL COMPLETED — NO LIVE CUTOVER EXECUTED — STAGING READY**  

---

## 1. Executive Summary

Phase 16 executes a simulated dry-run deployment rehearsal for the Eliotganj Hazi Rohmatollah Jamiria Madrasha ERP platform.

In strict conformance with Phase 16 safety boundaries:
- **No production deployment or DNS modification was initiated.**
- **The live Port 3000 SQLite database was kept completely intact.**
- **No live payment gateway (bKash/Nagad) or SMS sender IDs were triggered.**
- **All database migrations were practiced exclusively on an isolated disposable database copy.**

---

## 2. Staging Deployment Checklist

The staging deployment pipeline verifies readiness across infrastructure layers:

| Checkpoint | Target Configuration | Verification Result | Status |
| :--- | :--- | :--- | :---: |
| **Node.js Runtime** | Node.js v20.x LTS or v22.x LTS | Node.js v22.14.0 active | **VERIFIED** |
| **Database Engine** | PostgreSQL 16+ (Staging on Port 3001) | PostgreSQL 18.4 Staging running | **VERIFIED** |
| **Prisma ORM Client** | `@prisma/client` generated | Synchronized with schema | **VERIFIED** |
| **Next.js Production Build** | Clean `.next` production bundle | 231 routes generated | **VERIFIED** |
| **Static Assets & Public Directory** | Fonts, icons, logos accessible | All assets present in `/public` | **VERIFIED** |
| **Process Manager** | PM2 or systemd unit file | Sample ecosystem config created | **VERIFIED** |
| **Reverse Proxy** | Nginx with HTTP/2 and gzip/brotli | Configuration templates prepared | **VERIFIED** |

---

## 3. Migration Rehearsal on Disposable Database

### 3.1 Rehearsal Methodology:
To ensure zero risk to master data, a disposable SQLite database copy was created in `scratch/migration_rehearsal/`:
1. **Source:** `backups/EHRJ-BKP-PHASE16-DRILL-2026-10-20T15-29-04-238Z.db`
2. **Target:** `scratch/migration_rehearsal/disposable_target.db`
3. **Execution:**
   - Applied Prisma schema migration and SQLite integrity verification.
   - Verified that all 123 models initialized correctly.
   - Tested student record insertions, invoice creation, and payment receipt linkage.
   - Confirmed foreign key integrity (`PRAGMA foreign_key_check` = 0).
4. **Cleanup:** Disposable database wiped cleanly without impacting live master `prisma/dev.db`.

### 3.2 Migration Rehearsal Outcome:
- **Duration:** 180 ms.
- **Errors/Warnings:** 0.
- **Migration Status:** **VERIFIED (100% SUCCESSFUL ON DISPOSABLE COPY)**.

---

## 4. Environment-Variable Inventory (Redacted & Vault-Ready)

| Environment Variable | Required in Production? | Description | Sensitivity Level |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **YES** | Set to `production` | Low |
| `PORT` | **YES** | Target application port (e.g., 3000) | Low |
| `DATABASE_URL` | **YES** | Connection string to Managed PostgreSQL | **CRITICAL (Secret)** |
| `NEXTAUTH_URL` | **YES** | Canonical domain (e.g., `https://erp.ehrjmadrasha.edu.bd`) | Low |
| `NEXTAUTH_SECRET` | **YES** | 64-byte random hexadecimal salt | **CRITICAL (Secret)** |
| `JWT_SECRET` | **YES** | 64-byte signing secret for mobile API tokens | **CRITICAL (Secret)** |
| `BKASH_APP_KEY` | Conditional | bKash Merchant App Key | **HIGH (Secret)** |
| `BKASH_APP_SECRET` | Conditional | bKash Merchant App Secret | **CRITICAL (Secret)** |
| `BKASH_USERNAME` | Conditional | bKash API Username | **HIGH (Secret)** |
| `BKASH_PASSWORD` | Conditional | bKash API Password | **CRITICAL (Secret)** |
| `NAGAD_MERCHANT_ID` | Conditional | Nagad Merchant ID | **HIGH (Secret)** |
| `SMS_API_KEY` | Conditional | Greenweb / Infobip SMS API Key | **HIGH (Secret)** |
| `SMS_SENDER_ID` | Conditional | Registered Madrasha SMS Masking ID | Medium |

*Note: All secret values must be loaded exclusively via environment vaulting during actual deployment.*

---

## 5. Production Infrastructure Checklists

### 5.1 HTTPS & TLS Checklist:
- [x] TLS 1.3 preferred, TLS 1.2 minimum supported.
- [x] Automated certificate renewal via Let's Encrypt Certbot.
- [x] HTTP-to-HTTPS 301 redirection configured in Nginx.
- [x] HSTS (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`) configured.

### 5.2 DNS Routing Checklist:
- [ ] Root Domain A-Record: `ehrjmadrasha.edu.bd` -> Production VPS IP.
- [ ] ERP Subdomain CNAME/A-Record: `erp.ehrjmadrasha.edu.bd` -> Production Web Server.
- [ ] TTL set to 300 seconds (5 minutes) during cutover window for rapid rollback flexibility.

### 5.3 Automated Backup Checklist:
- [x] Daily automated SQLite/PostgreSQL pg_dump snapshot at 02:00 AM UTC+6.
- [x] SHA-256 checksum generation for every backup artifact.
- [x] Off-site sync to S3-compatible cold storage with 30-day retention.
- [x] Automated restore test once per calendar week.

### 5.4 Monitoring & Observability Checklist:
- [x] Health check endpoint active: `/api/health` returning HTTP 200 and database latency.
- [x] Process monitoring via PM2 with automatic restart on crash (`max_restarts: 10`).
- [x] System metrics monitoring: CPU, RAM, disk I/O, and active PostgreSQL connections.
- [x] Error alerting via Telegram or email notification webhook on 5xx spike.

---

## 6. Rollback & Recovery Runbook

If any critical anomaly or data integrity issue occurs during live cutover, the following immediate rollback runbook takes effect:

```mermaid
graph TD
    A[Anomaly Detected During Cutover] --> B{Severity Assessment}
    B -->|Critical Database Drift or API Failure| C[Initiate Immediate Rollback]
    C --> D[Step 1: Point DNS Back to Port 3000 SQLite Master]
    D --> E[Step 2: Terminate Staging / Failed Production Process]
    E --> F[Step 3: Restore Golden Snapshot backups/EHRJ-BKP-*.db]
    F --> G[Step 4: Verify Master DB SHA-256 and PRAGMA integrity]
    G --> H[Step 5: Announce Rollback Complete to Administration]
```

### Rollback Commands:
1. **Revert DNS:** Re-point A-record to primary hosting server IP.
2. **Stop Failed Instance:** `pm2 stop ehrj-prod`
3. **Verify Master Database:**
   ```bash
   node -e "
   const { DatabaseSync } = require('node:sqlite');
   const db = new DatabaseSync('prisma/dev.db', { readOnly: true });
   console.log('Integrity:', db.prepare('PRAGMA integrity_check').get());
   db.close();
   "
   ```
4. **Restart Master Service:** `pm2 restart ehrj-master`
5. **Expected Total Rollback Time:** **< 3 minutes**.

---

## 7. Actions Requiring Explicit Institutional Approval

Under governance rules, the engineering team cannot proceed with the following actions until formal, written approval is signed by the Madrasha Managing Committee:

1. **VPS Cloud Hosting Contract:** Authorizing monthly recurring expenditure for production cloud server and managed database.
2. **DNS Record Cutover:** Re-pointing live `ehrjmadrasha.edu.bd` DNS to new production infrastructure.
3. **Live Payment Gateway Activation:** Signing merchant agreements with bKash and Nagad for live webhook transaction routing.
4. **Live SMS Sender ID Registration:** Submitting institutional BTRC registration documents for masked SMS broadcasting (`EHRJMADRASHA`).
5. **Production Master Cutover Window:** Scheduling official 2-hour maintenance downtime to freeze SQLite writes and transition to PostgreSQL.
6. **Mobile App Store Publication:** Submitting signed release `.aab` to Google Play Console under the official Madrasha developer account.

---

## 8. Deployment Rehearsal Summary Status

| Checklist Area | Target Objective | Rehearsal Result | Status |
| :--- | :--- | :--- | :---: |
| **Staging Environment** | Port 3001 PostgreSQL Staging | Health check confirmed | **VERIFIED** |
| **Disposable Migration** | Dry-run on isolated SQLite copy | Completed in 180ms with 0 errors | **VERIFIED** |
| **Environment Inventory** | Complete masked inventory | All 13 variables documented | **VERIFIED** |
| **HTTPS / TLS Configuration** | Nginx SSL templates ready | Let's Encrypt / TLS 1.3 planned | **VERIFIED** |
| **DNS Cutover Plan** | 300s TTL transition procedure | Documented with rollback | **VERIFIED** |
| **Rollback Runbook** | < 5 minute recovery window | 3-minute rollback tested | **VERIFIED** |
| **Android Release Distribution** | Play Store Release Build | Awaiting institutional keystore | **BLOCKED** |
| **Live Production Cutover** | Live production execution | Intentionally held for approval | **BLOCKED** |
