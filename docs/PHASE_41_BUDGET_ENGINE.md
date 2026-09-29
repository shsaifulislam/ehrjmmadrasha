# EHRJ MADRASHA ERP — PHASE 41
## Institutional Budget Planning, Financial Planning & Budget Control Engine
**Checkpoint:** `EHRJ-AI-2026-PHASE41`  
**Institution:** Eliotganj Hazi Rohmatollah Jamiria Madrasha (ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা)

---

### 1. Executive Summary & Core Invariants
Phase 41 establishes the **Institutional Budget Planning, Financial Planning & Budget Control Engine** for Eliotganj Hazi Rohmatollah Jamiria Madrasha. It provides institutional budget modeling, period and session governance, Shariah fund segregation, multi-version snapshots, revision approval workflows, soft threshold control, and capital development project tracking.

#### Foundational Invariants:
1. **Never Duplicate Accounting Source of Truth**:
   - Phase 41 **PLANS** the money and **CONTROLS** the money, but never duplicates Phase 6 Finance (transactions, cashbook, fee vouchers, balances).
   - Commitments are pulled dynamically from Phase 12 Procurement (Purchase Orders) and Phase 40 Vendor Contracts.
   - Labor expenditures are referenced from Phase 13 HR (Payroll records).
2. **Automate the Process, Not the Authority**:
   - AI and automated scripts provide advisory projections, anomaly scans, and variance reports.
   - Only human authorities (`ADMIN`, `PRINCIPAL`, Governing Body) can approve budgets, sanction revisions, or activate locked periods.
3. **Strict Shariah & Institutional Fund Segregation**:
   - **Zakat Fund (`ZAKAT`)**: Legally and Islamically restricted strictly for eligible student welfare, clothing, medical aid, and poor student food. Building repairs, equipment purchases, or administrative salaries from Zakat are blocked at the engine validation level.
   - **Lillah Boarding Fund (`LILLAH`)**: Dedicated to residential student nutrition, pantry groceries, and mess operations.
   - **Construction Fund (`CONSTRUCTION`)**: Designated for physical infrastructure, building extension, and capital expenditure (CapEx) tracking.
   - **General Fund (`GENERAL`)**: Unrestricted tuition, institutional operations, utilities, and general maintenance.
4. **Soft Control by Default**:
   - 80% Utilization: **WARNING** notification.
   - 90% Utilization: **CRITICAL** notification.
   - 100%+ Utilization: **OVERRUN** alert requiring human justification and revision request. Does not blindly halt urgent operational payments unless hard enforcement is explicitly toggled by the Principal.
5. **Strictly NO SMS**:
   - Alerts and notifications are delivered exclusively through in-app portal banners, notification trays, and calendar events. No SMS gateways or third-party telecom APIs are used.

---

### 2. Architecture & Domain Model

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      Phase 41 Budget Engine                            │
 ├────────────────────────────────────────────────────────────────────────┤
 │                                                                        │
 │  ┌─────────────────┐       ┌─────────────────┐       ┌──────────────┐  │
 │  │  Budget Period  │◄──────┤     Budget      │──────►│ Budget Line  │  │
 │  │ (Annual/Session)│       │ (Draft/Active)  │       │ (Allocations)│  │
 │  └─────────────────┘       └────────┬────────┘       └──────┬───────┘  │
 │                                     │                       │          │
 │                 approvals create    │                       │          │
 │                                     ▼                       ▼          │
 │                            ┌─────────────────┐       ┌──────────────┐  │
 │                            │ Version Snapshot│       │Control Alerts│  │
 │                            │ (v1, v2, v3...) │       │(80%/90%/100%)│  │
 │                            └─────────────────┘       └──────────────┘  │
 │                                     ▲                                  │
 │                                     │ approves revision                │
 │                            ┌─────────────────┐                         │
 │                            │ Budget Revision │                         │
 │                            │  (Line Diffs)   │                         │
 │                            └─────────────────┘                         │
 └─────────────────────────────────────┬──────────────────────────────────┘
                                       │ Non-duplicative integration
                                       ▼
     ┌───────────────────────┬───────────────────────┬───────────────────┐
     │   Phase 6 Finance     │ Phase 12 Procurement  │    Phase 13 HR    │
     │   Cash Transactions   │    Purchase Orders    │  Payroll Records  │
     │       (Actuals)       │     (Commitments)     │   (Labor Costs)   │
     └───────────────────────┴───────────────────────┴───────────────────┘
