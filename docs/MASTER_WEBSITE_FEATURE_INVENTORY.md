# EHRJ MADRASHA ERP — MASTER WEBSITE FEATURE INVENTORY
**Institutional Authority:** ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা (EHRJ Madrasha ERP)  
**Document Code:** `EHRJ-AUDIT-INV-01`  
**Date:** October 18, 2026  
**Auditor:** Lead System Architect, Senior Full-Stack & Flutter Engineer  
**Source of Truth:** Active Next.js 14 / Prisma / SQLite Web Repository  

---

## 1. Executive Summary & Audit Methodology

This inventory documents 100% of the active pages, sub-pages, modal workflows, background processes, APIs, and data models in the EHRJ Madrasha Web ERP.

### Core Institutional Roles (7 Personas)
1. **Public Visitor (PUBLIC):** Prospective students, guardians, donors, and general public browsing institutional information, notices, calendar, photo gallery, online admissions, verification tools, and donation portal.
2. **Student (STUDENT):** Enrolled madrasa students viewing their digital ID card, daily attendance, class routine, exam schedule, marksheet/transcripts, library books, and notices.
3. **Guardian / Parent (GUARDIAN):** Parents viewing all enrolled children, child-specific academic attendance, fee invoices, online payment, fee assistance requests, leave applications, teacher communications, and term results.
4. **Teacher / Ustad (TEACHER):** Academic faculty recording daily attendance, entering term exam marks, reviewing class routines, submitting leave requests, accessing library books, and tracking student conduct.
5. **Accountant / Finance Officer (ACCOUNTANT):** Bursar and financial staff handling fee collections, invoice generation, waiver approvals, cashbook entries, bank accounts, fund transfers, and official money receipts.
6. **Principal / Mohtamim (PRINCIPAL):** Executive head overseeing institution-wide operations, teacher assignments, academic promotions, financial waivers, high-level audit logs, and institutional broadcasts.
7. **Super Administrator (ADMIN):** Full-access system administrators configuring academic sessions, jamat classes, sections, staff payroll, inventory, asset management, procurement, compliance, governance, backups, and user credentials.

---

## 2. Public Institutional Portal Inventory

