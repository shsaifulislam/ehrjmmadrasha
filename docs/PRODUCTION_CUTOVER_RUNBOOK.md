# EHRJ MADRASHA ERP — PRODUCTION CUTOVER RUNBOOK
## Step-by-Step Execution Plan for Authorized Production Migration

**Document ID:** `EHRJ-RUNBOOK-CUTOVER-01`  
**Target Environment:** Cloud Linux Host (Ubuntu 24.04 LTS) + Managed PostgreSQL 16+  
**Estimated Maintenance Window:** 30 minutes  
**Target Rollback SLA:** < 3 minutes  
**Execution Condition:** Requires formal sign-off from `docs/PRODUCTION_GO_NO_GO_DECISION.md` before execution.

---

## 1. Pre-Cutover Timeline & Checklist

### T-Minus 24 Hours
- [ ] Confirm cloud Linux VPS provisioning and firewall rules (allow 80, 443, 22 only).
- [ ] Verify managed PostgreSQL instance provisioning with `sslmode=require`.
- [ ] Provision AWS S3 / Cloudflare R2 bucket for persistent student photos and document storage.
- [ ] Distribute maintenance window notification to students, parents, and teachers:  
  *“জরুরী সিস্টেম আপগ্রেড: আগামী [তারিখ] রাত ১২:০০ থেকে ১২:৩০ পর্যন্ত মাদরাসা ইআরপি সাময়িক বন্ধ থাকবে।”*
- [ ] Verify existing SQLite backup integrity (`PRAGMA integrity_check;`).

### T-Minus 2 Hours
- [ ] Lower DNS TTL for `ehrjmadrasha.edu.bd` and `erp.ehrjmadrasha.edu.bd` to 300 seconds.
- [ ] Re-verify physical device connectivity and Flutter release build artifacts (`app-release.apk`).
- [ ] Ensure all cutover operators are connected via secure terminal.

---

## 2. Maintenance Window Execution Sequence (T-0 to T+30m)

### Step 1: Activate Maintenance Mode & Freeze Writes (T-00:00)
1. Display institutional maintenance banner across all public and portal web routes:
   ```bash
   # Enable maintenance mode via environment flag
   export NEXT_PUBLIC_MAINTENANCE_MODE="true"
   ```
2. Put SQLite database in read-only query mode to prevent record mutations:
   ```sql
   PRAGMA query_only = ON;
   ```
3. Verify that new POST/PUT/DELETE requests return HTTP 503 Maintenance:
   ```bash
   curl -I http://localhost:3000/api/health
   # Expected response: {"status":"MAINTENANCE","maintenance":{"isActive":true}}
   ```

### Step 2: Final Immutable SQLite Snapshot (T-00:05)
1. Force SQLite WAL checkpoint to flush all pending memory pages:
   ```sql
   PRAGMA wal_checkpoint(TRUNCATE);
   ```
2. Generate timestamped, SHA-256 verified cutover snapshot:
   ```bash
   node -e "
   const fs = require('fs');
   const crypto = require('crypto');
   const src = 'prisma/dev.db';
   const dest = 'backups/FINAL_CUTOVER_SNAPSHOT_' + Date.now() + '.db';
   fs.copyFileSync(src, dest);
   const hash = crypto.createHash('sha256').update(fs.readFileSync(dest)).digest('hex');
   console.log('Final Snapshot Created:', dest, 'SHA-256:', hash);
   "
   ```

### Step 3: Production PostgreSQL Schema Migration (T-00:08)
1. Export production connection string (from secure vault):
   ```bash
   export DATABASE_URL="postgresql://ehrj_prod_user:SECRET_PASS@prod-db.internal:5432/ehrj_production?sslmode=require"
   ```
2. Apply full Prisma schema migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. Verify that 123 production tables are created cleanly.

### Step 4: Final Delta ETL & Record Pump (T-00:12)
1. Execute the verified topological data migration pump:
   ```bash
   node scripts/migrate_sqlite_to_postgres.js
   ```
2. Reset PostgreSQL sequence numbers to prevent auto-increment collisions:
   ```sql
   SELECT setval(pg_get_serial_sequence('tableName', 'id'), COALESCE(max(id) + 1, 1), false) FROM tableName;
   ```

### Step 5: Post-Migration Reconciliation & Financial Audit (T-00:18)
1. Run automated reconciliation script:
   ```bash
   npx tsx scratch/verify_phase7_reconciliation.ts
   ```
2. Validate the **Zero-Discrepancy Gate**:
   - Total Model Match: **123 / 123 (100.0%)**
   - Record Delta: **0**
   - Financial Billed Delta: **৳ 0.00**
   - Financial Paid Delta: **৳ 0.00**
   *If any count or financial delta > 0, ABORT CUTOVER and trigger Rollback.*

### Step 6: Switch Web ERP to Production PostgreSQL (T-00:22)
1. Update `.env.production` on production host:
   ```env
   NODE_ENV=production
   DATABASE_URL="postgresql://ehrj_prod_user:SECRET_PASS@prod-db.internal:5432/ehrj_production?sslmode=require&pgbouncer=true"
   NEXT_PUBLIC_API_URL="https://erp.ehrjmadrasha.edu.bd/api"
   NEXT_PUBLIC_MAINTENANCE_MODE="false"
   ```
2. Build and launch Next.js under PM2 cluster:
   ```bash
   npm run build
   pm2 restart ehrj-web-erp --update-env
   ```

### Step 7: Smoke Test Live Production Endpoints (T-00:25)
- [ ] `GET https://erp.ehrjmadrasha.edu.bd/api/health` returns `status: "HEALTHY"`, `databaseProvider: "postgresql"`.
- [ ] Admin login works at `/login` with `adminehrjmadrasha@gmail.com`.
- [ ] Student directory loads at `/admin/students`.
- [ ] Public results query works at `/results`.
- [ ] Duplicate payment submission returns `409 Conflict`.

### Step 8: Mobile App Production Endpoint Switch & Cutover Complete (T-00:28)
1. Publish app configuration update pointing `defaultBaseUrl` to `https://erp.ehrjmadrasha.edu.bd/api`.
2. Disable maintenance mode flag.
3. Announce successful cutover to users.

---

## 3. Post-Cutover Hypercare Checklist (First 24 Hours)
- [ ] Monitor Nginx access and error logs (`/var/log/nginx/error.log`).
- [ ] Check PostgreSQL connection pool metrics via PgBouncer.
- [ ] Verify zero 500 errors on student and parent login routes.
- [ ] Confirm automated nightly backup cron job runs at 02:00 AM.
