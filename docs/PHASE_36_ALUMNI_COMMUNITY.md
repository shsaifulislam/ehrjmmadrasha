# EHRJ MADRASHA ERP
## PHASE 36 — ALUMNI, FORMER STUDENT & COMMUNITY RELATIONSHIP MANAGEMENT ENGINE

**Project:** Eliotganj Hazi Rohmatollah Jamiria Madrasha  
**Bangla:** ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা  
**Short Name:** EHRJ Madrasha  
**Checkpoint:** `EHRJ-AI-2026-PHASE36`  
**Status:** COMPLETED & VERIFIED  

---

## 1. ARCHITECTURAL MISSION & CORE INVARIANTS

Phase 36 implements a production-grade **Alumni, Former Student & Institutional Community Relationship Management Engine** for EHRJ Madrasha. The engine enables the institution to maintain structured, privacy-conscious, and historically accurate lifelong connections with graduates, former students, legacy alumni, institutional patrons, volunteers, and donors without violating existing systemic boundaries:

```text
=============================================================================
AUTHORITATIVE STUDENT MASTER (prisma.student / prisma.enrollment)
  ▲
  │ (References studentId / studentIdNumber, zero duplication)
  │
PHASE 36: ALUMNI RELATIONSHIP LAYER (AlumniProfile, AlumniGroup, Mentorship)
  │
  ├─► PRIVACY ENGINE: Strict masking, opt-in visibility, anti-scraping (<=50/page)
  ├─► MENTORSHIP ENGINE: Institutional vetting flow, no direct unmonitored chat
  ├─► VOLUNTEER ENGINE: Service hours tracking, institutional activities
  ├─► CONTRIBUTIONS: Direct link to Phase 6 Finance Funds (Zakat, Lillah, etc.)
  └─► LEGACY IMPORT: Batch staging, duplicate diagnostics (phone, email, name+year)
=============================================================================
```

### Core Invariants Enforced

1. **Alumni Is a Relationship Layer, Not a Second Student Database:**
   - Authoritative historical student master records (`prisma.student`, `prisma.enrollment`) remain the single source of truth.
   - Verified alumni profiles reference `studentId`. Academic degrees, department, and completion year are verified against authoritative enrollment records.
   - For historical alumni prior to digital records, profiles are explicitly designated `isLegacy: true` with required `legacySourceNote`.

2. **Privacy by Default:**
   - Public directory queries execute strict sanitization (`sanitizeAlumniForPublic`).
   - Contact details (phone, email, full address, social handles) are permanently redacted unless the alumnus explicitly enables `publicContactAllowed` and `publicDirectoryOptIn`.
   - Admin access requires RBAC validation; raw personal data is never sent in unauthenticated payloads.

3. **Anti-Scraping Defense:**
   - Public directory queries are capped at a maximum of `50` profiles per response, irrespective of requested pagination parameters.
   - Bulk programmatic harvesting is prevented at both the domain engine and API route layers.

4. **Institutional Mentorship Protection (No Unrestricted Chat):**
   - Mentorship operates via a mediated institutional workflow:
     `Student / Guardian Request` $\rightarrow$ `Admin / Taleemat Review` $\rightarrow$ `Approved Institutional Connection`.
   - Direct, unmonitored peer-to-peer or adult-to-student messaging is strictly prohibited to safeguard students and institutional integrity.

5. **Financial Integrity & Zero Payment Redundancy:**
   - Financial contributions connect directly to Phase 6 Finance fund codes (`GENERAL`, `LILLAH`, `ZAKAT`, `CONSTRUCTION`, `ORPHAN_SUPPORT`).
   - Phase 36 does NOT implement duplicate payment gateways or parallel ledger systems.
   - In-kind donations (books, educational equipment, medical supplies) are recorded with item descriptions and estimated value.

6. **Strictly NO SMS:**
   - In adherence to institutional constraints, all alumni communications, registration confirmations, and verification notices are dispatched via secure in-app portal notifications and email. No SMS gateways are utilized.

7. **Historical Immutability & Audit Trail:**
   - Self-service alumni updates allow editing current occupation, employer, location, and privacy preferences.
   - Core historical fields (`graduationYear`, `department`, `degreeName`, `studentId`) are immutable and can only be corrected through administrative verification with logged audit entries.

---

## 2. DOMAIN ENGINES & COMPONENT ARCHITECTURE

All domain logic resides in `src/lib/alumni/` with clean functional separation and atomic persistence:

```text
src/lib/alumni/
├── types.ts                      # Complete domain interfaces & type definitions
├── alumniStore.ts                # Atomic JSON persistence & pre-seeded datasets
├── alumniVerificationEngine.ts   # Verification lifecycle & student master linkage
├── alumniPrivacyEngine.ts        # Privacy sanitization & anti-scraping pagination
├── alumniGroupEngine.ts          # Community batch & interest group management
├── alumniMentorshipEngine.ts     # Safe mentorship matching & facilitation
├── alumniVolunteerEngine.ts      # Volunteer opportunities & service hours
├── alumniContributionEngine.ts   # Phase 6 Finance & in-kind contribution logging
├── alumniImportEngine.ts         # Legacy batch import with duplicate detection
└── index.ts                      # Unified public API barrel
```

### 2.1 Verification State Machine (`AlumniVerificationEngine`)

Profiles transition through a controlled state machine:

```text
[REGISTER / IMPORT]
        │
        ▼
 PENDING_VERIFICATION ────(Admin Review & Prisma Student Link)────► VERIFIED
        │                                                              │
        ▼ (Reject)                                                     ▼
     REJECTED                                                        ACTIVE
                                                                       │
                                                       ┌───────────────┴───────────────┐
                                                       ▼                               ▼
                                                   OPTED_OUT                       ARCHIVED
```

- `verifyAlumniProfile()`: Validates existence against `prisma.student`, verifies graduation year and department, transitions status to `VERIFIED` and sets `verifiedAt`.
- `updateAlumniProfileSelfService()`: Restricts alumni to updating allowed non-historical fields (`currentOccupation`, `organization`, `city`, `country`, `bio`, `linkedInUrl`, `privacy`). Attempting to alter `graduationYear` or `department` throws a domain validation error.

### 2.2 Privacy & Anti-Scraping (`AlumniPrivacyEngine`)

- `sanitizeAlumniForPublic()`: Strips private attributes (`phone`, `email`, `address`, `legacySourceNote`, `notes`, `auditEntries`). Only exposes contact fields if `privacy.publicContactAllowed === true`.
- `searchPublicDirectory()`: Applies department, batch year, occupation, and keyword filters against opted-in profiles (`publicDirectoryOptIn === true`).
- Enforces `Math.min(limit, 50)` anti-scraping guardrail on every query.

### 2.3 Community Groups (`AlumniGroupEngine`)

- Supports group categories: `BATCH_YEAR`, `PROFESSIONAL`, `REGIONAL`, `INTEREST`, and `COMMITTEE`.
- Governs membership requests (`PENDING` $\rightarrow$ `ACTIVE` $\rightarrow$ `REJECTED`).
- Pre-seeded with key institutional circles:
  - *Dawra-e-Hadith 2020 Batch Circle*
  - *Dhaka Division EHRJ Alumni Network*
  - *Khatmul Quran & Hifz Mentors Circle*

### 2.4 Controlled Mentorship (`AlumniMentorshipEngine`)

- Mentors declare areas of expertise (e.g., Higher Arabic Literature, Qirat, IT & Digital Skills, Career Counseling).
- Students submit structured mentorship requests with educational goals and questions.
- Administrators review and approve requests (`APPROVED`), assigning institutional meeting links or vetted email correspondence.

### 2.5 Volunteer Opportunities & Service Hours (`AlumniVolunteerEngine`)

- Manages institutional volunteer campaigns: Annual Jalsa, Ramadan Iftar Distribution, Blood Donation Camp, Hifz Exam Supervision.
- Tracks volunteer applications (`APPLIED` $\rightarrow$ `ACCEPTED` $\rightarrow$ `COMPLETED`).
- Records verified volunteer service hours.

### 2.6 Financial & In-Kind Contributions (`AlumniContributionEngine`)

- Logs financial gifts linked to Phase 6 Finance funds (`GENERAL`, `LILLAH`, `ZAKAT`, `CONSTRUCTION`, `ORPHAN_SUPPORT`) with transaction references.
- Logs in-kind contributions (e.g., 50 copies of Mishkat al-Masabih, Desktop PC for Hifz lab).

### 2.7 Legacy Batch Import Engine (`AlumniImportEngine`)

- Designed for digitizing historical alumni rosters (1995–2022).
- Two-phase execution:
  1. `previewImportBatch()`: Validates CSV/JSON rows and runs duplicate diagnostics against existing records (checking phone, email, and exact name + graduation year match).
  2. `executeImportBatch()`: Atomically commits valid non-duplicate rows as `PENDING_VERIFICATION` or pre-verified legacy records with full audit trail.

