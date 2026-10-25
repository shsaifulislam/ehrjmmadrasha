# EHRJ Flutter Multi-Role Application Architecture

**Repository Path:** `ehrj_flutter_app/`  
**Target Organization:** Eliotganj Hazi Rohmatollah Jamiria Madrasha (EHRJ)  
**Instituional Name (Bangla):** ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা  
**Platforms:** Android, Flutter Web (PWA), Windows Desktop  
**Primary Language:** Bangla (`bn`)  
**Backend:** Next.js 14 App Router (`http://localhost:3000`), Prisma ORM, SQLite DB  

---

## 1. Architectural Overview

The EHRJ Flutter application is structured according to **Clean Layered Architecture** with an **Offline-First Data Flow**. It supports **7 institutional roles** under a unified code base:
1. **Admin (মুহতামিম / অ্যাডমিন)**: `AdminDashboardScreen` — Institutional oversight, student & teacher registries, system health, database backup triggers.
2. **Principal / Head of Madrasa (অধ্যক্ষ / শিক্ষা সচিব)**: `PrincipalDashboardScreen` — Academic routine oversight, departmental attendance averages, syllabus progress, examination approval workflows.
3. **Teacher (উস্তাদ / শিক্ষক)**: `TeacherDashboardScreen` — Class/section selection, student roster, daily attendance toggles, offline draft saving, sync queue, exam marks entry.
4. **Student (শিক্ষার্থী)**: `StudentDashboardScreen` — Daily routine, assigned subjects, syllabus progress, terminal examination results.
5. **Guardian (অভিভাবক)**: `GuardianDashboardScreen` — Multi-child switcher, attendance monitoring, fee payments & receipts, term report card, leave applications.
6. **Accountant / Finance Staff (হিসাবরক্ষক)**: `AccountantDashboardScreen` — Fee collection vouchers, pending student dues, daily ledger receipts.
7. **Public / Prospective Applicant (সাধারণ দর্শনার্থী ও ভর্তিচ্ছু)**: `PublicHomeScreen` — Madrasa overview, history, online admission application (`/api/admissions/apply`), public notice board, student QR identity verification.

```
                           +-------------------------------------+
                           |            Presentation             |
                           |   (Screens, Widgets, Providers)     |
                           +-------------------------------------+
                                              |
                                              v
                           +-------------------------------------+
                           |          Domain / Models            |
                           | (User, Attendance, Marks, Academic) |
                           +-------------------------------------+
                                              |
                                              v
                           +-------------------------------------+
                           |         Repositories Layer          |
                           | (Teacher, Portal, Public, AuthRepo) |
                           +-------------------------------------+
                                   /                       \
                                  /                         \
                                 v                           v
                +-------------------------+     +-------------------------+
                |    Local Persistence    |     |      Remote Network     |
                |  (SharedPreferences,    |     |    (Dio Client, JWT     |
                |   Offline Draft Queues) |     |  Bearer Interceptor)    |
                +-------------------------+     +-------------------------+
                                                             |
                                                             v
                                                +-------------------------+
                                                |     Next.js Backend     |
                                                |  (469 Route Handlers)   |
                                                +-------------------------+
```

---

## 2. Layer Definitions

### 2.1 Presentation Layer (`lib/presentation/`)
- **Theme & Brand**: `AppTheme` implements Material 3 with official EHRJ Islamic Forest Green (`#0D5C3A`), Warm Ivory (`#F9F8F3`), and Gold accents (`#D4AF37`). Bangla typography is powered by `GoogleFonts.hindSiliguri()`.
- **Responsive Layout & Breakpoints**: `ResponsiveBreakpoints` dynamically serves:
  - Mobile (< 640px): Bottom navigation bar, floating action buttons, streamlined card stacks.
  - Tablet & Desktop (>= 640px / >= 1024px): Persistent navigation sidebar, multi-column KPI grids, table layouts.
- **State Management**: Implemented via `provider`.
  - `AuthProvider`: Manages authentication lifecycle, JWT token storage, user role detection, and logout.
  - `TeacherProvider`: Controls selected class, section, date, student roster, attendance marking, draft saving, and online submission.
  - `SyncProvider`: Orchestrates durable offline sync queue, background/manual retry, and sync status telemetry.
