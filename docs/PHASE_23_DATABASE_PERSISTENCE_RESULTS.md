# EHRJ MADRASHA ERP — PHASE 23: DATABASE PERSISTENCE RESULTS REPORT

**Document ID:** `EHRJ-DOC-P23-04`  
**Revision:** Phase 23 Database Persistence & Dual-Engine Audit  
**Date:** October 20, 2026  
**Auditor:** Principal Enterprise Full-Stack & System Architect  
**Environments Tested:**  
- **Production-Target Staging:** PostgreSQL 18 on `localhost:5432/ehrj_staging`  
- **Master Development Baseline:** SQLite 3 at `prisma/dev.db`  
**Overall Persistence Outcome:** **ACCEPTANCE VERIFIED IN ISOLATED STAGING**

---

## 1. Executive Summary

Phase 23 evaluated data persistence, transaction safety, foreign key referential integrity, and dual-engine data model consistency across both the PostgreSQL staging database and the master SQLite development database.

The master SQLite database remained **100% untouched and byte-identical** before and after the audit. All database write tests were strictly executed on isolated PostgreSQL staging using disposable records.

---

## 2. Master SQLite Preservation Evidence

| Check Item | Baseline Pre-Audit Hash | Post-Audit Hash | Verification Result |
| :--- | :---: | :---: | :---: |
| `prisma/dev.db` SHA-256 | `db452633adeddb9f4baf0441c500e7df2c460a7fe58b40d99d693af3994dc094` | `db452633adeddb9f4baf0441c500e7df2c460a7fe58b40d99d693af3994dc094` | **IDENTICAL (Zero Drift)** |

> [!NOTE]
> The cryptographic SHA-256 hash was independently verified at the beginning of the audit, during intermediate operations, and upon final script completion. The database was not modified, seeded, or migrated during Phase 23.

---

## 3. PostgreSQL Staging CRUD Lifecycle Verification

All persistence operations were tested against the running PostgreSQL staging server using the isolated staging Prisma client (`scratch/prisma-staging-client`):

### 3.1 Create Cycle (`DB-PERS-01`)
- **Action:** Created test student record `PERSIST-1792518335872` with full name `টেস্ট শিক্ষার্থী (পারসিস্টেন্স)`.
- **Result:** Successfully committed to PostgreSQL.
- **Read-Back:** In a distinct subsequent database transaction across the connection pool, `findUnique({ where: { id } })` resolved the exact persisted entity with 100% field parity. Status: **VERIFIED**.

### 3.2 Update Cycle (`DB-PERS-02`)
- **Action:** Updated student name to `টেস্ট শিক্ষার্থী (আপডেটেড নাম)`.
- **Result:** Update committed. Subsequent read reflected the modified UTF-8 Bengali string accurately without truncation or character encoding distortion. Status: **VERIFIED**.

### 3.3 Delete Cycle (`DB-PERS-03`)
- **Action:** Deleted test student record.
- **Result:** Database returned deletion confirmation. Subsequent query returned `null`. Status: **VERIFIED**.

### 3.4 Foreign Key Integrity & Orphan Prevention (`DB-PERS-04`)
- **Action:** Attempted to insert an `Enrollment` record referencing an invalid, nonexistent student ID (`non-existent-student-id-99999`).
- **Result:** PostgreSQL rejected the insert with a foreign key constraint violation error. Zero orphan records created. Status: **VERIFIED**.

---

## 4. Financial Ledger Mathematical Integrity

In financial testing on PostgreSQL staging:
- **Test Invoice:** `INV-TEST-P23-326626`
  - Total Amount: ৳ 3,500.00
  - Paid Amount: ৳ 2,000.00
  - Due Amount: ৳ 1,500.00
- **Equation Assertion:** `totalAmount === paidAmount + dueAmount`
  - `3,500 === 2,000 + 1,500` (Holds true, difference = 0.00 BDT).
- **Payment Receipt:** `RCT-TEST-P23-326626` created with unique transaction ID `TXN-P23-1792518335872`.
- **Duplicate Prevention:** Database schema strictly enforces `@unique` on `transactionId` and `receiptNumber`, preventing double-payment posting.

---

## 5. Dual-Engine Parity Summary

| Metric | Master Development (SQLite) | Production Staging (PostgreSQL) | Parity Status |
| :--- | :---: | :---: | :---: |
| **Port** | 3000 | 3001 | Distinct / Isolated |
| **Prisma Schema** | `prisma/schema.prisma` | `prisma/schema.staging.prisma` | 100% Synced (55 Models) |
| **Active Records** | 7 Students, 5 Teachers, 6 Invoices | Staging replica with sanitized data | Clean / Sanitized |
| **Foreign Keys** | Enabled via PRAGMA | Enforced natively by PostgreSQL | Consistent |
| **Status** | Stable & Preserved | Verified in Acceptance Testing | **VERIFIED** |
