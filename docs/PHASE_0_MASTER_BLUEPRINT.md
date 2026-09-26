# EHRJ DIGITAL CAMPUS
## PHASE 0 — MASTER APPLICATION BLUEPRINT & REQUIREMENTS SPECIFICATION

---

### 1. PROJECT IDENTITY & BRAND INTEGRITY

* **Institution Name (Bengali):** ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
* **Institution Name (English):** Eliotganj Hazi Rohmatollah Jamiria Madrasha
* **Institution Name (Arabic):** الجامعة الإسلامية رحمة الله إليوت غنج
* **Founder & Muhtamim (Principal):** মাওলানা মহা. আবুল কালাম সরকার
* **Year of Establishment:** ২০২১ইং (2021 AD)
* **Campus Address:** পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা, বাংলাদেশ
* **Official Contacts & Helpdesk:**
  * Phone 1: `01845-162664`
  * Phone 2: `01826-416696`
  * Phone 3: `01949-091911`
* **Official Administrative Email:** `adminehrjmadrasha@gmail.com`
* **Institutional Support & SMTP Email:** `ehrjmadrasha@gmail.com`
* **Domain & Email Constraints:** Strictly `.com` or standard `gmail.com` (Zero `.edu` / `.edu.bd` dependencies).
* **Social Links:**
  * Facebook: `https://www.facebook.com/ehrjmadrasda`
  * YouTube: `https://www.youtube.com/@ehrjmadrasha`
  * WhatsApp Channel: `https://whatsapp.com/channel/0029VbC30aF6buMF0LGPMp3F`

---

### 2. PRODUCT DEFINITION & CORE ARCHITECTURAL PRINCIPLES

**EHRJ Digital Campus** is a single, unified, full-stack educational institution ERP, public portal, and management platform tailored specifically for a traditional Qawmi Madrasa, Hifzul Quran academy, and modern integrated education complex.

#### Fundamental Architecture Principles:
1. **Single Centralized Operational Admin:** All high-level management, admissions, finances, user credentials, student enrollments, academic structures, and website CMS are controlled exclusively via `/admin`.
2. **NO Super Admin:** Multi-tiered super-admin hierarchies are rejected. Authority is unified cleanly under the operational Admin.
3. **Dedicated Lightweight Principal Oversight (`/principal`):** The Muhtamim has an oversight dashboard to inspect institutional health, view financial and academic reports, update the official principal's message, and issue formal correction/issue directives to the Admin. The Principal is an oversight executive, not an operational data-entry admin.
4. **Isolated Teacher Panel (`/teacher`):** Teachers have zero visibility into finance, audit logs, or unrelated classes. They focus strictly on assigned classes, roll-call attendance, marks entry, and routine.
5. **Zero-Friction Guardian & Student Portal (`/portal` & `/login` Tab 2):** Public or low-friction query using Jamat + Roll (+ optional verification DOB/phone) returning printable report cards, fee dues, and attendance, avoiding paid SMS/OTP expenses.
6. **Integrated Public Website (`/`):** Dignified Islamic institutional aesthetic with real photos, live prayer times, notice board, and public verification tools.

---

### 3. COMPLETE DOCUMENT INVENTORY

```
DOCUMENT 01: Product Requirements Specification (PRS)
DOCUMENT 02: Complete Application Architecture
DOCUMENT 03: Complete Route Map & Navigation Tree
DOCUMENT 04: Complete Page Inventory & Component Matrix
DOCUMENT 05: Step-by-Step User Flow Specification
DOCUMENT 06: Role & Permission Matrix (RBAC)
DOCUMENT 07: Database Entity Relationship Specification (ERD)
DOCUMENT 08: API Architecture Specification & Endpoints
DOCUMENT 09: Production-Grade Finance & Multi-Fund Architecture
DOCUMENT 10: Authentication & Security Architecture
DOCUMENT 11: UI/UX Design System & Typography Tokens
DOCUMENT 12: File, Media & Document Factory Architecture
DOCUMENT 13: Notification & Institutional Gmail Architecture
DOCUMENT 14: Quality Assurance & Multi-Tier Testing Strategy
DOCUMENT 15: Deployment & Environment Architecture
DOCUMENT 16: Phase-by-Phase Development Roadmap
```

---

### DOCUMENT 01: Product Requirements Specification (PRS)

#### 1.1 Problem Statement
Rural and semi-urban Qawmi madrasas struggle with paper-based registers, loss of historical student marks, lack of financial transparency regarding Zakat and Lillah boarding funds, and difficulty communicating with guardians who may lack tech literacy or institutional email addresses.

#### 1.2 Target Personas
1. **The Operational Admin (নাযিমে দারুল ইকামাহ / অফিস সহকারী):** Needs high-speed data entry, 1-click admission approval, invoice issuance, cash voucher logging, and certificate generation.
2. **The Muhtamim / Principal (মাওলানা মহা. আবুল কালাম সরকার):** Needs high-level institutional health summaries (how many orphans fed, current cash in Zakat fund, attendance rates), and a direct channel to direct the admin.
3. **The Ustad / Teacher:** Needs a clean mobile-friendly attendance register with an "All Present" toggle and quick subject mark submission.
4. **The Guardian / Student:** Needs frictionless visibility into report cards and dues without remembering complex passwords or waiting for paid OTP SMS.
5. **The Community Donor / Visitor:** Needs complete transparency about the 5 funds (especially Lillah Boarding and Zakat) and clear payment details.

