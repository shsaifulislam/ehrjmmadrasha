# EHRJ MADRASHA DIGITAL CAMPUS & ERP
## PHASE 10 — HOSTEL & RESIDENTIAL MANAGEMENT ENGINE
### Master Production Architecture & Verification Documentation

---

### 1. OVERVIEW & INSTITUTIONAL CONTEXT

- **Institution (বাংলা):** ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
- **Institution (English):** Eliotganj Hazi Rohmatollah Jamiria Madrasha
- **Institution (العربية):** الجامعة الإسلامية رحمة الله إليوت غنج
- **Established:** 2021
- **Location:** পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা, বাংলাদেশ
- **Founder & Muhtamim:** মাওলানা মহা. আবুল কালাম সরকার

The **Hostel & Residential Management Engine** (Phase 10) provides a production-grade, concurrency-safe, and immutable residential lifecycle management infrastructure for student boarding and day-care services at the institution.

Phase 10 adheres to strict design constraints:
- **Preserved Existing Architecture:** Uses the authoritative student residential status (`RESIDENTIAL`, `DAY_CARE`, `NON_RESIDENTIAL`) without replacement.
- **Zero Unnecessary Enterprise Complexity:** No room/floor/bed/hall allocation tables, no separate warden or hostel staff roles.
- **RBAC Continuity:** Operates strictly within the four canonical institutional roles (`ADMIN`, `PRINCIPAL`, `TEACHER`, `GUARDIAN`).
- **Phase 6 Finance Integration Invariant:** `DAY_CARE` students are strictly exempted from food billing (Food Bill = ৳0, `DAY_CARE_FOOD_EXEMPTION`). Historical invoices remain completely immutable upon status changes or checkout.
- **Phase 8 Communication Engine Integration:** Event-driven in-app notifications and email dispatch with deterministic idempotency keys for check-in, check-out, status change, request submission, and review decisions.
- **Strict Guardian Isolation & IDOR Protection:** Guardians can only view and submit requests for their verified linked children (`guardian.students.some(gs => gs.studentId === studentId)`). Cross-student manipulation returns `403 Forbidden`.
- **Teacher Scoped Access:** Read-only residential roster view for assigned classes; operational mutations (check-in, check-out, fee manipulation) are blocked with `403 Forbidden`.

---

### 2. CORE RESIDENTIAL ARCHITECTURE

```text
       ┌────────────────────────────────────────────────────────┐
       │             ADMIN HOSTEL OPERATIONS COCKPIT            │
       │              (src/app/admin/hostel/page.tsx)           │
       └───────────┬────────────────────────────────────────────┘
                   │
                   ▼
       ┌────────────────────────────────────────────────────────┐
       │             HOSTEL DOMAIN ENGINE & WORKFLOWS           │
       │              (src/lib/hostelEngine.ts)                 │
       └─────┬──────────────────┬──────────────────┬────────────┘
             │                  │                  │
             ▼                  ▼                  ▼
    [ Transactional Check-In ]  [ Clean Check-Out ] [ Status Transition ]
     • Lock & guard active state • Mark CHECKED_OUT   • Record old & new
     • Prevent double check-in   • Student -> NON_RES • Session aware
     • Update Student Status     • Preserve invoices  • Maintain immutability
     • Append ResidentialHistory • Append History     • Trigger notification
             │                  │                  │
             └──────────────────┼──────────────────┘
                                │
                                ▼
         ┌──────────────────────────────────────────────┐
         │             INTEGRATION ENGINES              │
         ├──────────────────────┬───────────────────────┤
         │ Phase 6 Finance      │ Phase 8 Communication │
         │ • Canonical billing  │ • Portal Notification │
         │ • DAY_CARE Food = ৳0 │ • Institutional Email │
         │ • Past bill frozen   │ • Idempotency Keys    │
         └──────────────────────┴───────────────────────┘
```

---

### 3. DATABASE SCHEMA & ENTITY MODELS

Added models in `prisma/schema.prisma`:

1. **`ResidentialEnrollment`**:
   - Represents the operational lifecycle of a student's hostel stay per session.
   - States: `PENDING`, `APPROVED`, `CHECKED_IN`, `ACTIVE`, `CHECKED_OUT`, `CANCELLED`.
   - Fields: `studentId`, `sessionId`, `residentialStatus`, `status`, `admissionDate`, `checkInDate`, `checkOutDate`, `notes`, `createdById`.
   - Constraints: `@@unique([studentId, sessionId])` ensures at most one enrollment record per student per academic session.

