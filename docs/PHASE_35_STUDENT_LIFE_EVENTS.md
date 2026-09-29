# EHRJ MADRASHA ERP
## PHASE 35 — INSTITUTIONAL STUDENT LIFE, EVENTS, ACTIVITIES & ENGAGEMENT ENGINE

**Project:** Eliotganj Hazi Rohmatollah Jamiria Madrasha  
**Bangla:** ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা  
**Short Name:** EHRJ Madrasha  
**Checkpoint:** `EHRJ-AI-2026-PHASE35`  
**Status:** COMPLETED & VERIFIED  

---

## 1. ARCHITECTURAL MISSION & CORE INVARIANTS

Phase 35 builds a production-grade **Institutional Student Life, Events, Activities & Engagement Engine** that governs non-core-academic institutional life (competitions, quran tilawat, debate, sports, convocation, seminars, parent assemblies, community volunteering) while preserving absolute integrity with existing EHRJ ERP authorities:

```text
ONE STUDENT TRUTH (Student Master)
ONE CALENDAR TRUTH (Phase 33 Calendar)
ONE DOCUMENT/CERTIFICATE TRUTH (Phase 7/29 Document Factory & Prisma Certificate)
ONE COMMUNICATION TRUTH (Phase 8/32 Communication Engine — STRICTLY NO SMS)
ONE FINANCE TRUTH (Phase 6 Finance)
ONE CMS TRUTH (Phase 31 CMS)
---------------------------------------------------------------------------------
MANY ENGAGEMENT EXPERIENCES (Public / Guardian / Teacher / Admin)
```

### Core Invariants Enforced

1. **No Duplicate Student Authority:** Event participants and registrations reference authoritative `prisma.student`. No duplicate student tables or profile records are created.
2. **Domain Separation of Results:** Event competition results (`EventCompetitionResult`) are strictly isolated from academic exam results (`ExamMark`/`Result`). Event results never alter academic grades, marks, or student promotion.
3. **Domain Separation of Attendance:** Event attendance (`EventAttendanceRecord`: `PRESENT`, `ABSENT`, `LATE`, `EXCUSED`) is strictly separated from daily academic attendance (`prisma.attendance`).
4. **No Second Calendar Engine:** Events schedule their calendar visibility and resource reservations through Phase 33 `CalendarEvent` and `requestResourceBooking`.
5. **Authoritative Certificates:** Official certificates are generated through Phase 7/29 `prisma.certificate` with unique verification identifiers (`EHRJ-VER-YYYY-XXXXX`) and high-contrast verifiable QR codes.
6. **Strictly NO SMS:** Communications occur exclusively via web portal, in-app notices, and official email. SMS is strictly omitted.
7. **Zero Autonomous AI Actions:** AI is restricted to assistance (drafting descriptions, summarizing reports). All approvals, registrations, attendance marking, scoring, and certificates require human authorization.

---

## 2. SYSTEM ARCHITECTURE & LIFECYCLE STATE MACHINE

### Controlled Event Lifecycle

```text
DRAFT
  ↓
REVIEW
  ↓
APPROVED (Auto-syncs to Phase 33 Calendar & Resource Booking)
  ↓
PUBLISHED / REGISTRATION_OPEN
  ↓
REGISTRATION_CLOSED / IN_PROGRESS
  ↓
COMPLETED
  ↓
ARCHIVED
  (CANCELLED: Can be triggered from pre-completion states; releases Calendar & Bookings)
```

### Event Master Schema (`InstitutionalEvent`)

