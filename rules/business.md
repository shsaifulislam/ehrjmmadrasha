# EHRJ Digital Campus & ERP — Comprehensive Business Rules Specification

> **System:** Eliotgonj Hazi Rohmatollah Jamiria Madrasha Web Application & Enterprise ERP  
> **Status:** Authoritative Evidence-Based Extraction  
> **Target Scope:** Core Academic, Financial, Admission, HR, Operations, and Governance Domains  
> **Legend:**  
> - `[IMPLEMENTED]` — Directly verified in active code with line-level evidence.  
> - `[INFERRED]` — Derived from database schema relationships and architectural patterns.  
> - `[MISSING]` — Required by standard institutional logic but omitted in code.  
> - `[UNKNOWN]` — Insufficient implementation details to confirm enforcement.

---

## 1. Admissions & Student Onboarding Rules

### BR-ADM-001: 17-Digit National Birth Certificate Validation
- **Status:** `[IMPLEMENTED]`
- **Domain:** Student Admissions
- **Implementation Evidence:** [`src/lib/duplicateDetection.ts:45`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/duplicateDetection.ts) & [`src/app/api/admission/route.ts:58`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/app/api/admission/route.ts)
- **Rule Specification:** Every student applying for admission must supply a valid 17-digit Bangladesh National Birth Registration Number (`birthCertificateNo`). It must be strictly numeric and unique across all active students and pending applications.
- **Enforcement Mechanics:** Pre-submission query checks both `prisma.student.findUnique({ where: { birthCertificateNo } })` and `prisma.application.findFirst({ where: { birthCertificateNo, status: { notIn: ["REJECTED"] } } })`.
- **Failure Behavior:** Returns HTTP 400 Bad Request if format is invalid; HTTP 409 Conflict if duplicate is detected.

### BR-ADM-002: Server-Side Application Tracking Number Issuance
- **Status:** `[IMPLEMENTED]`
- **Domain:** Student Admissions
- **Implementation Evidence:** [`src/lib/admissionId.ts:13-45`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/admissionId.ts)
- **Rule Specification:** When an online application is submitted, the server must automatically assign a permanent, immutable tracking code in the format: `EHRJ-ADM-YYYY-XXXX` (e.g. `EHRJ-ADM-2026-0001`).
- **Enforcement Mechanics:** Formed by taking target academic year prefix `EHRJ-ADM-{year}-`, evaluating current sequential count and max existing suffix via Prisma, and zero-padding to 4 digits.
- **Immutability:** Once generated, the application number cannot be altered, edited, or reused.

### BR-ADM-003: Concurrency-Safe Atomic Admission Approval Workflow
- **Status:** `[IMPLEMENTED]`
- **Domain:** Student Admissions / Academic Registry
- **Implementation Evidence:** [`src/lib/admissionApproval.ts:38-315`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/admissionApproval.ts)
- **Rule Specification:** Approval of an application must be entirely transactional. If already approved, rejection is mandatory (preventing double student accounts). Approval must simultaneously:
  1. Transition application status to `APPROVED`.
  2. Generate a permanent Student ID Number (`EHRJ-YYYY-XXXX`).
  3. Create or link the Guardian entity and User account.
  4. Create the formal `Student` record.
  5. Create the `Enrollment` record with class roll number.
  6. Generate the initial Admission Fee Invoice.
  7. Log an immutable audit record.
- **Failure Behavior:** If any single operation fails, the entire transaction rolls back via `prisma.$transaction`.

### BR-ADM-004: 100% Fee Waiver for Orphan Students (Yateem)
- **Status:** `[IMPLEMENTED]`
- **Domain:** Admissions / Student Welfare
- **Implementation Evidence:** [`src/lib/admissionApproval.ts:240-275`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/admissionApproval.ts)
- **Rule Specification:** If an applicant is designated as an orphan (`isOrphan: true`), the system must grant an automatic 100% waiver on initial admission fees and map the transaction to the Lillah/Zakat assistance fund.
- **Enforcement Mechanics:** Evaluated during `approveAdmissionTransaction`. Net payable invoice is generated as `0.00 BDT` with `waiverReason: "এতিম ও দুঃস্থ শিক্ষার্থী কল্যাণ তহবিল থেকে ১০০% মওকুফ"`.

---

## 2. Academic Structure, Roll & Grading Rules

