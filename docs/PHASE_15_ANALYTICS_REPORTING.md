# EHRJ MADRASHA DIGITAL CAMPUS & ERP
## PHASE 15 — ADVANCED DASHBOARD, ANALYTICS & MANAGEMENT REPORTING ENGINE
### MASTER ARCHITECTURE & SPECIFICATION REPORT

Institution:
- Bengali: ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
- English: Eliotganj Hazi Rohmatollah Jamiria Madrasha
- Arabic: الجامعة الإسلامية رحمة الله إليوت غنج
- Established: 2021
- Location: পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা, বাংলাদেশ

Checkpoint: `EHRJ-AI-2026-PHASE15`

---

## 1. Executive Summary & Objective

Phase 15 delivers a centralized, production-grade **Advanced Dashboard, Analytics & Management Reporting Engine** for Eliotganj Hazi Rohmatollah Jamiria Madrasha.

### Core Architectural Decisions:
1. **Strictly Read-Optimized Layer (Zero Parallel Sources of Truth):**
   - Phase 15 does NOT create duplicate tables or parallel copies of operational data (Students, Invoices, Receipts, Attendance, Exams, Results, Library, Hostel, Transport, Inventory, HR, or Helpdesk).
   - All analytics queries compute metrics directly from authoritative source tables via indexed database queries and transactional aggregations.
2. **"No Fake Zero" Discipline:**
   - Missing or unconfigured data is never substituted with arbitrary zeros. Errors or loading states are explicitly displayed so administrative decision-makers always see authentic numbers.
3. **No New Analytics Roles (Preserved Authentic 4-Tier RBAC):**
   - Retains the institution's existing roles: `ADMIN`, `PRINCIPAL`, `TEACHER`, `GUARDIAN`.
   - Admin has institutional analytics & report builder; Principal has executive oversight dashboards; Teachers have assignment-scoped analytics; Guardians have child-specific progress metrics.
4. **Strict Privacy & Anti-IDOR Protections:**
   - **Guardian Portal:** Scoped strictly via `GuardianStudent` link. Querying unlinked student IDs triggers HTTP 403 Forbidden.
   - **Teacher Panel:** Scoped strictly to assigned Jamats, sections, and subjects (`TeacherAssignment`).
   - **Financial Privacy:** Individual donor names, zakat recipient identities, and individual staff salaries are protected and never leaked into high-level dashboards.
5. **Interactive Drill-Down & Management Report Pack:**
   - Every KPI card provides direct navigation to the respective operational module with active filter parameters.
   - Consolidated Management Report Pack includes executive summary in Bengali & English, multi-departmental KPIs, actionable alerts, and printable styling.

---

## 2. Database Models & Schema Extensions

The analytics engine introduces 2 persistent models into `prisma/schema.prisma` without disturbing existing operational entities:

| Model | Purpose | Key Constraints & Relations |
| :--- | :--- | :--- |
| `SavedReport` | Stores frequently executed report configurations | `title`, `description`, `module` (`STUDENTS`, `ADMISSIONS`, `ATTENDANCE`, `RESULTS`, `FINANCE`, `OPERATIONS`, `HELPDESK`), `reportType`, `filtersJson`, `isPublic`, `createdById` -> `User.savedReports` |
| `ReportSchedule` | Defines recurring report schedules | `title`, `reportType`, `frequency` (`DAILY`, `WEEKLY`, `MONTHLY`), `dayOfWeek`, `dayOfMonth`, `recipientsJson`, `format` (`PDF`, `PRINT`, `CSV`), `isActive`, `lastRunAt`, `nextRunAt` |

---

## 3. Analytics Service Architecture (`src/lib/analyticsEngine.ts`)

The service layer contains modular, decoupled analytics calculation functions:

| Function | Scope | Key Metrics & Data Sources |
| :--- | :--- | :--- |
| `parseDateFilter` | Date range engine | Presets for `TODAY`, `YESTERDAY`, `THIS_WEEK`, `THIS_MONTH`, `PREVIOUS_MONTH`, `ALL_TIME`, and `CUSTOM` ranges. |
| `getOverviewAnalytics` | Executive oversight | High-level summary of active students, today's attendance rate, net collections, 5 cash funds total (`GENERAL`, `LILLAH`, `ZAKAT`, `CONSTRUCTION`, `ORPHAN_SUPPORT`), actionable alerts with severity levels (`URGENT`, `WARNING`, `INFO`), and factual executive narrative in Bengali & English. |
| `getStudentsAnalytics` | Student body | Demographics, active/withdrawn/completed counts, gender split, Jamat class distribution, residential vs day-care split, orphan and financial assistance counts. |
| `getAdmissionAnalytics` | Admissions funnel | Total applications, pending, approved, rejected, confirmed admissions, and conversion rate. |
| `getAttendanceAnalytics` | Attendance metrics | Present, absent, late, leave counts and overall rate; class-by-class attendance comparison. |
| `getAcademicAnalytics` | Qawmi result metrics | Total examinees, pass rate, and distribution across 5 Qawmi grade tiers: মুমতাজ (>=80%), জায়্যিদ জিদ্দান (70-79%), জায়্যিদ (60-69%), মাকবুল (50-59%), রাসিব (<50%). |
| `getFinanceAnalytics` | Financial analytics | Billed, collections, outstanding dues, expenses, net surplus, payment method split (Cash, bKash, Nagad, Rocket, Bank, Gateway), income by fee type, and balances/movements across all 5 dedicated funds. |
| `getOperationsAnalytics` | Cross-department ops | Library loans/overdues, residential hostel occupants, transport routes/enrollments, inventory stock & low-stock alerts, HR staff counts & expiring documents, and open/urgent helpdesk requests. |
| `getSessionComparison` | Academic comparison | Compares Academic Session A vs Academic Session B across student enrollment, fee collections, attendance, and exam pass rates. |
| `getTeacherScopedAnalytics` | Scoped teacher view | Scoped strictly to teacher's assigned classes/sections, calculating assigned students, today's section attendance, and class schedule. |
| `getGuardianChildAnalytics` | Scoped child view | Scoped strictly to linked child with IDOR verification, presenting attendance rate, fee balances, exam results with Qawmi grades, library loans, room info, and transport route. |
| `executeReportBuilder` | Custom report engine | Dynamic query generator supporting module selection, date range filtering, Jamat class filtering, and session filtering with pagination limits. |
| `getSavedReports`, `createSavedReport`, `deleteSavedReport` | Report presets CRUD | Management of saved report templates for fast recurring review. |

---

## 4. API Endpoints & Access Control

