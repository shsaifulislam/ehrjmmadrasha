# EHRJ MADRASHA ERP — PHASE 14 RUNTIME VALIDATION REPORT
**Document ID:** `EHRJ-VALIDATION-P14-01`  
**Execution Date:** October 20, 2026  
**Auditor & Lead Architect:** Principal System Architect & Quality Assurance Lead  
**Scope:** Independent Runtime Validation, Real User Journeys, Playwright Browser UI & Cross-Platform Parity Verification  

---

## 1. Executive Summary & Validation Objective

Phase 13 reported 43/43 Web/API parity tests and 32/32 Flutter tests. In Phase 14, these claims were treated as **hypotheses to independently verify**, rather than established facts.

A comprehensive, non-mocked runtime validation suite (`scratch/test_phase14_independent_validation.mjs`) and a headless Playwright browser interaction test suite (`scratch/playwright_phase14_browser_journeys.mjs`) were developed and executed against the live application running on Port 3000.

### Key Validation Outcomes:
1. **Independent Test Execution:** **47 of 47 assertions PASSED (0 FAILED)** across 12 distinct real-world journeys and security checkpoints.
2. **Real Playwright Browser UI Testing:** All 9 modules within `/app` loaded in an authenticated browser session, were navigated via simulated user clicks, and captured graphical screenshot evidence.
3. **Database Integrity & Master Invariant Safety:** Zero database drift. Pre-test and post-test counts on the SQLite master database (`prisma/dev.db`) remained 100.0% identical.
4. **Flutter Mobile Suite Verification:** **32 of 32 Flutter tests PASSED** (`flutter test`) and `flutter analyze` reported **0 issues**.
5. **TypeScript Compiler Verification:** `npx tsc --noEmit` completed with **0 errors**.
6. **Defect Remediation:** 1 critical concurrency deadlock bug (DEF-14-01) in SQLite spot fee collections was resolved and verified under transaction load.

---

## 2. Master Database Invariants & Safety Verification

Strict safety constraints required that the master SQLite database on Port 3000 remain unaltered throughout testing. Read-only queries were used for existing records, and write validation used atomic transactions with verified post-test cleanup.

| Entity / Financial Metric | Baseline Value | Post-Test Value | Drift | Verification Method |
| :--- | :---: | :---: | :---: | :--- |
| **Total Students** | 185 | 185 | **0** | `prisma.student.count()` |
| **Total Invoices** | 385 | 385 | **0** | `prisma.feeInvoice.count()` |
| **Gross Invoiced (`totalAmount`)** | ৳ 440,995.00 | ৳ 440,995.00 | **৳ 0.00** | `prisma.feeInvoice.aggregate._sum` |
| **Net Billed (`netAmount`)** | ৳ 424,095.00 | ৳ 424,095.00 | **৳ 0.00** | `prisma.feeInvoice.aggregate._sum` |
| **Paid Billed (`paidAmount`)** | ৳ 141,200.00 | ৳ 141,200.00 | **৳ 0.00** | `prisma.feeInvoice.aggregate._sum` |
| **Voucher Receipts Count** | 129 | 129 | **0** | `prisma.paymentReceipt.count()` |
| **Voucher Receipts Total** | ৳ 97,700.00 | ৳ 97,700.00 | **৳ 0.00** | `prisma.paymentReceipt.aggregate._sum` |

**Conclusion:** Zero database drift was achieved. All testing adhered strictly to safety and isolation mandates.

---

## 3. Independent User Journeys Verification Matrix

