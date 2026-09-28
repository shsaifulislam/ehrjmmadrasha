# EHRJ MADRASHA DIGITAL CAMPUS & ERP
## PHASE 13 — HR, TEACHER & STAFF MANAGEMENT ENGINE
### MASTER ARCHITECTURE & SPECIFICATION REPORT

Institution:
- Bengali: ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
- English: Eliotganj Hazi Rohmatollah Jamiria Madrasha
- Arabic: الجامعة الإسلامية رحمة الله إليوت غنج
- Established: 2021
- Location: পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা, বাংলাদেশ

Checkpoint: `EHRJ-AI-2026-PHASE13`

---

## 1. Executive Summary & Objective

Phase 13 establishes the central, production-grade **HR, Teacher & Institutional Staff Management Engine** for the Eliotganj Hazi Rohmatollah Jamiria Madrasha ERP platform.

### Core Architectural Decisions:
1. **Strictly Inside Admin Panel (`/admin/hr`):** No separate staff portal, HR role, payroll role, or employee portal was created. The existing role hierarchy (`ADMIN`, `PRINCIPAL`, `TEACHER`, `GUARDIAN`) remains intact.
2. **Decoupled User Identity (`Employee ↔ User`):** An `Employee` record exists independently of login credentials (`Employee.userId` is an optional one-to-one link to `User`). Institutional non-teaching staff (cooks, drivers, security, cleaners) can be recorded and managed without creating unnecessary login accounts.
3. **No Duplicate Engines:**
   - **Academic Teaching:** Uses existing `TeacherAssignment` directly (`teacherId` pointing to `User.id`).
   - **Payroll/Finance:** Relies authoritatively on Phase 6 `PayrollRecord` and the 5 cash funds (`GENERAL`, `LILLAH`, `ZAKAT`, `CONSTRUCTION`, `ORPHAN_SUPPORT`).
   - **Attendance:** Integrated into `EmployeeAttendanceRecord`, keeping employee attendance separated from student attendance while adhering to shared conventions.
   - **Assets & Transport:** Deeply linked to Phase 12 `InventoryAsset` (assigned to employee) and Phase 11 `TransportDriver` (linked via `employeeId`).
4. **Historical Immutability & Offboarding:** Employees are **never** deleted upon exit (`RESIGNED`, `TERMINATED`, `RETIRED`). Every status change, department shift, designation promotion, and salary revision generates an immutable timeline in `EmployeeEmploymentHistory`.

---

## 2. Database Models & Schema Design

The engine utilizes 11 models in `prisma/schema.prisma`:

| Model | Purpose | Key Constraints & Relations |
| :--- | :--- | :--- |
| `Employee` | Central institutional employee record | `employeeId` unique (`EHRJ-EMP-YYYY-XXXX`), `qrToken` unique, linked to `User?`, `EmployeeDepartment?`, `EmployeeDesignation?` |
| `EmployeeDepartment` | Configurable institutional departments | `nameEn` unique, sort order, active status |
| `EmployeeDesignation` | Configurable designations | `nameEn` unique, sort order, active status |
| `EmployeeEmploymentHistory` | Immutable career & status change timeline | `employeeId`, `changeType`, `previousValue`, `newValue`, `effectiveDate`, `recordedByUserId` |
| `EmployeeQualification` | Academic & madrasa qualifications | `employeeId`, `degreeTitle`, `institution`, `passingYear`, `verificationStatus` |
| `EmployeeDocument` | Contracts, letters, NID, certificates | `employeeId`, `documentType`, `verificationToken` unique, `expiryDate` |
| `EmployeeLeaveType` | Configurable leave classifications | `code` unique (`CASUAL`, `SICK`, `EMERGENCY`, `ANNUAL`, `OFFICIAL`, `MATERNITY`, `UNPAID`, `OTHER`) |
| `EmployeeLeaveBalance` | Annual leave quota tracking | Compound unique `[employeeId, leaveTypeId, year]`, tracks `allocatedDays`, `usedDays`, `pendingDays`, `remainingDays` |
| `EmployeeLeaveRequest` | Leave application lifecycle | `requestCode` unique (`EHRJ-LRQ-YYYY-XXXX`), date validation, overlap prevention, status transitions (`SUBMITTED` -> `APPROVED` / `REJECTED`) |
| `EmployeeAttendanceRecord` | Staff daily attendance ledger | Compound unique `[employeeId, date]`, statuses: `PRESENT`, `ABSENT`, `LATE`, `LEAVE`, `HALF_DAY`, `HOLIDAY` |
| `HrSequence` | Concurrency-safe atomic numbering | Compound unique `[prefix, year]` for prefixes `EMP`, `LRQ`, `DOC` |

---

## 3. API Endpoints

All admin endpoints enforce server-side RBAC (`ADMIN` full access, `PRINCIPAL` read-only):

