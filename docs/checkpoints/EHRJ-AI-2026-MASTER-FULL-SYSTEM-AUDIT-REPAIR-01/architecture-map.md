# EHRJ Digital Campus & ERP — Authoritative Architecture Map

> **System:** Eliotgonj Hazi Rohmatollah Jamiria Madrasha Web Application & Enterprise ERP  
> **Checkpoint:** `EHRJ-AI-2026-MASTER-FULL-SYSTEM-AUDIT-REPAIR-01`  
> **Date:** October 5, 2026  
> **Status:** AUTHORITATIVE DIGITAL TWIN

---

## 1. High-Level Architectural Monolith

The EHRJ platform is architected as an enterprise Next.js 14.2 (App Router) monolith with TypeScript, Tailwind CSS, Prisma ORM, and SQLite configured with Write-Ahead Logging (`WAL` mode).

```
                      [ CLIENT TIERS ]
  Public Visitors │ Guardians │ Faculty Teachers │ Principal │ Admin
         │             │              │               │          │
         ▼             ▼              ▼               ▼          ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │                    Next.js Edge Middleware                      │
 │    - Path Routing Guard (/admin, /portal, /teacher, /principal)  │
 │    - Security Response Headers (HSTS, CSP, nosniff, SAMEORIGIN) │
 │    - Legacy Redirects (/guardian -> /portal [308])               │
 └──────────────────────────────────┬───────────────────────────────┘
                                    │
                                    ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │                  Next.js App Router Monolith                     │
 │  ┌──────────────────────┐              ┌──────────────────────┐  │
 │  │    UI Pages (177)    │ ───────────► │  API Handlers (475)  │  │
 │  │ (/admin, /portal,    │  HTTP / JSON │ (/api/admin/**,      │  │
 │  │  /teacher, /verify)  │              │  /api/portal/**)     │  │
 │  └──────────────────────┘              └──────────┬───────────┘  │
 │                                                   │              │
 │  ┌────────────────────────────────────────────────▼───────────┐  │
 │  │              Service Layer & Domain Engines (207)          │  │
 │  │  - Auth & Security Engine (bcrypt, jose, session guard)    │  │
 │  │  - 5-Fund Financial Ledger (General, Lillah, Zakat, etc.)  │  │
 │  │  - Admission & Student Lifecycle Engine                    │  │
 │  │  - Qawmi Academic Assessment & Results Engine              │  │
 │  │  - Operations, Backup, DR Drill & Incident Engine          │  │
 │  └───────────────────────────────┬────────────────────────────┘  │
 └──────────────────────────────────┼───────────────────────────────┘
                                    │
                                    ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │                       Storage Systems                            │
 │  ┌─────────────────────────────────┐   ┌──────────────────────┐  │
 │  │   Prisma ORM & SQLite (dev.db)   │   │ Subsystem JSON Store │  │
 │  │    - 120 Relational Models      │   │ - data/security/     │  │
 │  │    - WAL Mode + PRAGMA FK Enforce│   │ - data/governance/   │  │
 │  │    - 1,986+ Immutable Audit Logs│   │ - data/budgets/      │  │
 │  └─────────────────────────────────┘   └──────────────────────┘  │
 └──────────────────────────────────────────────────────────────────┘
```

---

## 2. System of Record & Ownership Map

Every major domain within the EHRJ institutional lifecycle has a singular authoritative implementation.

