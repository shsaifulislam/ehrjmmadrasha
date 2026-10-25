# EHRJ Madrasha ERP — Multi-Role Flutter Application & Architecture Audit Report

**Document Identifier:** `docs/FLUTTER_TEACHER_APP_AUDIT.md`  
**Checkpoint:** `EHRJ-AI-2026-FLUTTER-AUDIT-PHASE-0`  
**Date of Audit:** October 17, 2026  
**Auditor / Engineering Agent:** Antigravity AI Senior Architect & Full-Stack Team  
**Institution:** Eliotganj Hazi Rohmatollah Jamiria Madrasha (EHRJ Madrasha)  
**Scope:** Full Institutional Multi-Role Application (Admin, Principal, Teacher, Student, Guardian, Accountant, Public Visitors)  
**Status:** **PHASE 0 AUDIT COMPLETE & RATIFIED**

---

## 1. Executive Mission & Project Scope

The Eliotganj Hazi Rohmatollah Jamiria Madrasha (EHRJ Madrasha) ERP system is being extended with a production-grade Flutter application (`ehrj_flutter_app`). In accordance with the updated master prompt, the application expands beyond single-role teacher functionality to serve the **entire madrasa community** across 7 distinct roles:

1. **Admin (মুহতামিম / অ্যাডমিন):** Complete institutional oversight, user management, academic schedules, finance audit, notices, and system configuration.
2. **Principal / Head of Madrasa (অধ্যক্ষ / শিক্ষা সচিব):** Academic supervision, teacher leave approvals, student admissions review, and institutional operations.
3. **Teacher (উস্তাদ / শিক্ষক):** Class roster management, daily attendance, examination mark entry with offline drafts, class routines, lesson plans, and leave applications.
4. **Student (শিক্ষার্থী):** Personal class routine, attendance records, exam results/marksheets, library books, and madrasa notices.
5. **Parent / Guardian (অভিভাবক):** Children's real-time attendance, progress reports, tuition and exam fee payment status, gate pass requests, and teacher communications.
6. **Accountant / Finance Staff (হিসাবরক্ষক):** Fee invoice generation, quick payment collection, daily cash book monitoring, and donation receipts.
7. **Public Visitors & Applicants (সাধারণ দর্শনার্থী ও ভর্তিচ্ছু শিক্ষার্থী):** Institution history, curriculum details, public circulars/notices, photo gallery, online admission form submission, donation bank details, and document/ID card QR verification.

**Core Invariant:**  
`CODE CHANGED != TASK COMPLETED.`  
Every module must integrate with the existing verified backend without fabricating mock success, violating role boundaries, or creating duplicate databases.

---

## 2. Environment, Toolchain & Device Inspection

### 2.1 Host Environment & Dependencies
- **Operating System:** Windows 11 Enterprise (Build `26H2`, Version `10.0.26300.9711`)
- **Flutter SDK Version:** `3.47.7` (Channel `stable`, revision `abaf9c5237`)
- **Dart SDK Version:** `3.13.5` (DevTools `2.60.0`)
- **Node.js Environment:** `v20.18.0` (Active on existing Next.js backend)
- **Local ERP Backend Server:** Running on `http://localhost:3000` (Process `task-4202`), Health API: `HEALTHY`

### 2.2 Available Target Platform Toolchains (`flutter doctor`)
```text
[√] Flutter (Channel stable, 3.47.7, on Microsoft Windows, locale en-US)
[√] Windows Version (Windows 11 or higher, 26H2)
[√] Chrome - develop for the web
[√] Visual Studio - develop Windows apps (Visual Studio Build Tools 2026 18.4.0)
[!] Android toolchain - develop for Android devices (Android SDK 36.0.0; cmdline-tools not yet in PATH)
[√] Connected device (3 available)
[√] Network resources
```