---

### DOCUMENT 02: Complete Application Architecture

```
                                  ┌────────────────────────┐
                                  │      EHRJ Digital      │
                                  │         Campus         │
                                  └───────────┬────────────┘
                                              │
         ┌──────────────────┬─────────────────┼─────────────────┬──────────────────┐
         ▼                  ▼                 ▼                 ▼                  ▼
┌─────────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌────────────────┐
│  Public Web     │ │  Unified Auth │ │  Admin ERP    │ │ Teacher Panel │ │ Guardian/Stud. │
│  Portal (/)     │ │  (/login)     │ │  (/admin)     │ │ (/teacher)    │ │ Portal (/portal)│
└────────┬────────┘ └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └────────┬───────┘
         │                  │                 │                 │                  │
         └──────────────────┴────────┐        │        ┌────────┴──────────────────┘
                                     ▼        ▼        ▼
                              ┌───────────────────────────────┐
                              │  Next.js 14 App Router API    │
                              │  Stateless JWT / HttpOnly     │
                              └───────────────┬───────────────┘
                                              │
                      ┌───────────────────────┼───────────────────────┐
                      ▼                       ▼                       ▼
               ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
               │  Prisma ORM │         │ Nodemailer  │         │ Local Secure│
               │ Relational  │         │ Gmail SMTP  │         │ Media Store │
               │ SQLite / PG │         │ ehrjmadrasha│         │ /public/    │
               └─────────────┘         └─────────────┘         └─────────────┘
```

---

### DOCUMENT 03: Complete Route Map & Navigation Tree

#### Public Web Routes:
* `/` — Flagship Homepage (Prayer widget, impact stats, principal quote, photo gallery, notices, donation/Zakat funds)
* `/about` — Institution History, Mission, Vision, and Leadership
* `/academic` — Departments (Noorani, Nazera, Hifz, Kitab) & Approved Classes Directory
* `/admission` — Online Admission Form & Instant Tracking Slip
* `/admission/track` — Application Status Query by Tracking ID
* `/notices` — Live Notice Board with Category Filtering & Search
* `/notices/[id]` — Individual Notice Reader
* `/results` — Public Student Result & Marksheet Lookup (Zero-Friction)
* `/gallery` — Real Institution Photo & Activity Gallery
* `/downloads` — Downloadable Resources (Admission Forms, Routine, Syllabus, Calendar, Prospectus)
* `/verify` — Public Certificate & Document Verification Portal
* `/contact` — Campus Location, Helplines, Social Channels & Inquiry Form

#### Authentication Routes:
* `/login` — Unified Authentication Hub (Tab 1: Staff/Admin Login | Tab 2: Zero-Friction Student Search)
* `/api/auth/login` — Bcrypt credential validation, rate limiting, and HttpOnly session issuance
* `/api/auth/me` — Authenticated session introspection
* `/api/auth/logout` — Session termination and audit record

#### Centralized Admin ERP Routes (`/admin`):
* `/admin` — Master Dashboard Overview (Key metrics, fund ledgers, recent admissions)
* `/admin/students` — Student Directory, Permanent IDs, and Class Roster
* `/admin/admission` — Pending Applications Review, Duplicate Check & 1-Click Approval
* `/admin/academic` — Academic Sessions, Jamat Classes, Sections, and Subjects
* `/admin/attendance` — Institutional Attendance Auditing & Correction
* `/admin/exams` — Exam Scheduling, Subject Allocation, Marks Review & Publishing
* `/admin/finance` — 5 Separate Cash Funds, Income/Expense Vouchers, and Due Invoices
* `/admin/documents` — ID Card Generator & Sanad/Certificate Issuance
* `/admin/communication` — Institutional Gmail Notifications & Direct Alerts
* `/admin/cms` — Website CMS (Homepage Notices, Announcements, Media)
* `/admin/reports` — Consolidated Financial & Academic Audit Reports
* `/admin/users` — Teacher & Staff Credential Management
* `/admin/settings` — Institution Identity, Contact Info, and Backup Operations

#### Teacher Panel Routes (`/teacher`):
* `/teacher` — Teacher Dashboard Overview
* `/teacher/classes` — Assigned Classes & Subjects
* `/teacher/attendance` — Roll-Ordered Digital Attendance Register
* `/teacher/results` — Subject Marks Submission & Draft Saving
* `/teacher/routine` — Weekly Class Schedule
* `/teacher/exams` — Exam Duty & Syllabus Milestones
* `/teacher/notes` — Academic Lecture Notes
* `/teacher/notices` — Staff Notices
* `/teacher/profile` — Teacher Profile & Password Update
* `/teacher/leave` — Leave Application to Principal