- `GET /api/admin/hr/stats` — Overall counts (Total, Active, Teachers, Staff, On-Leave, Expiring Documents, Pending Leaves, Monthly Payroll).
- `GET /api/admin/hr/departments` & `POST /api/admin/hr/departments` — List and create departments.
- `PUT /api/admin/hr/departments/[id]` — Update department details.
- `GET /api/admin/hr/designations` & `POST /api/admin/hr/designations` — List and create designations.
- `PUT /api/admin/hr/designations/[id]` — Update designation details.
- `GET /api/admin/hr/employees` — Search, filter (by type, dept, designation, status), and pagination.
- `POST /api/admin/hr/employees` — Create employee with atomic ID generation, initial leave quotas, and joining history.
- `GET /api/admin/hr/employees/[id]` — Detailed employee profile with qualifications, documents, assets, attendance, leave, and timeline.
- `GET /api/admin/hr/employees/[id]?card=true` — Generates digital ID card payload with institutional emerald QR code.
- `PUT /api/admin/hr/employees/[id]` — Update employee details with automatic history tracking on salary/designation/dept change.
- `POST /api/admin/hr/employees/[id]/status` — Status lifecycle change (`ACTIVE`, `ON_LEAVE`, `SUSPENDED`, `RESIGNED`, `TERMINATED`, `RETIRED`, `INACTIVE`) with linked user account suspension and asset audit.
- `POST /api/admin/hr/employees/[id]/qualifications` & `DELETE /api/admin/hr/employees/[id]/qualifications` — Manage qualifications.
- `POST /api/admin/hr/employees/[id]/documents` — Upload official employee documents.
- `POST /api/admin/hr/employees/[id]/documents/[docId]/verify` — Verify/reject documents.
- `GET /api/admin/hr/leave/types` — List configured leave types and annual allocations.
- `GET /api/admin/hr/leave/requests` & `POST /api/admin/hr/leave/requests` — Submit leave requests with overlapping date guards.
- `POST /api/admin/hr/leave/requests/[id]/review` — Review leave request (`APPROVED` / `REJECTED`) with automatic balance adjustments.
- `GET /api/admin/hr/attendance` & `POST /api/admin/hr/attendance` — View and record daily attendance entries.
- `GET /api/admin/hr/reports` — Aggregated reports (`EMPLOYEE_REGISTER`, `TEACHER_REGISTER`, `LEAVE_REPORT`, `DOCUMENT_EXPIRY`).
- `GET /api/public/hr/verify/[token]` — Public privacy-safe verification (exposes identity, designation, validity without leaking salaries, NID, or phone).

---

## 4. UI Architecture & Components

- **Admin HR Hub (`src/components/hr/AdminHrHub.tsx`):**
  - Integrated into `/admin` sidebar navigation with custom `Briefcase` icon.
  - Tab views:
    1. *সারসংক্ষেপ ও মেট্রিক্স (Overview & Metrics)* — KPI cards, 30-day document expiry scanner, recent timeline audits.
    2. *কর্মী তালিকা (Employee Directory)* — Real-time search, filters by employee type and status, action buttons for profile and digital ID card.
    3. *নতুন কর্মী ফর্ম (Add Employee)* — Complete registration with departmental assignment and salary configuration.
    4. *ছুটি ব্যবস্থাপনা (Leave Management)* — Workflow desk with quick Approve / Reject actions and balance deduction feedback.
    5. *দৈনিক স্টাফ হাজিরা (Staff Attendance)* — Date-based cockpit for recording Present, Late, Absent, Leave.
    6. *দপ্তর ও পদবি কাঠামো (Departments & Designations)* — Dynamic master configuration without code redeployment.
    7. *এইচআর রিপোর্ট ও অডিট (Reports & Audit)* — Printable official registers and expiry logs.
  - Modals: Full Employee Details & Timeline Modal, Status Transition Modal, Digital ID Card Preview with QR, and Leave Decision Modal.
- **Direct Admin Route (`src/app/admin/hr/page.tsx` & `/admin/hr/employees/[id]/page.tsx`):** Dedicated page routes wrapping `AdminHrHub`.
- **Public Verification Route (`src/app/verify/employee/[token]/page.tsx`):** Public-facing token validation showing institutional authenticity with strict privacy protections.

---

## 5. Security & IDOR Protections

1. **RBAC Isolation:**
   - Teachers and Guardians are strictly rejected (`403 Forbidden`) from all `/api/admin/hr/*` routes.
   - Principals receive executive read-only oversight; mutation operations are restricted to `ADMIN`.
2. **Public Privacy Protection:**
   - Public QR verification exposes only institutional metadata, name, designation, department, and employment status. Sensitive fields (base salary, NID, emergency phone, residential address) are completely redacted.
3. **Data Integrity:**
   - Concurrency-safe sequential codes (`EHRJ-EMP-YYYY-XXXX`, `EHRJ-LRQ-YYYY-XXXX`).
   - Overlapping approved/submitted leave requests for the same employee are blocked at the transaction level.
   - Salary updates preserve historical payroll records without retroactive alterations.
