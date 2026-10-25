# EHRJ Digital Campus & ERP — Role-Based Access Control (RBAC) & Permissions

> **System:** Eliotgonj Hazi Rohmatollah Jamiria Madrasha Web Application & Enterprise ERP  
> **Status:** Authoritative Evidence-Based Role & Permission Audit  
> **Scope:** Edge Middleware, In-Handler Security Assertions, and Data-Layer Scoping  
> **Date:** October 2026

---

## 1. System Roles & Hierarchical Principles

The EHRJ platform defines four authoritative user roles in addition to anonymous public actors:

```
                     [ ADMIN ]
                   (Super Admin)
                         │
                         ▼
                   [ PRINCIPAL ]
                (Academic/Executive)
                  /             \
                 ▼               ▼
           [ TEACHER ]      [ GUARDIAN ]
            (Faculty)     (Parent/Student)
                 │               │
                 └───────┬───────┘
                         ▼
                     [ PUBLIC ]
               (Anonymous Visitors)
```

### 1.1 Canonical Role Definitions

| Role Identifier | Primary Audience | Scope of Responsibility | Typical Dashboard Path |
| :--- | :--- | :--- | :--- |
| **`ADMIN`** | Madrasa IT Administrators & Office Head | Complete ERP administrative authority: user provisioning, fee configuration, general ledger, inventory, payroll, security configurations, database backups. | `/admin` |
| **`PRINCIPAL`** | Institutional Principal (Muhtamim) | Executive and academic oversight: admission approvals, exam results publication, budget approvals, staff evaluations, official circulars. | `/principal` / `/admin` |
| **`TEACHER`** | Faculty Members & Qawmi Ustads | Classroom instructional operations: taking attendance, recording test marks, submitting leave requests, viewing class rosters. | `/teacher` |
| **`GUARDIAN`** | Parents & Student Guardians | Self-service parental portal: viewing linked children's attendance, examination report cards, dues status, online fee payment, downloading transcripts. | `/portal` |
| **`PUBLIC`** | General Public & Prospective Students | Public informational website: viewing notices, submitting online admissions applications, verifying certificates and receipts via QR codes. | `/` |

---

## 2. Edge Middleware Routing Boundary Matrix

Enforced via Next.js Middleware in [`src/middleware.ts`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/middleware.ts):

| Path Pattern | Allowed Roles | Enforcement Logic | Failure Action |
| :--- | :--- | :--- | :--- |
| `/admin/:path*`<br>`/api/admin/:path*` | `ADMIN`, `PRINCIPAL` | JWT role inspection. *(Exception: TEACHER granted GET access to selected academic routes)* | API: 403 Forbidden<br>Web: Redirect to `/login?tab=institutional` |
| `/teacher/:path*`<br>`/api/teacher/:path*` | `TEACHER`, `ADMIN`, `PRINCIPAL` | JWT role inspection. Admins and Principal inherit teacher panel privileges. | API: 403 Forbidden<br>Web: Redirect to `/login?tab=institutional` |
| `/principal/:path*`<br>`/api/principal/:path*` | `PRINCIPAL`, `ADMIN` | JWT role inspection. | API: 403 Forbidden<br>Web: Redirect to `/login?tab=institutional` |
| `/portal/:path*`<br>`/api/portal/:path*` | `GUARDIAN`, `ADMIN`, `PRINCIPAL` | JWT role inspection. Legacy `/guardian` paths permanently 308 redirected to `/portal`. | API: 403 Forbidden<br>Web: Redirect to `/login?tab=guardian` |
| `/api/auth/:path*` | `PUBLIC` | Publicly accessible at boundary; handlers verify token when appropriate. | N/A |
| `/api/verify/:path*` | `PUBLIC` | Public cryptographic lookup; zero authentication required. | N/A |
| `/api/admission` | `PUBLIC` | Public online application intake. | N/A |

---

## 3. Module-by-Module Permission Matrix

Legend:
- **C:** Create / Submit
- **R:** Read / View
- **U:** Update / Edit
- **D:** Delete / Purge
- **A:** Approve / Authorize
- **X:** Export / Download Reports

