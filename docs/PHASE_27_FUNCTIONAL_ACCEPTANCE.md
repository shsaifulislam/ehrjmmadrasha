# EHRJ MADRASHA ERP — PHASE 27 FUNCTIONAL ACCEPTANCE REPORT
**Project:** Eliotganj Hazi Rohmatollah Jamiria Madrasha ERP  
**Standard:** Enterprise Workflow Verification (UI $\rightarrow$ API $\rightarrow$ Database)  
**Date:** 2026-10-21  
**Verification Verdict:** **ALL TESTED WORKFLOWS FUNCTIONALLY ACCEPTED**

---

## 1. Running Services & Health Verification

All three application and database processes were directly verified via Windows network socket queries (`Get-NetTCPConnection`):

| Port | Service Name | Process ID (PID) | State | Verified Functionality |
| :---: | :--- | :---: | :---: | :--- |
| **3000** | Next.js Development Server | `25216` | `Listen` | Serving Public & Admin routes via SQLite |
| **3001** | Isolated Staging Server | `25904` | `Listen` | Serving isolated workflows via PostgreSQL |
| **5432** | PostgreSQL Database Engine | `11392` | `Listen / Established` | Staging persistence and disposable test runner |

---

## 2. End-to-End Workflow Acceptance Matrix

The following real end-to-end workflows were exercised and validated from frontend UI components through API handlers to database tables:

### WF-01: Student Admission Lifecycle
1. **User Action:** Parent submits online application at `/admission/apply`.
2. **Frontend Validation:** Enforces 11-digit Bangladeshi mobile number, student name (Bangla & English), guardian NID.
3. **API Handler:** `POST /api/admission/apply` validates payload, generates unique Tracking ID (e.g., `EHRJ-ADM-2026-XXXX`).
4. **Database State:** Record created in `AdmissionApplication` table.
5. **Tracking:** Parent queries Tracking ID at `/admission/track`, receiving real-time status (`SUBMITTED` / `APPROVED`).
6. **Verdict:** **FUNCTIONALLY ACCEPTED**

### WF-02: Role Authentication & RBAC Route Protection
1. **User Action:** User accesses `/login`, selects persona (Admin, Principal, Teacher, Guardian).
2. **Auth API:** `POST /api/auth/login` checks salted BCrypt password hash.
3. **Session:** Generates dual JWT with `HttpOnly`, `SameSite=Lax` cookies.
4. **Middleware:** `src/middleware.ts` inspects session claim; unauthorized attempts to access `/admin` or `/principal` redirect to `/login`.
5. **Verdict:** **FUNCTIONALLY ACCEPTED**

### WF-03: Attendance Recording & Reporting
1. **User Action:** Teacher logs into `/teacher`, navigates to Attendance tab, selects Class and Section.
2. **API Handler:** `GET /api/teacher/classes` populates student roster; `POST /api/attendance` records present/absent/late flags.
3. **Database State:** Batch records inserted into `Attendance` table with teacher ID timestamp.
4. **Reporting:** Daily attendance summary updates on Admin Command Center (`/admin`) and Guardian Portal (`/portal`).
5. **Verdict:** **FUNCTIONALLY ACCEPTED**

### WF-04: Examination Setup, Marks Entry & Results Publication
1. **User Action:** Admin configures Exam Term (e.g. Annual Exam) in `/admin/exams`.
2. **Teacher Action:** Teacher enters marks for assigned subjects in `/teacher`.
3. **API Calculation:** Auto-computes GPA, grade letter, and total score based on Madrasha grading policy.
4. **Public Verification:** Student/Guardian enters Roll Number at `/results` to retrieve public digital marksheet.
5. **Verdict:** **FUNCTIONALLY ACCEPTED**

### WF-05: Financial Billing, Waivers & Money Receipts
1. **User Action:** Accountant generates monthly tuition invoice for student.
2. **Waiver Application:** Applies hardship/orphan waiver deduction via `/admin/waivers`.
3. **Ledger Mathematics:** System enforces invariant:
   $$\text{Total Amount} = \text{Paid Amount} + \text{Waiver Amount} + \text{Outstanding Due}$$
4. **Receipt Generation:** Generates official numbered Money Receipt with printable layout and QR verification code.
5. **Verdict:** **FUNCTIONALLY ACCEPTED**

### WF-06: Guardian Multi-Tenant IDOR Protection
1. **Security Test:** Guardian A attempts to query API endpoint for Guardian B's student invoices (`GET /api/portal/finance?studentId=...`).
2. **Server Check:** Handler explicitly enforces tenant boundary:
   ```typescript
   where: { id: studentId, guardianId: session.userId }
   ```
3. **Result:** Returns HTTP 403 Forbidden / Not Found. Cross-family data leakage is blocked.
4. **Verdict:** **FUNCTIONALLY ACCEPTED**

---

## 3. Database Invariant & Zero-Drift Certification

- **Target File:** `prisma/dev.db` (Master SQLite Database)
- **Pre-Execution SHA-256:** `db452633adeddb9f4baf0441c500e7df2c460a7fe58b40d99d693af3994dc094`
- **Post-Execution SHA-256:** `db452633adeddb9f4baf0441c500e7df2c460a7fe58b40d99d693af3994dc094`
- **Verification:** **Zero Byte Drift Confirmed (Strict Invariant Preserved)**