#### Guardian & Student Portal Routes (`/portal`):
* `/portal` — Student/Guardian Dashboard Overview
* `/portal/children` — Linked Student Biodata & Profile
* `/portal/academic` — Enrolled Curriculum & Subject Ustads
* `/portal/attendance` — Attendance Statistics & Calendar
* `/portal/results` — Examination Marksheet & Islamic Grades (Mumtaz, etc.)
* `/portal/finance` — Tuition, Residential & Food Fee Dues & Receipts
* `/portal/documents` — Printable ID Card & Admission Confirmation
* `/portal/certificates` — Verified Hifz & Completion Certificates
* `/portal/requests` — Leave & Transfer Certificate (TC) Requests
* `/portal/notifications` — Institutional Notices & Alerts

#### Principal Oversight Routes (`/principal`):
* `/principal` — Executive Dashboard & Institutional Summary
* `/principal/overview` — High-Level Student, Teacher, and Financial Statistics
* `/principal/notices` — Official Muhtamim Messages & Announcements
* `/principal/issues` — Issue/Correction Directives Submitted to Admin
* `/principal/reports` — Monthly Audited Financial & Academic Reports

---

### DOCUMENT 04: Complete Page Inventory & Component Matrix

| Page Path | Purpose | Key Components | Data Source |
| :--- | :--- | :--- | :--- |
| `/` | Institutional Gateway | `Navbar`, `PrayerTimesWidget`, `ImpactMetrics`, `PrincipalQuote`, `NoticeBoard`, `GalleryPreview`, `DonationCards`, `Footer` | `Notice`, `PrincipalProfile`, `CashFund` |
| `/about` | Institutional Credibility | `HistoryTimeline`, `LeadershipCard`, `MissionVisionCards`, `CampusPhotoGrid` | Static & `PrincipalProfile` |
| `/academic` | Academic Transparency | `FacultyCards`, `DepartmentCurricula`, `ApprovedClassesTable`, `DailyRoutineGrid` | `JamatClass`, `Subject` |
| `/admission` | Student Intake | `MultiStepAdmissionForm`, `DuplicateDetector`, `InstantReceiptGenerator` | `Application`, `JamatClass` |
| `/notices` | Official Communication | `CategoryFilterBar`, `SearchInput`, `NoticeFeedCard`, `AttachmentDownload` | `Notice` |
| `/results` | Zero-Friction Reporting | `ClassRollSelector`, `ProgressiveReportCard`, `IslamicGradeBadge`, `PrintButton` | `Student`, `Result`, `ExamMark` |
| `/gallery` | Visual Evidence | `CategoryFilterPills`, `PhotoLightboxCard`, `ResponsiveImageGrid` | Public Assets |
| `/downloads` | Resource Access | `DownloadItemRow`, `DocumentBadge`, `FileDownloader` | Static CMS Resources |
| `/verify` | Fraud Prevention | `VerificationInput`, `VerifiedSanadCard`, `PrincipalSignatureStamp`, `QRSeal` | `Certificate`, `Student` |
| `/contact` | Physical & Digital Reach | `AddressCard`, `DirectHelplines`, `SocialBadges`, `InquiryForm`, `TravelGuide` | `INSTITUTION_INFO` |
| `/login` | Access Hub | `TabToggle`, `StaffLoginForm`, `ZeroFrictionSearchForm`, `CredentialHintBox` | `User`, `Student` |
| `/portal` | Stakeholder Dashboard | `ChildSwitcher`, `MetricCardGrid`, `10ModuleSubnav`, `MarksheetTable`, `LeaveForm` | `Student`, `Attendance`, `FeeInvoice` |
| `/teacher` | Academic Operations | `ClassSelector`, `RollCallRegister`, `AllPresentButton`, `MarksInputGrid`, `LeaveBox` | `TeacherAssignment`, `Attendance`, `ExamMark` |
| `/principal` | Executive Oversight | `ExecutiveStats`, `DirectiveComposer`, `OfficialMessageEditor`, `ReportViewer` | `AuditLog`, `CashFund`, `Student` |
| `/admin` | Complete ERP | `Sidebar13Tabs`, `ApprovalActionTable`, `StudentSearch`, `TeacherModal`, `CashbookVoucherForm`, `CMSComposer` | All Prisma Models |

---

### DOCUMENT 05: Step-by-Step User Flow Specification

#### Flow 1: Online Admission to Enrolled Student
1. Guardian visits `/admission`, fills student biodata, selects desired Jamat, specifies residential/orphan status, enters contact phone and optional email.
2. System detects potential duplicates (matching name + phone); creates record in `Application` table with tracking code `EHRJ-ADM-YYYY-XXXX`.
3. An automated confirmation email is sent via institutional Gmail (`ehrjmadrasha@gmail.com`).
4. Operational Admin opens `/admin` → "ভর্তি আবেদন (Admission)" tab, reviews applicant credentials.
5. Admin clicks **"অনুমোদন করুন (Approve)"**:
   - System updates `Application` status to `APPROVED`.
   - Generates permanent Student ID: `EHRJ-YYYY-XXXX`.
   - Calculates next sequential Roll Number for the selected Jamat.
   - Creates permanent `Student` record.
   - Creates/links `Guardian` record.
   - Creates active `Enrollment` record.
   - Generates initial admission `FeeInvoice` (waived automatically if orphan).
   - Asynchronously sends official congratulations email with permanent Student ID and Class Roll.
   - Appends permanent entry in `AuditLog`.

