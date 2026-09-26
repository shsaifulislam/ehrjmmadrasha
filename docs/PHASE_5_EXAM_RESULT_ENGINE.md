# EHRJ DIGITAL CAMPUS
## PHASE 5 — EXAM, ROUTINE, MARKS & RESULT ENGINE
### Comprehensive Technical Documentation

---

## 1. Executive Summary

Phase 5 delivers a complete, production-grade **Exam, Routine, Marks & Result Engine** for **ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা (Eliotganj Hazi Rohmatollah Jamiria Madrasha)**. Building directly upon the foundational Phase 1 (Auth & RBAC), Phase 2 (Academic Core), Phase 3 (Admissions), and Phase 4 (Attendance) engines, Phase 5 enforces mathematical consistency, tamper-proof verification, institutional auditability, and strict role scoping across all academic evaluation workflows.

---

## 2. Core Architecture & Workflow Lifecycle

```text
Academic Session (e.g. ২০২৫-২০২৬)
        ↓
Configurable Exam Type (e.g. বার্ষিক পরীক্ষা / সাময়িক)
        ↓
Exam Configuration (DRAFT → SCHEDULED → MARKS_ENTRY → REVIEW → PUBLISHED → CLOSED)
        ↓
Subjects & Custom Full/Pass Marks (e.g. 100/33, 50/17, Qawmi oral/written)
        ↓
Exam Routine & Conflict Detection (Room/Class/Subject conflict prevention)
        ↓
Teacher Scoped Marks Entry (Roll-ordered, bounds validation, ABSENT / EXEMPT flags)
        ↓
Teacher Submission & Locking (DRAFT → SUBMITTED)
        ↓
Admin Review & Aggregated Analysis
        ↓
Canonical Result Calculation Engine (Pass/Fail, Qawmi Grade: মুমতাজ, জায়্যিদ জিদ্দান, ইত্যাদি)
        ↓
Controlled Publication & Double-Publish Protection
        ↓
Immutable Frozen Snapshot (JSON) & Verification Code Generation (EHRJ-RES-YYYY-XXXX)
        ↓
Guardian Portal Access (Strict child isolation & IDOR blocked)
        ↓
Privacy-Safe Public Verification (/verify/result/[code])
```

---

## 3. Database Schema Models (`prisma/schema.prisma`)

### 3.1. `ExamType`
- Configurable examination categories (e.g., সাময়িক, অর্ধ-বার্ষিক, বার্ষিক, মডেল টেস্ট).
- Unique code constraint (`@unique`), title in Bengali and English, sort order, and active status.

### 3.2. `Exam`
- Linked to `AcademicSession` and `ExamType`.
- Supports dynamic lifecycle status: `DRAFT`, `SCHEDULED`, `MARKS_ENTRY`, `REVIEW`, `PUBLISHED`, `CLOSED`.
- Preserves historical instructions, start/end dates, and publication timestamps.

### 3.3. `ExamRoutine`
- Timetable scheduling for exams per Class/Jamat and Section.
- Conflict detection engine blocks:
  1. Duplicate subject routine for the same class/exam.
  2. Overlapping time intervals on the same date for the same class/section.
- Statuses: `DRAFT`, `PUBLISHED`, `CANCELLED`.

### 3.4. `ExamSubject` & `Subject`
- Fully configurable subject master (`Subject`) with Bangla/Arabic/English titles.
- `ExamSubject` binds subject to exam with custom `fullMarks` (e.g. 100, 50, 25), `passMarks`, weight, and sort order. No hardcoded 100/33 limits.

### 3.5. `ExamMark`
- Roll-ordered student evaluation record.
- Strict numeric validation (`0 <= marks <= fullMarks`).
- Explicit status flags: `PRESENT`, `ABSENT`, `EXEMPT`. Absences are stored separately and not conflated with zero.
- Lifecycle state: `DRAFT` vs `SUBMITTED`.

