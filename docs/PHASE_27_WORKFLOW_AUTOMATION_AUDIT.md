# EHRJ MADRASHA ERP — PHASE 27 AUDIT & SPECIFICATION
## Institutional Workflow Automation, Business Rules Engine & Event-Driven Process Orchestration

**Checkpoint ID:** `EHRJ-AI-2026-PHASE27`  
**Date:** 2026-09-29  
**Institution:** ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা (Eliotganj Hazi Rohmatollah Jamiria Madrasha)  
**Lead Roles:** Senior Software Architect, Workflow Engineer, Rules Engine Engineer, Reliability & Security Engineer  

---

### 1. Executive Mission & Core Governance Principles

Phase 27 establishes a production-grade, event-driven orchestration layer that safely interconnects all independent EHRJ operational modules (Admissions, Finance, Attendance, Academics, Library, Inventory, HR, Helpdesk, Operations, BI & Early Warnings) without allowing automation or AI to usurp human authority.

#### Core Governance Invariants:
1. **Automate the Process, Not the Authority:** System orchestrates information flow; high-stakes decisions remain reserved for authorized humans.
2. **Event $\neq$ Action Authorization:** Emitting a domain event does not grant automatic permission to mutate critical ledgers.
3. **Rule $\neq$ Permission:** Business rules cannot bypass Role-Based Access Control (RBAC) or institutional security boundaries.
4. **No Arbitrary Executable Code or SQL:** Rule evaluation strictly uses validated, declarative domain-specific schemas (DSL) and allowlisted operations.
5. **Human Approval Gateway:** High-risk actions (admission approval, fee waivers, financial assistance, result publication, refund, certificate revocation, account suspension) halt at `APPROVAL_REQUIRED` until signed off by an authorized human.
6. **No Duplicate Financial or Notification Actions:** Idempotency keys and event deduplication windows protect against replay and duplicate dispatches.
7. **Saga Orchestration & Compensation:** When distributed multi-step workflows experience partial failures, completed domain records are not blindly deleted; dedicated compensating actions or retries resolve inconsistencies.
8. **Observability & Dead-Letter Visibility:** Failed events and jobs never fail silently. They transition through `FAILED` $\to$ `RETRYING` $\to$ `DEAD_LETTER` with root-cause diagnostics visible in the Admin Workflow Center.

---

### 2. Codebase Audit of Existing Foundations

| Domain / Area | Existing Implementation in Codebase | Limitations & Gaps | Required Phase 27 Action |
| :--- | :--- | :--- | :--- |
| **Domain Events** | `emitDomainEvent` in `src/lib/communicationEngine.ts` writes to `NotificationOutbox`. | Lacks standardized envelope (`correlationId`, `causationId`, `actorType`, `schemaVersion`). Limited to notifications. | Implement `DomainEvent` contract, event dispatcher, and unified `EventOutbox` with consumer subscriptions. |
| **Outbox Pattern** | `NotificationOutbox` table in Prisma (`prisma/dev.db`) with `idempotencyKey` @unique and status indexing. | Processed synchronously or via simple cron; lacks dead-letter handling, retry backoff, and cross-module consumers. | Extend outbox processing with exponential backoff, dead-letter quarantine, and multi-consumer dispatch. |
| **Background Jobs** | `ReportSchedule` model in Prisma; ad-hoc cron jobs in `src/lib/schedulerEngine.ts`. | No unified, observable queue for ad-hoc workflow actions, retries, or execution histories. | Implement `AutomationJob` engine with states: `QUEUED`, `RUNNING`, `SUCCEEDED`, `RETRYING`, `FAILED`, `DEAD_LETTER`, `CANCELLED`. |
| **Scheduled Jobs** | `executeMasterCronRegistry` in `src/lib/schedulerEngine.ts` (Backups, Notification outbox, Attendance, Expiring docs). | Missed execution recovery is unmanaged; no declarative scheduled rules engine. | Integrate scheduled rule triggers, missed-run catch-up evaluation, and schedule pause/resume. |
| **Approval Workflows** | Fragmented per module: `admissionApproval.ts`, `DocumentRequest`, `LeaveRequest`, `change_requests.json`. | No centralized approval request protocol, cross-module approval queue, or structured expiry handling. | Build unified **Human Approval Gateway** (`EHRJ-APR-YYYY-XXXXXX`) with cryptographic evidence and role validation. |
| **State Machines** | Discrete state fields in `Application`, `DocumentRequest`, `SupportRequest`, `EarlyWarning`. | State transitions not validated against formal workflows; risk of illegal jumps if automated. | Formalize workflow lifecycle (`DRAFT`, `REVIEW`, `ACTIVE`, `PAUSED`, `ARCHIVED`) and enforce state transition gates. |
| **Idempotency** | Partial in `NotificationOutbox` and financial receipt generation. | No standardized workflow instance idempotency key (`wf_${code}_${entityId}_${triggerKey}`). | Enforce universal idempotency check before any workflow action executes. |
| **Business Rules** | Hardcoded logic in domain services; early warning rules in `src/lib/earlyWarningEngine.ts`. | No declarative rule parser, dry-run simulation engine, or conflicting rule detection. | Build declarative Rules Engine with dry-run mode (`SIMULATION`), loop detection, and versioning. |
| **AI Integration** | `aiEngine.ts` & `aiGovernance.ts` (Phase 21) with `requiresHumanApproval: true`. | AI cannot safely draft automation rules without structured schema validation. | Provide AI Natural Language rule drafting with mandatory Admin review and approval gates. |
| **BI & Early Warnings** | `earlyWarningEngine.ts` (Phase 26) with `EarlyWarningEvent` (FSM `DETECTED`...`RESOLVED`). | Early warnings do not automatically generate tracked investigation workflows or approval requests. | Connect `HIGH`/`CRITICAL` early warnings to workflow orchestration for supervised follow-up. |