- **Role-Based Routing**: Defined in `lib/app.dart`. Unauthenticated users access `LoginScreen` or `PublicHomeScreen`. Authenticated users are routed dynamically based on `user.role` to their dedicated dashboard.

### 2.2 Reusable Component Suite (`lib/presentation/common/widgets/`)
- `EhrjCard`: Consistent elevated card container with subtle shadow and border styling.
- `EhrjStatusBadge`: Semantic badge for attendance, fee payment, and sync states.
- `EhrjConfirmationDialog`: Accessible modal for destructive/irreversible actions.
- `EhrjLoadingSkeleton`: Shimmer placeholder for lists, profiles, and KPI metrics.
- `EhrjEmptyState`: Clean empty state illustration with localized Bangla guidance.
- `OfflineBanner`: Real-time offline indicator showing pending sync operations.
- `EhrjLogoWidget`: Circular branded institution crest with fallback initials.

### 2.3 Data & Domain Layer (`lib/data/`)
- **Models (`lib/data/models/`)**:
  - `UserModel`: Deserializes user identity, role, phone, and permissions from `/api/auth/me`.
  - `AcademicClassModel`, `SectionModel`, `SubjectModel`: Academic hierarchy deserialization.
  - `StudentRosterItem`: Roster member with roll number, Bangla name, father's name, and contact.
  - `DailyAttendanceSheet`: Offline attendance record tagged with `clientUuid`, `isDraft`, `isSynced`, and student statuses.
  - `ExamMarksSheetDraft`: Offline exam marks draft with validation rules and sync flags.
  - `NoticeModel`: Public and internal madrasa announcements.

- **Repositories (`lib/data/repositories/`)**:
  - `AuthRepository`: Coordinates `/api/auth/login`, saves JWT Bearer token to local storage, fetches `/api/auth/me`, and wipes local session on logout.
  - `TeacherRepository`: Loads teacher classes, sections, rosters with local cache fallback (`ehrj_cached_roster_*`), persists offline drafts, and submits online.
  - `PortalRepository`: Provides data for students and guardians (children, attendance history, term report cards, fee dues).
  - `PublicRepository`: Submits online admission forms and fetches public notices.

---

## 3. Offline-First Synchronization Protocol

1. **Roster Caching**:
   - Whenever an authenticated teacher successfully loads a class roster online, it is automatically cached in durable storage under `ehrj_cached_roster_<classId>_<sectionId>`.
   - If network connectivity is lost later, the teacher can still open the class and view the full student roster offline.

2. **Durable Pending Queue**:
   - Marking attendance offline creates a `DailyAttendanceSheet` with a unique UUID (`clientUuid`), `isDraft: true`, and `isSynced: false`.
   - The sheet is appended to `ehrj_offline_attendance_queue` in `SharedPreferences`.
   - When network connectivity is restored, the teacher can click **"সিঙ্ক করুন"** or `SyncProvider` flushes all pending sheets via `POST /api/teacher/attendance`.
   - Upon HTTP 200/201 confirmation from the ERP, the sheet is marked `isSynced: true` and removed from the pending queue.

3. **Conflict Detection & Idempotency**:
   - Each submission carries `clientUuid` and explicit `date` + `classId` + `sectionId`.
   - The backend validates session permissions and prevents duplicate attendance recording for the same date.
   - Offline changes never bypass server authorization.

---

## 4. Security & Data Protection

- **No Hardcoded Credentials**: API base URL defaults to `AppConfig.apiBaseUrl` with environment override support.
- **JWT Bearer Token Interceptor**: Tokens are securely stored and automatically injected into HTTP request headers (`Authorization: Bearer <token>`).
- **Server-Side Enforcement**: All operations (attendance, marks, admissions, backups) are verified on the Next.js server via `getCurrentUser(req)`. Client UI cannot bypass RBAC.
- **Safe Session Cleanup**: Logout removes the token from storage, clears cached drafts, and resets provider state.
