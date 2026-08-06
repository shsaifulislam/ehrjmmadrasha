# EHRJ Madrasha ERP — Comprehensive Repository Audit Report

**Date:** 2026-08-02  
**Audit Scope:** Entire Enterprise Codebase (`backend/`, `frontend/`, `docs/`, `deploy/`, `database/`)  
**Audit Purpose:** Pre-implementation repository audit to identify missing infrastructure, duplicate code, dead code, missing routes, and schema inconsistencies before Sprint 1 Execution.

---

## 1. Folder Structure Audit

### A. Backend (`backend/src/`)
- **Current State:**
  - `controllers/`, `middlewares/`, `modules/`, `routes/`, `services/`, `shared/`, `utils/`, `validations/`.
- **Issues Identified:**
  - `backend/server.js` exists in `backend/` root alongside `backend/src/server.ts` and `backend/src/app.ts`. `backend/server.js` contains a monolithic single-file setup which duplicates functionality in `backend/src/`.
  - Missing standardized modular separation for all 17 sub-systems (e.g. `backend/src/modules/admission/`, `backend/src/modules/student360/`, `backend/src/modules/accounting/`).
- **Action Plan:**
  - Standardize `backend/src/modules/` into sub-system domains.
  - Deprecate root `backend/server.js` in favor of modular `backend/src/server.ts`.

### B. Frontend (`frontend/src/`)
- **Current State:**
  - `app/`, `components/` (`common/`, `layout/`, `shared/`, `ui/`), `hooks/`, `lib/`, `providers/`.
- **Issues Identified:**
  - Presence of `frontend/src/components/common/ComingSoonPage.tsx` which contains "Coming Soon" placeholder text, violating the Zero-Placeholder directive.
  - `frontend/src/components/shared/` only contains 3 files (`EmptyState.tsx`, `PageLoader.tsx`, `TableSkeleton.tsx`). Missing the 22+ mandatory `App*` components codified in Volume 24/25 (`AppTable`, `AppForm`, `AppSearch`, `AppFilter`, `AppExport`, `AppImport`, `AppModal`, `AppDrawer`, `AppPDF`, `AppPrint`, `AppStats`, `AppTimeline`, `AppPermission`, `AppActivity`, `AppBadge`, `AppStatus`, `AppAvatar`, `AppUploader`, `AppQR`, `AppBarcode`, `AppToast`, `AppConfirm`, `AppDatePicker`).
- **Action Plan:**
  - Replace placeholder pages with real data-driven components.
  - Implement full `App*` Shared Component Library in `frontend/src/components/shared/`.

---

## 2. Database & Prisma Audit (`backend/prisma/schema.prisma`)

- **Current State:**
  - PostgreSQL DB schema with 1,170 lines covering `User`, `Role`, `Permission`, `Student`, `Teacher`, `Class`, `Admission`, `Invoice`, `JournalEntry`, `GeneralLedger`, etc.
- **Issues Identified:**
  - **Missing Standard Columns:** Not all models contain the 10 mandatory standard columns (`id`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `deletedAt`, `deletedBy`, `version`, `isActive`, `remarks`) specified in Volume 22 (`EHRJ-SRS-V22`). Some models use `isDeleted` boolean instead of `deletedAt` timestamp.
  - **Missing Indexes:** High-traffic search fields (e.g., `Student.nameBn`, `Admission.mobile`, `Invoice.status`, composite `[sessionId, classId]`) require additional B-Tree and Composite Indexes for sub-500ms query performance.
  - **Optimistic Locking:** Missing `version` (Int @default(1)) column on transactional entities (`Invoice`, `JournalEntry`, `Admission`) to prevent race condition mutations.
- **Action Plan:**
  - Refactor `schema.prisma` to incorporate the 10 standard columns and explicit composite indexes across all entities.

---

## 3. API & Controller Audit (`backend/src/routes/`)

- **Current State:**
  - REST endpoints defined under `/api/v1/*`.
- **Issues Identified:**
  - Some route handlers directly query Prisma without delegating to `Service` -> `Repository` layers.
  - Incomplete `Idempotency-Key` validation on payment and invoice creation endpoints.
  - Missing standardized error code namespaces (`STUDENT001`, `FINANCE010`, `ACCOUNT005`).
- **Action Plan:**
  - Refactor controllers to delegate strictly to Service Layer.
  - Enforce `Idempotency-Key` headers on sensitive financial endpoints.

---

## 4. Frontend Audit (`frontend/src/app/`)

- **Current State:**
  - Next.js 15 App Router structure with layouts for Admin, Student, Teacher, Guardian, and Public Admission.
- **Issues Identified:**
  - Hardcoded color hexes in old CSS (`scratch/old_repo/assets/css/app.css`) instead of CSS custom properties/Tailwind tokens.
  - Incomplete Dark Mode class mappings across some portal pages.
  - Missing full WCAG 2.2 AA aria-labels on custom button/modal triggers.
- **Action Plan:**
  - Migrate all UI components to use Tailwind CSS design tokens and Shadcn UI primitives with complete Light/Dark mode support.

---

## 5. Duplicate & Dead Code Clean-up

- **Dead Code identified:**
  - `backend/server.js` (legacy monolithic setup).
  - `backend/check-db.js`, `backend/get-class.js` (one-off test scripts in backend root).
  - `frontend/src/components/common/ComingSoonPage.tsx` (placeholder page).
- **Action Plan:**
  - Archive/move temporary scratch scripts to `scratch/` directory.
  - Purge placeholder components and enforce data-driven fallback states.

---

## 6. Summary & Sprint 1 Action Items

1. ✅ **Repository Audit Complete:** `docs/AUDIT_REPORT.md` generated.
2. 🚀 **Next Immediate Task (Sprint 1 - Step 2):** Implement Global Shared Infrastructure:
   - **Frontend:** Build 23+ `App*` components in `frontend/src/components/shared/`.
   - **Backend:** Build 14 core Shared Services in `backend/src/services/shared/` (`AuditService`, `NotificationService`, `SearchService`, `PDFService`, `PrintService`, `ImportService`, `ExportService`, `SettingsService`, `Student360Service`, `PermissionService`, `DashboardService`, `SMSService`, `EmailService`, `FileService`).