- `id`: Canonical format `EHRJ-EVT-YYYY-XXXXXX`
- `typeCode`: Configurable category (`QURAN_COMPETITION`, `HADITH_COMPETITION`, `DEBATE_SPEECH`, `PRIZE_GIVING`, `ACADEMIC_PROGRAM`, `PARENT_MEETING`, `SPORTS_GAMES`, `VOLUNTEER_COMMUNITY`, `OTHER`)
- `titleBn`, `titleEn`, `titleAr`, `descriptionBn`, `instructionsBn`
- `organizer`, `sessionId`, `sessionName`
- `audienceRule`: Deterministic targeting (`ALL_STUDENTS`, `BOYS_ONLY`, `GIRLS_ONLY`, `RESIDENTIAL_ONLY`, `SPECIFIC_CLASS`, `SPECIFIC_SECTION`, `SPECIFIC_STUDENTS`, `minAgeYears`, `maxAgeYears`)
- `startAt`, `endAt`, `registrationOpensAt`, `registrationClosesAt`
- `venueText`, `resourceId` (Phase 33 institutional resource, e.g. `RES-001` Darul Hadith Auditorium)
- `calendarEventId`, `bookingId`
- `isRegistrationRequired`, `maxCapacity`, `registeredCount`, `waitlistCapacity`, `waitlistedCount`
- `isPublic`, `status`, `leadTeacherId`, `assignedTeacherIds`

---

## 3. ENGINE IMPLEMENTATION

### 1. Event Store (`src/lib/events/eventStore.ts`)
- Atomic JSON persistence in `data/events/`:
  - `events.json`: Event master repository
  - `event_types.json`: Configurable event categories
  - `registrations.json`: Student registrations and waitlist state
  - `attendance.json`: Event check-ins and QR timestamps
  - `results.json`: Competition scores, rankings, and awards
  - `certificates.json`: Issued certificate linkages
  - `feedback.json`: Post-event feedback and ratings
  - `audit_log.json`: Immutable audit trail

### 2. Event Lifecycle Engine (`src/lib/events/eventLifecycleEngine.ts`)
- Enforces strict transition matrix.
- Illegal state jumps (e.g. `DRAFT` $\rightarrow$ `COMPLETED`) are rejected.
- Validates operator roles (Admin/Principal operational authority).
- Triggers Phase 33 calendar synchronization on publication.
- Triggers calendar cancellation and resource release on event cancellation.

### 3. Registration & Capacity Defense Engine (`src/lib/events/eventRegistrationEngine.ts`)
- **Deterministic Eligibility Evaluation:** Evaluates student gender, class/section enrollment, residential category, age, and disciplinary status.
- **Strict Capacity & Concurrency Protection:** Confirms registrations up to `maxCapacity`.
- **Waitlist Management:** Automatically places candidates onto waitlist (`WAITLISTED` with `waitlistPosition`) when capacity is saturated.
- **Automatic Waitlist Promotion:** When a confirmed registration is cancelled, the first candidate on the waitlist is automatically promoted to `CONFIRMED`.
- **Duplicate Prevention:** Prevents repeated signups for the same student.
- **Guardian IDOR Defense:** Verifies guardian-child relationship via `prisma.guardianStudent` link.

### 4. Event Attendance & QR Check-In Engine (`src/lib/events/eventAttendanceEngine.ts`)
- Complete isolation from daily academic attendance.
- Supports QR scan check-in, manual teacher panel check-in, and offline sync tagging.
- Prevents duplicate check-in for already present attendees.

### 5. Competition Results Engine (`src/lib/events/eventResultEngine.ts`)
- Records category, score, rank, awards (`FIRST_PLACE`, `SECOND_PLACE`, `THIRD_PLACE`, `WINNER`, `RUNNER_UP`, `SPECIAL_RECOGNITION`), and judge comments.
- Separation invariant: Never writes to `ExamMark` or alters academic grade points.
- Official publishing gate: Only authorized users can publish results publicly.

### 6. Certificate Engine (`src/lib/events/eventCertificateEngine.ts`)
- Directly integrates with Phase 7/29 `prisma.certificate`.
- Generates canonical verification codes (`EHRJ-VER-YYYY-XXXXX`) and high-contrast verification QR codes.
- Creates immutable frozen snapshots (`snapshotJson`) with event, student, award, and institutional signatories.
- Supports revocation (`REVOKED`) with immutable audit logging.

### 7. Calendar Bridge (`src/lib/events/calendarBridge.ts`)
- Integrates Phase 35 Events with Phase 33 Calendar.
- Books institutional resources (e.g. Darul Hadith Auditorium) and manages conflict checks.