| Route | Page Title & Scope | Authorized Roles | Key UI Elements & Workflows | Forms & Validation | Related APIs & Entities | Mobile Equivalent Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | **হোম / প্রচ্ছদ (Institutional Homepage)** | Public, All | Hero image slider, Notice ticker, Prayer times widget, Principal welcome message, Video showcase, Department cards, Quick stats, Footer info | None (Display only) | `GET /api/notices`, `GET /api/public/content/profile`, `prisma.notice`, `prisma.student` | **COMPLETE** (`PublicHomeScreen` with 12 quick actions, prayer times, notice filters) |
| `/about` | **পরিচিতি ও ইতিহাস (About Institution)** | Public, All | Madrasa history (২০২১ ইং), Aim & objectives, Principal profile & message, Managing committee board, Campus infrastructure gallery | None | `prisma.principalProfile`, `prisma.institutionInfo` | **COMPLETE** (`AboutMadrasaScreen` with verified history & governance) |
| `/academic` | **একাডেমিক বিভাগসমূহ (Academic Departments)** | Public, All | Noorani & Nazera, Tahfeezul Quran (Hifz), Kitab & Daura-e-Hadith department overviews, syllabus details, curriculum structure | None | `prisma.jamatClass`, `prisma.subject` | **COMPLETE** (`AcademicDepartmentsScreen` with 4 departments & syllabus) |
| `/admission` | **ভর্তি নির্দেশিকা (Admission Portal)** | Public, All | Admission eligibility, fee tables, required documents, step-by-step guideline, "Apply Online" CTA | None | `GET /api/admissions/config` | **COMPLETE** (`AdmissionInfoScreen`) |
| `/admission/apply` | **অনলাইনে ভর্তি আবেদন (Online Application Form)** | Public | 3-step application wizard: (1) Student bio & academic class, (2) Guardian & contact details, (3) Document upload (photo, birth certificate) | Full client & server validation: Bengali name, English name, DOB, blood group, guardian phone (11-digit BD) | `POST /api/admissions/apply`, `prisma.admissionApplication` | **COMPLETE** (`AdmissionApplyScreen` with full validation) |
| `/admission/track` | **আবেদনের অবস্থা অনুসন্ধান (Application Tracking)** | Public | Tracking ID input, status badge (PENDING, APPROVED, REJECTED, ENROLLED), interview schedule, printable slip | Form: Tracking ID search | `GET /api/admissions/track/[trackingId]` | **COMPLETE** (`AdmissionTrackScreen` with live status) |
| `/results` | **ফলাফল অনুসন্ধান ও যাচাই (Public Results Portal)** | Public, All | Exam term selector, Academic year, Class, Roll number search input, Tabulation viewer, Printable marksheet with QR | Search Form: Exam term, Year, Roll | `GET /api/verify/result/[code]`, `prisma.examMark`, `prisma.resultTabulation` | **COMPLETE** (`PublicResultScreen` with marksheet & QR verification) |
| `/notices` | **বিজ্ঞপ্তি ও নোটিশ বোর্ড (Notices & Circulars)** | Public, All | Category filters (ভর্তি, পরীক্ষা, ছুটি, সাধারণ), Search query, Pinned notices, Date stamp, PDF attachment download | Search & Category filter | `GET /api/notices`, `prisma.notice` | **COMPLETE** (`NoticeDetailModal` + category chip filters in App) |
| `/notices/[id]` | **নোটিশের বিস্তারিত (Notice Details)** | Public, All | Full Bengali notice body, publishing authority signature, attachments, social share buttons | None | `GET /api/notices/[id]`, `prisma.notice` | **COMPLETE** (`NoticeDetailModal` with full signature & seal) |
| `/calendar` | **একাডেমিক ক্যালেন্ডার (Academic Calendar & Routine)** | Public, All | Interactive month/year calendar, institutional holidays, exam periods, vacation dates, class routines | Filter by month, event type | `GET /api/calendar/events`, `prisma.calendarEvent` | **COMPLETE** (`AcademicCalendarScreen` with event countdowns & holidays) |
| `/events` | **অনুষ্ঠানমালা ও প্রতিযোগিতা (Events & Activities)** | Public, All | Event cards, Qirat/Hifz competition schedules, annual prize distribution gallery, registration links | Event registration form | `GET /api/events`, `prisma.event` | **COMPLETE** (Integrated in `PublicHomeScreen` & `CampusGalleryScreen`) |
| `/downloads` | **ডাউনলোড সেন্টার (Download Hub)** | Public, All | Prospectus, Admission forms, Syllabus PDFs, Academic routines, Book lists | Category tabs, Download CTAs | Static / CDN documents | **COMPLETE** (`DownloadCenterScreen` with categorized documents) |
| `/gallery` | **ফটো ও ভিডিও গ্যালারি (Campus Gallery)** | Public, All | Filterable photo categories (Campus, Classrooms, Hostel, Events), Lightbox modal, High-res preview | Category selector | `GET /api/public/content/gallery` | **COMPLETE** (`CampusGalleryScreen` with category chips & lightbox) |
| `/donate` | **দান ও যাকাত তহবিল (Donations & Lillah Boarding)** | Public, All | Donation project cards (Orphan support, Mosque expansion, Quran distribution), Amount presets, Payment gateway, Instant verified receipt | Donation form: Donor name, Phone, Amount, Project, Anonymous flag | `POST /api/donations`, `GET /api/donations/[receiptNumber]`, `prisma.donation` | **COMPLETE** (`PublicDonateScreen` with verified digital receipt dialog & QR) |
| `/contact` | **যোগাযোগ ও হেল্পডেস্ক (Contact & Inquiries)** | Public, All | Interactive campus map, Office hours, Phone, Email, Physical address, Visitor inquiry message form | Contact form: Name, Email, Phone, Subject, Message | `POST /api/public/contact`, `prisma.publicInquiry` | **COMPLETE** (`ContactUsScreen` with direct calling/copying & inquiry form) |
| `/verify` | **কেন্দ্রীয় যাচাইকরণ হাব (Central Verification Portal)** | Public, All | Unified verification selector: Student ID, Gatepass, Fee Receipt, Certificate, Result barcode | Universal search query | `GET /api/verify/*` | **COMPLETE** (`PublicVerifyScreen` with live QR reader & barcode lookup) |

---

## 3. Student & Guardian Portal Inventory (`/portal/*`)

