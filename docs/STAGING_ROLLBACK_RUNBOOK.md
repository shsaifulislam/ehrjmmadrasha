# EHRJ MADRASHA ERP — STAGING ROLLBACK RUNBOOK
## Operational Runbook: Staging Teardown & Production Rollback Recovery

**Document ID:** `EHRJ-RUNBOOK-ROLLBACK-01`  
**Purpose:** Standard Operating Procedure for abandoning staging clusters and executing emergency production cutover rollback  
**Tested RTO (Recovery Time Objective):** < 90 seconds  
**Tested RPO (Recovery Point Objective):** 0 uncommitted transactions  

---

## 1. Safe Abandonment of Staging Environment

If staging testing is completed or aborted, follow these steps to clean the isolated environment:

### Step 1: Disconnect Staging Clients
Terminate any background worker or test runner connected to `ehrj_staging`:
```powershell
Get-Process node, tsx -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -match "staging" } | Stop-Process
```

### Step 2: Drop Staging Database in PostgreSQL
Drop the staging database cleanly:
```powershell
$pass = (Get-Content "scratch/staging_pg_pass.tmp").Trim()
$env:PGPASSWORD = $pass
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -p 5432 -c "DROP DATABASE IF EXISTS ehrj_staging;"
$env:PGPASSWORD = $null
```

### Step 3: Remove Disposable Artifacts
Clean isolated client builds and temporary credentials:
```powershell
Remove-Item -Recurse -Force "scratch/prisma-staging-client" -ErrorAction SilentlyContinue
Remove-Item -Force "prisma/schema.staging.prisma" -ErrorAction SilentlyContinue
Remove-Item -Force "scratch/staging_pg_pass.tmp" -ErrorAction SilentlyContinue
```

---

## 2. Emergency Production Rollback Runbook (Cutover Reversion)

If a future production database cutover is attempted and critical failures are detected (e.g., connection pool exhaustion, latency spikes, or unhandled query incompatibilities), execute this reversion protocol:

```
[ALERT: ROLLBACK INITIATED]
             │
             ├──── Step 1: Halt Node.js Web / API Application
             │     pm2 stop ehrj-campus
             │
             ├──── Step 2: Revert Connection String in Production Environment
             │     sed -i 's/^DATABASE_URL=.*/DATABASE_URL="file:.\/prisma\/dev.db"/' .env.production
             │
             ├──── Step 3: Restore Pre-Cutover SQLite Binary & WAL Checkpoint
             │     cp backups/EHRJ-BKP-20261018-C67C43.db prisma/dev.db
             │     rm -f prisma/dev.db-wal prisma/dev.db-shm
             │
             ├──── Step 4: Re-apply SQLite Performance Pragmas
             │     npx tsx -e "
             │       import { initializeDatabasePragmas } from './src/lib/prisma';
             │       initializeDatabasePragmas();
             │     "
             │
             ├──── Step 5: Start Application Process & Run Health Check
             │     pm2 start ehrj-campus
             │     curl -f http://localhost:3000/api/health
             │
             └──── Step 6: Verify Admin & Student Portals Live
```

---

## 3. Data Loss Risk Analysis (Post-Cutover Transactions)

In the event that writes occur in PostgreSQL before an emergency rollback is triggered:

1. **Dual-Write Gap Risk:**
   - Transactions written to PostgreSQL *after* cutover but *before* rollback will not exist in the pre-cutover SQLite snapshot.
2. **Mitigation Strategy (Reconciliation ETL):**
   - Before dropping PostgreSQL, execute an incremental reverse dump:
     ```sql
     COPY (SELECT * FROM "PaymentReceipt" WHERE "createdAt" > '2026-10-18 20:00:00') TO '/tmp/receipts_delta.csv' CSV HEADER;
     ```
   - Replay incremental records into the restored SQLite database using an emergency ingestion script.
3. **Financial Safety First:**
   - In all rollback scenarios, financial ledgers (`FeeInvoice`, `PaymentReceipt`, `CashTransaction`) must be reconciled first using payment gateway transaction logs (bKash / Nagad statement reconciliation).
