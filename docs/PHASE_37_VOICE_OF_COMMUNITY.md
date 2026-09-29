# EHRJ MADRASHA ERP
## PHASE 37 — INSTITUTIONAL SURVEY, FEEDBACK, ASSESSMENT & VOICE-OF-COMMUNITY ENGINE

**Project:** Eliotganj Hazi Rohmatollah Jamiria Madrasha  
**Bangla:** ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা  
**Short Name:** EHRJ Madrasha  
**Checkpoint:** `EHRJ-AI-2026-PHASE37`  
**Status:** COMPLETED & VERIFIED  

---

## 1. ARCHITECTURAL MISSION & CORE PRINCIPLES

Phase 37 builds a production-grade **Institutional Survey, Feedback, Assessment & Voice-of-Community Engine** for collecting, analyzing, and acting upon structured institutional feedback from guardians, teachers, alumni, event participants, and public well-wishers while strictly protecting systemic integrity and human decision authority:

```text
=============================================================================
AUTHORITATIVE EXISTING ERP CORES (Student, HR, Finance, Events, Admissions)
  ▲
  │ (Referenced by ID/Code; Zero Systemic Duplication)
  │
PHASE 37: INSTITUTIONAL SURVEY & VOICE-OF-COMMUNITY ENGINE
  │
  ├─► LIFECYCLE & VERSIONING: DRAFT -> ... -> PUBLISHED -> OPEN -> CLOSED (v1 -> v2)
  ├─► PRIVACY & MODES: IDENTIFIED, PSEUDONYMOUS, ANONYMOUS
  ├─► SMALL-GROUP PROTECTION: Granular slice suppression when n < 5
  ├─► DUPLICATE DEFENSE: Idempotent token / student / respondent checks
  ├─► BOUNDED AI THEMES: Explicit `humanReviewRequired: true` guard
  ├─► HELPDESK BRIDGE: Direct conversion to Phase 14 EHRJ-REQ-YYYY-XXXXXX tickets
  └─► STRICTLY NO SMS: Web portal notices, in-app alerts, and official email
=============================================================================
```

### Core Invariants Enforced

1. **Feedback Informs Decisions; It Does Not Automatically Make High-Stakes Decisions:**
   - Survey results must never autonomously alter:
     - Student academic marks or exam results (`ExamMark`)
     - Student promotion or academic standing
     - Admission approval or rejection
     - Financial assistance, scholarships, or fee waivers
     - Staff payroll, compensation, or benefits
     - Teacher employment status or disciplinary actions
     - Certificate issuance or credential revocation
     - Account suspension or security permissions
   - Programmatically enforced via `assertNoHighStakesDecisionMutation()`.

2. **Published Survey Question Immutability:**
   - Once a survey is `PUBLISHED` or `OPEN`, direct alteration of its questions is strictly prohibited (`isVersionLocked = true`).
   - If updates are required, administrators must branch/clone a new version (`v1` $\rightarrow$ `v2`) as a `DRAFT`.
   - Historical responses remain permanently bound to their exact survey version.

3. **Technical Privacy & Anonymous Safety:**
   - For `ANONYMOUS` surveys, identity is technically severed from response payloads. Real names, user IDs, and client IP hashes are never recorded or displayed.
   - For `PSEUDONYMOUS` surveys, identities are masked for normal reviewers while preserving deduplication tokens.
   - For `IDENTIFIED` surveys, personal data is visible only to authorized administrators (`ADMIN`, `PRINCIPAL`).

4. **Small-Group Protection Policy:**
   - If a survey or demographic slice contains fewer than `5` completed responses, granular demographic breakdowns are automatically suppressed (`isSmallGroupSuppressed: true`) to prevent accidental deanonymization.

5. **Actionable Feedback to Help Desk Bridge (Phase 14):**
   - Survey findings can be directly converted into official Help Desk tickets (`createSupportRequest`), generating `EHRJ-REQ-YYYY-XXXXXX` references with bidirectional tracking.

6. **Strictly NO SMS:**
   - Invitations and deadline reminders are dispatched exclusively via the web portal, authenticated in-app alerts, and official email. SMS is strictly omitted.

---

## 2. DOMAIN ENGINES & COMPONENT ARCHITECTURE

All domain logic resides in `src/lib/surveys/` with atomic persistence in `data/surveys/`:

```text
src/lib/surveys/
├── types.ts                      # Complete domain interfaces & type definitions
├── surveyStore.ts                # Atomic JSON persistence & pre-seeded datasets
├── surveyLifecycleEngine.ts      # Controlled state machine & immutable versioning
├── surveyResponseEngine.ts       # Validation, duplicate protection, save & resume
├── surveyPrivacyEngine.ts        # Anonymous sanitization & small-group protection
├── surveyAnalyticsEngine.ts      # Quantitative distributions & bounded AI themes
├── surveyActionEngine.ts         # Improvement actions & Phase 14 Help Desk bridge
├── surveyCommunicationBridge.ts  # NO SMS invitation & deadline reminder workflows
└── index.ts                      # Unified public API barrel
```

### 2.1 State Machine Lifecycle (`SurveyLifecycleEngine`)

```text
DRAFT
  ↓
REVIEW
  ↓
APPROVED
  ↓
PUBLISHED (Locks question schema & captures Audience Snapshot)
  ↓
 OPEN ────► CLOSED ────► ANALYZING ────► COMPLETED ────► ARCHIVED
              │
              └────► (Branch new version v2: DRAFT)
```

- `createSurveyDraft()`: Initializes survey in `DRAFT` status with standard `EHRJ-SUR-YYYY-XXXXXX` ID.
- `transitionSurveyStatus()`: Validates allowed state transitions and automatically locks version questions upon `PUBLISHED` or `OPEN`.
- `createNewSurveyVersion()`: Creates successor survey (`v2`) linked to `v1`, resetting response counters while keeping historical records intact.

### 2.2 Response Engine & Deduplication (`SurveyResponseEngine`)

- `validateSurveyAnswers()`: Enforces question requirements, numeric scale bounds (e.g. 1 to 5), option selections, and evaluates conditional visibility.
- `isQuestionVisible()`: Real-time client & server conditional evaluation (`EQUALS`, `NOT_EQUALS`, `CONTAINS`, `LESS_THAN_OR_EQUAL`). Hidden questions are exempt from validation.
- `checkDuplicateResponse()`: Server-side check preventing multiple submissions for `ONE_PER_USER` or `ONE_PER_STUDENT` surveys.
- Save and resume: Supports saving in-progress drafts (`isDraft: true`).

### 2.3 Privacy Engine (`SurveyPrivacyEngine`)

- `sanitizeResponseForViewer()`: Strips PII based on `ResponseMode` and user authorization.
- `sanitizeResponseList()`: Evaluates total response count against `MIN_RESPONSE_THRESHOLD = 5`.

### 2.4 Analytics & Bounded AI Themes (`SurveyAnalyticsEngine`)

- Quantitative: Response counts, completion percentage, option-level distribution (counts & percentages), average satisfaction rating, CSAT index (0-100 scale).
- Qualitative: Clusters text comments into structured themes (`COMMENDATION`, `SUGGESTION`, `CONCERN`).
- Mandatory Safety Tag: All AI themes are permanently stamped with `humanReviewRequired: true` and `generatedByAi: true`.

### 2.5 Improvement Actions & Help Desk Bridge (`SurveyActionEngine`)

- Manages institutional follow-up: `IDENTIFIED` $\rightarrow$ `ASSIGNED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED` $\rightarrow$ `VERIFIED` $\rightarrow$ `CLOSED`.
- `convertFeedbackToHelpdeskTicket()`: Integrates with `src/lib/helpdeskEngine.ts` to spawn official `EHRJ-REQ-YYYY-XXXXXX` service tickets.

---

## 3. REST API ENDPOINTS

All endpoints enforce authentication, role permissions, and privacy sanitization:

| Endpoint | Method | Access Scope | Description |
| :--- | :--- | :--- | :--- |
| `/api/surveys` | `GET` | Public / Admin | List surveys with filters (status, type, public, audience). |
| `/api/surveys` | `POST` | Admin / Staff | Create a new survey draft in `DRAFT` status. |
| `/api/surveys/[id]` | `GET` | Public / Admin | Fetch survey definition and questions. |
| `/api/surveys/[id]` | `PATCH` | Admin | Update draft survey or non-locked metadata. |
| `/api/surveys/[id]` | `DELETE`| Admin | Delete draft survey or cancel/archive. |
| `/api/surveys/[id]/status` | `POST` | Admin | Transition status (`REVIEW`, `APPROVED`, `PUBLISHED`, `OPEN`, `CLOSED`). |
| `/api/surveys/[id]/version`| `POST` | Admin | Branch into a new version (v1 $\rightarrow$ v2) as an editable DRAFT. |
| `/api/surveys/[id]/submit` | `POST` | Public / Authenticated | Submit response with duplicate protection and answer validation. |
| `/api/surveys/[id]/responses`| `GET`| Admin / Reviewer | List responses with privacy sanitization and small-group suppression. |
| `/api/surveys/[id]/analytics`| `GET`| Admin / Teacher | Get quantitative distributions and bounded AI qualitative themes. |
| `/api/surveys/[id]/actions` | `GET`, `POST` | Admin / Staff | List improvement actions, create action, or convert to Help Desk ticket. |
| `/api/portal/surveys` | `GET` | Authenticated User | Get eligible surveys for logged-in user with completion status. |