---

### 3. Gap Analysis Matrix

| Area | Existing | Missing | Duplicate | Risk | Required Action |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Events** | `NotificationOutbox` | Event bus, correlation/causation chains, schema versions | Notification-specific outbox | **P1** | Build unified domain event bus with full correlation tracing. |
| **Jobs** | Cron runner | Persistent job queue with retry, backoff, and dead-letter | None | **P1** | Build `AutomationJob` registry and worker with dead-letter queue. |
| **Workflows** | Hardcoded steps in services | Declarative workflow definitions, versioning, pause/resume | None | **P0** | Implement `WorkflowDefinition` & `WorkflowInstance` engine. |
| **Rules** | Early warning rules | Structured rule engine (DSL), dry-run testing, conflict detector | None | **P1** | Build Declarative Rules Engine with dry-run simulation mode. |
| **Approvals** | Module-specific tables | Unified Human Approval Gateway (`EHRJ-APR-...`) | Divergent approval schemas | **P0** | Implement universal approval request protocol with expiry & audit. |
| **Notifications** | Phase 8 templates | Throttling windows and multi-alert anti-fatigue deduplication | Redundant dispatch | **P2** | Integrate notification throttling and deduplication keys. |
| **Finance** | Phase 6 billing engine | Safe scheduled monthly fee invoice runner via billing service | Risk of double billing | **P0** | Implement scheduled billing orchestrator calling authoritative billing service with idempotency. |
| **Security** | Phase 24 RBAC & Audit | Automation system actor role (`SYSTEM_AUTOMATION`), rule tamper guard | None | **P0** | Enforce restricted `SYSTEM_AUTOMATION` actor, rule immutability, and dry-run safety. |

---

### 4. Canonical Event Contract

Every domain event emitted within EHRJ must adhere to this standard contract:

```typescript
export interface DomainEvent<T = Record<string, any>> {
  eventId: string;           // "EVT-2026-XXXXXXXXXX"
  eventType: string;         // e.g. "ADMISSION_APPROVED", "PAYMENT_SUCCESSFUL"
  occurredAt: string;        // ISO 8601 UTC
  actorType: "USER" | "SYSTEM_AUTOMATION" | "SCHEDULED_CRON" | "GUARDIAN";
  actorId: string;           // User ID or "SYSTEM"
  sourceModule: "ADMISSION" | "FINANCE" | "ATTENDANCE" | "ACADEMIC" | "LIBRARY" | "INVENTORY" | "HR" | "HELPDESK" | "OPERATIONS" | "SECURITY" | "BI";
  entityType: string;        // e.g. "Student", "FeeInvoice", "Attendance"
  entityId: string;          // Primary key of affected entity
  payload: T;                // Structured, privacy-filtered payload
  correlationId: string;     // Unique id shared across all causal steps in a journey
  causationId?: string;      // ID of the event that directly caused this event
  schemaVersion: string;     // "1.0"
  idempotencyKey: string;    // "evt_${eventType}_${entityId}_${hash}"
}
```

---

### 5. Architectural Design of Workflow & Rules Engine

