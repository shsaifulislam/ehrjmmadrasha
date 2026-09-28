# ADR-003: Idempotent Multi-Fund Accounting Ledger & Strict Shariah Allocation
**Eliotganj Hazi Rohmatollah Jamiria Madrasha (EHRJ Madrasha)**

- **Status:** `ACCEPTED`
- **Decided Date:** 2026-09-28
- **Deciders:** Financial Controller, Senior Systems Architect, Mutawalli Committee

---

## 1. Context & Problem Statement
A Madrasha has strict religious and legal accounting requirements. Funds received for Zakat and Lillah (orphan/destitute food and shelter) cannot be mixed with General operational or Construction funds under Islamic Shariah jurisprudence. Furthermore, online mobile banking payments (bKash/Nagad) frequently suffer network retries and webhook delays, creating replay risks.

## 2. Decision
Implement an **idempotent multi-fund accounting ledger** with 5 authoritative cash funds (`GENERAL`, `LILLAH`, `ZAKAT`, `CONSTRUCTION`, `ORPHAN_SUPPORT`), strict mathematical due balance equality, and cryptographic QR token generation for payment receipts.

## 3. Invariants
- Mathematical Equality: `dueAmount == totalAmount - paidAmount - waiverAmount - discountAmount` (Zero tolerance for floating-point drift).
- Payment Idempotency: Every payment submission requires a unique transaction idempotency key. Duplicate submissions return the existing receipt without duplicate debiting.
- Shariah Fund Segregation: Zakat and Lillah disbursements are strictly allocated to eligible beneficiaries and tracked independently.

## 4. Consequences
- **Positive:**
  - 100% auditable accounting with zero undetected financial discrepancies.
  - Complete protection against webhook replay attacks.
- **Negative / Trade-offs:**
  - Strict invoice locking: Invoices cannot be modified directly once payments or receipts are attached; corrections require audited adjustment or reversal records.
