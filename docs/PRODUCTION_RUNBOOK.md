# EHRJ MADRASHA ERP — PRODUCTION RUNBOOK
**ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা**  
**Eliotganj Hazi Rohmatollah Jamiria Madrasha (EHRJ Madrasha)**  
*Document Version:* 1.0.0 (Phase 19 Go-Live Release)  
*Classification:* Operational Critical / Production Architecture

---

## 1. SYSTEM ARCHITECTURE & ENVIRONMENT OVERVIEW

The EHRJ Madrasha Digital Campus & ERP platform is engineered as a monolithic high-performance Next.js 14 (App Router) enterprise system, orchestrated with SQLite 3 in Write-Ahead Logging (WAL) mode, Prisma ORM, and fronted by an Nginx reverse proxy with TLS 1.3 termination and PM2 cluster process management.

| Parameter | Production Standard | Notes |
| :--- | :--- | :--- |
| **Node.js Runtime** | Node.js v20.x LTS | Strictly enforced engine version |
| **Framework** | Next.js 14 (App Router) | Standalone cluster output via PM2 |
| **Database Engine** | SQLite 3 (`prisma/dev.db`) | Configured with WAL mode, busy timeout 10000ms |
| **Reverse Proxy** | Nginx 1.24+ | TLS 1.3, HTTP/2, HSTS, Brotli/Gzip, Rate Limiting |
| **Process Manager** | PM2 (`deployment/ecosystem.config.js`) | Cluster mode, memory restart threshold 1GB |
| **Application Port** | 3000 (Internal) / 443 (Public) | Public traffic strictly redirected HTTP -> HTTPS |

---

## 2. PRODUCTION HEALTH MONITORING & ALERTING

### 2.1 Live Health Checks
The platform provides a unified system health diagnostics endpoint accessible to administrators:
- **API Endpoint:** `GET /api/admin/operations/health`
- **Dashboard UI:** `/admin/operations`
- **Component Coverage:**
  1. `application`: Process uptime, memory RSS, event loop latency.
  2. `database`: Query latency, schema compatibility, WAL file size.
  3. `storage`: Directory permissions, disk space availability.
  4. `authentication`: Session store latency, active administrative sessions.
  5. `email`: SMTP relay connectivity and latency.
  6. `notifications`: Outbox backlog count, failed message queue.
  7. `payments`: Active gateway configuration and transaction ledger health.
  8. `backgroundJobs`: Scheduled cron last-execution timestamp and failure count.
  9. `backups`: Age of latest completed snapshot, retention policy compliance.

### 2.2 Alert Severity Tiers
- **CRITICAL:** Database down, disk space > 95%, fatal payment webhook failure. Requires immediate pager notification and on-call intervention within 15 minutes.
- **URGENT:** Backup creation failure, SMTP relay down, memory usage > 85%. Requires resolution within 1 hour.
- **WARNING:** Expiring employee certifications, failed notification retry queue, unusual login failure spikes. Reviewed daily.
- **INFO:** Successful nightly backup, database retention cleanup, bulk migration batch completion.

---

## 3. DATABASE OPERATIONS, BACKUP & DISASTER RECOVERY

### 3.1 SQLite WAL Mode Invariants
- The production database operates with `PRAGMA journal_mode=WAL;` and `PRAGMA synchronous=NORMAL;`.
- SQLite checkpoints occur automatically. Never manually delete `-wal` or `-shm` sidecar files while the application is running.

### 3.2 Backup Execution Engine
Backups are triggered either via the automated scheduler or manually by authorized administrators:
```bash
# Automated trigger via Scheduled Job API:
curl -X POST http://localhost:3000/api/admin/operations/cron \
  -H "Authorization: Bearer <CRON_SECRET_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"jobKey": "DAILY_DATABASE_BACKUP"}'
```
Every snapshot generates:
1. Binary atomic copy to `backups/EHRJ-BKP-YYYYMMDD-XXXXXX.db`.
2. SHA-256 cryptographic hash calculated and stored in `SystemBackup`.
3. Validation of the `SQLite format 3` 16-byte magic header.
4. Auto-retention: Retains the latest 30 daily snapshots; purges snapshots older than 30 days while guaranteeing at least 3 historical snapshots remain.

### 3.3 Disaster Recovery & Restore Procedure
> **CRITICAL RULE:** A restore must NEVER be executed without taking an immediate `PRE_RESTORE` safety snapshot first.

**Step-by-Step Restore Procedure:**
1. **Identify Target Backup:** Find verified backup code in `/admin/operations` or via database query (`SystemBackup.findMany`).
2. **Execute Restore Drill:** Verify the target backup in isolation before touching the active database (`runDisasterRecoveryDrill`).
3. **Execute Production Restore:**
   ```bash
   # Via authenticated Admin API:
   curl -X POST http://localhost:3000/api/admin/operations/restore \
     -H "Cookie: auth_session=<ADMIN_SESSION>" \
     -H "Content-Type: application/json" \
     -d '{"backupId": "<TARGET_BACKUP_ID>"}'
   ```
