# Eliotgonj Hazi Rohmatollah Jamiria Madrasha Web Application
## Master Software Architecture & Implementation Plan (PROJECT_PLAN.md)

---

## 1. Executive Summary & Project Vision

### 1.1 Institution Context
**Eliotganj Hazi Rohmatollah Jamiria Madrasha** (ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা) is a renowned Islamic educational institution and orphanage located in Eliotganj, Daudkandi, Cumilla, Bangladesh. The institution provides multi-stream education comprising:
- **Noorani & Maktab Division** (নূরানী ও মক্তব বিভাগ) – Early childhood Quran recitation and foundational Islamic & general literacy.
- **Tahfeez-ul-Quran (Hifz) Division** (হিফজুল কুরআন বিভাগ) – Memorization of the Holy Quran with Sabaq (سبق), Sabqi (سبقی), and Manzil (منزل) monitoring.
- **Kitab Division** (কিতাব বিভাগ) – Comprehensive Islamic jurisprudence, Hadith, Tafsir, and Arabic literature alongside national general curriculum.
- **Orphanage & Lilah Boarding** (এতিমখানা ও লিল্লাহ বোর্ডিং) – Residential lodging, food, medical care, and clothing for orphan and underprivileged students.
- **Darul Ifta / Fatwa & Guidance** (দারুল ইফতা) – Community religious counsel and legal rulings.

### 1.2 The Problem Statement
Currently, administrative, academic, and financial operations are managed manually across physical paper ledgers, printed registers, and cash receipts. This causes:
1. Significant administrative burden during admissions, examination marks calculation, and result compilation.
2. Inefficient tracking of Hifz students' daily progress (Sabaq, Sabqi, Amokhta/Manzil).
3. Risk of human error and lack of transparency in Lilah boarding donations, Zakat/Sadaqah collections, and student fee reconciliation.
4. Absence of instant guardian communication (absence alerts, fees dues, exam results).
5. Lack of a modern digital public portal to showcase the madrasah’s historical legacy, annual conferences (Jalsa/Waz Mahfil), and donor transparency.

### 1.3 The Solution
A unified, state-of-the-art **Web Portal & Integrated Madrasah Management ERP System** engineered with enterprise-grade security, trilingual support (**Bengali, Arabic, and English**), modern Islamic aesthetics, offline-first receipt printing, and complete role-based governance.

---

## 2. Stakeholders & Role-Based Access Control (RBAC)

| Role | Bengali Title | Responsibilities & Access Scope |
| :--- | :--- | :--- |
| **Super Admin / Muhtamim** | মুহতামিম / মহাপরিচালক | Full systemic authority: institutional settings, financials, approvals, audit logs, staff management, role delegation. |
| **Academic Admin / Nazim-e-Taleemat** | নাজিম-এ-তা'লীমাত / শিক্ষা সচিব | Admissions, academic calendars, curriculum, class schedules, exam scheduling, grade validation, teacher allocations. |
| **Teacher / Ustad / Asatizah** | উস্তাদ / শিক্ষক | Daily student attendance, daily Hifz tracking (Sabaq/Sabqi/Manzil), marks entry, student behavioral remarks, syllabus progress. |
| **Accountant / Nazim-e-Maliyat** | নাজিম-এ-মালিয়াত / হিসাবরক্ষক | Fee collection, voucher generation, donations (Zakat, Lilah, General, Sadaqah), vendor expenses, payroll, financial auditing. |
| **Boarding / Hostel Superintendent** | মেস / লিল্লাহ বোর্ডিং তত্ত্বাবধায়ক | Student hostel allocations, daily meal counts, kitchen inventory, food stock ledger, health records. |
| **Student / Talib-e-Ilm** | তালেবে ইলম / শিক্ষার্থী | View own profile, daily routine, exam schedules, digital report cards, fee ledger, library loans. |
| **Guardian / Abhibhabok** | অভিভাবক | Access child's attendance records, Hifz daily progress, fee payment portal, result cards, direct notice desk. |
| **Donor / Mutawalli / General Public** | দাতা / সাধারণ শুভানুধ্যায়ী | Public landing page, institution history, photo gallery, notices, direct online donation (bKash/Nagad/Cards) with instant 80G/e-receipt. |

---

## 3. Technology Stack & Architecture

### 3.1 Architectural Philosophy
- **Modular Monolith / Clean Architecture**: Maximum maintainability, high performance, single repository simplicity with clear separation of concerns (Domain, Application, Infrastructure, Presentation).
- **Responsive Mobile-First UI**: 85%+ of parents, donors, and teachers in Bangladesh access software via mobile smartphones (Android/iOS).
- **Trilingual Localization Engine (i18n)**: Native Bengali (বাংলা) as primary, Arabic (العربية) with proper RTL layout for Quranic/Kitab terms, and English for administrative export/reporting.
- **Print & PDF Engine**: Thermal POS receipt printing for counter collections, and high-fidelity vector PDF generation for ID cards, Admit Cards, and Tabulation Sheets.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER (Next.js 14 App Router)           │
│   Public Portal  │  Admin ERP  │  Teacher App  │  Parent/Student View  │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             APPLICATION & SERVICES LAYER (Server Actions & REST)        │
│  Auth (JWT/Sessions) │ Admissions │ Hifz Tracker │ Accounts │ Exams     │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   DATA & INFRASTRUCTURE LAYER                          │
│   Prisma ORM │ PostgreSQL / SQLite │ Redis Cache │ Cloud Object Store  │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Core Tech Stack Matrix
- **Frontend Framework**: Next.js 14 / React 18 with TypeScript.
- **Styling & Design System**: Tailwind CSS with custom Islamic design tokens (Emerald Green, Gold Foil, Warm Cream, Midnight Slate), Lucide Icons, and `@tailwindcss/forms`.
- **Typography**:
  - Bengali: `Hind Siliguri` & `Noto Sans Bengali` (Google Fonts).
  - Arabic: `Amiri` & `Scheherazade New` (Quranic & Hadith rendering).
  - English & Numbers: `Inter` & `Outfit`.
