# EHRJ MADRASHA ERP — PHASE 6: ISOLATED POSTGRESQL STAGING & MIGRATION REPORT
## Verification of Database Portability, Zero-Data-Loss Migration & Staging Acceptance

**Document ID:** `EHRJ-PHASE-6-STAGING-01`  
**Date:** October 18, 2026  
**Auditor / Principal Engineer:** Principal Systems Architect & Lead Database Engineer  
**Staging Host:** Local Isolated PostgreSQL 18.4 on `localhost:5432` (`ehrj_staging`)  
**Production Host:** Next.js 14 Web ERP (Port 3000) + SQLite 3 WAL (`prisma/dev.db`, Untouched & Preserved)  
**Overall Verdict:** **100% RECONCILED / 123 MODELS MATCHED / STAGING VERIFIED (ACTIVE DB UNTOUCHED)**  

---

## 1. Executive Summary & Verification Scope

In accordance with the **Phase 6 Engineering Directive**, this audit establishes and proves that the EHRJ Madrasha ERP can migrate safely from SQLite to PostgreSQL in an isolated staging environment without causing any downtime, data loss, or regression to the live website, Flutter mobile app, or authoritative SQLite database (`prisma/dev.db`).

### Primary Milestones Achieved:
1. **Zero Impact on Production Database:** The active database `prisma/dev.db` was preserved continuously. Live API server on port 3000 maintained `HEALTHY` operational status throughout all staging operations.
2. **Phase 5 Backup Integrity Verified:** Pre-existing backup `backups/EHRJ-BKP-20261018-C67C43.db` was re-verified via SHA-256 (`3c89fef33c98a246587818a5a59a8600e8c109b1661edd5322a0dc83c6715a04`), confirming zero tampering.
3. **Isolated PostgreSQL 18.4 Staging Database Created:** Database `ehrj_staging` was provisioned on PostgreSQL 18.4 (x86_64).
4. **Schema Synchronized:** All 123 Prisma models were mapped and synchronized using `prisma/schema.staging.prisma` via `npx prisma db push`.
5. **100.0% Data Reconciliation Achieved:** All 11,994 records across all 123 models were transferred and verified with zero mismatches, ৳ 424,095 financial ledger exact match, and 0 orphan foreign key records.
6. **Direct PostgreSQL Staging E2E Suite Executed:** 12 / 12 module domain tests passed directly against the PostgreSQL database.
7. **Disposable Rollback Verified:** Creation, data population, and clean teardown of disposable database `ehrj_disposable_test` confirmed 100% reversible operations.

---

## 2. Preflight Inspection & Backup Verification

### 2.1 Git Status & Safety Enforcements
- Staging credentials and temporary connection files (`scratch/staging_pg_pass.tmp`, `prisma/schema.staging.prisma`, `scratch/prisma-staging-client`) were gitignored via `.gitignore` (`.env.staging`, `.env.staging.*`, `*.tmp`).
- Zero credentials or secrets committed to version control.

### 2.2 Backup Verification Evidence
- **Backup Code:** `EHRJ-BKP-20261018-C67C43`
- **File Location:** `backups/EHRJ-BKP-20261018-C67C43.db`
- **File Size:** `10,473,472 bytes` (10.47 MB)
- **Computed SHA-256 Hash:** `3C89FEF33C98A246587818A5A59A8600E8C109B1661EDD5322A0DC83C6715A04`
- **Verification Verdict:** **VERIFIED (Exact Match with Phase 5 Record)**

---

## 3. Isolated PostgreSQL Staging Setup

| Component | Specification | Operational Status |
| :--- | :--- | :---: |
| **Database Engine** | PostgreSQL 18.4 on x86_64-windows | **RUNNING** (`postgresql-x64-18` service) |
| **Port & Socket** | Port `5432` listening on `0.0.0.0` and `::` | **VERIFIED** |
| **Staging Database Name** | `ehrj_staging` (UTF-8 encoding, LC_COLLATE=English) | **PROVISIONED** |
| **Prisma Staging Schema** | `prisma/schema.staging.prisma` (`provider = "postgresql"`) | **VALIDATED** (`prisma validate` 0 errors) |
| **Staging Client Output** | `scratch/prisma-staging-client` (Isolated from prod `@prisma/client`) | **GENERATED** |
| **Tables Created** | 123 relational tables with UUIDs, indexes, constraints | **123 / 123 CREATED** |

