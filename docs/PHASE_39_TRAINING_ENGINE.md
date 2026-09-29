# EHRJ MADRASHA ERP — PHASE 39
## Teacher/Staff Training, Professional Development & Certification Engine
**Checkpoint:** `EHRJ-AI-2026-PHASE39`  
**Institution:** Eliotganj Hazi Rohmatollah Jamiria Madrasha (ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা)

---

### 1. Executive Summary & Mission
Phase 39 establishes a production-grade institutional **Training, Professional Development & Certification Engine** designed to govern and empower the continuous learning journey of teachers, administrative staff, hostel personnel, and institutional leadership.

#### Core Architectural Invariants:
1. **One Authoritative Employee Master**: Phase 39 references Phase 13 (`Employee` model). It never duplicates employee master data, employment history, payroll records, or leave management.
2. **Strict Separation of Attendance**: Training attendance is tracked per session independently and never writes to or modifies regular HR/payroll attendance.
3. **Strict Separation of Assessments**: Training assessment is dedicated to adult professional development. It never modifies academic student results, examination grades, or employee salary deductions.
4. **Institutional Certificate Verification**: Certificates are minted with unique verification tokens (`VER-TRN-YYYY-XXXX`) compatible with the Phase 7/29 verification gateway (`/verify/document/[token]`).
5. **Bounded AI**: AI assists with summaries, learning guidance, and practice questions, but is strictly prohibited from autonomously certifying or failing candidates.
6. **Strictly NO SMS**: Notification workflows rely strictly on in-app portal alerts and Phase 33 calendar synchronizations.

---

### 2. Architecture & Domain Model

```
                    ┌────────────────────────────────────────┐
                    │          Phase 13 Employee             │
                    │         (Authoritative Master)         │
                    └───────────────────┬────────────────────┘
                                        │ references
                                        ▼
┌──────────────────┐    enrolls    ┌────────────────────────┐    attends    ┌──────────────────────┐
│  Phase 38 SOP /  ├──────────────►│   TrainingEnrollment   │──────────────►│  TrainingAttendance  │
│    Knowledge     │               └───────────┬────────────┘               └──────────────────────┘
└──────────────────┘                           │ passes assessment
                                               ▼
┌──────────────────┐    syncs      ┌────────────────────────┐    verifies   ┌──────────────────────┐
│ Phase 33 Calendar│◄──────────────┤   TrainingAssessment   │──────────────►│     Phase 7 / 29     │
│  (Session Events)│               └───────────┬────────────┘               │  Certificate Verify  │
└──────────────────┘                           │ generates certificate      └──────────────────────┘
                                               ▼
                                   ┌────────────────────────┐
                                   │  TrainingCertificate   │
                                   │ (EHRJ-TRN-CERT-YYYY-*) │
                                   └────────────────────────┘
```