| Functional ERP Domain | ADMIN | PRINCIPAL | TEACHER | GUARDIAN | PUBLIC | Implementation Evidence |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Public Website & Notices** | CRUD | CRUD | R | R | R | `src/app/api/notices/route.ts` |
| **Online Admission Intake** | CRUD-AX | CRUD-AX | R | R (Own) | C (Apply) | `src/app/api/admin/admissions/route.ts` |
| **Academic Classes & Sessions**| CRUD-AX | CRUD-AX | R (Assigned) | R (Child) | R (Public) | `src/app/api/admin/academic/classes/route.ts` |
| **Student Roster & Profiles** | CRUD-AX | CRUD-AX | R (Assigned) | R (Own Child)| - | `src/app/api/admin/students/route.ts` |
| **Attendance Operations** | CRUD-AX | CRUD-AX | CRU (Assigned)| R (Own Child)| - | `src/lib/attendanceService.ts` |
| **Exam Schedules & Setup** | CRUD-AX | CRUD-AX | R | R | R (Public) | `src/app/api/admin/exams/route.ts` |
| **Mark Entry & Assessment** | CRUD-AX | CRUD-AX | CRU (Assigned)| - | - | `src/lib/resultCalculationService.ts` |
| **Centralized Result Publish**| CRUD-AX | CRUD-AX | R | R (Own Child)| - | `src/app/api/admin/results/route.ts` |
| **Document/Receipt Verify** | CRUD-AX | CRUD-AX | R | R | R (Masked) | `src/app/api/verify/document/route.ts` |
| **Fee Structuring & Invoicing**| CRUD-AX | CRUD-AX | - | R (Own Child)| - | `src/lib/feeCalculationService.ts` |
| **Payment Collection / MFS** | CRUD-AX | CRUD-AX | - | C (Pay Own) | - | `src/app/api/portal/finance/pay/route.ts` |
| **Financial Ledger & Books** | CRUD-AX | CRUD-AX | - | - | - | `src/app/api/admin/finance/route.ts` |
| **Staff & Payroll Management** | CRUD-AX | CRUD-AX | R (Own Pay) | - | - | `src/lib/hrEngine.ts` |
| **Faculty Leave Management** | CRUD-AX | CRUD-AX | CR (Submit) | - | - | `src/lib/hrEngine.ts:submitLeaveRequest` |
| **Inventory & Procurement** | CRUD-AX | CRUD-AX | - | - | - | `src/lib/inventoryEngine.ts` |
| **Budgets & Cost Centers** | CRUD-AX | CRUD-AX | - | - | - | `src/lib/budget/budgetControlEngine.ts` |
| **Contracts & Legal Review** | CRUD-AX | CRUD-AX | - | - | - | `src/lib/procurement/contractEngine.ts` |
| **Hostel Accommodation** | CRUD-AX | CRUD-AX | - | R (Own Child)| - | `src/lib/hostelEngine.ts` |
| **Transport & Logistics** | CRUD-AX | CRUD-AX | - | R (Own Child)| - | `src/lib/transportEngine.ts` |
| **Library Management** | CRUD-AX | CRUD-AX | R (Borrow) | R (Catalog) | - | `src/lib/libraryEngine.ts` |
| **Governance & Access Audit** | CRUD-AX | CRUD-AX | - | - | - | `src/lib/governanceEngine.ts` |
| **Compliance & Regulations** | CRUD-AX | CRUD-AX | - | - | - | `src/lib/compliance/complianceReviewEngine.ts` |
| **System Security & Accounts** | CRUD-AX | R | - | - | - | `src/lib/securityEngine.ts` |
| **Database Backups & Restore**| CRUD-AX | R | - | - | - | `src/app/api/admin/operations/backup/route.ts` |

---

## 4. Contradictions & Discrepancies Audit

During systematic cross-referencing between edge middleware rules, route handler logic, and business requirements, the following architectural inconsistencies were discovered:

---

### Finding 1: Unscoped Administrative Read Access Granted to Teachers in Middleware
- **Severity:** `HIGH`
- **Domain:** Role Separation & Data Scoping
- **Evidence:** [`src/middleware.ts:70-78`](file:///d:/Eliotgonj Hazi Rohmatollah Jamiria Madrasha Web Aplication/src/middleware.ts#L70-L78)
  ```typescript
  const isTeacherPermittedAdminRead =
    userRole === "TEACHER" &&
    request.method === "GET" &&
    (pathname.startsWith("/api/admin/exams") ||
      pathname.startsWith("/api/admin/subjects") ||
      pathname.startsWith("/api/admin/academic/sessions") ||
      pathname.startsWith("/api/admin/academic/classes"));
  ```
- **Expected:** Teachers should query specialized, teacher-scoped endpoints (`/api/teacher/classes`, `/api/teacher/subjects`) that only return their assigned sections.
- **Actual:** The middleware grants teachers global GET access to the full administrative endpoints. While write access is blocked, a teacher can inspect all classes and examination structures institution-wide.
- **Impact:** Minor privilege leak (excessive read access beyond assigned teaching roster).
- **Recommended Action:** Migrate frontend teacher components to use dedicated `/api/teacher/**` endpoints and restrict `/api/admin/**` strictly to `ADMIN` and `PRINCIPAL`.

---

### Finding 2: Missing Dual-Person Authorization on High-Value Financial Refunds
- **Severity:** `MEDIUM`
- **Domain:** Financial Governance
- **Evidence:** [`src/app/api/admin/finance/transactions/route.ts`](file:///d:/Eliotgonj Hazi Rohmatollah Jamiria Madrasha Web Aplication/src/app/api/admin/finance/transactions/route.ts)
- **Expected:** According to institutional financial policy, ledger write-offs or payment refunds exceeding 5,000 BDT require two-person sign-off (initiated by `ADMIN`, approved by `PRINCIPAL`).
- **Actual:** Any single user with the `ADMIN` role can execute transaction refunds directly without secondary principal approval.
- **Impact:** Weakened segregation of duties in financial ledger transactions.
- **Recommended Action:** Implement a pending approval state (`PENDING_APPROVAL`) for financial refunds requiring explicit principal authorization.

---

### Finding 3: Rate Limiting Omission on Public Admissions Intake
- **Severity:** `MEDIUM`
- **Domain:** Public API Security
- **Evidence:** [`src/app/api/admission/route.ts`](file:///d:/Eliotgonj Hazi Rohmatollah Jamiria Madrasha Web Aplication/src/app/api/admission/route.ts)
- **Expected:** Public endpoints accepting entity creation should implement IP-based rate limiting or CAPTCHA verification to prevent automated bot spam.
- **Actual:** While `/api/auth/login` has robust brute-force defense in `securityEngine.ts`, `/api/admission` does not invoke `checkAccountLockout` or IP rate limiting.
- **Impact:** Potential risk of automated spam application flood during peak intake periods.
- **Recommended Action:** Integrate IP-based sliding-window rate limiting on `/api/admission`.