```
[Domain Service (e.g. Admission/Finance)]
                │
                ▼ (Emits DomainEvent)
      [Event Dispatcher / Outbox]
                │
                ├──► Persist to Event Store (Append-Only)
                │
                ▼
        [Rules Engine]
        - Check Trigger Match
        - Safe Condition Evaluation (DSL)
        - Loop Guard (Max Depth <= 5)
        - Check Conflict & Status
                │
         Is High-Risk Action?
         ├── YES ──► [Human Approval Gateway] ──► Generates EHRJ-APR-YYYY-XXXXXX
         │                                         (Awaits Principal/Admin Decision)
         └── NO  ──► [Automation Job Queue]
                           │
                           ▼
                    [Job Executor]
                    - Idempotency Gate
                    - Calls Authoritative Domain Service
                    - Retry Policy with Exponential Backoff
                    - On Exhaustion: Quarantines to DEAD_LETTER
```

---

### 6. Implementation Plan & Milestones

1. **Core Domain Event & Outbox Engine (`src/lib/workflow/eventBus.ts`):**
   - Canonical `DomainEvent` contract.
   - Transaction-safe event publishing and subscription dispatch.
   - Append-only event log (`data/governance/domain_events.json`).
   - Event deduplication and idempotency verification.

2. **Unified Job Queue & Dead-Letter Management (`src/lib/workflow/jobQueue.ts`):**
   - Job lifecycle states: `QUEUED`, `RUNNING`, `SUCCEEDED`, `RETRYING`, `FAILED`, `DEAD_LETTER`, `CANCELLED`.
   - Exponential backoff calculation ($2^n \times 1000\text{ms}$).
   - Dead-letter queue inspector and manual replay capabilities.
   - Persistence in `data/governance/automation_jobs.json`.

3. **Declarative Business Rules Engine (`src/lib/workflow/rulesEngine.ts`):**
   - Condition operators: `EQUALS`, `NOT_EQUALS`, `GREATER_THAN`, `LESS_THAN`, `IN`, `CONTAINS`, `EXISTS`.
   - Dry-Run Simulation Mode: Computes matched entities and anticipated actions with zero mutations.
   - Loop protection (maximum execution depth = 5) and contradiction/conflict detector.
   - Versioning (`RuleVersion 1.0` $\to$ immutable).

4. **Human Approval Gateway (`src/lib/workflow/approvalEngine.ts`):**
   - High-risk action interceptor generating requests (`EHRJ-APR-2026-XXXXXX`).
   - States: `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`.
   - Expiry timeout tracking and mandatory audit trail with reviewer notes.
   - Persistence in `data/governance/approval_requests.json`.

5. **Cross-Module Orchestration & Scheduled Automation (`src/lib/workflow/workflowEngine.ts`):**
   - Built-in multi-step workflows:
     - `WF-ADM-001`: Admission Approval $\to$ Enrollment $\to$ Fee Structure Invoice Generation $\to$ Library Member Registration $\to$ Notification.
     - `WF-FIN-001`: Monthly Fee Run via authoritative `feeCalculationService` with idempotency.
     - `WF-ATT-001`: Repeated Absence $\to$ Early Warning $\to$ Throttled Guardian Notification.
     - `WF-INV-001`: Stock Below Reorder $\to$ Purchase Request Suggestion (High-Risk Approval Gate).
     - `WF-OPS-001`: Backup Failure $\to$ Operational Incident $\to$ Admin Alert.
   - Compensating actions for partial failures.

6. **Admin API & UI Workflow Center:**
   - Routes:
     - `GET /api/admin/workflows/overview`: System metrics, active workflows, queue depth, dead-letter count.
     - `GET/POST /api/admin/workflows/rules`: List rules, create new rule version, dry-run test.
     - `GET/POST /api/admin/workflows/approvals`: List pending approvals, submit decision (`APPROVE`/`REJECT`).
     - `GET/POST /api/admin/workflows/jobs`: Queue status, job history, dead-letter replay.
     - `GET /api/admin/workflows/events`: Searchable and filterable domain event audit trail.
   - Responsive UI:
     - `/admin/workflows`: 5-tab console (Overview, Workflows & Rules, Approval Gateway, Jobs & Dead-Letter, Event Audit).
     - Navigation link in `src/app/admin/page.tsx`.

7. **Verification & Regression:**
   - Comprehensive test suite `scratch/test_phase27_workflow_engine.ts` covering events, rules, dry-run, approval gate, job queue retries, dead-letter, loop protection, and cross-module orchestration.
   - Full regression across all phases (Phases 20–27).
   - Git checkpoint: `EHRJ-AI-2026-PHASE27`.