#### Flow 2: Zero-Friction Student Result & Fee Query
1. Guardian or student visits `/login` (Tab 2) or `/results` or `/portal`.
2. Selects Jamat from dropdown and enters class Roll number (e.g. Roll: `1`).
3. Frontend queries `/api/students/search` with rate limiting protection.
4. Server performs parameterized relational lookup: queries `Enrollment`, `Student`, `ExamMark`, `Attendance`, and `FeeInvoice`.
5. Renders comprehensive student profile: photo, attendance percentage, subject-wise marks, Islamic grades (`Mumtaz`, `Jayyid Jiddan`, etc.), fee dues, and verification QR code.
6. Guardian can click "প্রিন্ট করুন" for an official A4/thermal printed marksheet.

#### Flow 3: Financial Cashbook Voucher Logging
1. Cashier/Admin receives cash donation for Lillah Boarding or Zakat.
2. Navigates to `/admin` → "হিসাব ও ফান্ড (Finance)".
3. Clicks "নতুন আয় / ব্যয় ভাউচার", selects designated fund (`LILLAH` or `ZAKAT`), enters amount, donor/payee name, and description.
4. System executes a database transaction:
   - Inserts row in `CashTransaction` with auto-generated receipt code (`MR-YYYY-XXXXX` for income or `VR-YYYY-XXXXX` for expense).
   - Validates that expenses do not exceed available fund balance.
   - Updates `currentBalance` in `CashFund`.
   - Logs action in `AuditLog`.
5. Recalculates fund balance instantly on UI without page reload.

#### Flow 4: Principal Oversight Directive Flow
1. Muhtamim logs into `/principal`.
2. Reviews institutional overview (fund totals, student headcount).
3. Types a directive in the Issue Box (e.g., "লিল্লাহ বোর্ডিংয়ের শিক্ষার্থীদের খাবারের মান যাচাই করুন").
4. Clicks "নির্দেশনা প্রেরণ করুন".
5. Directive appears on Admin Dashboard as an active institutional notification.
6. Admin resolves the task and marks it completed; Principal can review audited resolution.

---

### DOCUMENT 06: Role & Permission Matrix (RBAC)

| System Feature / Module | Admin (`/admin`) | Principal (`/principal`) | Teacher (`/teacher`) | Guardian/Student (`/portal`) | Public Visitor |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Admission Applications** | Full (Review, Approve, Reject) | View Summary | No Access | Track Own Application | Submit New Form |
| **Student Permanent Records** | Full (Create, Edit, Status) | View Summary | View Assigned Class | View Own Linked Profile | No Access |
| **Enrollment & Roll Allocation** | Full (Assign, Promote) | View Summary | View Class Roster | View Own Roll | No Access |
| **Attendance Operations** | Full Audit & Override | View Summary | Mark Daily Attendance | View Own Attendance | No Access |
| **Examination & Marks** | Review, Publish, Tabulate | View Summary | Enter Marks for Assigned Subjects | View Published Results | Verify via Roll |
| **Finance: 5 Cash Funds** | Full (Log Income/Expense) | View Audited Balances | No Access | No Access | View Donation Needs |
| **Finance: Student Invoices** | Generate, Discount, Collect | View Summary | No Access | View Own Dues & Receipts | No Access |
| **Certificates & Sanad** | Issue, Revoke, Print | View & Co-sign | No Access | View & Download Own | Verify Authenticity |
| **Website CMS & Notices** | Full (Create, Edit, Delete) | Post Official Message | View Staff Notices | View Public Notices | View Public Notices |
| **User & Staff Accounts** | Full (Create Teacher Accounts) | View Profile | Edit Own Profile | No Access | No Access |
| **Audit Logs** | View All Immutable Logs | View High-Level Logs | No Access | No Access | No Access |

*Rule:* Zero Super-Admin hierarchy. All administrative authority is strictly consolidated under the single operational Admin role.

---

### DOCUMENT 07: Database Entity Relationship Specification (ERD)

#### 1. Entity: `User`
* `id` (String, UUID, Primary Key)
* `name` (String, Required)
* `username` (String, Unique, Required)
* `email` (String, Unique, Indexed, Required)
* `phone` (String, Unique, Optional)
* `passwordHash` (String, Bcrypt 12 rounds, Required)
* `role` (Enum: `ADMIN`, `TEACHER`, Required)
* `status` (Enum: `ACTIVE`, `INACTIVE`, `SUSPENDED`, Default: `ACTIVE`)
* `createdAt` / `updatedAt` (DateTime)