#### Key Domain Components:
- **`TrainingLifecycleEngine`**: Manages the 10-stage program lifecycle (`DRAFT` $\rightarrow$ `REVIEW` $\rightarrow$ `APPROVED` $\rightarrow$ `PUBLISHED` $\rightarrow$ `REGISTRATION_OPEN` $\rightarrow$ `SCHEDULED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED` $\rightarrow$ `ARCHIVED`), transactional capacity validation, and automatic waitlisting.
- **`TrainingAttendanceEngine`**: Session-level attendance (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`, `PARTIAL`), QR code scanner verification (`EHRJ-QR-TRN-${sessionId}`), and real-time attendance rate calculation.
- **`TrainingAssessmentEngine`**: Sanitized question bank (with answer keys redacted for participants), automated objective quiz scoring, and instructor evaluation workflows for practical assessments.
- **`TrainingCertificationEngine`**: Multi-criteria eligibility gatekeeper (`Attendance Threshold % + Passed Assessment = Eligible`), idempotent certificate issuance, validity tracking, and renewal extensions.
- **`TrainingIntegrationBridge`**: Non-duplicative profile builder for Phase 13 employee view, Phase 33 calendar payload generator, and Phase 37 feedback survey linker.

---

### 3. API Surface

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/training/programs` | GET | All | List programs with filtering by type, status, department |
| `/api/training/programs` | POST | Admin/Principal | Create new training program in DRAFT |
| `/api/training/programs/[id]` | GET | All | Get program details (assessment questions sanitized for non-admins) |
| `/api/training/programs/[id]` | PATCH | Admin/Principal | Update training program configuration |
| `/api/training/programs/[id]/action` | POST | Admin/Principal | Transition program lifecycle status |
| `/api/training/programs/[id]/enroll` | POST | Authenticated | Enroll or assign participant (with capacity check & waitlist) |
| `/api/training/sessions` | GET | All | Retrieve scheduled training sessions |
| `/api/training/sessions` | POST | Admin/Principal | Add or update session & sync Phase 33 Calendar |
| `/api/training/attendance` | GET | Authenticated | Retrieve attendance records (privacy protected) |
| `/api/training/attendance` | POST | Authenticated/Instructor | Record attendance or process QR check-in |
| `/api/training/assessments/[id]/submit` | POST | Authenticated | Submit assessment attempt with automated grading |
| `/api/training/certificates` | GET | Authenticated | Retrieve earned certificates (admin sees all) |
| `/api/training/certificates` | POST | Authenticated | Claim or issue certificate upon eligibility |
| `/api/training/renewals` | GET | Authenticated | List expiring soon (<30 days) and expired certificates |
| `/api/training/renewals` | POST | Admin/Principal | Renew certificate validity |
| `/api/training/stats` | GET | All | Compute dashboard metrics from active store data |

---

### 4. User Interfaces

#### 1. Institutional Training Console (`/admin/training`)
- **Programs Dashboard**: Visual status badges, capacity meters, multi-step lifecycle actions, and comprehensive creation modal.
- **Sessions & Calendar**: List of scheduled sessions, time slots, venues, and Phase 33 calendar synchronization status.
- **Participants & Attendance**: Real-time participant roster, employee assignment modal, QR scanner check-in verification, and attendance percentage monitor.
- **Assessments & Grading**: Assessment overview, pass thresholds, question bank details, and instructor evaluation drawer.
- **Certificates & Renewals**: Verifiable certificate ledger, public verification links, renewal queue for expiring certificates.
- **Audit Log**: Immutable audit stream capturing every program transition, enrollment, attendance, and certificate event.

#### 2. Teacher & Staff Learning Portal (`/portal/training`)
- **My Courses & Catalog**: Overview of assigned and available training programs with single-click registration.
- **Interactive Courseware**: Learning objectives, module-by-module breakdown, and recommended SOP readings.
- **Interactive Quiz Runner**: Multiple choice assessment interface with real-time score display and pass/fail feedback.
- **My Certificates (`/portal/training/certificates`)**: Printable institutional certificate view with QR verification code and direct link to `/verify/document/[token]`.

---

### 5. Verification & Testing Evidence

```text
================================================================================
       EHRJ MADRASHA ERP — PHASE 39 TEST SUITE
       Teacher/Staff Training, Professional Development & Certification Engine
       Checkpoint: EHRJ-AI-2026-PHASE39
================================================================================

--> Testing Training Lifecycle & State Transitions...
  [PASS] Test 1: Program creation assigns valid EHRJ-TRN ID
  [PASS] Test 2: New program starts in DRAFT status
  [PASS] Test 3: Transition DRAFT -> REVIEW succeeds
  [PASS] Test 4: Invalid transition REVIEW -> COMPLETED is blocked gracefully
  [PASS] Test 5: Transition to REGISTRATION_OPEN succeeds

--> Testing Session Scheduling & Phase 33 Calendar Payload...
  [PASS] Test 6: Session added successfully to program
  [PASS] Test 7: Calendar payload category is TRAINING
  [PASS] Test 8: Calendar payload links to PHASE_39_TRAINING
  [PASS] Test 9: Calendar start time is correctly formatted

--> Testing Participant Enrollment, Capacity & Waitlist...
  [PASS] Test 10: Participant 1 enrolled with CONFIRMED status
  [PASS] Test 11: Participant 2 enrolled with CONFIRMED status (capacity reached)
  [PASS] Test 12: Participant 3 enrolled with WAITLISTED status due to capacity limit
  [PASS] Test 13: Duplicate enrollment prevented and returns existing status

--> Testing Attendance Engine & QR Verification...
  [PASS] Test 14: Attendance recorded as PRESENT
  [PASS] Test 15: Enrollment attendance rate recalculated to 100%
  [PASS] Test 16: Valid QR code check-in succeeds with qrVerified flag
  [PASS] Test 17: Invalid/Cross-session QR is blocked

--> Testing Assessment Engine & Answer Sanitization...
  [PASS] Test 18: Sanitized assessment returned
  [PASS] Test 19: Correct answer is strictly redacted in sanitized assessment
  [PASS] Test 20: Correct quiz answers result in PASSED status
  [PASS] Test 21: Earned 100% score for correct answers
  [PASS] Test 22: Incorrect quiz answers result in FAILED status

--> Testing Certificate Issuance & Renewal Engine...
  [PASS] Test 23: Failed candidate is NOT eligible for certificate
  [PASS] Test 24: Qualified candidate (attendance + passed assessment) IS eligible for certificate
  [PASS] Test 25: Certificate issued successfully
  [PASS] Test 26: Certificate generates Phase 7/29 verification token
  [PASS] Test 27: Certificate issuance is idempotent (no duplicate IDs)
  [PASS] Test 28: Certificate renewal updates status to RENEWED

--> Testing Phase 13 Employee Training Profile Bridge...
  [PASS] Test 29: Profile matches requested employee ID
  [PASS] Test 30: Completed trainings count reflected in employee profile
  [PASS] Test 31: Earned certificates referenced in employee profile

--> Testing Instructor Evaluation & Development Plans...
  [PASS] Test 32: Instructor evaluation elevates status to PASSED
  [PASS] Test 33: Adjusted score reflected accurately
  [PASS] Test 34: Development plan successfully linked to employee training profile

--> Testing Dashboard Stats Calculation & Security Invariants...
  [PASS] Test 35: Dashboard stats reflect total programs
  [PASS] Test 36: Dashboard stats reflect issued certificates
  [PASS] Test 37: Mandatory completion rate is numeric
  [PASS] Test 38: INVARIANT CONFIRMED: Strictly NO SMS invocations exist in Phase 39 Engine
  [PASS] Test 39: Admin data preserves question answer key
  [PASS] Test 40: INVARIANT CONFIRMED: Answer keys strictly redacted for participant endpoints

================================================================================
Phase 39 Test Execution Complete: 40/40 Passed!
================================================================================
ALL PHASE 39 VERIFICATION TESTS PASSED SUCCESSFULLY! ✓
```

- **Regression Status**:
  - Phase 38 Knowledge & SOP: 55/55 Passed.
  - Phase 37 Survey Engine: 43/43 Passed.
- **Production Build Status**: Next.js App Router 14.2.35 compilation passed cleanly with zero type errors across all 185+ routes.
