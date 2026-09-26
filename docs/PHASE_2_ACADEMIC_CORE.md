# EHRJ DIGITAL CAMPUS
## PHASE 2 — ACADEMIC CORE + STUDENT & GUARDIAN FOUNDATION
### Architecture, Data Model, API & Verification Documentation

---

## 1. Overview & Objective

Phase 2 establishes the **Academic Core** and **Student & Guardian Data Foundation** of EHRJ Digital Campus for:
**ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা** (Eliotganj Hazi Rohmatollah Jamiria Madrasha, Established 2021).

The academic foundation is session-aware, history-preserving, configurable, and production-safe. It guarantees that closing a session or promoting a student preserves all past attendance, fee invoices, grades, and enrollments without destructive mutations.

---

## 2. Core Entities & Schema Architecture

### A. AcademicSession
- `id` (UUID Primary Key)
- `name` (String, unique e.g., "২০২৫-২০২৬")
- `startDate` & `endDate` (DateTime)
- `isCurrent` (Boolean)
- `status` (String: `DRAFT`, `ACTIVE`, `CLOSED`)
- `createdAt` & `updatedAt` (DateTime)
- Relations: `enrollments`, `attendances`, `exams`, `feeInvoices`, `teacherAssignments`

### B. JamatClass (Dynamic Qawmi & Academic Classes)
- `id` (UUID Primary Key)
- `nameBn` (e.g. "মিযান জামাত", "শিশু শ্রেণি")
- `nameEn` (e.g. "Mizan", "Class 1")
- `nameAr` (e.g. "صف الميزان")
- `code` (Unique String, uppercase e.g. "MIZAN", "CLS-1")
- `genderType` (`COMBINED`, `BOYS`, `GIRLS`)
- `sortOrder` (Integer)
- `isActive` (Boolean)
- Relations: `sections`, `subjects`, `enrollments`

### C. Section
- `id` (UUID Primary Key)
- `classId` (FK to `JamatClass`)
- `nameBn` (e.g. "ক শাখা", "খ শাখা")
- `nameEn` ("Section A", "Section B")
- `roomNo` (String, optional)
- `maxCapacity` (Integer, default 50-60)
- Relations: `enrollments`, `attendances`, `teacherAssignments`

### D. Student (Master Profile)
- `id` (UUID Primary Key)
- `studentIdNumber` (Unique String, format `EHRJ-YYYY-XXXX` — lifetime permanent)
- `fullNameBn`, `fullNameEn`, `fullNameAr`
- `dateOfBirth` (DateTime)
- `gender` (`MALE`, `FEMALE`)
- `bloodGroup`
- `birthCertificateNo` (Unique) & `nidNo`
- `fatherNameBn`, `fatherNameEn`, `fatherPhone`, `fatherOccupation`
- `motherNameBn`, `motherNameEn`, `motherPhone`
- `presentAddress`, `permanentAddress`
- `residentialStatus` (`RESIDENTIAL`, `NON_RESIDENTIAL`, `DAY_CARE` — Note: `DAY_CARE` students do not receive food bills)
- `isOrphan` (Boolean)
- `isFinanciallyWeak` (Boolean)
- `status` (`ACTIVE`, `INACTIVE`, `SUSPENDED`, `TRANSFERRED`, `COMPLETED`, `WITHDRAWN`)
- Relations: `guardianLinks`, `enrollments`, `documents`, `feeInvoices`, `results`

### E. Guardian & GuardianStudent (Multi-Guardian & Siblings Support)
- `Guardian`: `id`, `fullNameBn`, `fullNameEn`, `relation`, `phone` (unique), `email`, `nidNo`, `occupation`, `address`
- `GuardianStudent`: `id`, `guardianId`, `studentId`, `isPrimary` (Boolean)
  - Enables multiple guardians per student (e.g., father and maternal uncle).
  - Enables multiple siblings linked to the same guardian phone.
  - Exactly one guardian has `isPrimary: true`.

### F. Enrollment (Historical Academic Record)
- `id` (UUID Primary Key)
- `studentId` (FK to `Student`)
- `sessionId` (FK to `AcademicSession`)
- `classId` (FK to `JamatClass`)
- `sectionId` (FK to `Section`, nullable)
- `rollNumber` (Integer)
- `status` (`ACTIVE`, `PROMOTED`, `TRANSFERRED`, `DROPPED`)
- `enrolledAt` (DateTime)
- Constraint: `@@unique([sessionId, classId, sectionId, rollNumber])`

### G. StudentDocument
- `id` (UUID Primary Key)
- `studentId` (FK to `Student`)
- `documentType` (`PHOTO`, `BIRTH_CERTIFICATE`, `NID`, `PREVIOUS_CERTIFICATE`, `PREVIOUS_MARKSHEET`, `GUARDIAN_DOCUMENT`, `OTHER`)
- `fileName`, `fileUrl`, `fileSize`, `mimeType`
- `verificationStatus` (`PENDING`, `VERIFIED`, `REJECTED`)
- `verifiedAt` (DateTime)

---