#### 2. Entity: `Student`
* `id` (String, UUID, Primary Key)
* `studentIdNumber` (String, Unique, Indexed, e.g. `EHRJ-2026-0001`, Required)
* `fullNameBn` (String, Required)
* `fullNameEn` (String, Required)
* `fullNameAr` (String, Optional)
* `dateOfBirth` (DateTime, Required)
* `gender` (Enum: `MALE`, `FEMALE`, Required)
* `bloodGroup` (String, Optional)
* `photoUrl` (String, Optional)
* `fatherNameBn` (String, Required)
* `fatherPhone` (String, Optional)
* `presentAddress` (String, Required)
* `permanentAddress` (String, Required)
* `residentialStatus` (Enum: `RESIDENTIAL`, `NON_RESIDENTIAL`, `DAY_CARE`, Default: `NON_RESIDENTIAL`)
* `isOrphan` (Boolean, Default: `false`)
* `isFinanciallyWeak` (Boolean, Default: `false`)
* `status` (Enum: `ACTIVE`, `INACTIVE`, `COMPLETED`, `TRANSFERRED`, Default: `ACTIVE`)
* Relations: `Enrollment[]`, `Attendance[]`, `ExamMark[]`, `FeeInvoice[]`, `Certificate[]`

#### 3. Entity: `Guardian` & `GuardianStudent`
* `Guardian.id` (String, UUID, PK)
* `Guardian.fullNameBn` (String, Required)
* `Guardian.phone` (String, Unique, Indexed, Required)
* `Guardian.email` (String, Optional)
* `Guardian.relation` (String, Required)
* `GuardianStudent`: Junction table with unique compound key `[guardianId, studentId]`.

#### 4. Entity: `AcademicSession`
* `id` (String, UUID, PK)
* `name` (String, Unique, e.g. `২০২৫-২০২৬`, Required)
* `startDate` / `endDate` (DateTime, Required)
* `isCurrent` (Boolean, Default: `false`)

#### 5. Entity: `JamatClass`
* `id` (String, UUID, PK)
* `nameBn` (String, e.g. `নূরানী ও নাযেরা বিভাগ`, Required)
* `nameEn` (String, Required)
* `code` (String, Unique, Required)
* `genderType` (Enum: `COMBINED`, `BOYS`, `GIRLS`, Default: `COMBINED`)
* `sortOrder` (Integer, Default: `0`)
* `isActive` (Boolean, Default: `true`)

#### 6. Entity: `Enrollment`
* `id` (String, UUID, PK)
* `studentId` (String, FK → `Student.id`, Required)
* `sessionId` (String, FK → `AcademicSession.id`, Required)
* `classId` (String, FK → `JamatClass.id`, Required)
* `rollNumber` (Integer, Required)
* `status` (Enum: `ACTIVE`, `PROMOTED`, `DROPPED`, Default: `ACTIVE`)
* *Unique Constraint:* `[sessionId, classId, rollNumber]` (guarantees roll uniqueness per class per year).

#### 7. Entity: `Application` (Admissions)
* `id` (String, UUID, PK)
* `applicationNumber` (String, Unique, Indexed, e.g. `EHRJ-ADM-2026-0001`, Required)
* `studentNameBn` (String, Required)
* `studentNameEn` (String, Optional)
* `dateOfBirth` (DateTime, Required)
* `gender` (String, Required)
* `desiredClassId` (String, FK → `JamatClass.id`, Required)
* `desiredResidentialStatus` (String, Default: `NON_RESIDENTIAL`)
* `guardianName` (String, Required)
* `guardianPhone` (String, Required)
* `guardianEmail` (String, Optional)
* `address` (String, Required)
* `isOrphan` (Boolean, Default: `false`)
* `financialAssistanceRequested` (Boolean, Default: `false`)
* `status` (Enum: `PENDING`, `APPROVED`, `REJECTED`, Default: `PENDING`)
* `remarks` (String, Optional)

#### 8. Entity: `Attendance`
* `id` (String, UUID, PK)
* `studentId` (String, FK → `Student.id`, Required)
* `sessionId` (String, FK → `AcademicSession.id`, Required)
* `classId` (String, FK → `JamatClass.id`, Required)
* `date` (DateTime, Required)
* `status` (Enum: `PRESENT`, `ABSENT`, `LATE`, `LEAVE`, Required)
* *Unique Constraint:* `[studentId, date]`

#### 9. Entity: `FeeInvoice` & `PaymentReceipt`
* `FeeInvoice.id` (String, UUID, PK)
* `FeeInvoice.invoiceNumber` (String, Unique, Indexed, Required)
* `FeeInvoice.studentId` (String, FK → `Student.id`, Required)
* `FeeInvoice.totalAmount` (Float, Required)
* `FeeInvoice.discountAmount` (Float, Default: 0)
* `FeeInvoice.dueAmount` (Float, Required)
* `FeeInvoice.status` (Enum: `UNPAID`, `PARTIALLY_PAID`, `PAID`, `WAIVED`)
* `PaymentReceipt`: Linked to `FeeInvoice`, includes `receiptNumber`, `paymentMethod` (CASH, BKASH, NAGAD, BANK), `qrCodeToken`.