2. **`ResidentialHistory`**:
   - Immutable historical ledger of all residential status changes.
   - Fields: `studentId`, `sessionId`, `enrollmentId`, `previousStatus`, `newStatus`, `effectiveDate`, `reason`, `notes`, `recordedByUserId`.
   - Invariant: Historical records are append-only and never modified or deleted.

3. **`ResidentialRequest`**:
   - Formal application submitted by verified guardians for residential admission, status transition, or check-out.
   - States: `SUBMITTED`, `PENDING`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `CANCELLED`.
   - Fields: `requestNumber` (`EHRJ-HRQ-YYYY-XXXXXX`), `studentId`, `guardianId`, `sessionId`, `requestType`, `currentStatus`, `requestedStatus`, `reason`, `adminNotes`, `reviewedByUserId`.

4. **`ResidentialRule`**:
   - Institutional fee parameters per session.
   - Fields: `sessionId`, `monthlyHostelFee`, `monthlyFoodFee`, `admissionHostelFee`, `dayCareFoodExempt` (`true`), `allowGuardianRequest`, `rulesNotesBn`.

5. **`ResidentialRequestSequence`**:
   - Concurrency-safe atomic counter for request number generation per calendar year.

---

### 4. CANONICAL API MATRIX

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/admin/hostel/stats` | `GET` | ADMIN, PRINCIPAL | Live hostel occupancy, check-ins/outs, and due breakdown |
| `/api/admin/hostel/residents` | `GET`, `POST` | ADMIN | Server-side paginated residents list & manual enrollment |
| `/api/admin/hostel/residents/[studentId]` | `GET` | ADMIN, PRINCIPAL | Comprehensive student hostel profile, history, and finance summary |
| `/api/admin/hostel/check-in` | `POST` | ADMIN | Transactional check-in with double check-in guard |
| `/api/admin/hostel/check-out` | `POST` | ADMIN | Transactional check-out and restitution to NON_RESIDENTIAL |
| `/api/admin/hostel/status-change` | `POST` | ADMIN | Controlled residential state transition |
| `/api/admin/hostel/requests` | `GET` | ADMIN, PRINCIPAL | Guardian residential requests list |
| `/api/admin/hostel/requests/[id]/review` | `POST` | ADMIN | Request review (APPROVE / REJECT) with automatic state updates |
| `/api/admin/hostel/rules` | `GET`, `PUT` | ADMIN | Hostel fee policy configuration |
| `/api/admin/hostel/reports` | `GET` | ADMIN, PRINCIPAL | Summary, check-in, check-out, and history registers |
| `/api/portal/hostel` | `GET` | GUARDIAN | Linked child hostel overview with strict IDOR verification |
| `/api/portal/hostel/request` | `POST` | GUARDIAN | Submission of admission/change/checkout requests |
| `/api/teacher/hostel` | `GET` | TEACHER | Scoped read-only student residential roster |

---

### 5. FINANCE INTEGRATION & INVARIANTS

1. **Authoritative Source:** The student's `residentialStatus` attribute in `Student` is the single source of truth for residential fee assessment.
2. **Food Billing Exemption:**
   ```typescript
   if (student.residentialStatus === "DAY_CARE" && rule.dayCareFoodExempt) {
     return 0; // ৳0 (DAY_CARE_FOOD_EXEMPTION)
   }
   ```
3. **Past Invoices Frozen:** Changing a student's status or performing a check-out never mutates historical invoices or payment receipts. Only future invoice generation reflects the updated status.

---

### 6. NOTIFICATION TEMPLATES (PHASE 8 INTEGRATION)

Six dedicated notification templates registered in `src/lib/communicationEngine.ts`:
1. `RESIDENTIAL_ADMISSION_APPROVED`
2. `RESIDENTIAL_CHECKIN_COMPLETED`
3. `RESIDENTIAL_CHECKOUT_COMPLETED`
4. `RESIDENTIAL_STATUS_CHANGED`
5. `RESIDENTIAL_REQUEST_SUBMITTED`
6. `RESIDENTIAL_REQUEST_REJECTED`

Each notification event utilizes deterministic idempotency keys (`res_checkin_${studentId}_${date}`, `res_req_${requestId}`) to guarantee retry safety.
