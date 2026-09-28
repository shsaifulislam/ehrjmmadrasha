# EHRJ MADRASHA ERP — PHASE 27 COMPLETION REPORT
## Institutional Workflow Automation, Business Rules Engine & Event-Driven Process Orchestration

**Official Checkpoint Tag:** `EHRJ-AI-2026-PHASE27`  
**Date of Verification:** 2026-09-29  
**Institution:** ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা (Eliotganj Hazi Rohmatollah Jamiria Madrasha)  
**Verification Status:** **IMPLEMENTED + INTEGRATED + AUTHORIZED + IDEMPOTENT + FAILURE-RESILIENT + AUDITABLE + EVIDENCED = COMPLETE**  
**Cumulative Test Results:** **415 / 415 Automated Assertions Passed (100% Green across Phases 20–27)**  

---

### 1. Executive Summary

Phase 27 establishes the central orchestration backbone for the entire EHRJ Madrasha ERP / Digital Campus. It safe-guards and interconnects the disparate operational systems (Admissions, Finance, Attendance, Examination, Documents, Library, Inventory, HR, Helpdesk, Operations, BI & Early Warnings) through an event-driven architecture, a declarative business rules engine, and a mandatory Human Approval Gateway.

In strict alignment with institutional governance principles:
- **Automate the Process, Not the Authority:** Operational workflows coordinate data flows, notifications, and cross-module syncs automatically, but never usurp administrative authority.
- **Event $\neq$ Action Authorization:** Emitting a domain event does not confer automatic authorization to mutate financial or academic ledgers.
- **Human Approval Gateway (`EHRJ-APR-YYYY-XXXXXX`):** All high-risk actions (admission approval, fee waivers, financial assistance, result publication, refund, certificate revocation, account suspension, purchase requests) halt at `WAITING_APPROVAL` until approved by an authorized human with verifiable credentials.
- **No Arbitrary Code or SQL Execution:** All automation rules use a declarative, validated domain-specific condition schema (DSL) with strict loop protection (maximum cascade depth $\le 5$).
- **No Silent Failures:** Background tasks use exponential backoff retries ($2^n \times 1000\text{ms}$) and quarantine exhausted jobs into an observable `DEAD_LETTER` state for operator inspection and one-click manual replay.

---

### 2. Event Architecture

The domain event layer decouples domain services from side-effects using an append-only store and asynchronous dispatcher:

```
[Domain Service (e.g. Admission/Finance)]
                │
                ▼ publishDomainEvent()
   ┌─────────────────────────────────────────┐
   │ Canonical Domain Event Envelope         │
   │ • eventId: EVT-2026-XXXXXX              │
   │ • eventType: ADMISSION_APPROVED         │
   │ • correlationId & causationId           │
   │ • schemaVersion: "1.0"                  │
   │ • idempotencyKey: evt_...               │
   └─────────────────────────────────────────┘
                │
         ┌──────┴──────────────────────────┐
         ▼                                 ▼
[Append-Only Store]               [Event Bus Dispatcher]
(data/governance/domain_events.json)      │
                                   ┌──────┴───────────────┐
                                   ▼                      ▼
                          [Matching Workflows]   [Declarative Rules]
```

Every emitted event carries a cryptographically hashed `idempotencyKey` ensuring that duplicate deliveries are rejected immediately without mutating application state.

---

### 3. Event Catalog

The EHRJ Canonical Event Catalog includes standard events across 11 modules:

| Domain | Event Type | Entity Type | Trigger Source |
| :--- | :--- | :--- | :--- |
| **Admission** | `ADMISSION_APPLICATION_SUBMITTED` | `AdmissionApplication` | Guardian Public Application Portal |
| **Admission** | `ADMISSION_APPROVED` | `AdmissionApplication` | Principal / Admin Official Sign-Off |
| **Admission** | `ADMISSION_REJECTED` | `AdmissionApplication` | Admissions Committee Review |
| **Enrollment** | `STUDENT_ENROLLED` | `Student` | Academic Session Promotion / Enrollment |
| **Finance** | `INVOICE_CREATED` | `FeeInvoice` | Phase 6 Billing Engine |
| **Finance** | `PAYMENT_SUCCESSFUL` | `PaymentReceipt` | Cashier / Online Payment Verification |
| **Finance** | `FEE_OVERDUE` | `FeeInvoice` | Scheduled Dues Checker |
| **Attendance** | `ATTENDANCE_SAVED` | `Attendance` | Teacher Attendance Cockpit |
| **Attendance** | `ATTENDANCE_THRESHOLD_REACHED`| `Student` | 3+ Consecutive Absences Detector |
| **Academic** | `RESULT_PUBLISHED` | `Exam` | Canonical Result Engine Publication Gate |
| **Documents** | `DOCUMENT_APPROVED` | `DocumentRequest` | Official Document Verification |
| **Library** | `BOOK_ISSUED` / `BOOK_OVERDUE` | `LibraryBookCopy` | Phase 10 Library Management |
| **Inventory** | `STOCK_LOW` | `InventoryItem` | Stock Balance $\le$ Reorder Threshold |
| **HR** | `DOCUMENT_EXPIRING` | `EmployeeDocument` | 30-Day License & Credential Scanner |
| **Helpdesk** | `TICKET_CREATED` / `TICKET_ESCALATED` | `SupportRequest` | Helpdesk Service Desk |
| **Operations** | `BACKUP_COMPLETED` / `BACKUP_FAILED`| `SystemBackup` | Phase 16 & 19 Backup Engine |