### 2.3 Connected Target Devices (`flutter devices`)
1. **Windows (desktop):** `windows` • `windows-x64` • Native Windows application.
2. **Chrome (web):** `chrome` • `web-javascript` • Google Chrome 155 (Supports PWA, Service Worker, IndexedDB/Hive).
3. **Edge (web):** `edge` • `web-javascript` • Microsoft Edge 155.

---

## 3. Existing Backend Stack & Data Architecture

### 3.1 Framework & Core Modules
- **Framework:** Next.js `14.2.23` (App Router architecture with Edge middleware).
- **ORM & Database:** Prisma `5.22.0` on SQLite 3 (`file:./prisma/dev.db`, size ~10.1 MB).
- **Active Records:** 85 Users, 185 Students, 385 Fee Invoices, 16 Exam Sessions, 5 CashFunds (৳1,587,100 balance).
- **Route Count:** 469 route handlers audited in `api/contracts.md`.

### 3.2 Authentication & Authorization Engine
- **Token Format:** Signed JSON Web Tokens (JWT) using `jose` with HS256 and 64-character cryptographic entropy.
- **Header Support:** `src/middleware.ts` and `src/lib/auth.ts` inspect `request.cookies.get('ehrj_session_token')` AND `request.headers.get('authorization')` (Bearer tokens):
  ```typescript
  // src/middleware.ts & src/lib/auth.ts
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  }
  ```
- **Session Duration:** 7 days validity with automated blacklist revocation checking (`revoked_tokens.json` & Prisma `Session`).

---

## 4. Role-Based Capabilities & Workflow Matrix

| Role | Primary Portal Route | Key Functional Workflows | Offline Capability Strategy |
|---|---|---|---|
| **Admin** | `/admin` | Student/Teacher/Staff directory, classes, fee policies, notice broadcast, audit logs, backup tools | Read-only cached directories & dashboard metrics |
| **Principal** | `/principal` | Academic supervision, teacher leave approvals, admission vetting, operations monitoring | Cached oversight summaries, offline review queue |
| **Teacher** | `/teacher` | Attendance recording, exam mark entries, daily routine, lesson plans, leave requests, payroll | **Full Offline Drafts & Pending Sync Queue** for attendance and marks |
| **Student** | `/portal` | Class routine, personal attendance calendar, exam results, marksheet download, syllabus | Cached routine, profile, and previous semester report cards |
| **Guardian** | `/portal` | Multi-child switcher, fee payment history, daily attendance alert, leave requests, gate passes | Cached children profiles, payment receipts, offline leave draft |
| **Accountant** | `/admin/finance` | Invoice collection, offline-to-online payment reconciliation, donation vouchers, cash book | Offline draft receipt generation, sync upon reconnection |
| **Public Visitor** | `/` | About history, academic syllabus, online admission application, donation bank details, QR verification | Complete static cached information & offline admission form draft |

---

## 5. Backend API Inspection & Gap Analysis

### 5.1 Endpoints Inspected & Verified Operational

1. **Authentication:**
   - `POST /api/auth/login` (Authenticates user, creates JWT session).
   - `GET /api/auth/me` (Returns authenticated user profile).
   - `POST /api/auth/logout` (Revokes session and clears token).
   - `POST /api/auth/change-password` (Enforces strong password update).

2. **Teacher APIs:**
   - `GET /api/teacher/classes` (Assigned classes and sections).
   - `GET /api/teacher/attendance` & `POST /api/teacher/attendance` (Daily roster attendance submission).
   - `GET /api/teacher/exams` & `POST /api/teacher/results` (Marks entry and draft submission).
   - `GET /api/teacher/calendar/routines` (Weekly timetable).
   - `GET /api/teacher/leave` & `POST /api/teacher/leave` (Leave requests).
   - `GET /api/teacher/payroll` (Monthly salary statements).