4. **Validation:** System creates an automatic `PRE_RESTORE` snapshot of the active state, hot-swaps the database file atomically, and verifies SQLite integrity.
5. **Restart PM2:** `pm2 reload ecosystem.config.js` to clear in-memory caches and re-establish Prisma connections.

---

## 4. DATA MIGRATION & BULK INGESTION RUNBOOK

The Data Migration Engine (`src/lib/dataMigrationEngine.ts`) manages controlled onboarding of legacy records (paper or spreadsheet):
1. **Pre-requisite:** Take a safety backup tagged `PRE_MIGRATION`.
2. **Validation:** Send raw dataset through `validateStudentMigrationPayload(...)`. Verifies:
   - Full Bengali name (`fullNameBn`) present.
   - Valid Jamat class ID exists.
   - Guardian phone is valid Bangladeshi 11-digit format (`01XXXXXXXXX`).
   - Non-negative opening balance due.
3. **Atomic Execution:**
   - Sequential permanent Student IDs are generated format `EHRJ-YYYY-XXXX`.
   - Multi-child guardian deduplication groups siblings by guardian phone number.
   - Student enrollment record created with roll assignment.
   - Opening balance fee invoices generated under fee category `OTHER` with title `"প্রারম্ভিক বকেয়া ফি (Legacy Opening Balance)"`.
4. **Reconciliation:** Run `reconcileFinancialMigration()` to verify that opening balance invoices match imported totals and no arithmetic drift exists across the 5 cash funds.

---

## 5. SCHEDULED JOBS & CRON ENGINE

Configured in `src/lib/schedulerEngine.ts` and triggered via cron runner or systemd timer every 15 minutes:

```text
*/15 * * * * curl -s -X POST -H "Authorization: Bearer $CRON_SECRET_TOKEN" http://localhost:3000/api/admin/operations/cron -d '{"jobKey":"ALL"}' >> /var/log/ehrj_cron.log 2>&1
```

| Job Key | Name | Schedule | Action |
| :--- | :--- | :--- | :--- |
| `NOTIFICATION_OUTBOX_PROCESSOR` | বিজ্ঞপ্তি কিউ প্রসেসর | Every 15 min | Processes pending SMS/in-app notifications, retries failures up to 3 attempts. |
| `DAILY_DATABASE_BACKUP` | দৈনিক ব্যাকআপ | Nightly (02:00) | Creates full DB snapshot, applies 30-day retention rules. |
| `DAILY_ATTENDANCE_MONITOR` | হাজিরা পর্যবেক্ষণ | Daily (14:00) | Verifies attendance submission counts across all active Jamat classes. |
| `EXPIRING_DOCUMENTS_SCANNER` | সনদ মেয়াদ স্ক্যানার | Weekly (06:00) | Identifies teacher/employee documents expiring within 30 days, generates operational alerts. |

---

## 6. INCIDENT MANAGEMENT & EMERGENCY ROLLBACK

### 6.1 Incident Lifecycle
`DETECT` -> `CLASSIFY` -> `ACKNOWLEDGE` -> `INVESTIGATE` -> `MITIGATE` -> `RECOVER` -> `VERIFY` -> `DOCUMENT`

- **Incident Code Format:** `EHRJ-INC-YYYYMMDD-XXXXXX`
- All incident state changes are recorded in `SystemIncidentEvent` and mirrored to `AuditLog`.

### 6.2 Emergency Rollback Playbook
If a deployment defect breaks core workflows:
1. **Application Rollback:**
   ```bash
   git checkout <PREVIOUS_STABLE_COMMIT>
   npm ci
   npm run build
   pm2 reload ecosystem.config.js
   ```
2. **Database Rollback (If Schema / Data Corrupted):**
   - Identify `EHRJ-BKP-*-PRE_MIGRATION` or `PRE_RESTORE` snapshot.
   - Execute restore via `restoreDatabaseBackup(backupId, adminUserId)`.
   - Confirm application functionality via `npm run test:phase19`.

---

## 7. SECRETS & SECURITY HYGIENE
- Never commit `.env` or production secrets to Git.
- Session cookies must enforce `HttpOnly`, `SameSite=Lax`, and `Secure` over HTTPS.
- Rotate `AUTH_SECRET`, `JWT_SECRET`, and `CRON_SECRET_TOKEN` every 180 days or immediately if compromised.
- Audit logs are append-only; tampering triggers high-priority operational alerts.