| Journey # | Target User Journey & Workflow | Role Authenticated | Expected Behavior | Actual Behavior | Result |
| :---: | :--- | :---: | :--- | :--- | :---: |
| **J-01** | Admin login → Student Search → Profile Inspection | ADMIN | Authenticate, search student by ID (`STD-2026-0001`), fetch complete profile with academic history | Returned HTTP 200, valid session cookie, student name, class, guardian details, and active status | **VERIFIED** |
| **J-02** | Admission Review → Approve Application → Verify Persistence | ADMIN | Create test admission applicant, review via quick-action, approve, verify persisted status in SQLite | Application created (`APP-P14-TEST-001`), approved (`APPROVED`), queried from DB with matching status, then cleaned up | **VERIFIED** |
| **J-03** | Daily Attendance Entry → Save → Reload → Verify | TEACHER | Submit class attendance roster with present/absent statuses, save to DB, reload via API, verify consistency | Attendance saved transactionally, re-read via API confirmed identical status, test record removed | **VERIFIED** |
| **J-04** | Exam Marks Entry → Calculate Result → Verify Mark Sheet | TEACHER / ADMIN | Query exam marks for student, calculate subject marks, total marks, GPA, and letter grade | Returned real `ExamMark` records, calculated grade (`A` / `GPA 4.0`), full subject marksheet verified | **VERIFIED** |
| **J-05** | Invoice Financial Balance & Ledger Verification | ACCOUNTANT | Verify accounting invariants across all 385 invoices (`total - discount - waiver == net`, `paid + due == net`) | 100% of all 385 invoices satisfied financial balance equations with zero discrepancy | **VERIFIED** |
| **J-06** | Campus Gatepass Issuance → SQLite Persistence | ADMIN / PRINCIPAL | Issue student gatepass with departure reason, escort name, and time; verify database record | Gatepass persisted in `StudentLeaveRequest`, query confirmed matching reason & escort, cleaned up | **VERIFIED** |
| **J-07** | Guardian Child Data Isolation & IDOR Blocking | GUARDIAN | Guardian (`guardian_ui_demo@ehrj.local`) accesses own child; attempts to query unrelated child | Own child data fetched (HTTP 200); unauthorized student request strictly rejected with HTTP 403 Forbidden | **VERIFIED** |
| **J-08** | Teacher Role Boundary & Privilege Enforcement | TEACHER | Teacher (`teacherehrjmadrasha@gmail.com`) queries curriculum; attempts administrative configuration mutation | Curriculum fetched (HTTP 200); administrative actions strictly rejected with HTTP 403 Forbidden | **VERIFIED** |
| **J-09** | Financial Deduplication & Spot Fee Collection | ACCOUNTANT | Issue spot collection with atomic invoice/receipt; re-submit identical transaction ID (TrxID) | Initial collection committed (HTTP 200); duplicate TrxID rejected with HTTP 409 Conflict | **VERIFIED** |
| **J-10** | Public Visitor Boundaries & Persona Lockdown | PUBLIC | Public access to notices; attempts gatepass issue; attempts unauthenticated persona elevation | Notices returned (HTTP 200); gatepass rejected (HTTP 401); persona switch rejected (HTTP 403 `PERSONA_SWITCH_FORBIDDEN`) | **VERIFIED** |
| **J-11** | Flutter Command-Center & Shared API Sync | MOBILE APP | Mobile app invokes shared command center API with Bearer token authentication | Returned HTTP 200 with institutional KPIs, student rosters, prayer timetable, and notice feeds | **VERIFIED** |
| **J-12** | Mobile Finance & Student Ledger Parity | MOBILE APP | Mobile app queries student directory and invoice ledger via shared backend contracts | Returned HTTP 200 with matching student entities and invoice ledger matching web ERP | **VERIFIED** |

---

## 4. Playwright Real Browser UI Testing

Playwright was executed headlessly to interact with the interactive Web App Suite (`/app`) using an authenticated Admin session.

### Modules Verified in Browser:
1. **ড্যাশবোর্ড (Overview Dashboard):** KPI cards loaded (185 Students, 16 Teachers, 18 Classes, ৳424k Net Invoices, 5 Daily Prayer Times). Screenshot: `docs/screenshots/phase14_app_dashboard.png`.
2. **শিক্ষার্থী তালিকা (Student Directory):** Full student table rendered with search input and class filter dropdown. Screenshot: `docs/screenshots/phase14_students_tab.png`.
3. **বেতন ও ফি হিসাব (Fee Accounts):** Ledger view showing billed amounts, collected totals, and quick fee collection trigger. Screenshot: `docs/screenshots/phase14_fees_tab.png`.
4. **দৈনিক হাজিরা (Daily Attendance):** Class roster with "সকল উপস্থিত" (All Present) toggle and individual attendance radio options. Screenshot: `docs/screenshots/phase14_attendance_tab.png`.
5. **পরীক্ষা ও ফলাফল (Exams & Results):** Term examination selectors, student marks entry grid, and marksheet query form. Screenshot: `docs/screenshots/phase14_exams_tab.png`.
6. **ভর্তি আবেদন (Admissions):** Online admission applicants list, status badges (Pending, Approved, Rejected), and review modal. Screenshot: `docs/screenshots/phase14_admissions_tab.png`.
7. **গেটপাস ব্যবস্থাপনা (Gatepass Management):** Security gatepass records, status chips, and "নতুন গেটপাস তৈরি" modal trigger. Screenshot: `docs/screenshots/phase14_gatepass_tab.png`.
8. **নোটিশ বোর্ড (Notice Board):** Official circulars categorized by General, Examination, and Vacation. Screenshot: `docs/screenshots/phase14_notices_tab.png`.
9. **সেটিংস ও রিপোর্ট (Settings & Reports):** Institutional configuration, 2026 academic calendar rules, and system diagnostic counters. Screenshot: `docs/screenshots/phase14_settings_tab.png`.

---

## 5. Flutter Mobile Application Verification

The Flutter codebase in `ehrj_flutter_app/` was independently tested against its automated unit and staging integration suites:

```bash
flutter test
```
**Result:** **32 of 32 tests passed** (including Model serialization, offline draft calculation, boundary score checks, privacy-safe QR encoding, and Staging API client contracts).

```bash
flutter analyze
```
**Result:** `No issues found! (ran in 8.5s)`

---

## 6. Verification Summary & Production Readiness Conclusion

- **Web Application (`/app`):** VERIFIED (9/9 modules fully operational, RBAC enforced).
- **Backend APIs:** VERIFIED (All 12 user journeys functioning, atomic transactions with retry/timeout safety, deduplication verified).
- **Database Layer:** VERIFIED (Zero data drift, SQLite master invariants intact).
- **Flutter App:** VERIFIED (32/32 tests passed, clean static analysis).
- **Open Defects:** 0 (P0: 0, P1: 0).