---

## 4. USER EXPERIENCES & FRONTEND SURFACES

1. **Public Survey & Community Voice Hub (`/surveys`):**
   - Public landing with institutional integrity pledge.
   - Shows active public surveys (Website accessibility feedback, public suggestions).
   - Invariant assurance card explaining anonymous privacy and non-punitive feedback policy.

2. **Interactive Survey Taking Experience (`/surveys/[id]`):**
   - Mobile-first, responsive, accessible form design.
   - Dynamic real-time conditional questions (e.g. selecting "Yes" reveals detailed follow-up text area).
   - Rating stars (1 to 5), Likert scale selectors, radio options, checkboxes, yes/no toggles.
   - Save Draft button and Final Submit button.
   - Instant confirmation screen with reference ID and submission receipt.

3. **Authenticated Portal Surveys (`/portal/surveys`):**
   - Dedicated portal tab for Guardians, Teachers, and Alumni.
   - Tabs: "অংশগ্রহণযোগ্য জরিপসমূহ (Active Surveys)" vs "সম্পন্ন মতামত (Completed Feedback)".
   - Clear privacy badges: "বেনামী (Anonymous)", "ছদ্মনামযুক্ত (Pseudonymous)", "পরিচিত (Identified)".

4. **Admin Survey Cockpit (`/admin/surveys`):**
   - KPI metrics: Total Surveys, Active Surveys, Total Responses, Open Improvement Actions.
   - Management table with status badges, version locks, response tallies, and filter controls.
   - Built-in Survey Builder modal to scaffold new surveys with dynamic question definitions.

5. **Admin Survey Detail & Deep-Dive (`/admin/surveys/[id]`):**
   - Header with status transition buttons and "নতুন সংস্করণ তৈরি (Create v2)" version branching.
   - **Analytics & Distributions Tab:** CSAT index, question distributions, small-group protection warnings, and bounded AI qualitative themes.
   - **Responses Tab:** Privacy-sanitized responses list.
   - **Improvement Actions Tab:** Follow-up actions tracker with "কনভার্ট টু হেল্পডেস্ক (Convert to Support Ticket)" button linking to Phase 14.
   - **Questions & Audience Tab:** Audience snapshot and question definitions.

---

## 5. VERIFICATION & TEST EVIDENCE

### 5.1 Automated Domain Test Suite (`test:phase37`)

Test file: `scratch/test_phase37_survey_engine.ts`  
Command: `npm run test:phase37`