## 3. Academic APIs Implemented

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/admin/academic/sessions` | `GET` | Admin/Principal | List all academic sessions with counts |
| `/api/admin/academic/sessions` | `POST` | Admin | Create a new academic session |
| `/api/admin/academic/sessions/:id` | `GET, PATCH, DELETE` | Admin | View/update session; safe deletion protection |
| `/api/admin/academic/sessions/:id/activate` | `POST` | Admin | Set session as active/current |
| `/api/admin/academic/sessions/:id/close` | `POST` | Admin | Close session preserving all historical records |
| `/api/admin/academic/classes` | `GET` | All Auth | List dynamic classes ordered by sort order |
| `/api/admin/academic/classes` | `POST` | Admin | Create new Jamat with gender configuration |
| `/api/admin/academic/classes/:id` | `GET, PATCH, DELETE` | Admin | View/update Jamat; safe deletion protection |
| `/api/admin/academic/sections` | `GET` | All Auth | List sections (filterable by class) |
| `/api/admin/academic/sections` | `POST` | Admin | Create section with room & capacity |
| `/api/admin/academic/sections/:id` | `GET, PATCH, DELETE` | Admin | View/update section |
| `/api/admin/students` | `GET` | Admin/Teacher | Paginated student list with search & filters (Teacher scoped) |
| `/api/admin/students` | `POST` | Admin | Transactional student creation with permanent ID |
| `/api/admin/students/:id` | `GET` | Admin/Teacher/Guardian | Complete profile with IDOR security verification |
| `/api/admin/students/:id` | `PATCH` | Admin | Update master profile & roll adjustment with audit |
| `/api/admin/students/:id` | `DELETE` | Admin | Soft withdrawal archive protection |
| `/api/admin/students/:id/documents` | `GET, POST` | Admin/Principal | Student document foundation |
| `/api/admin/students/:id/guardians` | `GET, POST` | Admin | Multi-guardian linking & primary toggle |
| `/api/admin/guardians` | `GET, POST` | Admin | Guardian directory & creation |
| `/api/admin/guardians/:id` | `GET, PATCH` | Admin | Guardian detail & linked children |
| `/api/admin/promotions/preview` | `POST` | Admin | Previews promotion candidates and calculates rolls |
| `/api/admin/promotions` | `GET, POST` | Admin | Execute bulk/individual promotion in transaction |

---

## 4. UI Implementation

1. **Academic Management Hub (`/admin/academic`)**:
   - Tab 1: সেশন ব্যবস্থাপনা (Sessions) — List, create, activate, close sessions.
   - Tab 2: জামাত ও শ্রেণি (Classes) — Dynamic Qawmi structure, gender options, sort order.
   - Tab 3: শাখা ব্যবস্থাপনা (Sections) — Class-wise sections, capacity, room.
   - Tab 4: প্রমোশন ইঞ্জিন (Promotions) — Source/target pickers, candidate preview, roll assignment, execution with audit log.
   - Child redirects: `/admin/academic/sessions`, `/admin/academic/classes`, `/admin/academic/sections`, `/admin/academic/promotions`.

2. **Student Directory (`/admin/students`)**:
   - Real-time institutional metric counters (মোট, আবাসিক, অনাবাসিক, ডে-কেয়ার, এতিম).
   - Live multi-criteria filter and search.
   - "নতুন ছাত্র ভর্তি / নিবন্ধন" Multi-Step Modal with Arabic Name Assistance (`আরবি নাম সহায়তা`), family, contact, welfare, and initial enrollment.

3. **Student Master Profile (`/admin/students/[id]`)**:
   - 6 Tabs:
     1. সংক্ষিপ্ত রূপরেখা (Overview)
     2. ব্যক্তিগত তথ্য (Personal)
     3. পরিবার ও অভিভাবক (Family & Guardians)
     4. শিক্ষাবর্ষ ও জামাত ইতিহাস (Enrollment History & Roll Adjustment)
     5. ডকুমেন্টস (Student Documents)
     6. অডিট ও নিরাপত্তা লগ (Audit Trail)

4. **Guardian Directory (`/admin/guardians`)**:
   - Guardians listing with linked children cards and primary indicator.
   - New guardian registration modal.

---

## 5. Security & IDOR Enforcement

1. **Role-Based Server-Side Authorization**:
   - Only `ADMIN` can create sessions, classes, sections, students, guardians, or execute promotions.
2. **Teacher Academic Scoping**:
   - Teachers cannot view or access students outside their assigned academic jamats/sections.
3. **Guardian Child Isolation (IDOR Protection)**:
   - A guardian attempting to access an unlinked student profile via `/api/admin/students/:id` is blocked with `403 Forbidden`.
4. **Permanent Audit Logging**:
   - All critical operations (`CREATE`, `UPDATE`, `ROLL_CHANGE`, `PROMOTION`, `CLOSE_SESSION`) write immutable records into `AuditLog`.

---

## 6. Verification Results

- **Phase 2 Academic Core Automated Test Suite:**
  - Command: `node scripts/test_phase2_academic.js`
  - Result: **42 / 42 Tests Passed (0 Failures)**
- **Phase 1 Regression Test Suite:**
  - Command: `node scripts/test_phase1_foundation.js`
  - Result: **39 / 39 Tests Passed (0 Failures)**
- **Production Build:**
  - Command: `npm run build`
  - Result: **66 / 66 Pages Generated Successfully (0 Errors)**
- **Browser Subagent QA:**
  - Full end-to-end user journeys executed on live server (`http://localhost:3000`).
  - Screenshots captured for Academic Hub, Student Directory, Admission Modal, Student Profile, and Guardian Directory.