### BR-ACAD-001: Permanent Student ID Immutability
- **Status:** `[IMPLEMENTED]`
- **Domain:** Academic Registry
- **Implementation Evidence:** [`src/lib/studentId.ts:12-45`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/studentId.ts)
- **Rule Specification:** Student ID numbers follow the institutional standard `EHRJ-YYYY-XXXX` (e.g. `EHRJ-2026-0042`). The ID is assigned once for life and remains constant even when the student transitions classes, repeats an academic year, or graduates.
- **Enforcement Mechanics:** Generated once upon initial admission approval. The `studentIdNumber` column has a database-level `@unique` constraint in `prisma/schema.prisma`.

### BR-ACAD-002: Dynamic Class Roll Assignment
- **Status:** `[IMPLEMENTED]`
- **Domain:** Academic Registry
- **Implementation Evidence:** [`src/lib/studentId.ts:50-70`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/studentId.ts)
- **Rule Specification:** Unlike the permanent Student ID, the class roll number is scoped strictly to a specific combination of `(AcademicSession, JamatClass, Section)`.
- **Enforcement Mechanics:** `getNextRollNumber` queries existing enrollments in the specific session and class and returns `max(roll) + 1`.

### BR-ACAD-003: Canonical Qawmi Grading Hierarchy
- **Status:** `[IMPLEMENTED]`
- **Domain:** Examinations & Academic Assessment
- **Implementation Evidence:** [`src/lib/resultCalculationService.ts:12-18, 52-63`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/resultCalculationService.ts)
- **Rule Specification:** Examination results must be evaluated according to traditional Qawmi Madrasha grading thresholds:
  - **>= 80%:** মুমতাজ (ممتاز / Mumtaz) — Letter Grade: `A+` — Passed
  - **>= 70%:** জায়্যিদ জিদ্দান (جيد جدا / Jayyid Jiddan) — Letter Grade: `A` — Passed
  - **>= 60%:** জায়্যিদ (جيد / Jayyid) — Letter Grade: `B` — Passed
  - **>= 50%:** মাকবুল (مقبول / Maqbool) — Letter Grade: `C` — Passed
  - **< 50%:** রাসিব (راسب / Rasib) — Letter Grade: `F` — Failed (`isPassed: false`)

### BR-ACAD-004: Exam Exemption & Absence Rules
- **Status:** `[IMPLEMENTED]`
- **Domain:** Examinations & Evaluation
- **Implementation Evidence:** [`src/lib/resultCalculationService.ts:115-151`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/resultCalculationService.ts)
- **Rule Specification:**
  - If a student is flagged as **Exempt** (`isExempt: true`), marks are set to `null`, grade is rendered as "অব্যাহতি (مُعفى)" (`EX`), and the student is considered passed without penalty.
  - If a student is flagged as **Absent** (`isAbsent: true`), marks are set to `null`, grade is rendered as "অনুপস্থিত (غائب)" (`ABS`), and the student is failed (`isPassed: false`).

---

## 3. Attendance & Classroom Operations Rules

### BR-ATT-001: Date Normalization to UTC Midnight
- **Status:** `[IMPLEMENTED]`
- **Domain:** Attendance
- **Implementation Evidence:** [`src/lib/attendanceCalculations.ts:16-35`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/attendanceCalculations.ts)
- **Rule Specification:** All attendance records must be normalized to UTC midnight (`00:00:00.000Z`) for the institutional calendar day. This eliminates off-by-one errors and multi-timezone recording discrepancies.

### BR-ATT-002: Teacher Assignment Scoping Guard
- **Status:** `[IMPLEMENTED]`
- **Domain:** Attendance & Faculty Permissions
- **Implementation Evidence:** [`src/lib/attendanceService.ts:26-42`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/attendanceService.ts)
- **Rule Specification:** A faculty member holding the `TEACHER` role is only permitted to record or update attendance for classes and sections explicitly assigned to them in `TeacherAssignment`. Admin and Principal roles bypass this restriction.

### BR-ATT-003: 24-Hour Correction Window for Teachers
- **Status:** `[IMPLEMENTED]`
- **Domain:** Attendance Record Integrity
- **Implementation Evidence:** [`src/lib/attendanceCalculations.ts:10`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/attendanceCalculations.ts) & [`src/lib/attendanceService.ts:75, 140`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/attendanceService.ts)
- **Rule Specification:** Teachers may modify or correct an attendance sheet within 24 hours of the recorded date (`DEFAULT_CORRECTION_WINDOW_HOURS = 24`). After 24 hours, the sheet is locked to teacher mutations and requires administrative correction with an explicit justification.