- **ORM & Database**:
  - Database: PostgreSQL (Production) / SQLite (Local Zero-Config Dev & Automated Test Environment).
  - Schema Management: Prisma ORM with strict foreign-key cascades and indexing.
- **Authentication & Security**:
  - Jose / JWT / Session cookies with `HttpOnly`, `SameSite=Lax`, and `Secure` flags.
  - Password hashing: `bcryptjs` (salt rounds: 12).
  - Rate limiting: Sliding-window memory rate limiter on authentication and payment endpoints.
- **Payment Gateway Integration**:
  - Local MFS Gateways: bKash PGW (Tokenized Checkout), Nagad Direct, Rocket, and SSLCommerz for multi-channel debit/credit cards.
- **Reporting & Document Rendering**:
  - Printable HTML-to-PDF / `@react-pdf/renderer` / Browser Native Print CSS stylesheets with exact `@media print` dimensions (80mm POS receipt, A4 Marksheet, CR80 Student ID card).
- **QR Code & Barcoding**: `qrcode` generator for verifiable student ID cards, fee receipts, and digital result authenticity verification.

---

## 4. UI/UX Design System & Aesthetics

### 4.1 Color Palette
- **Primary Brand / Islamic Emerald**: `#0D5C3A` (Deep Forest Madrasah Green - symbolizes knowledge, peace, and tradition).
- **Primary Accent / Gold Leaf**: `#C59B27` / `#D4AF37` (Islamic geometric illumination and royal accents).
- **Secondary Dark / Deep Night Slate**: `#0B1914` (Header bars, dark-mode surface, high-contrast typography).
- **Neutral Background / Sand & Ivory**: `#F9F8F3` (Soft warm page background reducing eye strain).
- **Card & Surface White**: `#FFFFFF` with soft borders (`#E5E7EB` / `#E2E8F0`).
- **Semantic Feedback**:
  - Success: `#059669` (Passed, Paid, Present)
  - Warning: `#D97706` (Due, Late, Pending Approval)
  - Danger: `#DC2626` (Failed, Absent, Expelled)
  - Info: `#0284C7` (Notices, Announcements)

### 4.2 Micro-Interactions & Usability
- High-contrast touch targets (minimum 44x44px for smartphone finger taps).
- Instant live search & debounce filtering on student tables, fee ledgers, and donor registries.
- Skeleton loaders during data fetch; zero layout shift (CLS < 0.05).
- Print preview modals with dedicated 1-click thermal receipt printing.

---

## 5. Functional Module Specifications

### Module 1: Institutional Public Portal & Landing Page
1. **Hero Section**:
   - High-resolution campus presentation, institution name in Arabic calligraphy, Bengali, and English.
   - Core statistics counter: Total Students, Qualified Hafiz-e-Quran, Dedicated Teachers, Orphan Beneficiaries.
   - Quick CTA: "ভর্তি আবেদন" (Online Admission) & "দান করুন / ডোনেশন" (Donate Now).
2. **About & History**:
   - Founding story of Hazi Rohmatollah, foundation year, mission, vision, and Muhtamim's official message.
3. **Departments & Courses**:
   - Noorani & Najera, Tahfeez-ul-Quran, Kitab (Mizan to Daura-e-Hadith/Masters equivalent), Modern General Education (Bangla, English, Math, ICT).
4. **Notice & Circular Board**:
   - Searchable, downloadable PDF circulars (Admission notice, Vacation announcements, Jalsa schedules).
5. **Photo & Video Gallery**:
   - Campus infrastructure, Prize distribution ceremonies, Annual Dastarbandi (দস্তারবন্দী মাহফিল - Hifz graduation).
6. **Prayer Times & Hijri Calendar Widget**:
   - Daily 5 waqt Salah timing for Cumilla/Eliotganj district with current Hijri date calculation.
7. **Contact & Location**:
   - Interactive Google Map embed, emergency contact numbers, email, and social links.

---

### Module 2: Online Admission & Student Registration
1. **Public Admission Application Form**:
   - Student Full Name (Bangla & English), Date of Birth, Birth Registration Certificate No (BRN).
   - Father's & Mother's details, Guardian NID, WhatsApp number, emergency contact.
   - Department selection (Noorani, Hifz, Kitab, Day-care / Residential / Orphan Lilah).
   - Previous madrasah/school information and upload of passport photo.
2. **Admission Processing Workflow**:
   - `Submitted` ➔ `Admit Card Generated` ➔ `Admission Exam / Interview` ➔ `Approved / Rejected` ➔ `Roll & Section Allocated`.