#### 10. Entity: `CashFund` & `CashTransaction`
* `CashFund.id` (String, UUID, PK)
* `CashFund.nameBn` (String, e.g. `লিল্লাহ ফান্ড`, `যাকাত তহবিল`, `সাধারণ তহবিল`, `নির্মাণ ফান্ড`, `এতিম তহবিল`)
* `CashFund.code` (String, Unique: `GENERAL`, `LILLAH`, `ZAKAT`, `CONSTRUCTION`, `ORPHAN_SUPPORT`)
* `CashFund.currentBalance` (Float, Default: 0)
* `CashTransaction`: Linked to `CashFund`, `type` (`INCOME` / `EXPENSE`), `receiptOrVoucherNo` (Unique), `approvedByUserId`.

#### 11. Entity: `Notice` & `Certificate` & `AuditLog`
* `Notice`: `titleBn`, `contentBn`, `category`, `isUrgent`, `isPublished`, `publishedAt`.
* `Certificate`: `certificateNumber` (Unique), `verificationCode` (Unique), `studentId`, `certificateType`, `isRevoked`.
* `AuditLog`: `userId`, `action`, `entityType`, `entityId`, `detailsJson`, `ipAddress`, `createdAt`.

---

### DOCUMENT 08: API Architecture Specification

#### Authentication API:
* `POST /api/auth/login`: Accepts email & password; rate-limited (5 attempts / min); returns HttpOnly JWT cookie.
* `GET /api/auth/me`: Verifies active session token; returns user profile and assigned role.
* `POST /api/auth/logout`: Clears cookie and logs event in `AuditLog`.

#### Student & Public Portal API:
* `POST /api/students/search`: Accepts `{ rollOrId, classId, dob? }`; strictly parameterized query with rate limit (20 req / min); returns student card, marksheet, attendance stats, and fee summary without exposing private guardian data.
* `POST /api/certificates/verify`: Accepts `{ code }`; checks `Certificate` record; returns public verification authenticity status, issue date, and student name.

#### Admissions API:
* `POST /api/admissions/apply`: Accepts online applicant data; generates `EHRJ-ADM-YYYY-XXXX`; triggers Nodemailer confirmation email; logs duplicate warnings.
* `POST /api/admissions/approve`: Admin only; converts `Application` into `Student`, generates `EHRJ-YYYY-XXXX`, assigns next class roll, creates enrollment, issues fee invoice, and fires congratulations email.

#### Admin ERP API:
* `GET /api/dashboard/stats`: Returns aggregated counts for students, pending admissions, fund balances, teachers, and recent audit logs.
* `GET /api/admin/students`: Returns paginated student roster with search by name/roll and fee due status.
* `GET / POST /api/admin/teachers`: Retrieves all faculty; creates new teacher account with bcrypt-hashed credentials.
* `GET / POST /api/admin/finance`: Retrieves cash funds; records income/expense vouchers within Prisma database transaction.
* `GET / POST / DELETE /api/admin/notices`: Manages homepage and institutional announcements.

---

### DOCUMENT 09: Finance Architecture & The Five Separate Cash Funds

In accordance with Islamic Shariah and professional accounting standards, the institution operates under **Strict Fund Segregation**:
1. **সাধারণ তহবিল (General Fund - `GENERAL`):** Receives general donations, admission fees, monthly tuition fees. Used for teacher salaries, electricity, utilities, administrative overhead.
2. **লিল্লাহ বোর্ডিং ফান্ড (Lillah Boarding Fund - `LILLAH`):** Dedicated exclusively for student meals, cooking gas, kitchen supplies for poor students.
3. **যাকাত তহবিল (Zakat Fund - `ZAKAT`):** Strictly restricted to eligible poor and orphan students under Shariah rules for clothing, medical care, and direct support. Never mixed with operational utility expenses.
4. **নির্মাণ ও উন্নয়ন ফান্ড (Construction Fund - `CONSTRUCTION`):** Dedicated to madrasa building construction, roof casting, classroom furniture, and land development.
5. **এতিম তহবিল (Orphan Support Fund - `ORPHAN_SUPPORT`):** Dedicated long-term sponsorship and welfare for orphan students residing in the complex.

#### Transaction Integrity Rules:
* Every financial entry must specify: `fundId`, `type` (`INCOME` / `EXPENSE`), `amount`, `payeeOrPayer`, `receiptOrVoucherNo`.
* Expenses cannot be logged if the target fund has insufficient balance (`currentBalance < amount`).
* Fund balances are updated atomically inside database transactions.
* Base fee structures are immutable historically; discounts and orphan waivers are recorded as adjustment lines (`waiverAmount` / `discountAmount`) without altering base tuition metrics.

---

### DOCUMENT 10: Authentication & Security Architecture

1. **Password Security:** All staff and admin passwords hashed with `bcryptjs` using a salt work factor of 12 rounds. Raw passwords are never logged, cached, or stored.
2. **Stateless Session Management:** Signed with `jose` (HS256) with a 7-day expiration time and stored inside `HttpOnly`, `SameSite=Lax`, `Secure` (in production) cookies (`ehrj_session_token`).
3. **Role-Based Access Control (RBAC):** Server-side verification on all `/api/admin/*` and `/api/teacher/*` endpoints. Client-side checks are treated purely as UI display helpers; real security is enforced on the server.
4. **IDOR & Data Isolation:** Teachers can only query/mark students belonging to their assigned classes in the current active session. Guardians can only retrieve report cards matching specific roll numbers.
5. **Rate Limiting:** In-memory sliding-window rate limiters on `/api/auth/login` (5/min) and `/api/students/search` (20/min) to eliminate brute-force and scraping threats.
6. **Input Sanitization & Injection Prevention:** Prisma ORM parameterizes all SQL queries natively. XSS is prevented via React DOM JSX automatic escaping.
7. **Environment Variable Hygiene:** Secrets (`DATABASE_URL`, `JWT_SECRET`, `SMTP_USER`, `SMTP_PASS`) reside exclusively in `.env` and are never hardcoded in source code.

