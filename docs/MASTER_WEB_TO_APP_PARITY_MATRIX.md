# EHRJ MADRASHA ERP — MASTER WEB TO APP PARITY MATRIX
**Document ID:** `EHRJ-PARITY-MATRIX-03`  
**Date:** October 20, 2026  
**Auditor:** Lead System Architect & Full-Stack / Mobile Engineer  
**Reference Baseline:** `docs/MASTER_WEBSITE_FEATURE_INVENTORY.md`  

---

## 1. Parity Evaluation Criteria & Status Keys

- **FULL PARITY (100%):** Feature exists on both Web and Mobile, connects to backend API or safe cache, handles error/loading/empty states, matches visual tokens, and is verified by tests or real hardware.
- **ADAPTED WORKFLOW:** Web-specific layout (e.g., massive 12-column desktop table) adapted into a touch-first mobile pattern (card list with expandable drawer, bottom sheet, or offline draft sheet) preserving complete business fields.
- **MOBILE READ-ONLY BY DESIGN:** Feature is intentionally read-only on mobile (e.g. Guardian viewing child fee ledgers or directory lookups), while lifecycle creation/mutation is restricted to administrative staff on the web ERP.
- **WEB ONLY BY DESIGN:** Administrative or infrastructure capabilities (e.g., bulk CSV import, database migration CLI, backup configuration) that have no architectural place on mobile devices.
- **PARTIAL (50-80%):** Core screen exists, but secondary actions or specialized reports are undergoing progressive enhancement.
- **GAP (0%):** Present on the web ERP, expected on mobile, but completely absent.

---

## 2. Updated Functional Modules Parity Matrix

### Module A: Public Institution & Campus Hub

| Web Feature / Route | Role | Business Rules & Outcomes | Mobile Status | Implementation & Verification Evidence |
| :--- | :--- | :--- | :---: | :--- |
| **Institutional Homepage (`/`)** | PUBLIC | Hero banner, real-time prayer schedule, notice ticker, quick statistics, institutional service links | **FULL PARITY** | `PublicHomeScreen`, `PrayerTimesWidget`, `NoticeTickerWidget`. Verified on Pixel 7 (`docs/screenshots/pixel7_phase10_live.png`). |
| **About Madrasa (`/about`)** | PUBLIC | Founding history, mission, Noorani/Hifz/Kitab departments, Principal's message, managing committee | **FULL PARITY** | `AboutMadrasaScreen`. Full Bengali typography, responsive scroll cards. Verified on Pixel 7 (`docs/screenshots/pixel7_public_campus_real.png`). |
| **Online Admission Form (`/admission/apply`)**| PUBLIC | Multi-step application: Student details, Guardian contact, Department selection, tracking ID generation | **FULL PARITY** | `AdmissionApplyScreen`. Step-by-step wizard, input validation, confirmation card. Dart Unit Test #13. |
| **Application Tracker (`/admission/track`)** | PUBLIC | Instant status query by tracking ID (`EHRJ-ADM-xxxxxx`), review state badge, interview time | **FULL PARITY** | `AdmissionTrackScreen`. Search input, responsive status badges. Verified on Pixel 7 and Browser Playwright. |
| **Public Results Portal (`/results`)** | PUBLIC | Query term-wise results by year, examination, class, and roll; subject-wise marksheet and pass/fail status | **FULL PARITY** | `PublicResultsScreen`. Complete mark breakdown, grading, tamper-evident verification link. Dart Unit Test #3. |
| **Central QR & Document Verification (`/verify`)** | PUBLIC | Multi-type verification portal: Student ID, Gatepass, Money Receipt, and Academic Certificate | **FULL PARITY** | `UniversalVerifyScreen`. 4 distinct document verification types, real-time query. Browser Playwright. |
| **Academic Departments (`/academic`)** | PUBLIC | Noorani & Nazera, Tahfeezul Quran (Hifz), Kitab & Daura-e-Hadith department overviews, syllabus details | **FULL PARITY** | `AcademicDepartmentsScreen`. Full 4 departments, curriculum breakdown, Hadith banner. Pixel 7 verified. |
| **Academic Calendar & Events (`/calendar`)** | PUBLIC | Academic timeline, Ramadan & Eid holidays, term examinations, and countdowns | **FULL PARITY** | `AcademicCalendarScreen`. Month filters, countdown badges, official holiday tagging. Dart Unit Test #23. |
| **Download Center (`/downloads`)** | PUBLIC | Categorized institutional downloads: Admission forms, Syllabus PDFs, Academic routines, Book lists | **FULL PARITY** | `DownloadCenterScreen`. PDF format badges, file sizes, direct download feedback. Dart Unit Test #24. |
| **Campus Photo & Event Gallery (`/gallery`)**| PUBLIC | Filterable photo categories (Campus, Classrooms, Hostel, Events) with tap-to-expand lightbox preview | **FULL PARITY** | `CampusGalleryScreen`. Interactive category chips and high-res lightbox view. Dart Unit Test #25. |
| **Official Donation & Lillah Boarding (`/donate`)** | PUBLIC | Support Lillah boarding, Zakat, Hifz sponsorship; preset amount chips, bKash/Nagad guidelines, TrxID validation | **FULL PARITY** | `PublicDonateScreen`. Dynamic fee chips, instant verified money receipt dialog with QR. Dart Unit Test #21. |
| **Contact Us & Inquiries (`/contact`)** | PUBLIC | Campus address, official helplines (`01845-162664`), office hours, and interactive inquiry form with ticket number | **FULL PARITY** | `ContactUsScreen`. Direct phone clipboard action, inquiry validation, ticket generation. |
| **Notice Board & Reader (`/notices`)** | PUBLIC | Recent circulars, category tags (Exam, Vacation, General), detailed signature dialog view | **FULL PARITY** | `NoticeDetailModal` + category chips in `PublicHomeScreen`. Pixel 7 verified. |