### BR-ATT-004: Minimum 75% Attendance Requirement for Exams
- **Status:** `[INFERRED]`
- **Domain:** Examination Eligibility
- **Implementation Evidence:** [`src/lib/attendanceCalculations.ts:55-75`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/attendanceCalculations.ts)
- **Rule Specification:** Institutional academic policy dictates that students must maintain a minimum of 75% attendance during the academic term to sit for final centralized examinations without special dean/principal approval.

---

## 4. Financial & Fee Calculation Rules

### BR-FIN-001: Day Care Food Fee Exemption (Critical Invariant)
- **Status:** `[IMPLEMENTED]`
- **Domain:** Student Billing
- **Implementation Evidence:** [`src/lib/feeCalculationService.ts:71-90`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/feeCalculationService.ts)
- **Rule Specification:** Students whose residential status is `DAY_CARE` must NEVER receive billing for institutional food (`FOOD` fee type).
- **Enforcement Mechanics:** `calculateStudentFee` intercepts `student.residentialStatus === "DAY_CARE" && feeType === "FOOD"` and immediately returns zero net payable with breakdown rule `"DAY_CARE_FOOD_EXEMPTION"`.

### BR-FIN-002: Strict Fee Calculation Precedence Hierarchy
- **Status:** `[IMPLEMENTED]`
- **Domain:** Financial Accounting
- **Implementation Evidence:** [`src/lib/feeCalculationService.ts:32-36, 120-190`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/feeCalculationService.ts)
- **Rule Specification:** Fee invoices must compute payable amounts using a deterministic sequence:
  1. Base Amount (from `FeeStructure` or custom class fee)
  2. Less Scholarship Deductions
  3. Less Financial Assistance Deductions
  4. Less Special Discounts / Waivers
  5. Plus Late Fees (if billing due date has lapsed)
  6. Final Net Payable = `max(0, computedAmount)`
- **Invariant:** Net payable can never be negative.

### BR-FIN-003: Multi-Invoice Payment Allocation Invariant
- **Status:** `[IMPLEMENTED]`
- **Domain:** Payment Processing
- **Implementation Evidence:** [`src/app/api/portal/finance/pay/route.ts:40-95`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/app/api/portal/finance/pay/route.ts)
- **Rule Specification:** When a payment is submitted via mobile banking or bank transfer, the sum of all targeted invoice allocations (`sum(allocation.amount)`) must exactly match the overall deposit amount. Partial allocations are bound transactionally to distinct invoice ledger rows.

---

## 5. Human Resources, Leave & Payroll Rules

### BR-HR-001: Overlapping Leave Request Rejection
- **Status:** `[IMPLEMENTED]`
- **Domain:** HR & Staff Management
- **Implementation Evidence:** [`src/lib/hrEngine.ts:640-665`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/hrEngine.ts)
- **Rule Specification:** An employee cannot submit a leave request that overlaps in date range with an already approved or pending leave application.
- **Enforcement Mechanics:** `submitLeaveRequest` queries `LeaveApplication` where `status in ["PENDING", "APPROVED"]` and verifies that `startDate <= requestedEnd` and `endDate >= requestedStart`.

### BR-HR-002: Leave Balance Quota Verification
- **Status:** `[IMPLEMENTED]`
- **Domain:** HR & Staff Leave
- **Implementation Evidence:** [`src/lib/hrEngine.ts:600-630`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/hrEngine.ts)
- **Rule Specification:** Staff leave applications cannot exceed the allotted annual quota for the specified leave type (Casual, Medical, Earned) unless submitted as unpaid leave.

---

## 6. Inventory, Procurement & Assets Rules

### BR-INV-001: Minimum Reorder Threshold Alerts
- **Status:** `[IMPLEMENTED]`
- **Domain:** Inventory & Stock Control
- **Implementation Evidence:** [`src/lib/inventoryEngine.ts:310-345`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/inventoryEngine.ts)
- **Rule Specification:** When a stock-out transaction reduces an inventory item's total on-hand quantity below its defined `reorderLevel`, the system must trigger an automatic operational stock alert to inventory administrators.

### BR-INV-002: Purchase Order Three-Way Reconciliation
- **Status:** `[IMPLEMENTED]`
- **Domain:** Procurement & Finance
- **Implementation Evidence:** [`src/lib/inventoryEngine.ts:510-580`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/inventoryEngine.ts)
- **Rule Specification:** A Purchase Order cannot be marked as `COMPLETED` until Goods Receipt Notes (GRN) match ordered quantities and vendor invoices match PO unit prices.
