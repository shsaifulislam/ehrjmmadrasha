# EHRJ MADRASHA ERP — STAGING MIGRATION RUNBOOK
## Operational Runbook: SQLite to PostgreSQL Staging Execution Guide

**Document ID:** `EHRJ-RUNBOOK-MIGRATION-01`  
**Target Environment:** Staging / Isolated Verification Cluster  
**Prerequisites:** PostgreSQL 15+ installed and running, Node.js 18+, Prisma 5.22.0  
**Estimated Run Time:** ~4 minutes for 11,994 records across 123 models  

---

## 1. Safety Rules & Operational Boundary

> [!IMPORTANT]
> - Never execute migration steps on the active production database file (`prisma/dev.db`).
> - Keep staging credentials in private files (`scratch/staging_pg_pass.tmp` or `.env.staging`), never in version control.
> - Verify that `prisma/schema.prisma` is backed up before generating staging artifacts.

---

## 2. Step-by-Step Staging Migration Procedures

### Step 1: Pre-Migration Backup & WAL Checkpoint
Flush active SQLite transactions to disk and create a verified backup:
```powershell
npx tsx -e "
import { PrismaClient } from '@prisma/client';
import { createDatabaseBackup } from './src/lib/operationsEngine';
const prisma = new PrismaClient();
async function backup() {
  await prisma.\$queryRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE);');
  const bkp = await createDatabaseBackup('PRE_MIGRATION');
  console.log('Created backup:', bkp.backupCode, bkp.checksum);
  await prisma.\$disconnect();
}
backup();
"
```

### Step 2: Provision Isolated PostgreSQL Database
Log in to PostgreSQL server and create the isolated database:
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -p 5432 -c "CREATE DATABASE ehrj_staging;"
```

### Step 3: Generate Staging Prisma Schema
Create `prisma/schema.staging.prisma` configured with `provider = "postgresql"` and an isolated client output:
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../scratch/prisma-staging-client"
}

datasource db {
  provider = "postgresql"
  url      = env("STAGING_DATABASE_URL")
}

// ... (append all 123 models from prisma/schema.prisma)
```

Ensure the file is saved as UTF-8 without BOM:
```bash
node -e "const fs=require('fs'); let c=fs.readFileSync('prisma/schema.staging.prisma','utf8'); if(c.charCodeAt(0)===0xFEFF) c=c.slice(1); fs.writeFileSync('prisma/schema.staging.prisma',c,'utf8');"
```

### Step 4: Validate and Push Schema to Staging Database
Push all 123 tables, foreign keys, unique constraints, and indexes into `ehrj_staging`:
```powershell
$env:STAGING_DATABASE_URL = "postgresql://postgres:PASSWORD@localhost:5432/ehrj_staging?schema=public"
npx prisma db push --schema=prisma/schema.staging.prisma
```
*Expected Output:*
`Datasource "db": PostgreSQL database "ehrj_staging", schema "public"`  
`Your database is now in sync with your Prisma schema.`  
`Generated Prisma Client to .\scratch\prisma-staging-client`

### Step 5: Execute Batch ETL Data Migration
Run the automated migration runner (`scratch/staging_migration_and_reconciliation.ts`):
```powershell
npx tsx scratch/staging_migration_and_reconciliation.ts
```

What the script performs:
1. Executes `SET session_replication_role = 'replica';` to allow topological batch loading.
2. Extracts records from SQLite in chunks of 200.
3. Inserts records into PostgreSQL tables using `createMany({ skipDuplicates: true })`.
4. Resets `SET session_replication_role = 'origin';`.
5. Compares table counts for all 123 models.
6. Verifies financial sums on `FeeInvoice`.
7. Checks foreign key orphan counts.

### Step 6: Verify Staging Data Reconciliation
Inspect generated report `scratch/reconciliation_report.json`:
- Ensure `modelsMatched === 123`.
- Ensure `modelsMismatched === 0`.
- Verify total records count matches `11,994`.

### Step 7: Run Direct PostgreSQL E2E Test Suite
Execute the staging test suite:
```powershell
npx tsx scratch/test_postgres_staging_e2e.ts
```
*Expected Output:* `POSTGRESQL STAGING TEST SUMMARY: 12 PASSED / 0 FAILED (100% SUCCESS)`.