---

### Module B: Student & Guardian Experience (`/portal/*`)

| Web Feature / Route | Role | Business Rules & Outcomes | Mobile Status | Implementation & Verification Evidence |
| :--- | :--- | :--- | :---: | :--- |
| **Multi-Child Switcher** | GUARDIAN | Toggle between siblings for multi-student parents with isolated attendance, fees, and results | **FULL PARITY** | `GuardianDashboardScreen` with horizontal ChoiceChips switcher. Tested in `app_unit_test.dart` (test #19). |
| **Digital Student ID Card** | STUDENT, GUARDIAN | Official photo, student ID, roll, class, blood group, guardian phone, tamper-evident QR | **FULL PARITY** | `StudentDigitalIdCard` widget with tamper-evident verification URL. Tested in `app_unit_test.dart` (test #15). |
| **Student Leave Application** | GUARDIAN | Apply for medical/urgent leave with date range picker, reason, and emergency contact | **FULL PARITY** | `StudentLeaveRequestModal`. Input validation, status tracker. |
| **Fee Invoices & Digital Receipts** | GUARDIAN | Itemized invoice listing, payment history, official verified money receipt with barcode/QR | **MOBILE READ-ONLY BY DESIGN** | `PaymentReceiptCard` widget with tamper-evident verification URL. Tested in `app_unit_test.dart` (test #16). |
| **Class Timetable / Routine** | STUDENT, GUARDIAN | Weekly period timetable with subject, teacher name, and classroom number | **FULL PARITY** | Dedicated Routine tab in student & guardian portals. |
| **Term Examination Results** | STUDENT, GUARDIAN | Complete report card with subject marks, GPA, letter grade, and merit position | **FULL PARITY** | Dedicated Results tab with academic summary cards. |

---

### Module C: Teacher / Faculty Operations (`/teacher/*`)

| Web Feature / Route | Role | Business Rules & Outcomes | Mobile Status | Implementation & Verification Evidence |
| :--- | :--- | :--- | :---: | :--- |
| **Daily Attendance Taking** | TEACHER | Class/Section dropdown, student list, one-tap Present/Absent toggle, "All Present" shortcut, offline draft save | **ADAPTED WORKFLOW** | Offline-first attendance engine with LocalStorage draft cache and background sync. Tested in `app_unit_test.dart` (test #2, #7). |
| **Term Exam Marks Entry** | TEACHER | Subject selector, full marks validation, score entry, pass/fail indicators, offline draft | **ADAPTED WORKFLOW** | Offline draft sheet with auto-sync and boundary score validation. Tested in `app_unit_test.dart` (test #3, #9). |
| **Weekly Teacher Timetable** | TEACHER | Day-by-day periods, assigned subjects, class sections, and room numbers | **FULL PARITY** | Dedicated Teacher Routine tab with active period indicators. |
| **Teacher Leave & Balance** | TEACHER | Check remaining casual/sick leaves and submit leave applications to Principal | **FULL PARITY** | Leave management tab in Teacher dashboard. |

---

### Module D: Principal Oversight & Approvals (`/principal/*`)

| Web Feature / Route | Role | Business Rules & Outcomes | Mobile Status | Implementation & Verification Evidence |
| :--- | :--- | :--- | :---: | :--- |
| **Executive Operations KPI** | PRINCIPAL | Today's campus attendance %, student count, teacher presence, fee collection summary | **FULL PARITY** | Executive dashboard with real-time institutional metrics cards. |
| **Fee Waiver Approvals** | PRINCIPAL | Review guardian financial assistance applications; Approve / Reject with remarks | **FULL PARITY** | Actionable approval cards with confirm dialogs and backend sync. |
| **Teacher & Staff Leave Approvals**| PRINCIPAL | Review pending leave requests from teachers; Approve / Reject with remarks | **FULL PARITY** | Actionable staff leave queue with instant authorization. |
| **Official Notice Authorization**| PRINCIPAL | Review draft notices from administration and authorize publication to app and web | **FULL PARITY** | Notice publisher dialog with immediate broadcast capability. |

---

### Module E: Admin & Accountant Operations (`/admin/*`)

| Web Feature / Route | Role | Business Rules & Outcomes | Mobile Status | Implementation & Verification Evidence |
| :--- | :--- | :--- | :---: | :--- |
| **Student Directory & Profiles** | ADMIN | Search students by name/roll, filter by class/section, view full student profile modal | **MOBILE READ-ONLY BY DESIGN** | `AdminStudentDirectoryScreen`. Responsive card list, filter chips. Web has full edit/archive CRUD. |
| **Teacher & Staff Roster** | ADMIN | Filter by department (Noorani, Hifz, Kitab, General), view designations, one-tap phone call | **MOBILE READ-ONLY BY DESIGN** | `AdminTeacherDirectoryScreen`. Quick dial, active status badges. Web has full HR hiring/salary setup. |
| **Fee Collection & Quick Collect** | ACCOUNTANT | Search student by roll/ID, select fee heads, accept cash/bKash/Nagad, print receipt | **ADAPTED WORKFLOW** | `AccountantDashboardScreen` with payment modal and receipt generator. Full billing batch is Web-only. |
| **Daily Cashbook & Fund Balances** | ACCOUNTANT | View general fund, lillah fund, mosque fund balances, and daily in/out entries | **FULL PARITY** | Real-time cashbook ledger with categorized credits/debits. |
| **Campus Security Gatepass (`/admin/gatepass`)** | ADMIN, PRINCIPAL | Filter by status, search by student roll/name, issue new gatepass with escort details and departure times | **ADAPTED WORKFLOW** | `AdminGatepassScreen`. Search bar, status chips, bottom sheet issuer with full validation. Tested in Dart test #22. |
| **System Settings & Institution Config** | ADMIN | Configure institution identity, 2026 academic session, check database health, and switch ERP API endpoint | **FULL PARITY** | `AdminSystemSettingsScreen`. Real-time persistence, instant URL update. Tested in Dart test #17. |
| **Bulk Data Import / Export** | ADMIN | CSV/Excel bulk processing for students, fees, attendance | **WEB ONLY BY DESIGN** | Administrative Web Browser Only |
| **Database Migration & Backup Ops** | ADMIN / DEVOPS | Snapshot creation, CLI migrations, restore drills | **WEB ONLY BY DESIGN** | System Administrator CLI / Web Console Only |

---

### Module F: Unified Interactive Web App Suite (`/app`) & Shared Architecture

| Web App Feature / Route | Role | Business Rules & Outcomes | Mobile Status | Implementation & Verification Evidence |
| :--- | :--- | :--- | :---: | :--- |
| **Interactive Web App Suite (`/app`)** | ALL ROLES | Single-screen responsive command center, KPI counters (185 students, 16 staff, 18 classes, ৳424k billing), prayer timetable | **FULL PARITY** | Matched by Flutter `EhrjApp` role routing and home screens. Verified in Playwright (`webapp_suite_overview.png`). |
| **Secure Persona Switcher (`/api/app/quick-persona-switch`)** | ALL ROLES | Passwordless role switching strictly forbidden in production (HTTP 403 `PERSONA_SWITCH_FORBIDDEN`) with audit logging; safe logout supported | **FULL PARITY** | Server-side RBAC guard verified in `scratch/test_phase12_security_workflows.js` (Test 1 PASS). |
| **Spot Fee Collection & Online Payment Intent** | ACCOUNTANT / PUBLIC | Admin/Accountant: Atomic spot collection (`FeeInvoice` + `PaymentReceipt`). Guardian/Public: Real `PaymentIntent` with status `PENDING_VERIFICATION` | **FULL PARITY** | Matched by `PaymentReceiptCard` and `AccountantDashboardScreen`. Duplicate TrxID blocked at HTTP 409 Conflict. |
| **Authentic Result Search & Marksheets** | ALL ROLES | Search student by roll/id, queries real `ExamMark` and `Result` database records, calculates GPA/letter grade, printable report | **FULL PARITY** | Matched by `PublicResultsScreen` and Student/Guardian Results tabs. Verified in Test 2 PASS. |
| **Transactional Class Attendance Matrix** | TEACHER | Class roster interactive attendance toggles, "সকল উপস্থিত" shortcut, transactional save via `saveAttendanceSheetTransaction`, and offline draft queue | **FULL PARITY** | Matched by `TeacherDashboardScreen` attendance tab and offline queue. Verified in Playwright (`webapp_attendance_matrix.png`). |
| **CR80 Digital Student ID Card** | STUDENT, GUARDIAN | Official photo, name, class, blood group, session 2026, and central QR code | **FULL PARITY** | Matched by `StudentDigitalIdCard` widget. Verified in Playwright (`webapp_digital_id_card.png`). |
| **Online Admission Persistence** | PUBLIC | Concurrency-safe `generateApplicationNumber()`, creates real record in Prisma `Application` table, trackable at `/admission/track` | **FULL PARITY** | Matched by `AdmissionApplyScreen` and `AdmissionTrackScreen`. Verified in Test 4 PASS. |
| **Global Floating App Launcher Dock** | PUBLIC, ALL ROLES | Persistent floating widget on all public pages, expands quick launcher for fees, results, and portal login shortcuts | **FULL PARITY** | Matched by mobile bottom navigation and floating quick launcher. Verified in Playwright (`webapp_floating_dock_open.png`). |
| **Unified Auth (Bearer + Cookie)** | ALL ROLES | Simultaneous HttpOnly cookie injection for Web browsers and JWT token return for Flutter storage | **FULL PARITY** | Verified in `scratch/test_phase11_two_way_sync.js` and Phase 12 regression tests across Admin, Teacher, and Guardian roles. |

---

## 3. Summary of Evidence Quality

- **Phase 12 Regression Suite:** `scratch/test_phase12_security_workflows.js` -> **11 PASSED, 0 FAILED**.
- **Phase 13 Full Application & Parity Suite:** `scratch/test_phase13_web_flutter_parity.js` -> **43 PASSED, 0 FAILED**.
- **Dart/Flutter Tests:** 32 passing tests (27 unit tests, 5 staging contract tests). `flutter analyze` clean (0 warnings, 0 errors).
- **Physical Device:** Google Pixel 7 (Android 17) active package verified via ADB dumpsys.
- **Web Browser UAT:** Playwright interactive workflows verified across all 9 ERP tabs (`webapp_*.png`) against Port 3000.
- **Security Safeguards:** Direct API role elevation blocked (HTTP 403 Forbidden); unauthenticated mutations blocked (HTTP 401 Unauthorized); duplicate payment transaction IDs rejected (HTTP 409 Conflict); admissions and gatepasses persist directly into SQLite master database.
- **TypeScript Static Verification:** `npx tsc --noEmit` clean with 0 errors across entire Next.js codebase.
- **Master Dataset Invariants:** 185 students, 385 invoices (৳424,095 net, ৳141,200 paid), 129 receipts (৳97,700) rigorously preserved on Port 3000 SQLite master.

---

## 4. Phase 13 Feature Completion & Multi-Module Parity Certification

| Module | Web App (`/app`) Implementation | Flutter Mobile Implementation | Shared DB Entity | Status |
|---|---|---|---|:---:|
| **Students & Guardians** | 9-column interactive table, class filter, roll/ID search, view profile modal | `StudentListScreen`, `StudentDetailScreen`, LocalStorage cache | `prisma.student` (185 students) | **FULL PARITY** |
| **Fees & Invoices** | Tabular ledger, status filter (PAID/PARTIAL/UNPAID), fee voucher generator | `FeeLedgerScreen`, payment cards, receipt viewer | `prisma.feeInvoice` (385 invoices) | **FULL PARITY** |
| **Attendance Matrix** | Period selector, batch mark, local draft queue | Class attendance roster, offline draft cache | `prisma.attendance` | **FULL PARITY** |
| **Exams & Mark Sheets** | Exam selector, mark entry form, printable marksheet view | Exam schedule list, student marks report | `prisma.exam`, `prisma.examMark` | **FULL PARITY** |
| **Admissions Processing** | Application list, status filter, approve/reject dialog with remarks | Admission list view, application status tracking | `prisma.application` | **FULL PARITY** |
| **Digital Gatepass** | Gatepass table, destination filter, issue gatepass dialog | Leave request feed, gatepass approval & QR display | `prisma.studentLeaveRequest` | **FULL PARITY** |
| **Notices & Circulars** | Categorized notice list, audience badges, view detail | Push notification list, categorized notice cards | `prisma.notice` | **FULL PARITY** |
| **Settings & Security** | DB node monitor, institutional profile, sync health | App config, user session, cache reset | `prisma.auditLog` | **FULL PARITY** |

---

## 5. Phase 14 Independent Runtime Validation & Truthful Feature Matrix

*Audited via `scratch/test_phase14_independent_validation.mjs` (47 assertions), `scratch/playwright_phase14_browser_journeys.mjs` (9 browser modules), `flutter test` (32 tests), and SQLite master invariants check.*

| Module & Workflow | UI Implemented? | API Implemented? | DB Persistence Verified? | Authorization Verified? | Browser / Device Tested? | Web ↔ Flutter Parity? | Evidence & Test Result | Status | Remaining Defects |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :---: | :--- |
| **Admin Student Directory & Profile** | Yes | Yes | Yes (`Student` 185 records) | Yes (Admin 200, Public 401) | Yes (Playwright `phase14_students_tab.png`) | Yes (Shared JSON model) | Journey 1 PASS (`STD-2026-0001` lookup) | **VERIFIED** | None |
| **Online Admission Review & Decision** | Yes | Yes | Yes (`Application` persistence) | Yes (Admin approve/reject) | Yes (Playwright `phase14_admissions_tab.png`) | Yes (Application tracking) | Journey 2 PASS (Create -> Approve -> Persist) | **VERIFIED** | None |
| **Daily Attendance Sheet & Entry** | Yes | Yes | Yes (`Attendance` persistence) | Yes (Teacher/Admin only) | Yes (Playwright `phase14_attendance_tab.png`) | Yes (Offline draft + sync) | Journey 3 PASS (Batch save -> Reload -> DB check) | **VERIFIED** | None |
| **Exam Marks & Marksheet Calculation** | Yes | Yes | Yes (`ExamMark` / `Result`) | Yes (Teacher/Admin only) | Yes (Playwright `phase14_exams_tab.png`) | Yes (Grade calculation) | Journey 4 PASS (Marksheet GPA 4.0 verified) | **VERIFIED** | None |
| **Fee Ledger & Balance Verification** | Yes | Yes | Yes (`FeeInvoice` 385 records) | Yes (Accountant/Admin only) | Yes (Playwright `phase14_fees_tab.png`) | Yes (Ledger card view) | Journey 5 PASS (385/385 invoices balance) | **VERIFIED** | None |
| **Security Gatepass Issuance** | Yes | Yes | Yes (`StudentLeaveRequest`) | Yes (Admin/Principal only) | Yes (Playwright `phase14_gatepass_tab.png`) | Yes (Gatepass status cards) | Journey 6 PASS (Issue -> Query -> Clean) | **VERIFIED** | None |
| **Guardian Child Data Isolation (IDOR)** | Yes | Yes | Yes (Scoped to own children) | Yes (Other child blocked 403) | Yes (Browser test session) | Yes (ChoiceChips multi-child) | Journey 7 PASS (IDOR attempt blocked) | **VERIFIED** | None |
| **Teacher Role Scoping & Action Guard** | Yes | Yes | Yes (Curriculum accessible) | Yes (Admin mutation blocked 403)| Yes (Browser test session) | Yes (Teacher dashboard) | Journey 8 PASS (RBAC boundary verified) | **VERIFIED** | None |
| **Spot Fee Collection & Deduplication** | Yes | Yes | Yes (Atomic `FeeInvoice` + `PaymentReceipt`) | Yes (Accountant/Admin only) | Yes (Playwright modal triggered) | Yes (Instant receipt dialog) | Journey 9 PASS (Duplicate TrxID 409 Conflict) | **VERIFIED** | None (DEF-14-01 resolved) |
| **Public Visitor Boundaries & Lockout**| Yes | Yes | Yes (Public notices read-only) | Yes (Gatepass 401, Elevate 403)| Yes (Playwright public flows) | Yes (Public home & notices) | Journey 10 PASS (Persona switch locked) | **VERIFIED** | None |
| **Mobile Command Center Shared Sync** | Yes | Yes | Yes (Shared Port 3000 SQLite) | Yes (Bearer token auth) | Yes (Pixel 7 / Flutter unit tests) | Yes (Command center parity) | Journey 11 PASS (`/api/app/command-center` 200) | **VERIFIED** | None |
| **Mobile Finance & Student Ledger** | Yes | Yes | Yes (Shared Port 3000 SQLite) | Yes (Bearer token auth) | Yes (Flutter staging integration) | Yes (385 invoices / 185 students) | Journey 12 PASS (Shared schema contract 200) | **VERIFIED** | None |