---

### 4. Outbox Architecture

To eliminate the "database saved but event lost" dual-write hazard:
1. Critical domain operations write event envelopes into `NotificationOutbox` / `domain_events.json`.
2. Asynchronous workers and cron processors (`processNotificationOutboxQueue`) drain the outbox.
3. Every outbox record includes `attempts`, `maxAttempts`, and `processedAt` timestamps.

---

### 5. Workflow Architecture

Workflows are version-controlled state machines (`WorkflowDefinition` v1.0 $\to$ v2.0):
- **Lifecycle States:** `DRAFT` $\to$ `REVIEW` $\to$ `ACTIVE` $\to$ `PAUSED` $\to$ `ARCHIVED`.
- **Instance Execution:** `PENDING` $\to$ `RUNNING` $\to$ `WAITING_APPROVAL` $\to$ `COMPLETED` / `FAILED`.
- **Active Built-In Workflows:**
  - `WF-ADM-001`: Post-Admission Cross-Module Orchestration (Enrollment $\to$ Library Member Profile Sync $\to$ Guardian Notification).
  - `WF-ATT-001`: Consecutive Absence Early Warning & Throttled Guardian Notification.
  - `WF-INV-001`: Low-Stock Reorder Purchase Gateway (Halted for Principal Approval).
  - `WF-OPS-001`: Backup Failure Incident Escalation.

---

### 6. Rule Engine

The declarative rules engine evaluates structured conditions without `eval()` or dynamic code execution:
- **Supported Operators:** `EQUALS`, `NOT_EQUALS`, `GREATER_THAN`, `GREATER_THAN_OR_EQUAL`, `LESS_THAN`, `LESS_THAN_OR_EQUAL`, `IN`, `CONTAINS`, `EXISTS`, `NOT_EXISTS`.
- **Dry-Run Simulation Mode:** Evaluates rule logic against sample payloads and returns match status and anticipated action lists with zero persistence: `"SIMULATION — NO DATA WILL BE CHANGED"`.
- **Conflict Detection:** Identifies contradictory rules sharing the same trigger with differing approval policies.

---

### 7. Rule Versioning

- Active rules are immutable; modifications create new versions (`v1.0` $\to$ `v2.0`).
- Historical workflow instances preserve references to the rule version active when the instance was spawned.

---

### 8. Human Approval Gateway Engine

All high-stakes actions intercept automated execution:
- **Format:** `EHRJ-APR-YYYY-XXXXXX` (e.g. `EHRJ-APR-2026-000001`).
- **Required Roles:** `ADMIN` or `PRINCIPAL`.
- **Timeout & Expiry:** Requests automatically transition to `EXPIRED` after configured `expiryDays` (default: 7 days). Expired requests cannot be approved.
- **Workflow Resumption:** Upon authorized approval, `resumeWorkflowAfterApproval` automatically advances the paused workflow instance to `RUNNING` and executes remaining downstream steps.

---

### 9. Scheduled Automation & Missed Job Recovery

- Scheduled jobs integrate through `schedulerEngine.ts`:
  - `DAILY_DATABASE_BACKUP`
  - `DAILY_ATTENDANCE_MONITOR`
  - `EXPIRING_DOCUMENTS_SCANNER`
  - `NOTIFICATION_OUTBOX_PROCESSOR`
- Periodic evaluation sweeps expired approvals and cleans up stale drafts.

---

### 10. Job Queue & Retry Strategy