3. **Guardian & Student APIs:**
   - `GET /api/portal/dashboard` (Multi-child summary, attendance, dues).
   - `GET /api/portal/attendance` (Monthly attendance calendar).
   - `GET /api/portal/results` (Exam tabulation and report cards).
   - `GET /api/portal/fees` (Unpaid invoices and payment links).
   - `POST /api/portal/leave-requests` (Guardian leave submission).
   - `GET /api/portal/routine` (Student class timetable).

4. **Public APIs:**
   - `GET /api/notices` (Published announcements).
   - `GET /api/events` (Madrasa events).
   - `POST /api/admission` (Online admission submission).
   - `GET /api/admission/track` (Admission application tracking).
   - `GET /api/verify/*` (Public QR verification for students, receipts, and certificates).

### 5.2 Identified Backend Compatibility Gaps & Safe Solutions

| Gap ID | Identified Limitation | Safe Engineering Remediation | Risk Level |
|---|---|---|---|
| **GAP-01** | `POST /api/auth/login` sets cookie but does not return `token` in JSON body | Include `token: token` in the JSON response payload. Web cookie remains unchanged. | **Zero** (100% backward-compatible) |
| **GAP-02** | `GET /api/auth/me` does not pass `req` into `getCurrentUser(req)` | Pass `req` to `getCurrentUser(req)` so Bearer JWT headers are read for mobile clients. | **Zero** (100% backward-compatible) |
| **GAP-03** | Flutter Web Cross-Origin Requests (CORS) | If Flutter Web runs on a different port (e.g. 8080) during local debugging, enable standard CORS headers on `/api/**` or proxy via standard base URL. | **Low** |

---

## 6. Target Flutter Application Architecture

### 6.1 Directory & Workspace Structure
The Flutter application is placed cleanly in:
`ehrj_flutter_app/` inside the root workspace.

This ensures:
- The Next.js web application (`package.json`, `src/`, `prisma/`) is completely untouched.
- Clean separation of Dart dependencies (`pubspec.yaml`) and Node dependencies (`package.json`).
- Monorepo alignment allowing shared documentation and asset synchronization.

### 6.2 Layered Architecture
```
ehrj_flutter_app/
├── lib/
│   ├── app.dart                        # Multi-role MaterialApp wrapper with themes & routes
│   ├── main.dart                       # App entrypoint & service locator initialization
│   ├── core/
│   │   ├── constants/                  # Colors (#0D5C3A, #F9F8F3), API paths, storage keys
│   │   ├── network/                    # Dio client with Bearer token interceptor & offline queue
│   │   ├── storage/                    # Hive / SharedPreferences persistent offline storage
│   │   ├── theme/                      # Light/Dark Islamic theme & Bangla typography
│   │   └── utils/                      # Date/Bangla numeral helpers, validators
│   ├── data/
│   │   ├── models/                     # Strongly-typed models (User, Student, Attendance, Exam)
│   │   └── repositories/               # Hybrid offline-first repositories (Cache-first + Network)
│   └── presentation/
│       ├── common/                     # Reusable Bangla buttons, cards, skeletons, dialogs
│       ├── routes/                     # GoRouter with role-based auth redirection guards
│       ├── public/                     # Public visitors (About, Academic, Admission, Notices)
│       ├── auth/                       # Unified Bangla login screen (Admin/Teacher/Guardian tabs)
│       ├── teacher/                    # Teacher dashboard, attendance, marks, routine, leave
│       ├── guardian/                   # Guardian dashboard, child switcher, attendance, fees
│       ├── student/                    # Student view (routine, marksheet, attendance)
│       └── admin_principal/            # Admin/Principal oversight and operations summaries
└── test/
    ├── unit/                           # Model serialization, validation, and auth tests
    └── widget/                         # Role-based dashboard and UI component tests
```

### 6.3 Offline-First Persistence Strategy
- **Platform Compatibility:**
  - Android & Windows: Hive / SharedPreferences provide fast key-value and typed binary storage.
  - Flutter Web: Hive with IndexedDB backend provides full in-browser persistence.