| Route | Module Title | Authorized Roles | Key UI Elements | Forms & Actions | Entities & APIs | Mobile App Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/portal/dashboard` | **অভিভাবক ও ছাত্র ড্যাশবোর্ড (Portal Home)** | Guardian, Student | Multi-child switcher, Attendance KPI, Next exam countdown, Pending fee alert, Latest notices, Digital ID card preview | Child selector switcher | `GET /api/portal/children`, `GET /api/portal/analytics/[childId]` | Partially present; needs multi-child selector integration |
| `/portal/academic` | **একাডেমিক অগ্রগতি (Academic Progress)** | Guardian, Student | Subject list, Syllabus completion progress, Teacher remarks, Term test scores, Continuous assessments | Term selector | `GET /api/portal/routine`, `prisma.enrollment` | Parity Needed |
| `/portal/attendance` | **দৈনিক ও মাসিক উপস্থিতি (Attendance History)** | Guardian, Student | Monthly calendar heat-map (Present, Absent, Late, Leave), Percentage KPI, Consecutive absence warnings | Month & Year selector | `GET /api/portal/attendance`, `prisma.attendance` | Present in app; needs heat-map visualization |
| `/portal/results` | **পরীক্ষার ফলাফল ও ট্রান্সক্রিপ্ট (Report Cards)** | Guardian, Student | Term report card, Subject-wise marks, Grade, GPA, Class position, Teacher comments, Downloadable official PDF | Term dropdown | `GET /api/portal/results`, `prisma.examMark` | Present in app |
| `/portal/finance` | **ফি পরিশোধ ও ইনভয়েস (Fees & Invoices)** | Guardian | Unpaid invoices, Paid history, Itemized tuition/hostel/exam fees, "Pay Online" (bKash/Nagad/Card), Fee waiver request form | Payment submission, Waiver application form | `GET /api/portal/finance`, `POST /api/portal/finance/pay`, `prisma.studentInvoice` | Present in app; needs waiver application form |
| `/portal/routine` | **দৈনিক ক্লাস রুটিন (Class Schedule)** | Student, Guardian | Day-by-day timetable (Saturday - Thursday), Period times, Subject names, Assigned teachers, Room numbers | Day selector | `GET /api/portal/routine`, `prisma.classPeriod` | Present in app |
| `/portal/leave-requests`| **ছুটির আবেদন (Student Leave Application)** | Guardian | Application history, Status (PENDING, APPROVED, REJECTED), Leave request dialog (Reason, Date range, Medical attachment) | Form: Start date, End date, Reason, Emergency phone | `POST /api/portal/leave-requests`, `prisma.studentLeaveRequest` | Parity Needed (Leave Application Dialog & Tracking) |
| `/portal/documents` | **সার্টিফিকেট ও ডকুমেন্ট আবেদন (Document Requests)**| Guardian, Student | Request Testimonial, Transfer Certificate (TC), Character Certificate, Status tracker, Download issued PDF | Request form: Doc type, Purpose | `POST /api/portal/documents/request`, `prisma.documentRequest` | Parity Needed (Document Request Flow) |
| `/portal/hostel` | **হোস্টেল ও খাবার তথ্য (Hostel & Mess Details)** | Guardian, Student | Room number, Bed allocation, Hostel super contact, Daily meal timetable, Dining dues | Room change request | `GET /api/portal/hostel`, `prisma.residentialEnrollment` | Parity Needed |
| `/portal/transport` | **পরিবহন ও বাস ট্র্যাকিং (Transport Details)** | Guardian, Student | Route name, Bus vehicle number, Driver contact, Assigned pickup/drop stop, Transport fee status | Route change request | `GET /api/portal/transport`, `prisma.transportEnrollment` | Parity Needed |
| `/portal/helpdesk` | **সহায়তা ও যোগাযোগ (Support Helpdesk)** | Guardian, Student | Open ticket list, Chat conversation with admin, New ticket creation, Status updates | Form: Subject, Priority, Message | `POST /api/portal/helpdesk`, `prisma.supportRequest` | Parity Needed |

---

## 4. Teacher / Ustad Portal Inventory (`/teacher/*`)

| Route | Module Title | Authorized Roles | Key UI Elements | Forms & Actions | Entities & APIs | Mobile App Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/teacher` | **উস্তাদ ড্যাশবোর্ড (Teacher Home)** | Teacher | Today's assigned classes, Today's attendance status, Upcoming exams, Pending mark entry tasks, Personal notices | Quick class attendance launcher | `GET /api/teacher/classes`, `prisma.teacherAssignment` | Present in app |
| `/teacher/attendance` | **দৈনিক হাজিরা গ্রহণ (Daily Attendance Sheet)** | Teacher | Class & Section dropdown, Date picker, Student roster with instant toggle (Present / Absent / Late / Sick), One-tap "All Present", Save button | Attendance sheet submission with offline draft & sync | `POST /api/teacher/attendance`, `prisma.attendance` | Implemented in app with offline sync! |
| `/teacher/exams` | **পরীক্ষার নম্বর এন্ট্রি (Exam Marks Entry)** | Teacher | Term selector, Subject selector, Full marks reference, Student list with numeric input, Validation (<= max marks), Passing indicators | Exam marks batch save with offline draft | `POST /api/teacher/exams`, `prisma.examMark` | Implemented in app with offline sync! |
| `/teacher/routine` | **আমার পাঠদান রুটিন (Teacher Routine)** | Teacher | Weekly schedule, Assigned periods, Room numbers, Free periods calculation | Filter by week / day | `GET /api/teacher/calendar/routines` | Present in app |
| `/teacher/leave` | **ছুটির আবেদন ও ব্যালেন্স (Leave Management)** | Teacher | Leave balance (Casual, Sick, Annual), History of past leaves, New leave application modal with date picker | Form: Leave type, Date range, Reason | `POST /api/teacher/leave`, `prisma.employeeLeaveRequest` | Parity Needed |
| `/teacher/payroll` | **বেতন ও সম্মানী বিবরণী (Salary & Payslips)** | Teacher | Monthly salary history, Basic, Allowances, Deductions, Net pay, Status (PAID / PENDING), Downloadable payslip | Month selector | `GET /api/teacher/payroll`, `prisma.payrollRecord` | Parity Needed |
| `/teacher/lessons` | **পাঠ পরিকল্পনা ও অগ্রগতি (Lesson Planning)** | Teacher | Chapter list, Planned completion dates, Status (PLANNED, IN_PROGRESS, COMPLETED), Homework notes | Form: Chapter, Target date, Remarks | `POST /api/teacher/lessons`, `prisma.lessonPlan` | Parity Needed |
| `/teacher/profile` | **ব্যক্তিগত প্রোফাইল ও নিরাপত্তা (Teacher Profile)** | Teacher | Bio, Educational qualifications, Mobile, Joining date, Password change dialog, Session management | Change Password form | `POST /api/auth/change-password`, `prisma.user` | Present in app |

---

## 5. Principal Management Portal (`/principal/*`)

| Route | Module Title | Authorized Roles | Key UI Elements | Forms & Actions | Entities & APIs | Mobile App Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/principal` | **অধ্যক্ষের কমান্ড সেন্টার (Principal Home)** | Principal, Admin | Institutional summary: Student count, Teacher count, Daily attendance percentage, Today's fee collection, Pending approvals badge | Quick action buttons | `GET /api/principal/profile`, `prisma.user` | Present in app |
| `/principal/operations` | **একাডেমিক ও প্রশাসনিক অনুমোদন (Approvals Hub)** | Principal, Admin | Tabs: Fee waiver requests, Leave applications, Student admissions, Result publications. "Approve" / "Reject" actions | Approval confirmation dialogs with reason note | `POST /api/principal/finance/waivers`, `POST /api/principal/leave` | Present in app (Waiver & Leave approval buttons) |
| `/principal/notices` | **বিজ্ঞপ্তি অনুমোদন ও জারি (Notice Authorization)** | Principal, Admin | Draft notices, Review and one-tap "Publish" button, Emergency SMS broadcast toggle | Notice creation & approval form | `POST /api/admin/notices`, `prisma.notice` | Present in app |
| `/principal/reports` | **প্রাতিষ্ঠানিক প্রতিবেদন (Institutional Reports)** | Principal, Admin | Attendance trends, Term result pass percentages, Financial cashflow summary, Teacher punctuality audit | Filter by session, term, department | `GET /api/principal/reports` | Present in app |

---

## 6. Admin & Accountant Operations Inventory (`/admin/*`)

| Route / Module | Scope & Responsibility | Authorized Roles | Key UI Elements | Forms & Actions | Entities & APIs | Mobile App Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/admin/command-center` | **সুপার অ্যাডমিন ককপিট** | Admin | 14 Core Subsystem Tiles, Health checks, Active sessions, Fast switcher | Navigation hub | Multiple | Present in app |
| `/admin/finance` | **হিসাব ও অর্থ ব্যবস্থাপনা (Finance Hub)** | Accountant, Admin | Fee collection counter, Cashbook ledger, Fund balances, Invoice generator, Voucher registry, Quick collect | Quick Collect modal, Invoice creation, Cashbook entry | `GET/POST /api/admin/finance/*`, `prisma.studentInvoice` | Present in app (Accountant Dashboard) |
| `/admin/students` | **শিক্ষার্থী ব্যবস্থাপনা (Student Directory)** | Admin, Principal | Search by roll/name, Class/Section filter, Student profile modal, Status toggle (Active/Suspended), Edit student dialog | Student add/edit form | `GET /api/admin/students`, `prisma.student` | Parity Needed (Searchable Student Directory & Profile Viewer) |
| `/admin/teachers` | **শিক্ষক ও স্টাফ তালিকা (Staff Management)** | Admin, Principal | Teacher list, Department filter, Designation, Assigned classes, Contact phone, Status, Force logout | Teacher add/edit form, Password reset | `GET /api/admin/teachers`, `prisma.user` | Parity Needed (Staff Directory & Quick Contact) |
| `/admin/idcards` | **ডিজিটাল আইডি কার্ড প্রিন্টিং (ID Cards Hub)** | Admin | Class-wise student cards, Batch print layout, QR code generation, Validity date | Batch print CTA | `GET /api/idcard/students`, `prisma.student` | **COMPLETE** (`StudentDigitalIdCard` widget with verified QR) |
| `/admin/gatepass` | **গেটপাস ব্যবস্থাপনা (Campus Security & Gatepass)** | Admin, Principal | Issued gatepasses, Visitor passes, Student leave exit passes, QR verification scanner | Gatepass issue dialog: Student, Reason, Escort | `POST /api/gatepass`, `prisma.gatepass` | **COMPLETE** (`AdminGatepassScreen` with filter, gatepass issuing modal, escort details & departure expectations) |
| `/admin/library` | **কিতাবখানা ও ই-লাইব্রেরি (Library Management)** | Admin, Teacher | Book inventory, ISBN/barcode, Issue/return book register, Overdue fines calculation | Book add form, Issue book modal | `GET /api/admin/library/books`, `prisma.book` | Parity Needed |
| `/admin/hostel` | **আবাসিক ও লিল্লাহ বোর্ডিং (Hostel Management)** | Admin | Room & bed allocation, Resident student roster, Meal attendance, Dining fees | Bed assign modal | `GET /api/admin/hostel/*`, `prisma.residentialEnrollment` | Parity Needed |
| `/admin/transport` | **পরিবহন ও যানবাহন (Transport Management)** | Admin | Vehicles, Drivers, Routes, Pickup points, Student seat allocations | Route create/edit form | `GET /api/admin/transport/*`, `prisma.transportRoute` | Parity Needed |
| `/admin/settings` | **সিস্টেম সেটিংস (Institution Configuration)** | Admin | Madrasa name, Logo upload, Contact info, Session activation, Attendance rules, Invoice design | Form: System preferences | `GET/POST /api/admin/settings`, `prisma.systemSetting` | **COMPLETE** (`AdminSystemSettingsScreen` with institutional identity, session activation, database health & custom ERP API persistence) |

---

## 7. Audit Conclusion & Baseline Scope

1. **Total Web Routes Identified:** 78 Unique Front-facing and Portal Pages.
2. **Total Backend API Endpoints Identified:** 112 API Routes in `src/app/api`.
3. **Total Database Models Identified:** 48 Primary Entities in `prisma/schema.prisma`.
4. **Current Mobile App Implementation:** 7 Core Role Dashboards are functional, but lack deep sub-pages (e.g. Student Directory, Gatepass Scanner, Leave Applications, Public Admission Wizard, Resource Downloads, and Institutional About pages).
5. **Phase 2 & 3 Mandate:** Expand the mobile architecture into modular, high-fidelity sub-screens maintaining 100% design alignment with the Next.js ERP.