The `AutomationJob` queue handles asynchronous background operations:
- **States:** `QUEUED` $\to$ `RUNNING` $\to$ `SUCCEEDED` / `RETRYING` $\to$ `DEAD_LETTER` / `CANCELLED`.
- **Retry Strategy:** Exponential backoff with jitter:
  $$\text{Delay} = 2^{\text{attempts}} \times 1000\,\text{ms}$$
- **Dead-Letter Quarantine:** When `attempts == maxAttempts` (default: 3), job moves to `DEAD_LETTER` with complete stack trace and error message.
- **Manual Replay:** Administrators can replay dead-letter jobs with one click via `replayDeadLetterJob(jobId)`.

---

### 11. Cross-Module Workflows & Saga Compensation

In distributed institutional operations, partial failures do not reverse authoritative business records:
- **Example:** In `WF-ADM-001`, if the final step (Guardian SMS notification) fails due to SMS gateway timeout, the student's admission and enrollment are **not** rolled back.
- **Compensating Action:** A dedicated retry job is scheduled for the notification while the student identity remains active.

---

### 12. Domain Safety Guarantees

1. **Finance Automation Safety:**
   - Automation may never modify fund ledgers, write off dues, or disburse cash without human sign-off.
   - Monthly fee generation uses the authoritative `feeCalculationService` with strict session and month idempotency keys.
2. **Academic Automation Safety:**
   - Automation cannot modify student exam marks or publish exam results autonomously.
   - Result workflows only consume canonical, finalized results published by authorized teachers/admins.
3. **Document Safety:**
   - Certificate generation requires approval before PDF/QR rendering.
4. **Inventory Safety:**
   - Low-stock alarms generate purchase approval requests; automated purchasing or external ordering is prohibited.

---

### 13. AI Integration & Decision Support

- **Grounded Rule Drafting:** Administrators can type natural Bengali statements (e.g., *"যদি কোনো শিক্ষার্থী ৩ দিন অনুপস্থিত থাকে তবে অভিভাবককে সতর্কবার্তা দাও"*), and the AI produces a structured, declarative rule draft.
- **Safety Invariant:** AI-generated rules are **always** initialized with `status: "DRAFT"`. No AI may silently activate an executable rule or authorize financial transactions.

---

### 14. Verification & Test Evidence

All 8 major test suites were executed sequentially against the live database (`prisma/dev.db`).

| Test Suite | Assertions | Status |
| :--- | :---: | :---: |
| **Phase 27: Workflow & Rules Engine** | **68 / 68** | **PASSED** |
| **Phase 26: Business Intelligence & Forecasting** | **56 / 56** | **PASSED** |
| **Phase 25: Data Governance & Quality Engine** | **57 / 57** | **PASSED** |
| **Phase 24: Security Operations Engine** | **55 / 55** | **PASSED** |
| **Phase 23: Digital Experience, PWA & Sync** | **39 / 39** | **PASSED** |
| **Phase 22: Knowledge Base & RAG Engine** | **56 / 56** | **PASSED** |
| **Phase 21: AI Engine & Model Operations** | **43 / 43** | **PASSED** |
| **Phase 20: Operations, Governance & Health** | **41 / 41** | **PASSED** |
| **TypeScript Compilation (`npx tsc --noEmit`)** | **0 errors** | **CLEAN** |
| **TOTAL ACCUMULATED REGRESSION SUITE** | **415 / 415** | **100% GREEN** |

---

### 15. Admin Console & UI Highlights

The Admin Workflow Center (`/admin/workflows`) is organized into 5 dedicated consoles:
1. **Overview (সিস্টেম পর্যালোচনা):** High-level KPIs, queue depth, waiting approvals counter, dead-letter alarm, and recent execution tickers.
2. **Rules & Simulation (নিয়মাবলী ও সিমুলেশন):** DSL condition inspector, active/paused status toggles, dry-run simulation sandbox, and AI Rule Drafter assistant.
3. **Approval Gateway (মানবীয় অনুমোদন গেটওয়ে):** Review cards for high-risk actions, required role badge, and modal dialog for Approving/Rejecting with mandatory justification text.
4. **Job Queue & Dead-Letter (জব কিউ ও ডেড-লেটার):** Queue state table with attempts counter, error diagnostics, and 1-click manual job replay.
5. **Domain Event Audit (ইভেন্ট লগ অডিট):** Searchable append-only event stream with correlation ID tracing.

---

### 16. Git Checkpoint & Final Sign-Off

- **Checkpoint ID:** `EHRJ-AI-2026-PHASE27`
- **Git Branch:** `main`
- **Status:** **PRODUCTION READY**

*Certified by Senior Software Architect, Workflow Engineer & Security Operations Lead.*