3. **Automated Admit Card**:
   - Downloadable printable PDF with unique Application Tracking PIN and venue instructions.

---

### Module 3: Tahfeez-ul-Quran (Hifz) Digital Tracker
*A specialized module designed for traditional Quranic pedagogy:*
1. **Daily Sabaq (سبق - New Lesson)**:
   - Para number, Surah, Ayah range, quality rating (Mumtaz/A+, Jayyid Jiddan/A, Jayyid/B, Maqbool/C, Daaif/Needs Repeat).
2. **Sabqi (سبقی - Recent Quarter / Half Para Review)**:
   - Tracking daily review of the current ongoing Para (আমপারা / সংশ্লিষ্ট পারা).
3. **Amokhta / Manzil (منزل - Distant Revision)**:
   - Daily 1/2 to 1 Para recitation from past memorized Paras to preserve Quran retention.
4. **Parent Progress View**:
   - Real-time progress bar: "Total Paras Completed: 18 / 30", current memorization speed, and teacher remarks.

---

### Module 4: Student Information System (SIS) & Digital ID Cards
1. **Comprehensive Student Master Record**:
   - Student Unique ID (Format: `ERJM-YYYY-DEPT-XXXX`), Blood group, Medical notes, Guardian contact.
2. **Status Tracking**:
   - Active, Transferred (Chharpotro/ছাড়পত্র), Graduated (Hafiz/Alim), Boarding Resident, Non-Resident.
3. **Digital Smart ID Card Generator**:
   - Dual-sided CR80 standard printable format with student photo, barcode, and QR code pointing to online verification URL.

---

### Module 5: Attendance & Leave Management
1. **Daily Attendance Register**:
   - Bulk class-wise marking: `Present` (উপস্থিত), `Absent` (অনুপস্থিত), `Late` (দেরি), `Excused Leave` (ছুটি).
2. **Teacher & Staff Attendance**:
   - Daily punch-in/punch-out tracking with monthly deduction logic for unapproved absences.
3. **SMS Gateway Alerts**:
   - Automatic trigger: When a day-care student is marked absent without prior notice, an instant SMS alert is prepared for the guardian's phone.

---

### Module 6: Examination, Marks & Tabulation Sheet (Natija)
1. **Exam Configuration**:
   - First Term (প্রথম সাময়িক), Mid Term (দ্বিতীয় সাময়িক), Annual (বার্ষিক পরীক্ষা), and Monthly Evaluation (মাসিক মূল্যায়ন).
2. **Subject & Grading Scheme**:
   - Quran, Hadith, Fiqh, Nahw-Sarf, Arabic Literature, Bengali, English, Mathematics, General Science.
   - Madrasah standard grading system:
     - `Mumtaz` (মুমতাজ - 80% to 100%)
     - `Jayyid Jiddan` (জায়্যিদ জিদ্দান - 65% to 79%)
     - `Jayyid` (জায়্যিদ - 50% to 64%)
     - `Maqbool` (মাকবুল - 33% to 49%)
     - `Rasib` (রাসিব / ফেল - 0% to 32%)
3. **Tabulation Sheet & Transcripts**:
   - One-click generation of institutional marksheets (নম্বরপত্র / রেজাল্ট কার্ড) with official watermark and Muhtamim signature line.
4. **Public Result Portal**:
   - Public search portal where parents enter Student ID and Exam Session to view/download results.

---

### Module 7: Accounts, Fee Management & Money Receipts
1. **Fee Structures**:
   - Admission fee, monthly tuition fee, residential boarding charges, examination fee, book charges.
   - Concession / Scholarship / Free-ship discount tags for orphan and needy students.
2. **Counter Fee Collection (Cash Counter)**:
   - Select student ID ➔ Pending dues load automatically ➔ Enter amount ➔ Select Cash / bKash / Nagad ➔ Print dual receipt (1 for Student, 1 for Madrasah copy).
3. **Income & Expense Book (Cashbook)**:
   - Multi-category accounting: General Fund, Lilah Boarding Fund, Mosque Fund, Construction Fund, Staff Salary.
   - Daily, Monthly, and Annual Income vs Expense reports with balance sheet export.

---

### Module 8: Lilah Boarding, Orphanage & Sponsor-A-Yateem
1. **Orphan & Underprivileged Register**:
   - Verification documents, guardian death certificates, financial background verification.
2. **Donor "Sponsor An Orphan" Portal**:
   - Direct sponsorship options (Monthly 2,500 BDT or Annual 30,000 BDT for food, accommodation, and books).
   - Anonymized student progress reports sent securely to the sponsor.
3. **Mess & Food Inventory**:
   - Daily grocery purchase log (Rice, lentils, oil, fish, meat), daily student meal attendance, stock depletion warnings.

---

### Module 9: Online Donations & Donor Transparency Desk
1. **Multi-Channel Donations**:
   - Zakat Fund (যাকাত ফান্ড - strictly shariah-compliant for Lilah boarding & poor students).
   - Sadaqah & Lilah Boarding Fund (সদকা ও বোর্ডিং তহবিল).
   - Madrasah Construction & Development Fund (উন্নয়ন ও নির্মাণ তহবিল).
   - General Charity / Lillah Jafiran Fund.
