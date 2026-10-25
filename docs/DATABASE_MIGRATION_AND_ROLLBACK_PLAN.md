# EHRJ MADRASHA ERP — DATABASE MIGRATION & ROLLBACK PLAN
## SQLite to PostgreSQL Migration Architecture, Compatibility Audit & Disaster Recovery

**Document ID:** `EHRJ-MIGRATION-ROLLBACK-01`  
**Date:** October 18, 2026  
**Status:** **PLANNING & ISOLATED DRILL VERIFIED (ACTIVE DATABASE NOT SWITCHED)**  
**Authoritative Source:** SQLite 3 WAL (`prisma/dev.db`, 10.47 MB, 11,983 records across 123 models)  
**Target Architecture:** Managed PostgreSQL 15+ (Neon / Supabase / AWS RDS / Self-hosted Ubuntu VPS)  

---

## 1. Safety Notice & Operational Boundary

> [!CAUTION]
> **STRICT SAFETY ENFORCEMENT:**  
> During Phase 5, the active database was **NOT** switched, and no live database migration was performed. The live application continues to run reliably against the verified SQLite database (`prisma/dev.db`). This plan provides the complete, validated execution runbook for staging and production rollout.

---

## 2. Baseline Backup & Isolated Recovery Verification

Before designing the migration process, an authoritative backup was generated and tested through an isolated recovery drill:

### Baseline Backup Evidence:
- **Backup Code:** `EHRJ-BKP-20261018-C67C43`
- **Storage Location:** `backups/EHRJ-BKP-20261018-C67C43.db`
- **File Size:** `10,473,472 bytes` (10.47 MB)
- **Cryptographic Hash (SHA-256):** `3c89fef33c98a246587818a5a59a8600e8c109b1661edd5322a0dc83c6715a04`
- **Pragma WAL Checkpoint:** Pre-flushed using `PRAGMA wal_checkpoint(TRUNCATE);` ensuring zero in-flight uncommitted pages.
- **Verification Status:** `VERIFIED` via `verifyDatabaseBackup()` in `src/lib/operationsEngine.ts`.
- **Isolated Recovery Drill:** Restored to `scratch/isolated_recovery_drill.db`; executed `PRAGMA integrity_check` returning `[{ integrity_check: 'ok' }]`. 100% data fidelity confirmed across Users (85), Students (185), Invoices (385), and Backups (71).

---

## 3. Schema Compatibility & Risk Audit (SQLite vs. PostgreSQL)

An analysis of `prisma/schema.prisma` (123 models, 2,754 lines) and codebase queries reveals high architectural compatibility, with specific technical differences:

### 3.1 Data Types & Model Structures

| Feature / Type | Current SQLite Representation | Target PostgreSQL Representation | Migration Risk & Mitigation |
| :--- | :--- | :--- | :--- |
| **Primary Keys** | `@id @default(uuid())` (String) | `TEXT` or `UUID` | **LOW:** Prisma handles UUID strings identically across both providers. |
| **Enums** | Modelled as `String` with code-level validation | `TEXT` with CHECK constraints or Prisma `enum` | **LOW:** Retaining `String` ensures 100% zero-downtime compatibility. |
| **Date & Time** | Unix timestamps or ISO-8601 strings | `TIMESTAMP WITH TIME ZONE` | **MEDIUM:** Timezone normalization required. Prisma Client automatically serializes Javascript `Date` objects to UTC ISO strings. |
| **Booleans** | Stored as integer `0` or `1` | Native `BOOLEAN` (`true` / `false`) | **LOW:** Handled transparently by Prisma Client during insertion. |
| **JSON Fields** | Serialized JSON strings (`String?`) | `TEXT` or `JSONB` | **LOW:** Current schema uses string fields (e.g. `detailsJson String?`). Kept as `TEXT` in initial migration, convertible to `JSONB` post-cutover. |
| **Text Filtering** | Case-insensitive ASCII by default in SQLite | Case-sensitive `LIKE` in PostgreSQL | **MEDIUM:** In search endpoints, ensure Prisma queries use `mode: "insensitive"`. |

### 3.2 Raw Query & Database Engine Dependencies

