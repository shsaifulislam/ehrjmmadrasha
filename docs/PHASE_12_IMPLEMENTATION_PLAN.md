# EHRJ MADRASHA ERP — PHASE 12 IMPLEMENTATION PLAN
## Secure App Mode, Real Business Workflows & Web–Flutter Integration

### 1. Executive Summary
Phase 12 transforms `/app` from an initial prototype interface into an authentic digital campus client connected directly to EHRJ ERP's authoritative database and services.

Key Objectives:
1. **Critical Role-Switching Security Remediation:** Disable passwordless persona switching in production and non-isolated environments; enforce strict server-side RBAC and audit logging.
2. **Authentic Business Workflows:** Replace mock responses in quick actions with genuine Prisma database operations (student search, examination marks, fee collections, payment intents, admission applications, attendance transactions).
3. **Financial Ledger Integrity:** Distinguish spot fee collections (admin/accountant) from online payment submissions (guardians/public). Enforce duplicate transaction ID (TrxID) rejection at HTTP 409 and eliminate fake auto-generated receipt numbers.
4. **Attendance & Offline Resilience:** Connect attendance submissions to `saveAttendanceSheetTransaction` with LocalStorage offline draft queues and sync mechanisms.
5. **Web–Flutter Parity & Verification:** Verify shared database visibility, execute automated regression test suites, verify TypeScript cleanliness, and run Flutter test suites.

---

### 2. Implementation Architecture

```
User / Browser Client (/app)
  │
  ├── 1. Auth & Persona Switch
  │      └── /api/app/quick-persona-switch
  │           ├── Guard: NODE_ENV !== "production" && ALLOW_DEV_PERSONA_SWITCH === "true"
  │           ├── Unauthorized elevation -> 403 Forbidden + Audit Log
  │           └── Logout/Public -> Deletes ehrj_session_token cookie
  │
  ├── 2. Quick Actions
  │      └── /api/app/quick-action
  │           ├── SEARCH_RESULT:
  │           │    ├── Prisma Student -> Active Enrollment -> Top Exam Result
  │           │    ├── Prisma ExamMark (real subjects & marks)
  │           │    └── Official Verification QR (/verify?type=student)
  │           │
  │           ├── GENERATE_FEE_RECEIPT:
  │           │    ├── Admin/Accountant:
  │           │    │    ├── Concurrency-safe Invoice & Receipt Numbers
  │           │    │    ├── Duplicate TrxID Check -> 409 Conflict
  │           │    │    └── Atomic Prisma Transaction (FeeInvoice + PaymentReceipt + AuditLog)
  │           │    └── Guardian/Public:
  │           │         ├── Duplicate TrxID Check -> 409 Conflict
  │           │         └── Real PaymentIntent (status: PENDING_VERIFICATION)
  │           │
  │           ├── SUBMIT_ADMISSION_QUICK:
  │           │    ├── Concurrency-safe generateApplicationNumber()
  │           │    ├── Prisma Application record creation (status: PENDING)
  │           │    └── Trackable via /admission/track?code=EHRJ-ADM-...
  │           │
  │           └── SAVE_ATTENDANCE:
  │                ├── Session verification (Admin/Principal/Teacher)
  │                ├── saveAttendanceSheetTransaction (Prisma transaction)
  │                └── Offline fallback to LocalStorage draft queue
  │
  └── 3. Master Database Invariants
       ├── Port 3000 SQLite: 185 students, 385 invoices (৳424,095 net, ৳141,200 paid)
       └── Port 3001 PostgreSQL: Isolated Staging Environment
```

---

### 3. Phased Task Breakdown

| Task # | Task Description | Target File(s) | Status |
|---|---|---|---|
| 12.1 | Lockdown `/api/app/quick-persona-switch` against passwordless role elevation | `src/app/api/app/quick-persona-switch/route.ts` | **COMPLETE** |
| 12.2 | Connect Result Search to genuine `ExamMark` and `Result` database records | `src/app/api/app/quick-action/route.ts` | **COMPLETE** |
| 12.3 | Connect Fee Generation to atomic spot collection or PaymentIntent with TrxID check | `src/app/api/app/quick-action/route.ts` | **COMPLETE** |
| 12.4 | Connect Admission Submission to `prisma.application` with official tracking number | `src/app/api/app/quick-action/route.ts` | **COMPLETE** |
| 12.5 | Connect Attendance Submission to `saveAttendanceSheetTransaction` | `src/app/api/app/quick-action/route.ts` | **COMPLETE** |
| 12.6 | Refactor `/app` UI Header: replace role dropdown with user session pill, dashboard links, and login options | `src/app/app/page.tsx` | **COMPLETE** |
| 12.7 | Add TrxID input, verification notices, and offline draft queue in `/app` | `src/app/app/page.tsx` | **COMPLETE** |
| 12.8 | Write and execute automated security and workflow regression test suite | `scratch/test_phase12_security_workflows.js` | **COMPLETE** |
| 12.9 | Run full TypeScript check (`npx tsc --noEmit`) and Flutter tests (`flutter test`) | `ehrj_flutter_app` | **COMPLETE** |
| 12.10 | Update Master Web-to-App Parity Matrix and Go/No-Go Decision Document | `docs/` | **COMPLETE** |