---

## 3. API ROUTES

All endpoints feature role verification, error handling, and privacy sanitization:

| Endpoint | Method | Access Scope | Description |
| :--- | :--- | :--- | :--- |
| `/api/alumni` | `GET` | Public / Admin | Search alumni directory with pagination (max 50) and privacy filtering. |
| `/api/alumni` | `POST` | Public / Authenticated | Register new alumni profile (`PENDING_VERIFICATION`). |
| `/api/alumni/[id]` | `GET` | Public / Admin / Owner | Fetch single profile (sanitized for public, full for admin/owner). |
| `/api/alumni/[id]` | `PATCH` | Authenticated Owner / Admin | Self-service update of non-historical fields and privacy flags. |
| `/api/alumni/[id]/verify` | `POST` | Super Admin / Nazim | Approve, reject, opt-out, or archive alumni profile. |
| `/api/alumni/groups` | `GET`, `POST` | Authenticated / Admin | List groups, fetch memberships, create group, request to join. |
| `/api/alumni/volunteering`| `GET`, `POST` | Authenticated / Admin | List opportunities, submit volunteer applications, log service hours. |
| `/api/alumni/mentorship` | `GET`, `POST` | Authenticated / Student | Register as mentor, submit student request, admin facilitate. |
| `/api/alumni/contributions`| `GET`, `POST` | Authenticated / Admin | List contributions and record financial / in-kind contributions. |
| `/api/alumni/import` | `POST` | Super Admin / Taleemat | Preview and execute legacy batch import with duplicate diagnostics. |
| `/api/portal/alumni` | `GET`, `PATCH` | Authenticated Alumnus | Consolidated personal alumni portal dashboard & self-service updates. |

---

## 4. USER EXPERIENCES & FRONTEND SURFACES

1. **Public Alumni Portal (`/alumni`):**
   - Islamic aesthetic with emerald and gold theme.
   - Core KPIs: Total Registered Alumni, Active Batches, Volunteer Hours, Mentorship Matches.
   - Quick navigation to Public Directory, Self-Registration, Community Groups, and Mentorship.
   - Institutional integrity pledge emphasizing privacy and authenticated student linkage.

2. **Public Sanitized Directory (`/alumni/directory`):**
   - Live debounced search by name, department, batch year, and occupation.
   - Card layout with privacy badges; masked contact information for profiles without explicit opt-in.
   - Embedded Self-Registration Modal allowing former students to submit verification requests.

3. **Authenticated Alumni Portal (`/portal/alumni`):**
   - Single-view management console for logged-in alumni.
   - Personal profile editor (occupation, organization, location, bio).
   - Granular privacy toggles (`publicDirectoryOptIn`, `publicContactAllowed`, `allowMentorshipRequests`, `allowVolunteeringInvites`).
   - Group memberships and join request tracker.
   - Active mentorship engagements and volunteer service hours ledger.
   - Lifetime contribution history (financial and in-kind).

4. **Admin Alumni Cockpit (`/admin/alumni`):**
   - Executive KPI tiles: Total Alumni, Pending Verifications, Active Mentors, Total Contributions.
   - Tabbed management console:
     - **Verification Queue:** Review pending profiles, inspect linked `studentIdNumber`, approve with notes or reject.
     - **Alumni Directory:** Full-access administrative table with export and status controls.
     - **Legacy Import Hub:** Paste CSV/JSON rows, run duplicate detection preview, and execute bulk creation.
     - **Audit Trail:** Immutable ledger of all verification and profile update actions.

---

## 5. VERIFICATION & TEST EVIDENCE

### 5.1 Automated Domain Test Suite (`test:phase36`)

Test file: `scratch/test_phase36_alumni_engine.ts`  
Command: `npm run test:phase36`

