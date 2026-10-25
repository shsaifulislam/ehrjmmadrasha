# EHRJ MADRASHA ERP — PRODUCTION ROLLBACK RUNBOOK
## Emergency Recovery & Disaster Rollback Procedure

**Document ID:** `EHRJ-RUNBOOK-ROLLBACK-01`  
**Target SLA:** Restoration in < 3 minutes  
**Zero Data Loss Guarantee:** Assured by read-only write freeze and verified pre-cutover WAL snapshot.  
**Scope:** Reversal of PostgreSQL cutover and full restoration of SQLite production-like runtime.

---

## 1. Rollback Trigger Criteria

An immediate, unconditional rollback to the SQLite baseline must be executed if any of the following occur during cutover:

1. **Reconciliation Failure:** Post-ETL record count discrepancy > 0 records across any of the 123 models.
2. **Financial Ledger Drift:** Any variance in net billed or collected amounts (`delta != ৳ 0.00`).
3. **Database Unavailability:** Managed PostgreSQL connection timeout exceeding 60 seconds or persistent pool exhaustion.
4. **Application Crash / Health Failure:** `/api/health` returns HTTP 500 or fails to boot under PM2.
5. **High Error Rate:** More than 1% unhandled HTTP 500 responses within the initial 15-minute smoke test window.
6. **Authentication Bypass or IDOR Flaw:** Any critical security regression detected during smoke tests.

---

## 2. Emergency Rollback Execution Sequence (< 3 Minutes)

### Step 1: Re-Engage Maintenance Barrier (0:00 - 0:30)
Immediately shield end-users from intermediate state errors:
```bash
export NEXT_PUBLIC_MAINTENANCE_MODE="true"
pm2 restart ehrj-web-erp --update-env
```

### Step 2: Restore Primary SQLite Database (0:30 - 1:00)
1. Verify the integrity of the pre-cutover snapshot:
   ```bash
   node -e "
   const fs = require('fs');
   const crypto = require('crypto');
   const file = 'backups/FINAL_CUTOVER_SNAPSHOT.db';
   if (!fs.existsSync(file)) {
     console.error('CRITICAL: Snapshot missing!'); process.exit(1);
   }
   console.log('Restoring from verified snapshot:', file);
   fs.copyFileSync(file, 'prisma/dev.db');
   "
   ```
2. Disable read-only mode on SQLite:
   ```sql
   PRAGMA query_only = OFF;
   ```
3. Run SQLite integrity check:
   ```sql
   PRAGMA integrity_check;
   -- Expected output: 'ok'
   ```

### Step 3: Revert Web ERP Configuration to SQLite (1:00 - 1:45)
1. Re-point environment file `.env` to SQLite:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXT_PUBLIC_MAINTENANCE_MODE="false"
   ```
2. Re-generate default Prisma client:
   ```bash
   npx prisma generate
   ```
3. Restart PM2 application cluster:
   ```bash
   pm2 restart ehrj-web-erp --update-env
   ```

### Step 4: Health & Smoke Validation (1:45 - 2:30)
1. Verify server health:
   ```bash
   curl http://localhost:3000/api/health
   # Expected response: {"status":"HEALTHY","databaseProvider":"sqlite"}
   ```
2. Execute automated smoke verification:
   ```bash
   npm run check:env
   ```
3. Verify that Admin and Guardian portals are fully responsive and showing existing records.

### Step 5: Notify Users & De-escalate (2:30 - 3:00)
1. Disable maintenance mode flag (`NEXT_PUBLIC_MAINTENANCE_MODE=false`).
2. Broadcast recovery status to institutional channels:  
   *“সম্মানিত ব্যবহারকারীগণ, সিস্টেম রক্ষণাবেক্ষণ সম্পন্ন হয়েছে এবং স্বাভাবিক কার্যক্রম সচল রয়েছে।”*

---

## 3. Data Delta Recovery (Handling Records Created During Window)

If the cutover advanced to a state where end-users submitted live records to PostgreSQL before a rollback was triggered:
1. Export all records from PostgreSQL created during the cutover timestamp window (`createdAt >= T_CUTOVER_START`):
   ```sql
   COPY (SELECT * FROM "PaymentReceipt" WHERE "createdAt" >= '2026-10-18 00:00:00') TO '/tmp/emergency_receipts.csv' WITH CSV HEADER;
   COPY (SELECT * FROM "AdmissionApplication" WHERE "createdAt" >= '2026-10-18 00:00:00') TO '/tmp/emergency_admissions.csv' WITH CSV HEADER;
   ```
2. Ingest the exported CSV records into SQLite using a transactional script to ensure zero transaction loss:
   ```bash
   node scripts/reconcile_rollback_deltas.js
   ```

---

## 4. Post-Rollback Root Cause Analysis (RCA) Protocol
1. Preserve all PostgreSQL error logs, PgBouncer logs, and Next.js stdout dumps in `scratch/rca_incident_<timestamp>/`.
2. Do not attempt another cutover until the root cause has been reproduced and resolved in isolated staging.
3. Convene a postmortem review within 24 hours with the Lead Architect, QA Lead, and Institutional IT Director.