### 8. Reporting Engine (`src/lib/events/eventReportEngine.ts`)
- Generates comprehensive event summary reports: total registrations, waitlist count, attendance %, achievements, issued certificates, and average feedback ratings.

---

## 4. USER EXPERIENCES & ROUTES

1. **Public Events Directory (`/events` & `/events/[id]`):**
   - Responsive listing with search, category pills, date/time, venue, seat availability.
   - Comprehensive detail page with schedule, instructions, registration CTA, published competition winners, and feedback rating.
   - Respects privacy: Participant contact details and private notes are strictly hidden.
2. **Guardian Portal (`/portal/events`):**
   - Multi-child switcher for linked students.
   - Real-time eligibility evaluation for each event.
   - Direct registration with parental consent declaration and notes.
   - Registration status view (`CONFIRMED`, `WAITLISTED` with position).
   - Cancellation trigger.
   - Official certificate viewer with verification links.
   - Achievement cards.
3. **Teacher Panel (`/teacher/events`):**
   - Filter to assigned events.
   - Real-time QR code check-in scanner / manual attendance entry.
   - Competition scoring and evaluation drawer.
4. **Admin Cockpit (`/admin/events`):**
   - Real-time KPIs (Total Events, Upcoming, Active Registrations, Completed).
   - Filterable event list by status and type.
   - Status transition controls.
   - Event creation modal.
   - Participant management drawer with attendance and check-in.
   - Competition results scoring & publication.
   - Certificate issuance modal.
   - Event completion summary report view.

---

## 5. API ENDPOINTS

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/events` | `GET` | PUBLIC/ADMIN | List events with category & status filters |
| `/api/events` | `POST` | ADMIN | Create new institutional event |
| `/api/events/[id]` | `GET` | PUBLIC/ADMIN | Event details |
| `/api/events/[id]` | `PATCH` | ADMIN | State transitions & field updates |
| `/api/events/[id]/register` | `GET` | ADMIN/TEACHER | List event registrations |
| `/api/events/[id]/register` | `POST` | GUARDIAN/ADMIN | Register student with capacity check |
| `/api/events/[id]/register` | `DELETE` | GUARDIAN/ADMIN | Cancel registration & trigger waitlist promotion |
| `/api/events/[id]/checkin` | `GET` | TEACHER/ADMIN | List event attendance records |
| `/api/events/[id]/checkin` | `POST` | TEACHER/ADMIN | QR code or manual check-in |
| `/api/events/[id]/results` | `GET` | PUBLIC/ADMIN | Competition results (respects public gate) |
| `/api/events/[id]/results` | `POST` | TEACHER/ADMIN | Record score or publish all results |
| `/api/events/[id]/certificates` | `GET` | GUARDIAN/ADMIN | List event certificates |
| `/api/events/[id]/certificates` | `POST` | ADMIN | Issue certificate via Phase 7/29 |
| `/api/events/[id]/certificates` | `DELETE` | ADMIN | Revoke certificate |
| `/api/events/[id]/report` | `GET` | ADMIN | Event completion & engagement summary |
| `/api/events/[id]/feedback` | `GET` | PUBLIC/ADMIN | List feedback (masked for public) |
| `/api/events/[id]/feedback` | `POST` | ALL | Submit post-event feedback |
| `/api/portal/events` | `GET` | GUARDIAN | Guardian child-level events & achievements |

---

## 6. VERIFICATION & TEST RESULTS

Automated test runner: `npm run test:phase35` (`scratch/test_phase35_student_life_events.ts`)

```text
======================================================================
   EHRJ ERP - PHASE 35 STUDENT LIFE, EVENTS & ENGAGEMENT ENGINE       
   Checkpoint: EHRJ-AI-2026-PHASE35 Verification Suite                
======================================================================

--- SETUP: Resolving authoritative test student from database ---
  [PASS] Test 1: Test student resolved with valid Student Master ID

