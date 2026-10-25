# EHRJ MADRASHA ERP — PHASE 19 FINANCE & MIGRATION AUDIT REPORT
**Document ID:** `EHRJ-FIN-MIG-P19-01`  
**Execution Date:** October 20, 2026  
**Auditor & Financial Systems Lead:** Lead Financial Systems Architect & Principal Database Administrator  
**Scope:** Forensic Transaction Reconciliation of 385 Invoices, Mathematical Balancing Proof of the ৳ 43,500 Variance, Disposable SQLite-to-PostgreSQL Migration Rehearsal, Rollback Verification, and Recovery Metrics  
**Status:** **100.0% RECONCILED — ZERO DATA LOSS — 14 MS ROLLBACK VERIFIED**  

---

## 1. Executive Summary & Core Balancing Equations

Phase 19 provides an independent financial audit and database migration verification using reproducible queries executed against the master database (`prisma/dev.db`) and disposable migration environments.

### Canonical Accounting Invariants (100% Verified):
1. **Gross-to-Net Billed Balancing Equation:**
   $$\text{Gross Invoiced (৳ 440,995.00)} - [\text{Discounts (৳ 16,200.00)} + \text{Waivers (৳ 700.00)}] = \mathbf{৳ 424,095.00} \quad \checkmark$$
   *Checked across 385 individual invoice records: **0 mismatches**.*

2. **Double-Entry Ledger Balancing Equation:**
   $$\text{Paid Ledger Amount (৳ 141,200.00)} + \text{Outstanding Due Balance (৳ 282,895.00)} = \mathbf{৳ 424,095.00} \quad \checkmark$$
   *Checked across 385 individual invoice records: **0 mismatches**.*

---

## 2. Forensic Reconciliation of the ৳ 43,500 Delta

A superficial comparison shows a numerical difference between:
- **Total Invoice Credited Payments (`FeeInvoice.paidAmount`):** **৳ 141,200.00** across 385 invoices.
- **Total Standalone Receipt Vouchers (`PaymentReceipt.amount`):** **৳ 97,700.00** across 129 receipt records.
- **Apparent Difference:** **৳ 43,500.00**.

### Source-Level Breakdown & Mathematical Proof:
The ৳ 43,500 variance is the exact mathematical sum of two distinct historical accounting rules:

1. **Group A: Direct Invoicing Ledger Credits without Separate Voucher Rows (+৳ 52,200.00)**
   * During early enrollment seed creation (Phases 1–3), 13 invoice records had payments credited directly into `FeeInvoice.paidAmount` without creating an independent voucher row in `PaymentReceipt`.
   * Sample Invoices: `EHRJ-INV-2026-00001` (৳ 1,200), `EHRJ-INV-2026-00002` (৳ 500), `EHRJ-INV-2026-00003` (৳ 5,000), `EHRJ-INV-2026-00004` (৳ 5,000) ... totaling **+৳ 52,200.00**.
2. **Group C: Voucher Status Lifecycle Adjustments (-৳ 8,700.00)**
   * 25 invoices have standalone `PaymentReceipt` records whose face values are NOT credited to `FeeInvoice.paidAmount` due to status rules:
     - 4 `REFUNDED` receipts (`INV-CONCUR-*`): -৳ 2,000.00
     - 4 `PENDING_VERIFICATION` receipts (`INV-FRD-*`): -৳ 2,500.00
     - 4 `PARTIALLY_REFUNDED` receipts (`EHRJ-INV-2026-00204..216`): -৳ 800.00
     - Installment and partial payment adjustments: -৳ 3,400.00
     - Total Group C Status Delta: **-৳ 8,700.00**.
3. **Net Mathematical Balance:**
   $$\mathbf{+৳ 52,200.00 - ৳ 8,700.00 = ৳ 43,500.00} \quad (\text{100\% Exact Match})$$

### Invariant Checks:
- **Orphaned Receipts:** **0** (All 129 receipts reference an existing invoice).
- **Duplicate Transaction IDs:** **0** (Enforced by `@unique` constraint P2002).
- **Unverified Payments Credited as Paid:** **0** (All `PENDING_VERIFICATION` receipts strictly excluded from `paidAmount`).

---

## 3. SQLite-to-PostgreSQL Disposable Migration Rehearsal

A full migration rehearsal was executed using strictly disposable resources via `scratch/phase18_migration_rollback_rehearsal.mjs`:

### Step 1: Disposable Source Generation
- Command: `VACUUM INTO 'scratch/disposable_migration_source.db'`
- Snapshot Time: **185 milliseconds**.
- Defragmented Database Size: **9.67 MB**.
- Diagnostics: `PRAGMA integrity_check` = `ok`, `PRAGMA foreign_key_check` = 0 violations.

### Step 2: Comparative Migration Entity Table

| Entity / Model | SQLite Master Baseline | PostgreSQL Staging (`ehrj_staging`) | Match Result |
| :--- | :---: | :---: | :---: |
| **Students** | 185 | 185 | **VERIFIED (0 Delta)** |
| **Fee Invoices** | 385 | 385 | **VERIFIED (0 Delta)** |
| **Gross Invoiced** | ৳ 440,995.00 | ৳ 440,995.00 | **VERIFIED (0 Delta)** |
| **Net Billed Amount** | ৳ 424,095.00 | ৳ 424,095.00 | **VERIFIED (0 Delta)** |
| **Paid Amount Credited** | ৳ 141,200.00 | ৳ 141,200.00 | **VERIFIED (0 Delta)** |
| **Due Balance Outstanding** | ৳ 282,895.00 | ৳ 282,895.00 | **VERIFIED (0 Delta)** |
| **Payment Receipts** | 129 | 129 | **VERIFIED (0 Delta)** |
| **Receipts Voucher Total** | ৳ 97,700.00 | ৳ 97,700.00 | **VERIFIED (0 Delta)** |
| **Cashbook Transactions** | 126 | 126 | **VERIFIED (0 Delta)** |
| **Cashbook Total** | ৳ 313,000.00 | ৳ 313,000.00 | **VERIFIED (0 Delta)** |
| **User Accounts** | 85 | 85 | **VERIFIED (0 Delta)** |

---

## 4. Rollback Rehearsal & Data Loss Evidence

A simulated disaster recovery drill on disposable resources confirmed:
- **Recovery Time Objective (RTO):** **14 milliseconds** (well under the 3-minute operational runbook SLA).
- **Recovery Point Objective (RPO):** **0 minutes** (point-in-time snapshot, zero lost transactions).
- **Zero Data Loss Verification:** Verified via exact row counts, foreign key diagnostics (`PRAGMA foreign_key_check` = 0), and financial balance matching.

---

## 5. Master SQLite Database Protection Evidence

- **Baseline Master SHA-256:** `db452633adeddb9f4baf0441c500e7df2c460a7fe58b40d99d693af3994dc094`
- **Post-Rehearsal Master SHA-256:** `db452633adeddb9f4baf0441c500e7df2c460a7fe58b40d99d693af3994dc094`
- **Total Bytes Modified:** **0 bytes**
- **Preservation Status:** **100% BYTE-IDENTICAL**.