- **Offline Mutation Queue:**
  - When offline, attendance sheets and marks drafts are stored locally with status `SYNC_PENDING` and a unique client UUID.
  - Once connectivity is restored, the `SyncManager` flushes the queue sequentially with idempotent retry protection.
  - The UI shows clear visual indicators: **সবুজ (অনলাইন / সিঙ্কড)** vs **হলুদ (খসড়া সংরক্ষিত / সিঙ্ক বাকি)**.

---

## 7. Risk Analysis & Mitigation Matrix

| Risk Factor | Potential Impact | Prevention & Mitigation Strategy |
|---|---|---|
| **Accidental ERP Disruption** | High | Work strictly inside `ehrj_flutter_app/`; never delete or alter existing Next.js files without review. |
| **Unauthorized Role Escalation** | Critical | Enforce all permissions server-side via JWT claims; client routes only mirror server authorization. |
| **SQLite Concurrent Lockout** | Medium | Maintain PM2 single-instance fork mode on backend; Flutter client uses debounced batched API requests. |
| **Bangla Font Rendering Clipping** | Low | Bundle Google Fonts / Unicode-compliant Bangla fonts (e.g. Hind Siliguri / Noto Sans Bengali) with proper line heights. |
| **Offline Sync Collisions** | Medium | Use client UUID idempotency keys and timestamp-based conflict detection. Never silently overwrite newer server records. |

---

## 8. Multi-Phase Implementation Plan

### Phase 1: Brand System, Typography & Flutter Project Scaffold
- Scaffold clean Flutter project `ehrj_flutter_app` supporting Web, Windows, and Android.
- Configure official EHRJ Madrasha logo (`public/images/logo.jpg`), app icons, splash screen, and color palette (`#0D5C3A`, `#F9F8F3`, `#D4AF37`).
- Create reusable Bangla design components (buttons, input fields, status badges, offline banners).

### Phase 2: Core Network, Offline Persistence & Auth Integration
- Implement `Dio` HTTP client with interceptors for Bearer JWT handling and timeout fallbacks.
- Implement persistent local storage (Hive / SharedPreferences).
- Build unified Bangla login screen with role routing (Admin, Principal, Teacher, Guardian, Student).

### Phase 3: Teacher Role Implementation (Offline Attendance & Marks)
- Implement Teacher Dashboard with assigned classes, subjects, and analytics.
- Implement Daily Attendance workflow with offline local draft persistence and sync queue.
- Implement Exam Marks entry with range validation and draft saving.
- Implement Routine, Leave Requests, and Payroll viewers.

### Phase 4: Guardian & Student Portals Implementation
- Multi-child switching mechanism for parents.
- Attendance calendar viewer and fee status breakdown.
- Student academic timetable, report cards, and notices.

### Phase 5: Admin, Principal & Accountant Management Modules
- Institutional overview statistics and quick actions.
- Teacher leave approval workflows.
- Finance invoice collections and donation tracking.

### Phase 6: Public Visitor & Admission Workflow
- Institutional information, history, and curriculum explorer.
- Offline-capable Online Admission application draft.
- Notice ticker, events calendar, and QR code verification tool.

### Phase 7: Testing, Regression & Final Delivery
- Unit tests for models and sync queue.
- Widget tests for role-based navigation and authentication guards.
- Compilation and verification across Flutter Web and Windows Desktop.
- Bangla user documentation and operations manual.

---

## 9. Phase 0 Audit Conclusion & Next Immediate Step

The existing EHRJ Madrasha ERP codebase is robust, feature-rich, and ready for Flutter client integration. The 469 existing API endpoints provide all necessary academic, financial, and administrative operations.

**Approved Next Immediate Action (Phase 1):**  
Apply the minor non-breaking enhancements to `src/app/api/auth/login/route.ts` and `src/app/api/auth/me/route.ts` to return JWT tokens to mobile clients, then scaffold the `ehrj_flutter_app` project with the official brand identity, icons, and theme system.
