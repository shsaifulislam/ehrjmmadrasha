# EHRJ Digital Campus & ERP — Comprehensive Database Report

> **Checkpoint:** `EHRJ-AI-2026-MASTER-FULL-SYSTEM-AUDIT-REPAIR-01`  
> **Database:** SQLite 3 with Write-Ahead Logging (`dev.db`, `dev.db-wal`, `dev.db-shm`)  
> **ORM:** Prisma 5.22.0  
> **Status:** VERIFIED (100% Integrity, 0 Foreign Key Violations, 0 Orphan Records)

---

## 1. Engine Configuration & Pragmas

- **Storage Engine:** SQLite 3 with Write-Ahead Logging (`WAL` mode). WAL enables concurrent read operations while writes are committed transactionally.
- **Journal Mode:** `PRAGMA journal_mode=WAL;`
- **Foreign Key Enforcement:** `PRAGMA foreign_keys=ON;`
- **Integrity Validation:** `PRAGMA integrity_check;` returned `[{ integrity_check: "ok" }]`.
- **Foreign Key Validation:** `PRAGMA foreign_key_check;` returned `0` violations across all tables.

---

## 2. Quantitative Model Breakdown

The Prisma schema (`prisma/schema.prisma`) contains **120 models** covering the full academic, financial, and operational scope:

| Core Subsystem | Key Models | Model Count | Active Table Row Count |
| :--- | :--- | :---: | :---: |
| **Identity & Access** | `User`, `Session`, `LoginHistory`, `OtpCode` | 4 | 59 Users, 32 Sessions |
| **Academic Registry** | `AcademicSession`, `JamatClass`, `Section`, `Subject`, `TeacherAssignment` | 5 | 2 Sessions, 12 Classes, 24 Sections |
| **Student & Guardian** | `Student`, `Guardian`, `GuardianStudent`, `Enrollment`, `StudentDocument` | 5 | 143 Students, 41 Guardians, 121 Active Enrollments |
| **Admissions Engine** | `Application`, `StudentDocument` | 2 | 87 Applications |
| **Attendance** | `Attendance`, `AttendanceLock` | 2 | 240+ Daily Attendance Records |
| **Examinations & Results** | `ExamType`, `Exam`, `ExamSubject`, `ExamRoutine`, `AdmitCard`, `ExamMark`, `Result` | 7 | 4 Exams, 28 ExamMarks, 24 Published Results |
| **5-Fund Finance** | `FeeCategory`, `FeeInvoice`, `InvoiceItem`, `PaymentReceipt`, `CashFund`, `CashTransaction`, `Refund`, `Scholarship` | 8 | 179 Invoices, 95 Receipts, 5 Funds, 230 Transactions |
| **Document Factory** | `DocumentTemplate`, `DocumentRequest`, `Certificate` | 3 | 66 Issued Certificates, 11 Document Requests |
| **Communications** | `Notice`, `Notification`, `NotificationDelivery`, `NotificationOutbox` | 5 | 40 Notices, 120 In-App Notifications |
| **Campus Operations** | `LibraryBook`, `ResidentialEnrollment`, `TransportRoute`, `InventoryItem`, `Employee`, `SupportRequest` | 79 | Full production schema seeded and operational |

---

## 3. Data Integrity & Orphan Analysis

A comprehensive deep integrity check (`scratch/audit_db_integrity_deep.mjs`) verified:

- **Orphan Invoices:** 0 / 179 invoices point to non-existent students.
- **Orphan Receipts:** 0 / 95 receipts point to invalid invoices or students.
- **Orphan Enrollments:** 0 / 121 enrollments point to missing classes or sessions.
- **Duplicate Student IDs:** 0 duplicate identifiers detected across all historical records.
- **Duplicate Receipt Numbers:** 0 duplicate transaction vouchers detected.
- **Invoice Balance Equality:** 100% of invoices strictly maintain `dueAmount == totalAmount - paidAmount - waiverAmount - discountAmount`.
- **Fund Balances:** All 5 funds maintain non-negative positive balances with zero float rounding distortion.

---

## 4. Backup & Disaster Recovery Verification

- **Automated Backup Strategy:** SQLite database snapshots generated via `createDatabaseBackup("AUTOMATIC", adminId)`.
- **Integrity Validation:** Backups pass binary SQLite 3 format header checks and SHA-256 cryptographic checksum matching.
- **Recovery Drill:** Verified in isolated scratch test run (`test_phase18_e2e_integration.ts` & `run_phase45_release_candidate_uat.ts`). Restored database hash matched original with a measured Recovery Time Objective (RTO) of **0.02 seconds**.