--- GROUP 1: Event Lifecycle & State Machine Transitions ---
  [PASS] Test 2: Successfully created new event with ID
  [PASS] Test 3: Blocked illegal transition DRAFT -> COMPLETED
  [PASS] Test 4: Transition DRAFT -> REVIEW succeeded
  [PASS] Test 5: Transition REVIEW -> APPROVED succeeded
  [PASS] Test 6: Transition APPROVED -> REGISTRATION_OPEN succeeded

--- GROUP 2: Audience Targeting & Deterministic Eligibility Rules ---
  [PASS] Test 7: Created female-targeted event
  [PASS] Test 8: Deterministic eligibility correctly rejected male student for female event

--- GROUP 3: Registration Concurrency & Strict Capacity Defense ---
  [PASS] Test 9: First student confirmed within max capacity
  [PASS] Test 10: Blocked duplicate registration for the same student

--- GROUP 4: Waitlist Handling & Automatic Promotion ---
  [PASS] Test 11: Second student safely placed into WAITLIST with position 1
  [PASS] Test 12: Cancelled registration 1 successfully
  [PASS] Test 13: Waitlisted student automatically promoted to CONFIRMED status upon capacity release

--- GROUP 5: Event Attendance & QR Check-In (Domain Separation) ---
  [PASS] Test 14: QR Check-in successful
  [PASS] Test 15: Blocked duplicate check-in for already present participant
  [PASS] Test 16: Event attendance recorded in event domain store without polluting academic attendance

--- GROUP 6: Competition Results & Awards (Separated from Academic Exam Results) ---
  [PASS] Test 17: Recorded competition result with score 98 and rank 1
  [PASS] Test 18: Published event competition results
  [PASS] Test 19: Publicly queried published competition results

--- GROUP 7: Phase 7/29 Certificate Issuance & QR Verification ---
  [PASS] Test 20: Issued authentic event certificate with verification code
  [PASS] Test 21: Authoritative Prisma Certificate record verified in database
  [PASS] Test 22: Prisma Certificate type is EVENT_WINNER

--- GROUP 8: Phase 33 Calendar & Resource Booking Bridge ---
  [PASS] Test 23: Synchronized event to Phase 33 Calendar
  [PASS] Test 24: Found matching CalendarEvent record in Phase 33 calendar datastore

--- GROUP 9: Communication Domain Bridge (NO SMS) ---
  [PASS] Test 25: STRICT INVARIANT CONFIRMED: No SMS was dispatched or configured

--- GROUP 10: Guardian Child-Level IDOR Isolation ---
  [PASS] Test 26: IDOR DEFENSE: Blocked unauthorized guardian from registering unlinked child

--- GROUP 11: Event Feedback & Summary Reporting ---
  [PASS] Test 27: Generated comprehensive event completion report
  [PASS] Test 28: Report accurately counted competition results
  [PASS] Test 29: Report counted issued certificates
  [PASS] Test 30: Report computed average feedback rating

--- GROUP 12: Immutable Event Audit Trail ---
  [PASS] Test 31: Audit log tracks all events, registrations, attendance, and certificates
  [PASS] Test 32: Audit IDs follow strict format AUD-EVT-YYYY-XXXXXX
  [PASS] Test 33: Event transitioned to COMPLETED
  [PASS] Test 34: Event transitioned to ARCHIVED

======================================================================
   PHASE 35 VERIFICATION SUMMARY: 34/34 TESTS PASSED (100%)
======================================================================
```

### Zero Regressions Across Ecosystem
- `npm run test:phase34`: 36 / 36 PASSED (100%)
- `npm run test:phase33`: 47 / 47 PASSED (100%)
- `npm run test:phase32`: 42 / 42 PASSED (100%)
- `npm run test:phase31`: 37 / 37 PASSED (100%)
- **Total Automated Ecosystem Tests:** 196 / 196 PASSED (100%)

### Production Build Verification
- `npm run build`: Compiled 160 static and dynamic routes with zero TypeScript or build errors.

---

## 7. CHECKPOINT & COMMIT TAG

- **Tag:** `EHRJ-AI-2026-PHASE35`
- **Delivery Date:** 2026-09-29
- **Status:** **COMPLETE**