| Institutional Domain | Authoritative DB Model / Store | Authoritative Service / Engine | Authoritative API Endpoint | Authoritative UI Route | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication & Identity** | `User`, `Session`, `LoginHistory`, `data/security/revoked_tokens.json` | `src/lib/auth.ts`, `src/lib/securityEngine.ts` | `/api/auth/login`, `/api/auth/logout`, `/api/auth/session` | `/login`, `/login/admin`, `/login/guardian` | `AUTHORITATIVE` |
| **Student Master Roster** | `Student`, `Guardian`, `Enrollment` | `src/lib/studentId.ts`, `src/lib/admissionApproval.ts` | `/api/admin/students`, `/api/portal/children` | `/admin/students`, `/portal` | `AUTHORITATIVE` |
| **Admissions Intake & Review** | `Application`, `StudentDocument` | `src/lib/admissionId.ts`, `src/lib/duplicateDetection.ts` | `/api/admission`, `/api/admissions/apply`, `/api/admin/admissions/**` | `/admission`, `/admission/apply`, `/admin/admissions` | `AUTHORITATIVE` |
| **Academic Hierarchy & Roll** | `AcademicSession`, `JamatClass`, `Section`, `Subject` | `src/lib/studentId.ts:getNextRollNumber` | `/api/admin/academic/sessions`, `/api/admin/academic/classes` | `/admin/academic` | `AUTHORITATIVE` |
| **Attendance Operations** | `Attendance`, `AttendanceLock` | `src/lib/attendanceService.ts`, `src/lib/attendanceCalculations.ts` | `/api/admin/attendance`, `/api/teacher/attendance` | `/admin/attendance`, `/teacher/attendance` | `AUTHORITATIVE` |
| **Exams, Marks & Qawmi Grading**| `Exam`, `ExamSubject`, `ExamMark`, `Result` | `src/lib/resultCalculationService.ts` | `/api/admin/exams`, `/api/admin/results`, `/api/teacher/results` | `/admin/exams`, `/admin/results`, `/teacher/results`, `/results` | `AUTHORITATIVE` |
| **5-Fund Financial Ledger** | `FeeInvoice`, `PaymentReceipt`, `CashFund`, `CashTransaction`, `Refund` | `src/lib/feeCalculationService.ts`, `src/lib/paymentHardening.ts` | `/api/admin/finance/**`, `/api/portal/finance/pay` | `/admin/finance`, `/portal/finance` | `AUTHORITATIVE` |
| **Document Factory & Public QR** | `Certificate`, `DocumentRequest`, `DocumentTemplate` | `src/lib/documentFactory.ts`, `src/lib/certificateService.ts` | `/api/admin/documents`, `/api/verify/document/[token]` | `/admin/documents`, `/verify` | `AUTHORITATIVE` |
| **Public Notices & Communications**| `Notice`, `Notification`, `NotificationOutbox` | `src/lib/notifications.ts`, `src/lib/noticeService.ts` | `/api/notices`, `/api/admin/communication/**` | `/notices`, `/admin/communications` | `AUTHORITATIVE` |
| **Hostel Accommodation** | `ResidentialEnrollment`, `ResidentialHistory` | `src/lib/hostelEngine.ts` | `/api/admin/hostel/**` | `/admin/hostel`, `/portal/hostel` | `AUTHORITATIVE` |
| **Transport Logistics** | `TransportRoute`, `TransportVehicle`, `TransportEnrollment` | `src/lib/transportEngine.ts` | `/api/admin/transport/**` | `/admin/transport`, `/portal/transport` | `AUTHORITATIVE` |
| **Library Management** | `LibraryBook`, `LibraryBookCopy`, `LibraryIssue` | `src/lib/libraryEngine.ts` | `/api/admin/library/**` | `/admin/library`, `/portal/library` | `AUTHORITATIVE` |
| **HR & Faculty Payroll** | `Employee`, `PayrollRecord`, `EmployeeLeaveRequest` | `src/lib/hrEngine.ts` | `/api/admin/hr/**` | `/admin/hr` | `AUTHORITATIVE` |
| **Operations, Backups & Health** | `SystemBackup`, `RestoreOperation`, `AuditLog` | `src/lib/operationsEngine.ts`, `src/lib/security.ts` | `/api/admin/operations/backups`, `/api/admin/operations/health`, `/api/health` | `/admin/operations` | `AUTHORITATIVE` |

---

## 3. Approved Role Boundaries & Persona Scopes

The EHRJ system enforces strict, server-side zero-trust scoping for each persona:

```
[ADMIN] ─────► Complete institutional ERP authority, ledger oversight, user provisioning, database backups.
[PRINCIPAL] ─► Executive oversight, admission approval, result sign-off, high-value refund dual-authorization (>৳5,000).
[TEACHER] ───► Scoped strictly to assigned jamat classes/sections for attendance marking and mark entry.
[GUARDIAN] ──► Strictly isolated to linked biological/ward children. Cross-student access (IDOR) yields HTTP 403.
[PUBLIC] ────► Anonymous read access to public notices, prospectus, public verification lookups, and admission intake.
```
