# EHRJ MADRASHA ERP — PHASE 34 DOCUMENTATION
## DIGITAL ADMISSIONS 2.0, APPLICANT EXPERIENCE & ENROLLMENT ONBOARDING ENGINE

**Project:** Eliotganj Hazi Rohmatollah Jamiria Madrasha (ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা)  
**Short Name:** EHRJ Madrasha  
**Checkpoint:** `EHRJ-AI-2026-PHASE34`  
**Status:** COMPLETE (Production-Ready)  
**Date:** September 2026

---

### 1. Executive Summary & Architectural Invariant

Phase 34 implements the complete applicant self-service, journey tracking, draft resumption, and post-admission onboarding experience for EHRJ Madrasha.

#### Core Principle:
> **"ONE ADMISSION AUTHORITY, ONE ENROLLMENT TRUTH, MANY USER EXPERIENCES."**

Phase 34 strictly preserves Phase 3 as the single source of truth for:
- Authoritative `Application` database model in Prisma
- Concurrency-safe Tracking ID generator (`generateApplicationNumber`: `EHRJ-ADM-YYYY-XXXX`)
- Duplicate detection engine (`detectDuplicates`)
- Atomic admission approval & student creation transaction (`approveAdmissionTransaction` in `src/lib/admissionApproval.ts`)
- Financial invoice generation and ledger consistency (Phase 6 Finance)

---

### 2. Modules & Capabilities Implemented

#### A. Admission Configuration & Quota Engine (`src/lib/admissions/admissionConfigEngine.ts`)
- Configuration-driven admission periods (start date, end date, open/closed flags).
- Class quota and capacity tracking (`maxCapacity`, `currentApplicants`).
- Dynamic enrichment combining JSON configuration with authoritative counts directly from `prisma.application`.
- Configurable document checklist requirements and residential options.

#### B. Save as Draft & Secure Resume Engine (`src/lib/admissions/draftApplicationEngine.ts`)
- Multi-step draft persistence in `data/admissions/draft_applications.json` with 30-day automatic expiration.
- Real-time completion progress calculation (`computeDraftProgress`).
- Missing mandatory field detection (`missingRequiredFields`).
- Resumption via secure hexadecimal `resumeToken` or verified guardian phone.

#### C. Application Correction Workflow Engine (`src/lib/admissions/correctionWorkflowEngine.ts`)
- Admin correction request generator (`createCorrectionRequest`).
- Field locking: ensures applicant cannot alter immutable fields during correction.
- Preserves full audit history in `data/admissions/correction_history.json`.
- Applicant resubmission workflow (`processApplicantCorrectionResubmission`) safely transitioning status back to `SUBMITTED`.

#### D. Document Checklist & Security Engine (`src/lib/admissions/documentChecklistEngine.ts`)
- Upload file validation (`validateAdmissionUpload`): strict 5MB limit, whitelist extensions (`.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`), and MIME checks.
- Dynamic checklist builder (`buildDocumentChecklist`): generates verification status badges for Student Photo, Birth Certificate, Guardian NID, and Previous Marksheet.

#### E. Transparent Fee Breakdown & Assistance Engine (`src/lib/admissions/admissionFeeEngine.ts`)
- Projects authoritative `FeeStructure` from Prisma.
- Zero hardcoded amounts: combines `ADMISSION`, `SESSION_CHARGE`, `TUITION`, and `HOSTEL`.
- Human-governed financial assistance evaluation: flags orphan applicants for 100% tuition/boarding waiver recommendation while requiring authorized human administrative approval.

#### F. Secure Public Tracking & PII Defense (`src/lib/admissions/trackingSecurity.ts`)
- Public tracking defense: prevents enumeration and IDOR by requiring mobile number matching.
- Sensitive PII masking:
  - Phone: `018****3344`
  - National ID / Birth Certificate: `*************1234`
- Chronological application progress pipeline (`timeline`).
- Post-admission enrollment onboarding checklist.
- Digital Admission Confirmation slip with QR verification payload.

---

### 3. API Routes & Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/admissions/config` | Active admission configuration, dates & class quotas | Public |
| `PUT` | `/api/admissions/config` | Update admission dates & configuration | Admin Only |
| `POST` | `/api/admissions/draft` | Save or update in-progress application draft | Public |
| `GET` | `/api/admissions/draft` | Resume draft via token or verified phone | Public |
| `GET` | `/api/admissions/fees` | Calculate dynamic fee breakdown & assistance evaluation | Public |
| `GET` | `/api/admissions/track` | Secure tracking with timeline, checklist & onboarding | Public |
| `POST` | `/api/admissions/resubmit` | Resubmit corrected application data/documents | Public (Verified) |

---

### 4. Public Web Pages

1. **`/admission` (Landing Page):**
   - Live admission availability badge and session dates.
   - Available classes, seat capacities, and admission CTAs.
   - 10-step application journey overview.
   - Required document checklist with mandatory tags.
   - CMS-integrated FAQ section with accordion UI.
   - Official helpline hotline banner.

2. **`/admission/apply` (Multi-Step Journey):**
   - 9-step application flow: Session & Class $\rightarrow$ Student Info $\rightarrow$ Parents & Guardian $\rightarrow$ Address $\rightarrow$ Academic Background $\rightarrow$ Residential & Welfare $\rightarrow$ Documents $\rightarrow$ Fee Breakdown $\rightarrow$ Declaration & Submit.
   - "Save as Draft" at any step with resume token modal.
   - Dynamic fee preview with orphan/assistance waiver indicator.
   - Idempotent submission token preventing double-submissions.

3. **`/admission/track` (Secure Tracking & Onboarding):**
   - Dual-factor tracking verification (Tracking ID + Phone).
   - Stepper timeline visualizer with real-time status.
   - Masked PII display for public privacy.
   - In-page correction submission modal for `CORRECTION_REQUESTED` applications.
   - Post-approval onboarding checklist (`student_id`, `enrollment`, `portal_access`).
   - Printable digital admission confirmation certificate with verification QR code.

---

### 5. Verification & Test Evidence

#### Test Suite: `npm run test:phase34`
**Results:** `36 / 36 PASSED (100%)`

- **Group 1:** Admission Configuration & Class Quota Engine (5/5)
- **Group 2:** Save as Draft, Progress Calculation & Resumption (6/6)
- **Group 3:** Document Upload Security & Checklist Engine (5/5)
- **Group 4:** Transparent Fee Calculation & Assistance Rules (5/5)
- **Group 5:** Authoritative Phase 3 Submission & Phase 34 Tracking (9/9)
- **Group 6:** IDOR & Public Tracking Privacy Defense (1/1)
- **Group 7:** Post-Admission Enrollment Onboarding (5/5)

#### Regression Suite:
- `npm run test:phase33`: **47 / 47 PASSED** (Calendar, Scheduling & Booking)
- `npm run test:phase32`: **42 / 42 PASSED** (Communication & Outreach)
- `npm run test:phase31`: **37 / 37 PASSED** (Portal & CMS)
- `npx tsc --noEmit`: **0 ERRORS**
- `npm run build`: **0 ERRORS** across all 158 production routes.