2. **Instant Donation Verification & Money Receipt**:
   - Donors receive an automated PDF Money Receipt with institution registration number and official seal.
3. **Top Donors & Waqf Register**:
   - Permanent donors (আজীবন সদস্য / মুতাওয়াল্লী) registry with dedicated ledger.

---

### Module 10: Human Resources & Staff Payroll
1. **Faculty & Staff Directory**:
   - Teacher profiles, educational credentials (Doraim/Kamil/Qawmi certificates), designation, appointment date.
2. **Monthly Payroll Automation**:
   - Basic salary, housing allowance, meal allowance, advance deductions, final monthly salary disbursement slip.
3. **Teacher Leave Ledger**:
   - Casual leave, sick leave, Eid vacation records.

---

## 6. Database Schema Design (Prisma Data Model)

```mermaid
erDiagram
    User ||--o{ Student : "guardian_of"
    User ||--o{ Staff : "staff_profile"
    Student ||--o{ HifzLog : "has_logs"
    Student ||--o{ Attendance : "records"
    Student ||--o{ ExamMark : "receives"
    Student ||--o{ FeeInvoice : "billed"
    FeeInvoice ||--o{ PaymentTransaction : "settled_by"
    Donation ||--o{ PaymentTransaction : "processed_as"
    Exam ||--o{ ExamMark : "contains"
    Course ||--o{ ExamMark : "graded_in"

    User {
        string id PK
        string username UK
        string email UK
        string phone UK
        string passwordHash
        string role
        string status
        datetime createdAt
    }

    Student {
        string id PK
        string studentIdNumber UK
        string fullNameBn
        string fullNameEn
        string department
        string currentClass
        int rollNumber
        boolean isResidential
        boolean isOrphan
        string guardianPhone
        string bloodGroup
        string status
    }

    HifzLog {
        string id PK
        string studentId FK
        date logDate
        int sabaqPara
        int sabaqPage
        string sabaqQuality
        string sabqiStatus
        string manzilStatus
        string teacherRemarks
    }

    FeeInvoice {
        string id PK
        string studentId FK
        string invoiceNumber UK
        string feeCategory
        decimal amount
        decimal discountAmount
        decimal netAmount
        decimal paidAmount
        string status
        date dueDate
    }

    Donation {
        string id PK
        string receiptNumber UK
        string donorName
        string donorPhone
        string donorEmail
        string donationType
        decimal amount
        string paymentMethod
        string status
        datetime timestamp
    }
```

---

## 7. Phased Implementation Roadmap & Verification Plan