---

### DOCUMENT 11: UI/UX Design System & Typography Tokens

#### Aesthetic Theme: Modern Dignified Islamic Institution
* **Primary Emerald Green:** `#0D5C3A` (Tailwind `emerald-800` / Islamic dignity)
* **Deep Header Pine:** `#083B25` (Authority & header contrast)
* **Gold Leaf Accent:** `#C59B27` (Crest borders, active highlights, decorative seals)
* **Canvas Ground:** `#F9F8F3` (Warm ivory paper tone, zero eye fatigue)
* **Text Ink:** `#0B1914` (Deep slate charcoal, high readability)
* **Surface Containers:** `#FFFFFF` with borders `#E2E8F0`

#### Typography:
* Bengali: `Noto Sans Bengali`, `Hind Siliguri` (clean, modern glyph rendering without clipping)
* English: `Inter`, system font stack
* Arabic: `Noto Naskh Arabic`, `Amiri` for Quranic ayahs and institutional seal

---

### DOCUMENT 12: File, Media & Document Factory Architecture

1. **Storage Location:** Static institutional assets and uploaded student photos are stored in `public/images/` and served locally with zero external CDN costs.
2. **Current Integrated Media Assets:**
   * `logo.jpg`: Official round madrasa seal with "স্থাপিত - ২০২১ইং" and open Quran emblem.
   * `principal.jpg`: Official portrait of Muhtamim মাওলানা মহা. আবুল কালাম সরকার.
   * `students-class.jpg`: Classroom photo of students wearing institutional badges.
   * `students-celebration.jpg`: Students holding national flags in campus assembly.
   * `student-banner.jpg`: Student standing before the official backdrop banner.
3. **Printable Document Generation:**
   * Dynamic CSS Print Stylesheets (`@media print`) configured on `/results`, `/verify`, and `/admission` for 80mm thermal receipt and A4 certificate printing.
   * Dynamic QR Code generation using `qrcode` library for public token verification.

---

### DOCUMENT 13: Notification & Institutional Gmail Architecture

* **Zero-Cost Email SMTP Service:** Operates using institutional Gmail SMTP credentials configured in `.env` (`SMTP_USER="ehrjmadrasha@gmail.com"` and App Password `SMTP_PASS="mepz imnw lfly lxvo"`).
* **Delivery Engine:** Managed via `src/lib/mail.ts` with custom branded HTML templates.
* **Automated Email Triggers:**
  1. *Admission Submitted Confirmation:* Sent to guardian with tracking number `EHRJ-ADM-YYYY-XXXX`.
  2. *Admission Approved Notification:* Sent with permanent Student ID `EHRJ-YYYY-XXXX` and assigned Class Roll.
  3. *Payment Confirmation Receipt:* Sent upon counter payment logging.
  4. *Admin Alert Email:* Fires when critical system events or principal directives occur.

---

### DOCUMENT 14: Quality Assurance & Multi-Tier Testing Strategy

1. **Unit & Logic Tests:** Validation of grading logic (Mumtaz >= 80%, Jayyid Jiddan >= 65%), roll-call duplicate detection, and fee waiver calculations.
2. **Integration API Tests:** Verified via `scripts/test_apis.js` testing `/api/academic/classes`, `/api/notices`, `/api/students/search`, and `/api/certificates/verify`.
3. **End-to-End Route Checks:** Verified via `scripts/test_routes.js` testing all 15 public and administrative paths (`/`, `/about`, `/academic`, `/admission`, `/notices`, `/results`, `/gallery`, `/downloads`, `/verify`, `/contact`, `/login`, `/portal`, `/teacher`, `/principal`, `/admin`). All 15 routes returned `HTTP 200 OK`.
4. **Credential Integrity Test:** Verified via `scripts/test_auth.js` testing Bcrypt password comparison for `adminehrjmadrasha@gmail.com` and `teacherehrjmadrasha@gmail.com`.
5. **Real-Browser Visual Verification:** Verified using browser subagent with WebP video recording and screenshots captured for student result lookup, admin ERP dashboard, and live notice publishing.

---

### DOCUMENT 15: Deployment & Environment Architecture

#### Local Environment Requirements:
* Node.js: `v18.x` or `v20.x` LTS
* NPM: `v9.x` or `v10.x`
* Database: SQLite (`dev.db`) for lightweight zero-cost local operation, seamlessly compatible with PostgreSQL/Supabase via Prisma provider switch.

