# EHRJ MADRASHA ERP — PHASE 13 FEATURE COMPLETION PLAN
## Full Application Completion & Real Feature Parity

### 1. Executive Summary
Phase 13 delivers full institutional workflow completion across the Next.js Web Application suite (`/app`) and the Flutter Mobile App (`ehrj_flutter_app`). This phase moves beyond dashboard summaries into comprehensive, bidirectional data management with strict role-based access control (RBAC), multi-module live search/filtering, modal workflows, offline draft synchronization, and zero database regression.

### 2. Invariant Baseline Protection
- **Port 3000 SQLite Master Database (`prisma/dev.db`):**
  - Total Students: exactly 185
  - Total Invoices: exactly 385 (Net Total: ৳424,095; Paid Total: ৳141,200)
  - Total Receipts: exactly 129 (Paid Total: ৳97,700)
- **Port 3001 PostgreSQL Staging Node:** Isolated, intact, read-only verification.
- **Production Safety:** No live payment merchant invocation, no automated SMS dispatch, no destructive schema migration.

### 3. Core Modules & Execution Scope

| Module | Web App (`/app`) Scope | Flutter Mobile App Scope | Authoritative Source |
|---|---|---|---|
| **Students & Guardians** | Class filter, roll/ID search, profile inspection, status badges | Student list, profile details, emergency contact | `prisma.student`, `prisma.enrollment` |
| **Fees & Invoices** | Invoice filter, status tags (PAID, PARTIAL, UNPAID), due amount tracking | Fee summary, invoice breakdown, payment status | `prisma.feeInvoice`, `prisma.paymentReceipt` |
| **Attendance Matrix** | Period & date selection, student list, batch mark, draft queue | Class attendance, attendance history, offline cache | `prisma.attendance`, `prisma.attendanceLock` |
| **Examinations & Marks** | Exam selector, marks entry table, marksheet generation | Exam schedule, marks card, result publication view | `prisma.exam`, `prisma.examMark`, `prisma.result` |
| **Admissions Management** | Online submissions table, status review modal, approve/reject action | Admission status tracking, application lookup | `prisma.application` |
| **Digital Gatepass & Leave** | Request list, destination filter, issue new gatepass modal | Leave status, digital gatepass QR card | `prisma.studentLeaveRequest` |
| **Notices & Bulletins** | Categorized notice board, target audience badge, attachment view | Notice feed, push notification listener, bookmark | `prisma.notice`, `prisma.notification` |
| **Settings & Audit** | Database node monitor, institutional profile, sync health | App config, user session, cache reset | `prisma.auditLog`, `INSTITUTION_INFO` |

### 4. Implementation Phasing
- **Batch 1:** Unified multi-module data route (`/api/app/module-data`) supporting GET queries for all modules and POST actions for status changes and gatepass issuance.
- **Batch 2:** Full-featured Web App Suite (`/app`) incorporating tab-based navigation, search/filter bars, interactive table grids, modal dialogs for details/issuance, and offline draft support.
- **Batch 3:** Verification & Parity Automation (`scratch/test_phase13_web_flutter_parity.js`) verifying 43 test assertions covering invariants, auth, module endpoints, mutations, and Flutter repository APIs.
- **Batch 4:** Flutter Test Suite & Static Analysis execution (`flutter test` [32 tests passed], `flutter analyze` [0 issues]).
- **Batch 5:** Formal reporting and parity matrix consolidation.
