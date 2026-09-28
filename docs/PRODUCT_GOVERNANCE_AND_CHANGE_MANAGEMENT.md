# EHRJ MADRASHA — PRODUCT GOVERNANCE & CHANGE MANAGEMENT FRAMEWORK
**ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা**  
**Eliotganj Hazi Rohmatollah Jamiria Madrasha (EHRJ Madrasha)**  
*Policy Document Version:* 1.0.0 (Phase 20)  
*Classification:* Institutional Governance / Engineering Management Standard

---

## 1. CORE OPERATIONAL INVARIANTS

Every engineer, product designer, and administrator operating on the EHRJ Madrasha platform must adhere to the following inviolable principles:

> **FEATURE REQUEST != FEATURE APPROVED**  
> **CODE CHANGED != TASK COMPLETED**  
> **DEPLOYED != VERIFIED**  
> **VERIFIED != GOVERNED**  
> **PRODUCTION SYSTEM != FINISHED SYSTEM**

No feature shall be deployed directly to production without passing the complete evidence-based engineering lifecycle.

---

## 2. THE LONG-TERM ENGINEERING LIFECYCLE

```text
REQUEST
  ↓
UNDERSTAND & DISCOVER
  ↓
IMPACT ANALYSIS
  ↓
RISK CLASSIFICATION
  ↓
DESIGN & ARCHITECTURAL REVIEW
  ↓
APPROVAL
  ↓
IMPLEMENTATION
  ↓
UNIT & INTEGRATION TESTING
  ↓
SECURITY & PRIVACY REVIEW
  ↓
REGRESSION TESTING
  ↓
USER ACCEPTANCE TESTING (UAT)
  ↓
DEPLOYMENT (Controlled)
  ↓
HEALTH MONITORING & SMOKE TEST
  ↓
EVIDENCE VERIFICATION
  ↓
DOCUMENTATION & GOVERNANCE UPDATE
```

---

## 3. CHANGE MANAGEMENT PROTOCOL

### 3.1 Change Classification
Every change submitted via `/admin/governance` is assigned a unique identifier (`EHRJ-CHG-YYYY-XXXXXX`) and classified under one of the following types:

| Type | Definition | Risk Baseline |
| :--- | :--- | :--- |
| **FEATURE** | Introduction of brand new user-facing functionality. | MEDIUM |
| **ENHANCEMENT** | Iterative improvement to existing workflows. | LOW / MEDIUM |
| **BUG_FIX** | Remediation of incorrect or anomalous software behavior. | LOW / MEDIUM |
| **SECURITY** | Security patch, vulnerability remediation, or RBAC hardening. | HIGH / CRITICAL |
| **DATA** | Data migration, bulk ingestion, or historical record correction. | HIGH / CRITICAL |
| **INFRASTRUCTURE** | Nginx, PM2, Node.js runtime, or server hosting alterations. | HIGH / CRITICAL |
| **CONFIGURATION** | Institutional fees, grading rules, or academic session setup. | LOW / MEDIUM |
| **EMERGENCY** | Immediate production intervention to remediate system outages. | CRITICAL |

### 3.2 Risk Classification Tiers
1. **LOW:** Cosmetic UI changes, static text corrections, non-critical styling adjustments.
2. **MEDIUM:** Isolated changes within a single module (e.g. adding a report filter).
3. **HIGH:** Cross-module changes (affecting 3+ modules), or touching financial ledger, student rosters, or notifications.
4. **CRITICAL:** Changes touching authentication, session cookies, database schema, payment gateways, or production infrastructure.

---

## 4. CROSS-MODULE DEPENDENCY & IMPACT MATRIX

Before making any change, the engineer must consult the authoritative dependency graph:

```text
ADMISSIONS ──────► STUDENTS ──────► ENROLLMENT
    │                 │                 │
    ▼                 ▼                 ▼
NOTIFICATIONS      GUARDIANS        ATTENDANCE
    ▲                 │                 │
    │                 ▼                 ▼
 FINANCE ◄─────── PAYMENTS           ACADEMIC
    │
    ▼
5 CASH FUNDS (General, Lillah, Zakat, Construction, Orphan)
```

- **Rule 1:** A change to `STUDENTS` automatically requires regression testing on `ATTENDANCE`, `EXAMS`, `DOCUMENTS`, and `GUARDIANS`.
- **Rule 2:** Any change to `FINANCE` requires 100% mathematical equality verification across all invoices and funds.

---

## 5. DATABASE GOVERNANCE & HISTORICAL IMMUTABILITY

1. **Schema Change Gate:** Every proposed Prisma schema modification must provide an impact assessment detailing:
   - Data compatibility with existing records.
   - Forward and rollback migration path.
   - Storage overhead and index utilization.
2. **Historical Immutability:** Historical financial records (invoices, receipts, payments) and published exam results must NEVER be modified directly in the database.
3. **Audited Corrections:** If a mistake occurred in a historical record, a counter-balancing adjustment transaction or re-issuance record must be registered with administrative justification and logged in `AuditLog`.

---

## 6. DATA QUALITY AUDIT & RECONCILIATION

The system provides a built-in automated Data Quality Engine ([`src/lib/governanceEngine.ts`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/governanceEngine.ts)):
- **Frequency:** Nightly automated scan and on-demand via `/api/admin/governance/data-quality`.
- **Invariants Checked:**
  1. Student name duplication within the same Jamat class.
  2. Unlinked guardian profiles.
  3. Orphan enrollment records.
  4. Fee invoice arithmetic equality (`dueAmount == totalAmount - paidAmount - waiverAmount - discountAmount`).
  5. Negative fund balances across all 5 cash funds.
  6. Expiring employee documents.

---

## 7. TECHNICAL DEBT GOVERNANCE

Technical debt must never remain invisible. All technical debt items are formally registered in the Technical Debt Register:
- Tracked attributes: `debtId`, `module`, `risk`, `impact`, `workaround`, `priority`, `plannedResolution`.
- Open debt items are evaluated quarterly by the Engineering Lead and allocated to upcoming milestone phases.

---

## 8. ACCESS REVIEW & SECURITY AUDIT

- **Monthly:** Audit active sessions, remove stale sessions older than 30 days, verify that privileged accounts (`ADMIN` and `PRINCIPAL`) correspond to real verified personnel.
- **Quarterly:** Review teacher class assignments and guardian phone numbers.
- **Annually:** Full penetration test, disaster recovery drill with isolated restore, and architecture review.