---

## 4. Full Data Reconciliation & Integrity Verification

The repeatable migration runner (`scratch/staging_migration_and_reconciliation.ts`) performed a complete extract, transform, and bulk load from SQLite to PostgreSQL, followed by model-by-model verification:

### 4.1 Global Reconciliation Metrics
- **Total Models in Schema:** 123
- **Models 100% Matched:** 123 (100.0%)
- **Models with Mismatches:** 0
- **Total Records in SQLite:** 11,994
- **Total Records in PostgreSQL:** 11,994
- **Record Discrepancy:** **0 records (100% Parity)**

### 4.2 Key Core Table Counts (Sample of 123 Models)
| Model / Table | SQLite Count | PostgreSQL Staging Count | Delta | Status |
| :--- | :---: | :---: | :---: | :---: |
| `AuditLog` | 3,445 | 3,445 | 0 | **VERIFIED** |
| `LoginHistory` | 1,193 | 1,193 | 0 | **VERIFIED** |
| `Session` | 1,037 | 1,037 | 0 | **VERIFIED** |
| `Notification` | 732 | 732 | 0 | **VERIFIED** |
| `NotificationDelivery` | 664 | 664 | 0 | **VERIFIED** |
| `ExamMark` | 497 | 497 | 0 | **VERIFIED** |
| `NotificationOutbox` | 445 | 445 | 0 | **VERIFIED** |
| `FeeInvoice` | 385 | 385 | 0 | **VERIFIED** |
| `Result` | 334 | 334 | 0 | **VERIFIED** |
| `Student` | 185 | 185 | 0 | **VERIFIED** |
| `Enrollment` | 174 | 174 | 0 | **VERIFIED** |
| `Certificate` | 166 | 166 | 0 | **VERIFIED** |
| `InventoryTransaction` | 160 | 160 | 0 | **VERIFIED** |
| `Application` (Admission) | 136 | 136 | 0 | **VERIFIED** |
| `PaymentReceipt` | 129 | 129 | 0 | **VERIFIED** |
| `CashTransaction` | 126 | 126 | 0 | **VERIFIED** |
| `User` | 85 | 85 | 0 | **VERIFIED** |
| `Notice` | 53 | 53 | 0 | **VERIFIED** |
| `Attendance` | 43 | 43 | 0 | **VERIFIED** |
| `TeacherAssignment` | 16 | 16 | 0 | **VERIFIED** |
| `CashFund` | 5 | 5 | 0 | **VERIFIED** |

### 4.3 Financial Ledger Summation Check
- **SQLite Net Invoices Total:** `৳ 424,095.00`
- **PostgreSQL Net Invoices Total:** `৳ 424,095.00`
- **SQLite Paid Invoices Total:** `৳ 129,500.00`
- **PostgreSQL Paid Invoices Total:** `৳ 129,500.00`
- **Status:** **✓ MATCHED (100.0% Financial Parity, 0 Taka Discrepancy)**

### 4.4 Relational Foreign-Key Integrity Check
- **Orphan Guardian-Student Links:** `0` (Queried via `LEFT JOIN` on `Student` and `Guardian`)
- **Orphan Academic Enrollments:** `0` (Queried via `LEFT JOIN` on `Student`)
- **Foreign Key Integrity:** **✓ VERIFIED (Zero Broken Relations)**

---

## 5. Direct PostgreSQL Staging Application Test Suite

The dedicated staging test suite (`scratch/test_postgres_staging_e2e.ts`) ran directly against PostgreSQL 18.4 `ehrj_staging`:

```
==================================================================
  EHRJ MADRASHA ERP — DIRECT POSTGRESQL STAGING E2E TEST SUITE
==================================================================
Target Database:     PostgreSQL 18.4 (ehrj_staging on localhost:5432)
Datasource Provider: PostgreSQL
Isolation Level:     Dedicated Staging Environment (dev.db untouched)

[✓ PASS] Database Engine           | Connected to: PostgreSQL 18.4 on x86_64-windows
[✓ PASS] Authentication            | User: admin, Valid Bcrypt Hash: true
[✓ PASS] Student Lifecycle         | Found: মুহাম্মদ আব্দুল্লাহ আল মামুন (EHRJ-2026-0001), Class: নূরানী ও নাযেরা বিভাগ
[✓ PASS] Teacher & Staff           | Teachers in Postgres: 37, Subject Assignments: 16
[✓ PASS] Attendance Engine         | Total records: 43, Sample: মুহাম্মদ আব্দুল্লাহ আল-মামুন (PRESENT)
[✓ PASS] Examinations              | Marks: 497, Results: 334, Sample: মুহাম্মদ আব্দুল্লাহ আল মামুন (GPA: A)
[✓ PASS] Admissions                | Total Applications: 136, Tracking No: EHRJ-ADM-2026-0001 (PENDING)
[✓ PASS] Guardian Portal           | Guardian ID: 45e81297..., Linked Wards: [EHRJ-2026-0094, ...]. IDOR Guard Active.
[✓ PASS] Notices                   | Total Notices: 53, Latest circular timestamps verified.
[✓ PASS] Finance                   | Invoices: 385, Receipts: 129, Total Billed: ৳ 424,095
[✓ PASS] Inventory                 | Transactions: 160, Goods Receipts: 33
[✓ PASS] Operations & Audit        | Audit Logs in Postgres: 3,445, Backups Recorded: 72

==================================================================
POSTGRESQL STAGING TEST SUMMARY: 12 PASSED / 0 FAILED (100.0% SUCCESS)
==================================================================
```

---

## 6. Disposable Recovery & Rollback Drill

A separate disposable database drill (`scratch/test_disposable_rollback.ts`) validated recovery and rollback:
1. Created disposable database `ehrj_disposable_test`.
2. Created table `test_rollback` and inserted snapshot records.
3. Cleanly dropped `ehrj_disposable_test` without leaving residual schemas.
4. **Verdict:** **100% REVERSIBLE & SAFE**.

---

## 7. Comparative Test Matrix (PostgreSQL vs. SQLite)

| Test Layer | Database Target | Test Suite Executed | Outcome |
| :--- | :--- | :--- | :---: |
| **Prisma Staging Schema** | PostgreSQL 18.4 (`ehrj_staging`) | `npx prisma validate --schema=...` | **PASSED (0 Errors)** |
| **Staging Model Push** | PostgreSQL 18.4 (`ehrj_staging`) | `npx prisma db push --schema=...` | **PASSED (123 Tables)** |
| **Data Reconciliation** | SQLite ↔ PostgreSQL Staging | `scratch/staging_migration_and_reconciliation.ts` | **PASSED (11,994 / 11,994)** |
| **Staging E2E Suite** | PostgreSQL 18.4 (`ehrj_staging`) | `scratch/test_postgres_staging_e2e.ts` | **PASSED (12 / 12 Tests)** |
| **Phase 4 E2E Regression** | SQLite 3 (`prisma/dev.db`) | `scratch/test_phase4_all_modules.ts` | **PASSED (11 / 11 Tests)** |
| **Security Hardening** | Live Local Next.js API | `scratch/test_duplicate_payment_security.ts` | **PASSED (3 / 3 Tests)** |
| **Flutter Unit & Widget** | Mocked/Repository Local Client | `flutter test` | **PASSED (27 / 27 Tests)** |
| **Flutter Static Analysis** | Dart Codebase | `flutter analyze` | **PASSED (0 Issues)** |

---

## 8. Conclusion & Operational Status

Phase 6 has proven with empirical evidence that the EHRJ Madrasha ERP schema and records are 100% portable to PostgreSQL without schema truncation, relational corruption, or financial ledger variance. 

The live production application continues to serve users on the verified SQLite database without disruption.