### 3.6. `Result`
- Canonical evaluation record per student per exam.
- Stores calculated `totalFullMarks`, `totalObtained`, `percentage`, `grade`, and status (`PASS` / `FAIL`).
- Stores tamper-proof `verificationCode` (`EHRJ-RES-YYYY-XXXX`).
- Stores immutable `snapshotData` (JSON) containing exact student details, roll, subject breakdown, and grade at publication time.
- Statuses: `DRAFT`, `SUBMITTED`, `REVIEW`, `PUBLISHED`, `LOCKED`.

---

## 4. Canonical Calculation & Grading Rules (`src/lib/resultCalculationService.ts`)

1. **Numeric Validation:**
   - Marks must be non-negative and `<= fullMarks`.
2. **Qawmi Grading Scale:**
   - $\ge 80\%$: **মুমতাজ (A+ / Outstanding)**
   - $\ge 70\%$: **জায়্যিদ জিদ্দান (A / Very Good)**
   - $\ge 60\%$: **জায়্যিদ (A- / Good)**
   - $\ge 50\%$: **মাকবুল (B / Pass)**
   - $< 50\%$: **রাসিব (F / Fail)**
3. **Mandatory Subject Failure Guard:**
   - If any mandatory subject has `isPassed === false` or student was `ABSENT`, the overall result is marked as `FAIL` with grade `রাসিব`, regardless of overall total or percentage.
4. **Exemption Handling:**
   - Exempt subjects are excluded from calculation denominator if configured.
5. **Double Publish Protection:**
   - Idempotent publication returns existing result if already `PUBLISHED`, preserving original verification code and snapshot.

---

## 5. Security & IDOR Protections

| Role | Permitted Actions | Blocked Actions (Enforced via 403 Forbidden) |
| :--- | :--- | :--- |
| **Teacher** | Enter draft/submit marks for assigned class & subject only | Entering marks for unassigned classes/subjects; publishing results; modifying locked/published results |
| **Guardian** | View published marksheet for authenticated linked children | Viewing unlinked student results (IDOR); viewing draft marks; accessing internal marks |
| **Public** | Verify authenticity via unique verification code (`/verify/result/[code]`) | Querying results by student ID directly; accessing guardian phone, NID, address, or financial info |
| **Admin** | Configure exams, routine, subjects; review marks; publish; audit corrections | Modifying published marks without mandatory correction reason and audit logging |

---

## 6. API Endpoints

- `GET /api/admin/exams` & `POST /api/admin/exams`: Exam lifecycle management.
- `GET /api/admin/exams/types` & `POST /api/admin/exams/types`: Exam type configuration.
- `GET /api/admin/exams/[id]/routine` & `POST /api/admin/exams/[id]/routine`: Timetable with conflict checks.
- `GET /api/admin/exams/[id]/subjects` & `POST /api/admin/exams/[id]/subjects`: Exam subject & marks configuration.
- `GET /api/admin/subjects` & `POST /api/admin/subjects`: Subject master registry.
- `GET /api/teacher/results` & `POST /api/teacher/results`: Teacher marks entry (draft / submit).
- `GET /api/admin/results`: Admin aggregated results review.
- `POST /api/admin/results/publish`: Controlled atomic publication with frozen snapshot.
- `POST /api/admin/results/correct`: Post-publication mark correction with mandatory audit reason.
- `GET /api/portal/results`: Guardian portal results with IDOR enforcement.
- `GET /api/verify/result/[code]`: Privacy-safe public verification.

---

## 7. Verification & Automated Test Results

- **Phase 5 Exam Suite (`scripts/test_phase5_exams.js`):** **55 PASSED | 0 FAILED**
- **Phase 4 Attendance Suite (`scripts/test_phase4_attendance.js`):** **50 PASSED | 0 FAILED**
- **Phase 3 Admissions Suite (`scripts/test_phase3_admissions.js`):** **63 PASSED | 0 FAILED**
- **Phase 2 Academic Core Suite (`scripts/test_phase2_academic.js`):** **42 PASSED | 0 FAILED**
- **Phase 1 Foundation Suite (`scripts/test_phase1_foundation.js`):** **39 PASSED | 0 FAILED**
- **Next.js Production Build:** **Compiled Successfully (73/73 static & dynamic routes, 0 errors)**
- **Total Automated Test Assertions:** **249 PASSED | 0 FAILED**
