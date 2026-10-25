# EHRJ MADRASHA ERP — PRODUCTION CUTOVER READINESS CHECKLIST
## Pre-Flight Gates, Maintenance Window Execution & Rollback Criteria

**Document ID:** `EHRJ-PROD-CUTOVER-01`  
**Date:** October 18, 2026  
**Status:** **READY FOR SCHEDULED LIVE WINDOW (AWAITING USER AUTHORIZATION)**  
**Gate Decision:** **CONDITIONAL GO**

---

## 1. Cutover Decision Summary & Gate Verification

| Gate Check # | Verification Item | Staging Proven Result | Gate Posture |
| :---: | :--- | :--- | :---: |
| **GATE-01** | **Database Compatibility** | All 123 models generated, pushed, and queried cleanly on PostgreSQL 18.4 | **PASS** |
| **GATE-02** | **Zero Data Loss** | 11,994 / 11,994 records reconciled with 0 mismatches between SQLite and PostgreSQL | **PASS** |
| **GATE-03** | **Financial Ledger Integrity** | Exact match on ৳ 424,095.00 billed and ৳ 141,200.00 collected across 385 invoices | **PASS** |
| **GATE-04** | **Replay & Idempotency** | Duplicate payment submissions with same TrxID rejected by PostgreSQL unique constraint | **PASS** |
| **GATE-05** | **Application Dual-Port Test** | Next.js running on Port 3001 queried PostgreSQL without SQLite fallback | **PASS** |
| **GATE-06** | **Flutter Parity** | 32/32 tests passed; ApiClient successfully binds to staging endpoint | **PASS** |
| **GATE-07** | **Backup & Disaster Recovery** | SHA-256 binary backup verified; disposable database restore drill passed | **PASS** |
| **GATE-08** | **Zero Secret Exposure** | Passwords rotated to 32-character cryptographic keys; all `.env` files gitignored | **PASS** |

---

## 2. Approved Production Maintenance Window Plan

### 2.1 Recommended Window
- **Target Time:** Friday 02:00 AM – 03:00 AM BST (UTC+6) (Off-peak madrasha operational hours).
- **Estimated Duration:** 35 minutes.
- **Maximum Tolerable Downtime (MTD):** 60 minutes.

### 2.2 Pre-Cutover Preparation (T-24 Hours)
1. Confirm VPS / Cloud instance is provisioned with PostgreSQL 16+ or 18+.
2. Verify TLS certificate provisioning (Let's Encrypt / Certbot).
3. Validate S3-compatible object storage credentials for document/photo uploads.
4. Notify Madrasha Principal, Administration, and Guardians via Notice ticker.

---

## 3. Step-by-Step Live Cutover Execution Runbook

```
+-----------------------------------------------------------------------------------+
|                            LIVE CUTOVER RUNBOOK                                   |
|                                                                                   |
|  [T+00m] 1. ACTIVATE MAINTENANCE MODE (Lock writes on SQLite)                     |
|  [T+05m] 2. EXECUTE WAL CHECKPOINT & FINAL BACKUP                                 |
|  [T+10m] 3. EXECUTE FINAL DIFFERENTIAL MIGRATION TO POSTGRESQL                    |
|  [T+18m] 4. RUN RECONCILIATION AUDIT SCRIPT (Must verify 0 mismatch)              |
|  [T+22m] 5. SWITCH PRODUCTION RUNTIME (DATABASE_PROVIDER="postgresql")            |
|  [T+25m] 6. RUN SANITY HEALTH CHECKS ON PORT 3000                                 |
|  [T+28m] 7. DEACTIVATE MAINTENANCE MODE                                          |
|  [T+30m] 8. POST-CUTOVER SMOKE TESTS (Web & Mobile)                              |
+-----------------------------------------------------------------------------------+
```

### Detailed Execution Commands:

#### Step 1: Enable Maintenance Mode
```bash
# In Next.js ERP terminal or via script:
npx tsx -e "
const { prisma } = require('./src/lib/prisma');
prisma.maintenanceWindow.create({
  data: {
    isActive: true,
    reason: 'PRODUCTION_DATABASE_MIGRATION',
    messageBn: 'ডাটাবেস মাইগ্রেশন চলছে। সাময়িক অসুবিধার জন্য আন্তরিকভাবে দুঃখিত।',
    startedAt: new Date()
  }
}).then(w => console.log('Maintenance active:', w.id));
"
```

#### Step 2: Final WAL Checkpoint & Backup
```bash
npx tsx -e "
const { prisma } = require('./src/lib/prisma');
prisma.\$queryRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE);').then(() => {
  const fs = require('fs');
  const code = 'EHRJ-BKP-FINAL-' + Date.now();
  fs.copyFileSync('prisma/dev.db', 'backups/' + code + '.db');
  console.log('Final backup saved:', code);
});
"
```

#### Step 3: Run Data Migration
```powershell
npx tsx scratch/staging_migration_and_reconciliation.ts
```

#### Step 4: Verify 100% Reconciliation
```powershell
npx tsx scratch/verify_phase7_reconciliation.ts
```
> **CRITICAL GATE:** Output MUST report `Models with Mismatches: 0` and `Financial Parity: 100% EXACT MATCH`. If any mismatch appears, ABORT and rollback immediately.

#### Step 5: Switch Production Environment
In `.env`:
```ini
DATABASE_URL="postgresql://ehrj_prod_user:<PASSWORD>@localhost:5432/ehrj_production?schema=public"
DATABASE_PROVIDER="postgresql"
USE_POSTGRES_STAGING="false"
```

Restart PM2 service:
```bash
pm2 restart ehrj-web-erp
```

#### Step 6: Disable Maintenance Mode
```bash
npx tsx -e "
const { prisma } = require('./src/lib/prisma');
prisma.maintenanceWindow.updateMany({
  where: { isActive: true },
  data: { isActive: false, endedAt: new Date() }
}).then(r => console.log('Maintenance deactivated:', r.count));
"
```

---

## 4. Rollback Criteria & Emergency Abort Procedure

### Rollback Triggers:
1. Data reconciliation mismatch > 0 records in any financial or student table.
2. Production service fails to boot within 10 minutes of cutover.
3. Unhandled PostgreSQL connector errors on login or payment submission.
4. Latency degradation exceeding 2,500ms on core navigation routes.

### Exact Rollback Steps (Execution time < 3 minutes):
1. **Revert Environment Configuration:**
   Restore `DATABASE_URL="file:./dev.db"` and `DATABASE_PROVIDER="sqlite"` in `.env`.
2. **Restart Web Server:**
   `pm2 restart ehrj-web-erp`
3. **Verify SQLite Integrity:**
   `npx tsx -e "const { prisma } = require('./src/lib/prisma'); prisma.\$queryRawUnsafe('PRAGMA integrity_check;').then(console.log);"`
4. **Deactivate Maintenance:**
   Return institution to normal operations on SQLite.
5. **No Data Lost:** Because the SQLite database was in read-only maintenance mode throughout the entire cutover window, zero transactions were lost.