| Method | Endpoint | Authorized Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/analytics/overview` | `ADMIN`, `PRINCIPAL` | High-level executive dashboard & alerts |
| `GET` | `/api/admin/analytics/students` | `ADMIN`, `PRINCIPAL` | Student body analytics & class breakdown |
| `GET` | `/api/admin/analytics/admissions` | `ADMIN`, `PRINCIPAL` | Admission funnel & conversion rates |
| `GET` | `/api/admin/analytics/attendance` | `ADMIN`, `PRINCIPAL` | Attendance rates & class comparison |
| `GET` | `/api/admin/analytics/academic` | `ADMIN`, `PRINCIPAL` | Academic results & Qawmi grade breakdown |
| `GET` | `/api/admin/analytics/finance` | `ADMIN`, `PRINCIPAL` | Financial collections, expenses, and 5-fund balances |
| `GET` | `/api/admin/analytics/operations` | `ADMIN`, `PRINCIPAL` | Multi-module operational indicators |
| `GET` | `/api/admin/analytics/comparison` | `ADMIN`, `PRINCIPAL` | Session-by-session comparative analysis |
| `POST` | `/api/admin/analytics/reports/builder` | `ADMIN`, `PRINCIPAL` | Configurable report execution |
| `GET` | `/api/admin/analytics/reports/saved` | `ADMIN`, `PRINCIPAL` | Saved report templates listing |
| `POST` | `/api/admin/analytics/reports/saved` | `ADMIN` | Create saved report template |
| `DELETE` | `/api/admin/analytics/reports/saved/[id]` | `ADMIN` | Delete saved report template |
| `GET` | `/api/teacher/analytics` | `TEACHER`, `ADMIN` | Teacher-scoped class & student analytics |
| `GET` | `/api/portal/analytics/[childId]` | `GUARDIAN` | Guardian child-specific progress (IDOR-protected) |

---

## 5. UI Hubs & Dashboard Enhancements

### 1. Admin Analytics Hub (`src/components/analytics/AdminAnalyticsHub.tsx`)
Accessible via `/admin/analytics` and within the Admin Panel (`activeTab === "REPORTS"`):
- **Tab 1: Overview:** Executive summary narrative in Bengali, high-level KPIs, 5-fund summary cards, actionable alert banners with priority colors, and quick navigation.
- **Tab 2: Students & Admissions:** Demographics, active/residential/day-care split, Jamat distribution progress bars, and admission funnel.
- **Tab 3: Attendance & Results:** Daily attendance rate, Jamat-wise attendance bar chart, exam pass rate, and 5 Qawmi grade tiers.
- **Tab 4: Finance & 5 Funds:** Billed vs Collected vs Outstanding cards, expense breakdown, 5 dedicated cash funds (`GENERAL`, `LILLAH`, `ZAKAT`, `CONSTRUCTION`, `ORPHAN_SUPPORT`), and collection channels.
- **Tab 5: Institutional Operations:** Sub-cards for Library, Hostel, Transport, Inventory, HR, and Helpdesk with direct drill-down links.
- **Tab 6: Session Comparison:** Side-by-side comparative table analyzing change between selected academic sessions.
- **Tab 7: Report Builder & Print Pack:** Configurable query runner, CSV/print export, and saved report configurations.

### 2. Principal Oversight Dashboard (`src/app/principal/page.tsx`)
- Enhanced with real-time institutional overview analytics, factual executive narrative, multi-module alert monitor, 5-fund balance overview, and one-click printable management pack.

### 3. Teacher Dashboard (`src/app/teacher/page.tsx`)
- Enhanced with teacher-scoped class analytics: assigned students count, assigned sections list, today's attendance rate, and upcoming academic events.

### 4. Guardian Portal (`src/app/portal/page.tsx` & `/api/portal/analytics/[childId]`)
- Child-specific analytics: academic performance trends, attendance percentage, fee billing & due status, library books issued, room info, and transport route.
- Strictly validates student ownership against `GuardianStudent` records; non-linked child requests return HTTP 403.

---

## 6. Verification & Test Evidence

### Unit & Integration Test Suite (`scratch/test_phase15_api.ts`)
- **Total Tests:** 45 assertions across 12 test suites
- **Status:** 45 PASSED, 0 FAILED
- **Coverage:**
  1. Date filter presets (`TODAY`, `THIS_MONTH`, `ALL_TIME`)
  2. Executive overview & 5 cash funds verification
  3. Student demographics and Jamat distribution
  4. Admission funnel and conversion rate
  5. Attendance rates and class comparison
  6. Academic pass rates and 5 Qawmi grade tiers
  7. Finance billing, collections, and 5-fund movements
  8. Cross-department operations (Library, Hostel, Transport, Inventory, HR, Helpdesk)
  9. Session comparison differences
  10. Teacher-scoped class assignments and attendance
  11. Guardian child-specific metrics and IDOR attack blocking
  12. Report builder execution and saved report CRUD

### HTTP API & Security Suite (`scratch/test_phase15_http_api.ts`)
- **Total Tests:** 36 assertions
- **Status:** 36 PASSED, 0 FAILED
- **Coverage:**
  - Unauthenticated access rejection (HTTP 403)
  - RBAC: Guardian blocked from `/api/admin/analytics/overview` (HTTP 403)
  - RBAC: Teacher blocked from `/api/admin/analytics/finance` (HTTP 403)
  - Admin endpoints verification (`overview`, `students`, `admissions`, `attendance`, `academic`, `finance`, `operations`, `comparison`, `builder`, `saved`)
  - Teacher analytics endpoint verification (`/api/teacher/analytics`)
  - Guardian legitimate access (`/api/portal/analytics/[linkedChild]`) -> 200 OK
  - IDOR security test (`/api/portal/analytics/[unlinkedChild]`) -> 403 FORBIDDEN

### Regression Test Suite
- `npm run test:phase14` -> 44 Unit + 13 HTTP = 57 PASSED, 0 FAILED
- `npm run test:phase13` -> 15 Unit + 7 HTTP = 22 PASSED, 0 FAILED
- `npm run test:phase12` -> 45 Unit + 4 Endpoint = 49 PASSED, 0 FAILED

### TypeScript & Production Build Verification
- `npx tsc --noEmit` -> 0 errors (Code 0)
- `npm run build` -> Clean Next.js 14 production build (Code 0), all 108 routes compiled and prerendered.