```text
======================================================================
   EHRJ ERP — PHASE 37 SURVEY & VOICE-OF-COMMUNITY TEST SUITE        
   Checkpoint: EHRJ-AI-2026-PHASE37 Verification                      
======================================================================

--- GROUP 1: Survey Master Creation & Lifecycle State Machine ---
  [PASS] Test 01: Survey created with standard EHRJ-SUR-YYYY-XXXXXX format
  [PASS] Test 02: Initial survey status defaults to DRAFT
  [PASS] Test 03: Initial version is 1 and version is not locked
  [PASS] Test 04: Transitioned DRAFT -> REVIEW successfully
  [PASS] Test 05: Transitioned REVIEW -> APPROVED successfully
  [PASS] Test 06: Transitioned APPROVED -> PUBLISHED and locked version questions
  [PASS] Test 07: Transitioned PUBLISHED -> OPEN successfully
  [PASS] Test 08: State machine strictly rejects invalid skip transition (OPEN -> COMPLETED)

--- GROUP 2: Question Immutability & Safe Versioning ---
  [PASS] Test 09: Locked published survey strictly blocks silent question alteration
  [PASS] Test 10: Cloned version produces new survey with version incremented to 2
  [PASS] Test 11: New version defaults to editable DRAFT status
  [PASS] Test 12: New version properly references original survey ID

--- GROUP 3: Audience Snapshot & Targeting ---
  [PASS] Test 13: Audience snapshot is captured when survey is published
  [PASS] Test 14: Audience snapshot preserves target count and locks survey version

--- GROUP 4: Privacy Engine & Mode Sanitization ---
  [PASS] Test 15: Privileged admin viewer sees identified respondent name
  [PASS] Test 16: Unprivileged viewer sees masked identity for identified survey
  [PASS] Test 17: Anonymous survey strictly redacts identity even for Admin viewer

--- GROUP 5: Small-Group Protection (< 5 responses) ---
  [PASS] Test 18: Small-group protection activates when total responses < 5

--- GROUP 6: Conditional Logic & Question Validation ---
  [PASS] Test 19: Conditional question hidden when condition condition not met (TQ2 === true)
  [PASS] Test 20: Conditional question visible when condition condition met (TQ2 === false)
  [PASS] Test 21: Validation succeeds when required questions answered and hidden conditional question skipped
  [PASS] Test 22: Validation catches missing required question

--- GROUP 7: Response Submission & Duplicate Protection ---
  [PASS] Test 23: Response submission generates valid EHRJ-SUR-RES-YYYY-XXXXXX reference
  [PASS] Test 24: Final submission marks response as complete
  [PASS] Test 25: Duplicate submission attempt by same respondent/student is strictly rejected
  [PASS] Test 26: Draft response saves successfully without completion lock

--- GROUP 8: High-Stakes Invariant Guard ---
  [PASS] Test 27: Invariant guard prevents survey feedback from mutating academic exam marks
  [PASS] Test 28: Invariant guard prevents survey feedback from mutating staff payroll
  [PASS] Test 29: Invariant guard prevents survey feedback from mutating student promotion

--- GROUP 9: Bounded AI Qualitative Theme Summaries ---
  [PASS] Test 30: Analytics aggregates real response counts
  [PASS] Test 31: Calculates normalized 0-100 satisfaction index
  [PASS] Test 32: AI qualitative theme summary strictly enforces humanReviewRequired: true
  [PASS] Test 33: AI theme explicitly flagged as AI-generated

--- GROUP 10: Improvement Action Lifecycle & Help Desk Bridge ---
  [PASS] Test 34: Action generated with standard EHRJ-SUR-ACT-YYYY-XXXXXX format
  [PASS] Test 35: Initial action status defaults to IDENTIFIED
  [PASS] Test 36: Action transitioned to IN_PROGRESS
  [PASS] Test 37: Survey feedback successfully bridged to Phase 14 Help Desk ticket (EHRJ-REQ-YYYY-XXXXXX)

--- GROUP 11: Cross-Domain Integrations ---
  [PASS] Test 38: Event feedback survey links cleanly to Phase 35 Event Master
  [PASS] Test 39: Admission feedback survey links to Phase 34 Admission Experience
  [PASS] Test 40: Alumni feedback survey links to Phase 36 Alumni Relationship Engine

--- GROUP 12: Strictly NO SMS & Audit Trail Integrity ---
  [PASS] Test 41: Survey invitation dispatches strictly zero SMS messages
  [PASS] Test 42: Survey invitation utilizes web portal notice channel
  [PASS] Test 43: Immutable audit trail records survey lifecycle events (creation, transitions, actions)

======================================================================
   PHASE 37 VERIFICATION RESULTS: 43 / 43 TESTS PASSED (0 FAILED)
======================================================================
```

### 5.2 Cumulative Enterprise Regression Test Suite

| Phase | Domain Description | Test Count | Status |
| :--- | :--- | :--- | :--- |
| **Phase 37** | **Survey, Feedback & Voice-of-Community Engine** | **43 / 43** | **PASSED** |
| Phase 36 | Alumni & Community Relationship Engine | 37 / 37 | PASSED |
| Phase 35 | Student Life, Activities & Events Engine | 34 / 34 | PASSED |
| Phase 34 | Admission, Application & Enrollment Engine | 36 / 36 | PASSED |
| Phase 33 | Academic Scheduling & Resource Booking Engine | 47 / 47 | PASSED |
| Phase 32 | Communication, Push & Multi-Channel Notice Engine | 42 / 42 | PASSED |
| Phase 31 | Public Portal CMS & Content Lifecycle Engine | 37 / 37 | PASSED |
| **TOTAL** | **Cumulative Automated Invariant Tests** | **276 / 276** | **PASSED (100%)** |