```
PHASE 1: Foundation & Public Identity
├── Project Architecture & Tailwind Islamic Theme Setup
├── Multilingual i18n & Static Landing Page
├── Public Notices, Photo Gallery & Waqt Prayer Clock
└── Verified & Tested: Browser Responsive & Fast LCP < 1.2s

PHASE 2: Authentication, SIS & Admissions
├── RBAC System (Admin, Teacher, Accountant, Guardian)
├── Student Lifecycle & Admissions Workflow
├── Digital CR80 ID Card & Admit Card Generator with QR Code
└── Verified: CRUD + Security & Persistence Testing

PHASE 3: Academic, Attendance & Hifz Tracker
├── Classroom Management & Syllabus Schedules
├── Daily Attendance Engine with SMS Payload Prep
├── Tahfeez-ul-Quran (Hifz) Daily Sabaq/Sabqi/Manzil Ledger
└── Verified: Teacher UI test on mobile viewport + data persistence

PHASE 4: Examination, Grading & Report Cards
├── Exam Creation & Mark Entry Portal
├── Automatic Grading Algorithm (Mumtaz, Jayyid, Maqbool, Rasib)
├── High-Fidelity Vector PDF Marksheet & Public Result Check
└── Verified: Calculation checks + PDF download & print alignment

PHASE 5: Accounts, Fees, Lilah & Donation Gateway
├── Fee Invoicing & Dual-copy POS Receipt Printing
├── Cashbook & Multi-fund Ledger (Zakat, Lilah, General)
├── Online Donation Gateway (bKash/Nagad/SSLCommerz Mock & Live)
├── Lilah Boarding Grocery & Meal Inventory
└── Verified: Financial audit balance + Replay attack prevention

PHASE 6: Hardening, Regression Testing & Final Delivery
├── OWASP Security Audit (IDOR, XSS, CSRF, SQLi verification)
├── Cross-device testing (Mobile, Tablet, Desktop)
├── Automated E2E User Flow Tests
└── Final Signoff & Comprehensive Documentation

PHASE 36: Alumni, Former Student & Community Relationship Management Engine (EHRJ-AI-2026-PHASE36)
├── Core Invariant: Relationship layer, zero student master duplication
├── Verification Engine (Pending -> Verified -> Active -> Opted Out -> Archived)
├── Privacy Sanitization & Anti-Scraping Defense (Max 50 records/query)
├── Community Groups (Batch Year, Professional, Regional, Volunteer)
├── Controlled Mentorship Workflow (Student Request -> Admin Facilitation -> Connection)
├── Volunteer Opportunities & Verified Service Hours Ledger
├── Financial Contributions linked to Phase 6 Funds (Zakat, Lillah, etc.) & In-kind gifts
├── Legacy Batch Import Engine with Phone/Email/Name-Year Duplicate Diagnostics
├── Portals: Public Directory (/alumni/directory), Personal Portal (/portal/alumni), Admin Cockpit (/admin/alumni)
└── Verified: 37/37 Phase 36 Tests Passed, 233/233 Cumulative Regression Tests Passed

PHASE 37: Institutional Survey, Feedback, Assessment & Voice-of-Community Engine (EHRJ-AI-2026-PHASE37)
├── Core Invariant: Feedback informs decisions; never autonomously makes high-stakes decisions (assertNoHighStakesDecisionMutation)
├── Survey Lifecycle State Machine (DRAFT -> REVIEW -> APPROVED -> PUBLISHED -> OPEN -> CLOSED -> ANALYZING -> COMPLETED -> ARCHIVED)
├── Immutable Published Versions (v1 -> v2) preserving historical response binding
├── Audience Snapshot captured at publication
├── Response Modes: Identified, Pseudonymous, and Anonymous with technical PII segregation
├── Small-Group Protection (< 5 response threshold suppression)
├── Conditional Question Visibility Engine & Option Validation
├── Response Engine with Duplicate Protection & Save/Resume Draft
├── Bounded AI Qualitative Theme Summaries (permanently tagged humanReviewRequired: true)
├── Institutional Improvement Actions Lifecycle & Phase 14 Help Desk Ticket Bridge (EHRJ-REQ-YYYY-XXXXXX)
├── Strictly NO SMS (Portal, In-app notice, Email)
├── Frontend: Public Hub (/surveys), Interactive Form (/surveys/[id]), Portal (/portal/surveys), Admin Cockpit (/admin/surveys, /admin/surveys/[id])
└── Verified: 43/43 Phase 37 Tests Passed, 276/276 Cumulative Regression Tests Passed

PHASE 38: Institutional Knowledge, SOP, Policy, Handbook & Governance Document Management Engine (EHRJ-AI-2026-PHASE38)
├── Core Invariant: One authoritative policy, one controlled version; Phase 38 owns authority, Phase 22 owns RAG
├── Document Master Engine (Policies, SOPs, Handbooks, Guidelines, Rules, Memos)
├── Lifecycle State Machine (DRAFT -> UNDER_REVIEW -> APPROVED -> PUBLISHED -> EFFECTIVE -> SUPERSEDED -> EXPIRED -> ARCHIVED -> WITHDRAWN)
├── Immutable Versioning (v1.0 -> v1.1 minor, v2.0 major) preserving historical versions
├── Historical Effective-Date Engine: Resolves authoritative policy version for any past date
├── Legal Hold / Institutional Hold: Prevents archival, withdrawal, or deletion under legal/administrative inquiry
├── Principal Oversight & Approval Workflow with detailed audit provenance
├── Mandatory Role-Targeted Digital Acknowledgements (Teachers, Staff) & Compliance Metrics
├── Automated Policy Conflict Detection Scanner (Duplicate categories, overlapping dates, superseded collisions)
├── Authorized, Scoped & Time-Bounded Policy Exceptions Management
├── SOP Operational Steps Engine with Roles, Decision Points & Phase 27 Workflow Links
├── Handbook Engine with Multi-Level Table of Contents Navigation
├── Phase 22 RAG Sync Bridge: Auto-syncs approved/effective policies to Phase 22 knowledge store
├── Strictly NO SMS (In-app portal notices & calendar reminders only)
├── Frontend: Public Knowledge Hub (/knowledge), User Acknowledgement Console (/portal/knowledge), Admin Cockpit (/admin/knowledge, /admin/knowledge/documents, /admin/knowledge/reviews, /admin/knowledge/acknowledgements, /admin/knowledge/conflicts)
└── Verified: 55/55 Phase 38 Tests Passed, 173/173 Next.js Routes Production Build Clean

PHASE 39: Teacher/Staff Training, Professional Development & Certification Engine (EHRJ-AI-2026-PHASE39)
├── Core Invariants: Phase 13 owns authoritative employee master; training attendance separate from HR/payroll; assessment does not affect academic grades
├── Training Program Lifecycle (DRAFT -> REVIEW -> APPROVED -> PUBLISHED -> REGISTRATION_OPEN -> SCHEDULED -> IN_PROGRESS -> COMPLETED -> ARCHIVED)
├── Session Scheduling with Phase 33 Calendar Synchronous Payload
├── Transactional Participant Enrollment with Strict Capacity Validation & Automatic Waitlisting
├── Training Attendance Engine with QR Verification & Recalculated Attendance Percentage
├── Professional Assessment Engine with Answer Key Redaction, Automated Quiz Grading & Instructor Evaluation
├── Verifiable Certificate Engine with Phase 7/29 Tokens (VER-TRN-YYYY-XXXX) & Idempotent Issuance
├── Certificate Validity & Expiration Renewal Workflow (VALID -> EXPIRING_SOON -> EXPIRED -> RENEWED)
├── Phase 13 Non-Duplicative Employee Training Profile Integration Bridge & Professional Development Plans
├── Strictly NO SMS (In-app portal alerts and calendar schedules only)
├── Frontend: Admin Cockpit (/admin/training, /admin/training/programs, /admin/training/sessions, /admin/training/participants, /admin/training/assessments, /admin/training/certificates, /admin/training/renewals)
├── Frontend: Teacher/Staff Portal (/portal/training, /portal/training/[id], /portal/training/certificates)
PHASE 40: Institutional Procurement, Vendor, Contract & Supplier Relationship Management Engine (EHRJ-AI-2026-PHASE40)
├── Core Principles: "One procurement truth, one financial truth, one vendor truth" & "Automate the process, not the authority"
├── Non-Duplicative Architectural Boundaries: Phase 40 owns supplier/contract relationship layer; Phase 12 owns stock/inventory; Phase 6 owns accounting/cashbook; Phase 41 owns budgets
├── Vendor Master Engine: EHRJ-VEN-YYYY-XXXX institutional IDs, 7-state lifecycle (DRAFT, PENDING_VERIFICATION, ACTIVE, SUSPENDED, BLOCKED, INACTIVE, ARCHIVED)
├── Controlled Supplier Onboarding, bank account masking (•••• •••• XXXX), duplicate vendor detection (matching phone/tax/name warnings)
├── Multi-Point Verification Engine (Identity, Trade License, TIN/Tax, BIN/VAT, Bank Account, Contract Compliance) with auditor provenance
├── Phase 29 Document Intelligence Bridge: References file tokens without duplicate document storage
├── Multi-Contact Directory with primary contact flags and historical preservation
├── 15 Configurable Procurement Categories (Food, Books, Stationery, Furniture, IT, Electronics, Construction, Electrical, Plumbing, Transport, Cleaning, Maintenance, Services, Training, Other)
├── RFQ Engine: EHRJ-RFQ-YYYY-XXXX with lifecycle (DRAFT -> OPEN -> CLOSED -> EVALUATION -> AWARDED -> CANCELLED)
├── Quotation Management & Immutable Versioning (v1 -> v2) preserving revision lineage, terms, and attachments
├── Objective Multi-Vendor Comparison Matrix (Lowest price, delivery days, warranty, past on-time delivery rate) with ZERO autonomous awards
├── Committee Evaluation & Principal Approval Engine: Permanent human authority decision recording (no autonomous AI ranking)
├── Institutional Contract Engine: EHRJ-CON-YYYY-XXXX with immutable version snapshots (v1, v2...) on revisions
├── Automated Expiry & Renewal Scanning Engine (90, 60, 30, 7 days renewal alert thresholds)
├── Non-Duplicative Three-Way Matching Bridge: PO (Phase 12) + Goods Receipt (Phase 12) + Invoice/Cashbook (Phase 6)
├── Factual Vendor Performance Scorecards (On-time delivery %, quality compliance %, disputes, average response days)
├── Vendor Periodic Review & Institutional Risk Records (Single source, financial dependency, delivery instability)
├── Conflict-of-Interest Declaration Register with formal review states (DECLARED, CLEARED, RECUSED)
├── Phase 30 Global Search Integration: Exact ID indexing with strict RBAC (ADMIN/PRINCIPAL discovery only, Teacher/Guardian/Public blocked)
├── Phase 33 Institutional Calendar Bridge: Syncs contract expiries and RFQ submission deadlines
├── 14 Institutional Report Engines: Vendor Master, Verification, Compliance, RFQ Register, Quotation Comparison, History, Contract Register, Expiry, Renewals, Performance, Delivery, Budget, Finance, Risk (Print/PDF ready)
├── Strictly NO SMS (In-app portal notices & calendar reminders only)
├── Frontend UI: /admin/procurement, /admin/vendors, /admin/vendors/new, /admin/vendors/[id], /admin/procurement/quotations, /admin/procurement/evaluations, /admin/contracts, /admin/contracts/[id], /admin/contracts/renewals
└── Verified: 60/60 Phase 40 Engine & Security Tests Passed, 7/7 Live UI Routes Verified 200 OK (HTTP Status 200, ~41.6KB Rendered Payload), 0 TypeScript Compilation Errors

PHASE 41: Institutional Budget Planning, Financial Planning & Budget Control Engine (EHRJ-AI-2026-PHASE41)
├── Core Principle: Plan the money, control the money, but never duplicate the accounting source of truth
├── Core Invariant: Automate the process, not the authority (AI advisory only, human approval required)
├── Shariah & Institutional Fund Segregation (General, Lillah, Zakat, Construction, Orphan)
├── Zakat Expense Rule Enforcement: Strictly limited to student welfare, cloth, medical; building/admin blocked
├── Budget Period Governance (Financial Years & Academic Sessions with lock toggles)
├── Budget Lifecycle State Machine (DRAFT -> PREPARATION -> UNDER_REVIEW -> APPROVED -> ACTIVE -> REVISED -> CLOSED -> ARCHIVED)
├── Immutable Version Snapshots (v1, v2, v3...) generated on formal human approval
├── Budget Line Items with linear 12-month allocation profiles and fund classification
├── Calculation Engine: Remaining amount, utilization %, favorable/unfavorable variance, fund summaries
├── Soft Control Threshold Engine: 80% Warning, 90% Critical, 100%+ Overrun alerts with human acknowledgment
├── Budget Revision Workflow with line diff calculation, reason documentation, and version promotion
├── CapEx Capital Development Projects (Linked construction and physical infrastructure budgets)
├── Non-Duplicative Integration Bridge: Real-time link to Phase 6 CashTransaction, Phase 12 POs, Phase 13 Payroll
├── Strictly NO SMS (In-app portal alerts and calendar schedules only)
├── Frontend: Admin Budget Console (/admin/budgets, /admin/budgets/periods, /admin/budgets/new, /admin/budgets/[id], /admin/budgets/[id]/versions, /admin/budgets/[id]/revisions, /admin/budgets/[id]/variance, /admin/budgets/projects)
└── Verified: 79/79 Phase 41 Tests Passed, 157/157 Cumulative Phase 38-41 Regression Tests Passed, Next.js Production Build Clean across 190+ routes

PHASE 42: Institutional Risk Management, Internal Control & Governance Assurance Engine (EHRJ-AI-2026-PHASE42)
├── Core Principles: "Identify risk. Control risk. Verify control. Evidence the result." & "Automate the process, not the authority"
├── Non-Duplicative Architectural Boundaries: Operates strictly above operational stores (Phase 6 Finance, Phase 12 Inventory, Phase 13 HR, Phase 16 Operations, Phase 17/24 Security, Phase 25 Data Governance, Phase 40 Vendor, Phase 41 Budget)
├── Risk Register Engine: EHRJ-RISK-YYYY-XXXX institutional IDs, 10-state lifecycle (OPEN to ARCHIVED), 10 configurable categories
├── 5x5 Scoring & Residual Risk Matrix: Inherent score (Likelihood x Impact) mitigated to Residual score via verified controls
├── Strict Human Authority Gates: Principal-only risk acceptance & finding closure; non-empty justification & resolution evidence enforced
├── Internal Control Register: EHRJ-CTRL-YYYY-XXXX, Preventive/Detective/Corrective/Hybrid types, 9 frequency tiers
├── Formal Control Testing Engine: Records sample population, test method, expected vs actual result, and updates lastTestResult
├── Documented Control Exceptions & Compensating Controls: Time-bounded validity with automated expiration scanning (Section 39)
├── Internal Audit Findings & Anti-Silent-Closure: EHRJ-FND-YYYY-XXXX, root-cause taxonomy, verified closure gate (Section 19)
├── Corrective & Preventive Actions (CAPA): EHRJ-ACT-YYYY-XXXX, due dates, assignee tracking, and overdue alert queries
├── Governance Review Sessions & Calendar Sync: EHRJ-REV-YYYY-XXXX, decisions record, auto-sync to Phase 33 Calendar (EventSourceModule = "GOVERNANCE")
├── Universal Search Integration: Phase 30 indexed with strict RBAC (ADMIN/PRINCIPAL only; TEACHER & GUARDIAN return 0 results)
├── 12 Institutional Reports Engine: Risk Register, Assessment, Control Register, Effectiveness, Findings, CAPA, Overdue, Exceptions, Reviews, Assurance, Trend, Control Gap
├── Strictly NO SMS (In-app portal alerts and calendar schedules only)
├── Frontend UI: /admin/governance, /admin/governance/risks, /admin/governance/risks/new, /admin/governance/risks/[id], /admin/governance/controls, /admin/governance/findings, /admin/governance/actions, /admin/governance/reviews, /admin/governance/exceptions
└── Verified: 78/78 Phase 42 Tests Passed, 0 TypeScript Errors, 11 Live HTTP Routes Verified (Strict 403 on unauthenticated APIs, 307 on UI guards)

PHASE 43: Institutional Compliance Obligation, Requirement Tracking & Compliance Assurance Engine (EHRJ-AI-2026-PHASE43)
├── Core Principles: "Know the requirement. Assign the obligation. Track the evidence. Verify compliance." & "Automate the process, not the authority"
├── Non-Duplicative Architectural Boundaries: Operates above Phase 38 (Policies), Phase 40 (Contracts), Phase 42 (Risks/Controls), Phase 6 (Finance), Phase 13/39 (HR/Training), Phase 29 (Documents)
├── Requirement Master Engine: EHRJ-REQ-CMP-YYYY-XXXX institutional IDs, versioning (v1, v2...), 10 configurable sources, 8 categories
├── Section 9 & 40 Anti-Silent Exclusion Rule: Applicability modifications require mandatory reason, reviewer identity, and evidence references
├── Compliance Obligations Queue: EHRJ-COMP-YYYY-XXXX, 11 frequency tiers, 13 lifecycle statuses, responsibility matrix (RACI)
├── Evidence Reference & SHA-256 Hashing: Phase 29 token linkage without binary file duplication; Section 15 human verification gate
├── Formal Compliance Reviews: EHRJ-REV-CMP-YYYY-XXXX with 7-point assessment checklist and Principal-only decision recording
├── Controlled Exceptions & Compensating Controls: EHRJ-EXC-CMP-YYYY-XXXX with time-bounded validity and automated expiry detection
├── Remediation & CAPA Tracking: EHRJ-REM-CMP-YYYY-XXXX, root cause taxonomy, Section 19 verified closure gate
├── Phase 33 Calendar Synchronous Sync: Automatically pushes obligation deadlines to institutional calendar (EventSourceModule = "COMPLIANCE")
├── Universal Search Integration: Phase 30 indexed with strict RBAC (ADMIN/PRINCIPAL only; TEACHER & GUARDIAN return 0 results)
├── 12 Institutional Compliance Reports: Requirements, Obligations, Status, Overdue, Evidence, Expiry, Exceptions, CAPA, Policy Mapping, Control Mapping, Contracts, Management Assurance
├── Strictly NO SMS (In-app portal alerts and calendar schedules only)
├── Frontend UI: /admin/compliance, /admin/compliance/requirements, /admin/compliance/requirements/new, /admin/compliance/requirements/[id], /admin/compliance/obligations, /admin/compliance/obligations/[id], /admin/compliance/reviews, /admin/compliance/evidence, /admin/compliance/exceptions, /admin/compliance/remediation, /admin/compliance/reports
└── Verified: 38/38 Phase 43 Tests Passed, 0 TypeScript Errors, 19 Live HTTP Endpoints Verified (Strict 403 on unauthenticated APIs, 307 on UI guards)

PHASE 44: Final Gap Analysis, Architecture Consolidation & System Completeness Engine (EHRJ-AI-2026-PHASE44)
├── Core Principles: "Do not add features just to make the system look complete. Find what is actually missing, broken, duplicated, disconnected, unsafe or unverified" & "Code changed ≠ task completed"
├── Authoritative Source-of-Truth Map: Explicitly defines single ownership, mutator/reader roles, calculations, and invariants across all 43 institutional domains
├── Exhaustive Phase 1–43 Coverage Matrix: Complete registry of capabilities, stores, APIs, UI routes, and test suites
├── Architectural Duplication & Collision Audit: 8 cross-module collision vectors audited and resolved (Student, Finance, Inventory, Documents, Communications, Risk vs Compliance, Policy vs RAG, HR vs Training)
├── Security & Secret Hygiene Audit: Zero plaintext keys, sliding-window rate limiters, IDOR protection, and server-side RBAC validation
├── Financial & Shariah Integrity Audit: 5-fund segregation (General, Lillah, Zakat, Construction, Orphan), Zakat expense constraints, and idempotent payments
├── Human-in-the-Loop Governance: Strict enforcement of "AI assists, authorized humans decide"; zero autonomous high-stakes mutations
├── Communication Policy Audit: Strictly NO SMS invariant enforced across all dispatchers and notification outboxes
├── Master Completeness Diagnostic Engine: Programmatic scanner in src/lib/systemCompleteness/ and live endpoint /api/admin/completeness
├── Canonical Navigation Consolidation: Redirected /admin/communication to canonical /admin/communications cockpit
├── Master Gap Report: Comprehensive 20-section report in docs/PHASE_44_COMPLETION_REPORT.md
└── Verified: 261/261 Phase 44 Tests Passed, 0 TypeScript Compilation Errors, Live HTTP Endpoint Verified, Gate Status: READY_FOR_PHASE45

PHASE 45: Final System Integration, Production Hardening, Full QA & UAT Engine (EHRJ-AI-2026-PHASE45)
├── Core Principles: "Integrate everything. Verify everything. Trust nothing without evidence" & "Code changed ≠ task completed"
├── Production Release Candidate: Build version 1.0.0-RC1 created and baseline locked
├── Phase 44 Remediation Verification: 100% verified (canonical routing, Shariah Zakat expense constraint, anti-silent exclusion)
├── Master UAT Journey Suite: 19/19 User Journeys PASSED across all 5 Personas (Admin, Principal, Teacher, Guardian, Public)
├── Persona-Specific Isolation: Strict Guardian-Student IDOR boundary and Teacher academic scope verified
├── Controlled Backup & Restore Drill: Byte-exact SHA-256 cryptographic match (c6bb9097750a04c6...) restored in 186ms
├── Production Security Hardening: RBAC, IDOR, SQLi, XSS, CSRF, rate limiters, secure cookies, and security headers verified
├── Performance Benchmarking: Sub-120ms average latency across key routes (/api/health: 115ms, /admission: 114ms, /notices: 88ms)
├── Live HTTP Endpoint Probing: /api/admin/release-candidate returns strict 403 Forbidden for unauthenticated calls
├── Production Readiness Audit: All 11 checklist gates verified; 0 P0 blockers, 0 open P1 issues
├── Release Candidate Report: Comprehensive 17-section report in docs/PHASE_45_COMPLETION_REPORT.md
└── Final Release Decision: GO (Unconditionally Approved for Phase 46 Production Launch & Go-Live)
```


---

## 8. Definition of Done (DoD) & Verification Criteria
Following the **Universal Master Software Build Rule**:
1. **Design Integrity**: Vibrant Islamic aesthetics, emerald-gold palette, clean typography, responsive layout across all screen breakpoints.
2. **Data Persistence**: Zero mock reliance in final integration—every form submission must persist to the database and survive application restarts.
3. **Print Precision**: All receipts (80mm), admit cards (A4), and result cards must render cleanly in print mode without clipping or overflow.
4. **Security Hardening**: Strict server-side RBAC validation on all routes and Server Actions; passwords hashed with bcrypt; parameterized SQL via Prisma.
5. **Real User Verified**: End-to-end user journeys tested from public admission submission to accountant approval, attendance tracking, and marksheet generation.