```text
============================================================
  EHRJ MADRASHA ERP — PHASE 36 ALUMNI ENGINE TEST SUITE
============================================================

[TEST GROUP 1] Verification Engine & Pre-seeded Records
  ✓ Store initialized with pre-seeded verified alumni
  ✓ Found verified profile for Mawlana Hasan Mahmud
  ✓ Found verified legacy profile for Mufti Abdul Quddus (isLegacy=true)

[TEST GROUP 2] Profile Registration & Initial Status
  ✓ New profile successfully registered
  ✓ Initial status is PENDING_VERIFICATION
  ✓ Audit trail recorded registration action

[TEST GROUP 3] Administrative Verification Workflow
  ✓ Profile verified successfully with admin notes
  ✓ Status transitioned to ACTIVE
  ✓ Verified timestamp recorded

[TEST GROUP 4] Self-Service Profile Update & Historical Immutability
  ✓ Self-service update modified allowed fields (occupation, city, bio)
  ✓ Immutability guard blocked unauthorized graduationYear alteration

[TEST GROUP 5] Privacy Engine & Sanitization
  ✓ Public directory search returned sanitized profiles
  ✓ Masked email/phone when publicContactAllowed is false
  ✓ Anti-scraping limit clamped query to max 50 items

[TEST GROUP 6] Status Transitions (Opt-Out & Archive)
  ✓ Profile status changed to OPTED_OUT
  ✓ Opted-out profile excluded from public directory
  ✓ Profile status transitioned to ARCHIVED

[TEST GROUP 7] Community Groups & Membership
  ✓ Retrieved pre-seeded community groups
  ✓ Created new batch group: Dawra-e-Hadith 2024 Alumni Circle
  ✓ Membership join request submitted with PENDING status
  ✓ Admin approved group membership to ACTIVE

[TEST GROUP 8] Mentorship Engine & Facilitation
  ✓ Registered new alumni mentor profile
  ✓ Mentor listed in active mentors registry
  ✓ Student mentorship request created (PENDING)
  ✓ Admin facilitated and approved mentorship request

[TEST GROUP 9] Volunteer Engine & Service Hours
  ✓ Retrieved active volunteer opportunities
  ✓ Volunteer application submitted successfully
  ✓ Admin accepted volunteer application
  ✓ Completed application and logged 12 verified service hours

[TEST GROUP 10] Contributions & Phase 6 Finance Linkage
  ✓ Recorded financial contribution linked to ZAKAT fund
  ✓ Recorded in-kind book donation
  ✓ Alumni contribution history reflects logged contributions

[TEST GROUP 11] Legacy Batch Import Engine & Duplicate Detection
  ✓ Import preview identified 2 valid rows
  ✓ Import executed and staged records with legacySourceNote
  ✓ Duplicate detection caught repeated email/phone

[TEST GROUP 12] Complete System Stats & Audit Integrity
  ✓ System stats aggregation returned consistent metrics
  ✓ Raw audit entries intact with complete event log

============================================================
  RESULTS: 37 / 37 TESTS PASSED (0 FAILED)
============================================================
```

### 5.2 Enterprise Regression Test Suite

All prior phases were executed to confirm zero regression:

| Phase | Description | Tests Passed | Status |
| :--- | :--- | :--- | :--- |
| **Phase 36** | **Alumni & Community Relationship Engine** | **37 / 37** | **PASSED** |
| Phase 35 | Student Life, Activities & Events Engine | 34 / 34 | PASSED |
| Phase 34 | Admission, Application & Enrollment Engine | 36 / 36 | PASSED |
| Phase 33 | Academic Scheduling & Resource Booking Engine | 47 / 47 | PASSED |
| Phase 32 | Communication, Push & Multi-Channel Notice Engine | 42 / 42 | PASSED |
| Phase 31 | Public Portal CMS & Content Lifecycle Engine | 37 / 37 | PASSED |
| **TOTAL** | **Cumulative Automated Invariant Tests** | **233 / 233** | **PASSED (100%)** |

---

## 6. PRODUCTION RUNBOOK & OPERATIONAL GOVERNANCE

### 6.1 Data Storage & Backup
- Alumni profiles, groups, mentorships, volunteering, and contributions reside in `data/alumni/` as atomic, versioned JSON records.
- Standard daily backups include `data/alumni/*.json` alongside the primary SQLite/PostgreSQL database dumps.

### 6.2 Adding Historical Legacy Alumni Records
1. Log in to the Admin Portal with Super Admin or Nazim-e-Taleemat privileges.
2. Navigate to `/admin/alumni` $\rightarrow$ **Legacy Import**.
3. Format batch data as CSV or JSON with columns: `fullNameBn`, `fullNameEn`, `graduationYear`, `department`, `phone`, `email`, `legacySourceNote`.
4. Click **Preview & Check Duplicates** to verify against existing records.
5. Click **Execute Batch Import** to stage records.

### 6.3 Student Mentorship Safeguards
- Under no circumstances should direct personal phone numbers or unvetted private channels be distributed through the mentorship engine.
- All mentorship correspondence must be initiated via institutional email or supervised video/audio appointments scheduled by the Taleemat department.