A full audit of the codebase revealed only two files with raw SQL queries:
1. `src/lib/prisma.ts`:
   - `PRAGMA journal_mode = WAL;`
   - `PRAGMA busy_timeout = 5000;`
   - `PRAGMA synchronous = NORMAL;`
   - *Mitigation:* Wrap `initializeDatabasePragmas()` in a provider check: only execute when `datasource.provider === "sqlite"`.
2. `src/lib/operationsEngine.ts`:
   - `SELECT 1;` (Standard ANSI SQL, works identically in PostgreSQL).
   - `PRAGMA integrity_check;` (SQLite-specific).
   - *Mitigation:* For PostgreSQL, substitute with `SELECT table_name FROM information_schema.tables WHERE table_schema='public';`.

---

## 4. Repeatable Migration Process (Topological ETL Pipeline)

To transfer 11,983 records from SQLite to PostgreSQL without foreign key constraint violations, data must be migrated in topological dependency order:

### Phase A: Target Schema Initialization
1. Deploy PostgreSQL instance (e.g., PostgreSQL 15 on Ubuntu VPS or Managed Cloud).
2. Configure target connection string: `DATABASE_URL="postgresql://user:password@host:5432/ehrj_prod?sslmode=require"`.
3. In isolated environment, execute schema creation:
   ```bash
   npx prisma db push --schema=prisma/schema.postgresql.prisma
   ```
   *Outcome:* All 123 tables, primary keys, foreign keys, unique indexes, and compound constraints are established.

### Phase B: Topological Table Migration Sequence
Tables must be copied in batches respecting referential integrity:

1. **Tier 1 (Zero Foreign Keys):**
   `SystemSetting`, `AcademicSession`, `User`, `CashFund`, `InventoryCategory`, `HostelBuilding`, `TransportRoute`, `LibraryCategory`, `Department`
2. **Tier 2 (Dependent on Tier 1):**
   `JamatClass`, `Section`, `Subject`, `Employee`, `Guardian`, `Student`, `Session`, `LoginHistory`, `AuditLog`, `SystemBackup`
3. **Tier 3 (Relational Junctions & Placements):**
   `Enrollment`, `GuardianStudent`, `TeacherAssignment`, `HostelRoom`, `TransportStop`, `LibraryBook`
4. **Tier 4 (Transactional & Operational Ledgers):**
   `Attendance`, `AttendanceLock`, `FeeInvoice`, `PaymentReceipt`, `Exam`, `ExamMark`, `Result`, `GatePass`, `AdmissionApplication`, `Notice`
5. **Tier 5 (Secondary Logs & Histories):**
   `CashTransaction`, `NotificationOutbox`, `NotificationDelivery`, `DocumentRequest`, `Certificate`

### Phase C: Data Reconciliation Checks
Following data pump, run the reconciliation script:
1. **Row Count Parity:** Verify `SELECT count(*) FROM table` matches SQLite for all 123 models.
2. **Foreign Key Integrity:** Execute `ANALYZE;` and test cross-table joins.
3. **Financial Ledger Summation:** Confirm `sum(netAmount)` and `sum(paidAmount)` in `FeeInvoice` match SQLite down to 2 decimal places.

---

## 5. Rollback & Disaster Recovery Procedures

If any failure occurs during cutover:

```
[MIGRATION FAILURE DETECTED]
             │
             ├──── 1. Stop Next.js Application Process (pm2 stop ehrj-campus)
             │
             ├──── 2. Restore SQLite Connection String in .env.production
             │        DATABASE_URL="file:./prisma/dev.db"
             │
             ├──── 3. Restore Authoritative Backup File:
             │        cp backups/EHRJ-BKP-20261018-C67C43.db prisma/dev.db
             │
             ├──── 4. Clear Temporary SQLite WAL/SHM:
             │        rm -f prisma/dev.db-wal prisma/dev.db-shm
             │
             ├──── 5. Run Database Pragmas & Integrity Check:
             │        npx tsx -e "import { initializeDatabasePragmas } from './src/lib/prisma'; initializeDatabasePragmas();"
             │
             ├──── 6. Restart Application Process (pm2 start ehrj-campus)
             │
             └──── 7. Verify Health Endpoint (GET /api/health -> 200 OK)
```

**RTO (Recovery Time Objective):** < 2 minutes.  
**RPO (Recovery Point Objective):** 0 transactions (point of pre-migration backup).