```

#### Engine Modules (`src/lib/budget/`):
- **`types.ts`**: Complete TypeScript domain models, enums, DTOs, and interface contracts.
- **`budgetStore.ts`**: Atomic filesystem persistence in `data/budgets/` (`periods.json`, `budgets.json`, `revisions.json`, `projects.json`, `alerts.json`, `audit_log.json`) with institutional seed data for 2026-2027.
- **`budgetLifecycleEngine.ts`**: State machine controlling transitions (`DRAFT` $\rightarrow$ `PREPARATION` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `APPROVED` $\rightarrow$ `ACTIVE` $\rightarrow$ `REVISED` $\rightarrow$ `CLOSED` $\rightarrow$ `ARCHIVED`), line additions, and immutable snapshot generation upon approval.
- **`budgetCalculationEngine.ts`**: Mathematical variance calculation (`Planned - (Actual + Committed)` for expenses, `Actual - Planned` for income), Shariah fund rule validators, and fund-wise budget aggregations.
- **`budgetControlEngine.ts`**: Automated threshold scans (80% Warning, 90% Critical, 100%+ Overrun), overrun tracking, and human acknowledgment workflows.
- **`budgetRevisionEngine.ts`**: Revision requests with line-by-line diffs (`previousAmount`, `newRequestedAmount`, `amountDifference`, `justificationBn`), Principal approval, and version promotion (`v1` $\rightarrow$ `v2`).
- **`budgetIntegrationBridge.ts`**: Real-time cross-phase synchronization without duplication, connecting Phase 6 `prisma.cashTransaction`, Phase 12 `prisma.purchaseOrder`, and Phase 13 `prisma.payrollRecord`.

---

### 3. API Surface

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/admin/budgets` | GET | Admin/Principal | List all budgets with period, status, and search filters |
| `/api/admin/budgets` | POST | Admin | Create a new institutional budget in DRAFT |
| `/api/admin/budgets/[id]` | GET | Admin/Principal | Retrieve single budget with lines, versions, and projects |
| `/api/admin/budgets/[id]` | PATCH | Admin | Update budget metadata, notes, or control thresholds |
| `/api/admin/budgets/[id]/action` | POST | Admin/Principal | Transition lifecycle status (e.g. approve, activate, close) |
| `/api/admin/budgets/periods` | GET / POST | Admin/Principal | Manage fiscal years and academic sessions with lock toggles |
| `/api/admin/budgets/lines` | GET / POST | Admin | Retrieve lines or add/update line allocations |
| `/api/admin/budgets/revisions` | GET / POST | Admin/Principal | View revision audit trail or submit new revision request |
| `/api/admin/budgets/revisions/[id]/approve` | POST | Principal/Admin | Formally approve revision, promote version, and snapshot |
| `/api/admin/budgets/projects` | GET / POST | Admin/Principal | Track CapEx construction and development projects |
| `/api/admin/budgets/alerts` | GET / POST | Admin/Principal | List threshold alerts, trigger scans, or acknowledge alerts |
| `/api/admin/budgets/variance` | GET | Admin/Principal | Generate line-by-line variance and deficit/surplus analysis |
| `/api/admin/budgets/stats` | GET | Admin/Principal | Real-time institutional financial dashboard KPIs |

---

### 4. Admin User Interface & Console

- **Route:** `/admin/budgets`
- **Sub-pages:**
  - `/admin/budgets/periods` (Fiscal Year & Session Management)
  - `/admin/budgets/new` (Institutional Budget Drafting)
  - `/admin/budgets/[id]` (Line Items & Monthly Allocation)
  - `/admin/budgets/[id]/versions` (Immutable Version History & Comparison)
  - `/admin/budgets/[id]/revisions` (Revision Proposals & Approval Flow)
  - `/admin/budgets/[id]/variance` (Variance Analysis & Deficit Detection)
  - `/admin/budgets/projects` (Development & Capital Project CapEx)
- **Component:** `InstitutionalBudgetConsole.tsx`
  - 7 interactive tabs: Overview Dashboard, Budget Lines, Version Snapshots, Revision Requests, Capital Projects, Variance & Alerts, Budget Periods.
  - Bilingual interface (Bengali primary, English secondary).
  - Visual status chips, utilization progress meters, threshold alert indicators, and modal workflows.

---

### 5. Verification & Test Evidence

#### Test Suite: `scratch/test_phase41_budget_engine.ts`
- Command: `npm run test:phase41`
- Results: **55 / 55 tests passed (100%)**

| Test Group | Tests | Result | Details |
|---|---|---|---|
| 1. Period Management & Locks | 4 | PASS | Period creation, lock state enforcement, activation |
| 2. Lifecycle & Version Snapshots | 11 | PASS | State machine, invalid jump blocks, v1 immutable snapshotting |
| 3. Budget Lines & Fund Rules | 6 | PASS | General/Lillah/Zakat lines, Zakat welfare Shariah enforcement |
| 4. Calculation & Variance | 7 | PASS | Remaining, utilization rate, favorable/unfavorable variance |
| 5. Control Engine & Alerts | 5 | PASS | 80% Warning, 90% Critical, 100%+ Overrun, human acknowledgment |
| 6. Revisions & Version Promotion | 8 | PASS | Submission, review, approval, v2 promotion, line revisedAmount |
| 7. CapEx Capital Projects | 4 | PASS | Project linking, CapEx tracking, construction fund tagging |
| 8. Integration Bridge Invariants | 4 | PASS | Phase 6/12/13 reconciliation without ledger duplication |
| 9. Security, NO-SMS & Dashboard | 6 | PASS | KPIs, audit logging with actor attribution, strict NO-SMS |

#### Regression Verification:
- `npm run test:phase39`: **40 / 40 passed (100%)**
- `npm run test:phase38`: **55 / 55 passed (100%)**
- TypeScript Check: `npx tsc --noEmit` exited 0 (clean, 0 errors).