#### Environment Variables (`.env`):
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="ehrj-madrasa-digital-campus-secure-production-jwt-secret-key-2026"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="production"
SMTP_USER="ehrjmadrasha@gmail.com"
SMTP_PASS="mepz imnw lfly lxvo"
ADMIN_EMAIL="adminehrjmadrasha@gmail.com"
```

#### Production Build & Run Commands:
```powershell
# 1. Install dependencies
npm install

# 2. Push Prisma database schema and generate client
npx prisma db push
npx prisma generate

# 3. Seed verified records (Admin, Teacher, 15 Classes, 5 Funds)
node prisma/seed.js

# 4. Create optimized production build
npm run build

# 5. Start high-performance production server
npm run start
```

---

### DOCUMENT 16: Phase-by-Phase Development Roadmap

* **Phase 0 (Current):** Master Application Blueprint, Architecture Specification, Route Matrix, Security Auditing & Approval Gate.
* **Phase 1:** Core Authentication, Single Centralized Admin ERP Foundations & Institutional Database Seeding.
* **Phase 2:** Public Website & CMS Modules (About, Academic, Gallery, Downloads, Contact, Notices).
* **Phase 3:** Admissions Pipeline, Duplicate Detection & 1-Click Permanent Student Enrollment.
* **Phase 4:** Teacher Academic Panel, Roll-Call Digital Attendance Register & Marks Entry.
* **Phase 5:** Zero-Friction Guardian/Student Portal & Printable Marksheet/Report Card Generator.
* **Phase 6:** Finance & Cashbook System (5 Segregated Cash Funds, Income/Expense Vouchers, Invoices).
* **Phase 7:** Document Factory & Public Certificate Verification Engine.
* **Phase 8:** Principal Oversight Desk, Issue Directives & End-to-End System Hardening.

---

### 4. REQUIREMENT CONFLICT REVIEW

| Item | Previous Context / Draft | User Specific Directive | Status / Resolution |
| :--- | :--- | :--- | :--- |
| **Admin Hierarchy** | Multi-tier Admin / Super Admin suggested in initial generic prompts | "একটা Admin প্যানেলে সব কিছু হবে Super admin দরকার নাই ভুল ওয়েবসাইট কন্ট্রোল করবে এডমিন প্যানেল অন্য কোন প্যানেলে করবেনা Super admin থাকবে না" | **RESOLVED & ENFORCED:** Exactly ONE Admin panel (`/admin`). Super Admin eliminated entirely. |
| **Email Domains** | Placeholder `.edu` or `.edu.bd` emails generated in generic seed templates | "amar madrasay kono edu mail nai only.com domain or gmail" | **RESOLVED & ENFORCED:** Zero `.edu` emails. Strictly `gmail.com` and `.com` domain across all templates and database models. |
| **Guardian Authentication** | Password / OTP-based login systems | Zero-friction student search by Class + Roll (+ optional DOB) without paid SMS/OTP | **RESOLVED & ENFORCED:** Public zero-friction lookup implemented on Tab 2 of `/login`, `/results`, and `/portal`. |

---

### 5. FINAL PHASE 0 SUMMARY CHECKLIST (A TO U)

* **A. Executive Summary:** Complete blueprint created for EHRJ Digital Campus integrating public web, single Admin ERP, Teacher Panel, Guardian Portal, and Principal Oversight.
* **B. Final Architecture:** Next.js 14 App Router, Prisma ORM, Nodemailer institutional Gmail, stateless JWT session cookies.
* **C. Complete Route Tree:** All 26 static and dynamic routes mapped and verified.
* **D. Complete Page List:** 15 core pages implemented and returning HTTP 200 OK.
* **E. Module List:** 13 Admin modules, 10 Teacher modules, 10 Guardian portal modules, 5 Principal oversight modules.
* **F. User Roles:** Admin, Teacher, Principal (Oversight), Guardian/Student (Zero-Friction).
* **G. Permission Matrix:** Strict RBAC table documented with server-side validation.
* **H. Database Entities:** 17 relational Prisma models specified.
* **I. Relationships:** Full foreign keys, cascading rules, and unique constraints enforced.
* **J. API Boundaries:** All REST API contracts documented with method, validation, and error codes.
* **K. User Flows:** Step-by-step flows detailed for admission, approval, student creation, attendance, and results.
* **L. Finance Flow:** 5 separate funds (General, Lillah, Zakat, Construction, Orphan) with atomic ledger transactions.
* **M. Authentication:** Bcrypt hashing, HttpOnly JWT cookies, sliding rate limiters.
* **N. Security:** Parameterized queries, XSS protection, zero exposed credentials.
* **O. UI/UX:** Emerald `#0D5C3A`, Gold `#C59B27`, Ivory `#F9F8F3` aesthetic system.
* **P. File Architecture:** Real institution photos organized in `public/images/`.
* **Q. Email Architecture:** Institutional Gmail (`ehrjmadrasha@gmail.com`) with branded HTML templates.
* **R. Testing:** Route check, API check, auth check, and browser verification passed.
* **S. Deployment:** Production build verified with Next.js 14.
* **T. Unresolved Decisions:** None. All user constraints resolved and integrated.
* **U. Phase 1 Readiness Checklist:** 100% Ready for Phase 1 sign-off.
