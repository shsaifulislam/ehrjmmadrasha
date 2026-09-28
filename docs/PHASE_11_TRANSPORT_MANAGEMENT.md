# EHRJ MADRASHA DIGITAL CAMPUS & ERP
## PHASE 11 — TRANSPORT MANAGEMENT ENGINE
### Master Production Architecture & Verification Documentation

---

### 1. OVERVIEW & INSTITUTIONAL CONTEXT

- **Institution (বাংলা):** ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
- **Institution (English):** Eliotganj Hazi Rohmatollah Jamiria Madrasha
- **Institution (العربية):** الجامعة الإسلامية رحمة الله إليوت غنج
- **Established:** 2021
- **Location:** পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা, বাংলাদেশ
- **Founder & Muhtamim:** মাওলানা মহা. আবুল কালাম সরকার

The **Transport Management Engine** (Phase 11) delivers a lightweight, production-grade, and concurrency-safe student transport coordination infrastructure for the Eliotganj Hazi Rohmatollah Jamiria Madrasha campus.

Phase 11 strictly adheres to institutional and architectural boundaries:
- **No Fleet Tracking Overengineering:** Focused strictly on student transport coordination (Routes, Stops, Vehicles, Drivers, Student Enrollment, Capacity Guard, Transfers, Cancellations, Guardian Requests, and Monthly Invoicing). No GPS tracking, fuel management, or route optimization ERP bloat.
- **Zero Unnecessary Roles:** Operates strictly within the four canonical institutional roles (`ADMIN`, `PRINCIPAL`, `TEACHER`, `GUARDIAN`). Drivers are operational directory records with license tracking, not system login accounts.
- **Server-Side Capacity Guard:** Route vehicle capacity is verified within Prisma database transactions to prevent over-allocation during both admin assignments and guardian request approvals.
- **Strict Guardian Isolation & IDOR Protection:** Guardians can only access transport schedules and submit applications for their verified linked children (`guardian.students.some(s => s.studentId === studentId)`). Any cross-student inquiry or submission is rejected with `403 Forbidden`.
- **Phase 6 Finance Engine Integration:** Automated monthly transport fee invoice generation using the canonical institutional billing model with deterministic idempotency keys (`TR_INV_${studentId}_${billingMonth}_${sessionId}`) to ensure zero duplicate billing.
- **Phase 8 Communication Engine Integration:** Event-driven in-app notifications and institutional email alerts for guardian applications, approvals, rejections, route transfers, and cancellations.
- **Historical Immutability:** Previous route assignments and historical fee records remain permanently preserved in `TransportAssignmentHistory` upon route changes or service cancellations.

---

### 2. CORE TRANSPORT ARCHITECTURE

```text
        ┌────────────────────────────────────────────────────────┐
        │             ADMIN TRANSPORT HUB & COCKPIT              │
        │             (src/app/admin/transport/page.tsx)         │
        └───────────┬────────────────────────────────────────────┘
                    │
                    ▼
        ┌────────────────────────────────────────────────────────┐
        │            TRANSPORT DOMAIN ENGINE & WORKFLOWS         │
        │             (src/lib/transportEngine.ts)               │
        └─────┬──────────────────┬──────────────────┬────────────┘
              │                  │                  │
              ▼                  ▼                  ▼
     [ Capacity-Guarded ]    [ Atomic Transfer ]  [ Guardian Application ]
      • Route & stop verify   • Update active     • Sequence generation
      • Count active seats    • Record History    • IDOR verification
      • Check vehicle limit   • Immutable records • Admin approval gate
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 │
                                 ▼
          ┌──────────────────────────────────────────────┐
          │             INTEGRATION ENGINES              │
          ├──────────────────────┬───────────────────────┤
          │ Phase 6 Finance      │ Phase 8 Communication │
          │ • Monthly invoicing  │ • Portal Notification │
          │ • TR_INV idempotency │ • 6 Event Templates   │
          │ • Non-destructive    │ • Idempotency Keys    │
          └──────────────────────┴───────────────────────┘
```

---

### 3. DATABASE SCHEMA & ENTITY MODELS

Nine Phase 11 models added to `prisma/schema.prisma`:

1. **`TransportDriver`**:
   - Institutional driver directory with licensing and emergency contact records.
   - Fields: `name`, `phone` (unique), `altPhone`, `licenseNumber` (unique), `licenseExpiry`, `status` (`ACTIVE`, `INACTIVE`), `address`, `notes`, `createdById`.

2. **`TransportVehicle`**:
   - Madrasa-owned or contracted student transport vehicles.
   - Fields: `vehicleNumber` (unique), `vehicleType` (`BUS`, `MICROBUS`, `VAN`, `AUTO`), `capacity`, `driverId`, `status` (`ACTIVE`, `MAINTENANCE`, `INACTIVE`), `notes`, `createdById`.

3. **`TransportRoute`**:
   - Fixed transit routes serving Eliotganj, Daudkandi, and surrounding catchment areas.
   - Fields: `routeCode` (unique), `routeName`, `routeNameBn`, `vehicleId`, `monthlyFee`, `status` (`ACTIVE`, `INACTIVE`), `notes`.

4. **`TransportStop`**:
   - Designated pickup and drop-off points along a route.
   - Fields: `routeId`, `stopName`, `stopNameBn`, `sequenceOrder`, `pickupTime`, `dropTime`, `stopFee`, `status` (`ACTIVE`, `INACTIVE`).
   - Ordering: Managed via integer `sequenceOrder`.

5. **`TransportEnrollment`**:
   - Student operational transport subscription per academic session.
   - Fields: `studentId`, `sessionId`, `routeId`, `pickupStopId`, `dropStopId`, `startDate`, `endDate`, `monthlyFee`, `status` (`ACTIVE`, `TRANSFERRED`, `CANCELLED`, `SUSPENDED`).
   - Relations: Cascade links to `Student`, `AcademicSession`, `TransportRoute`, and `TransportStop`.

6. **`TransportRequest`**:
   - Formal transport requests submitted by verified guardians.
   - Fields: `requestNumber` (`EHRJ-TRQ-YYYY-XXXXXX`), `guardianId`, `studentId`, `sessionId`, `requestType` (`NEW_ENROLLMENT`, `CHANGE_ROUTE`, `CANCEL_SERVICE`), `currentRouteId`, `requestedRouteId`, `requestedPickupStopId`, `reason`, `status` (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`), `adminNotes`, `reviewedByUserId`, `reviewedAt`.

7. **`TransportAssignmentHistory`**:
   - Immutable historical audit ledger tracking all route allocations, transfers, and cancellations.
   - Fields: `studentId`, `sessionId`, `enrollmentId`, `routeId`, `action` (`ENROLLED`, `ROUTE_CHANGED`, `STOP_CHANGED`, `SUSPENDED`, `CANCELLED`), `previousRouteId`, `previousPickupStopId`, `newPickupStopId`, `effectiveDate`, `reason`, `notes`, `recordedByUserId`.

8. **`TransportRequestSequence`**:
   - Atomic year-scoped counter for generating formatted request IDs (`EHRJ-TRQ-YYYY-XXXXXX`).

9. **`TransportRule`**:
   - Session-level transport policy settings (`defaultMonthlyFee`, `allowGuardianRequest`, `maxAdvanceDays`, `notesBn`).

---

### 4. CANONICAL API MATRIX

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/public/transport` | `GET` | PUBLIC | Public-safe route schedules, pickup stops, and vehicle info |
| `/api/admin/transport/stats` | `GET` | ADMIN, PRINCIPAL | Live operational metrics, vehicle capacity alerts, revenue summary |
| `/api/admin/transport/routes` | `GET`, `POST` | ADMIN | List routes and create new transport route |
| `/api/admin/transport/routes/[id]` | `GET`, `PUT`, `DELETE` | ADMIN | Get route details, update route, or soft-delete route |
| `/api/admin/transport/stops` | `POST` | ADMIN | Add new stop to an existing route |
| `/api/admin/transport/stops/[id]` | `PUT`, `DELETE` | ADMIN | Update stop sequence/timing or remove stop |
| `/api/admin/transport/vehicles` | `GET`, `POST` | ADMIN | Vehicles list and vehicle registration |
| `/api/admin/transport/vehicles/[id]` | `PUT` | ADMIN | Update vehicle capacity, assigned driver, or status |
| `/api/admin/transport/drivers` | `GET`, `POST` | ADMIN | Drivers directory and driver onboarding |
| `/api/admin/transport/drivers/[id]` | `PUT` | ADMIN | Update driver license expiry, contact, or status |
| `/api/admin/transport/enrollments` | `GET`, `POST` | ADMIN | Search student enrollments and execute capacity-guarded assignment |
| `/api/admin/transport/enrollments/[id]` | `PUT`, `DELETE` | ADMIN | Transfer student to another route or cancel transport service |
| `/api/admin/transport/students/[id]` | `GET` | ADMIN, PRINCIPAL | Comprehensive student transport profile, active route, and history |
| `/api/admin/transport/requests` | `GET` | ADMIN, PRINCIPAL | Filterable guardian transport requests list |
| `/api/admin/transport/requests/[id]/review` | `POST` | ADMIN | Approve or reject guardian transport request with atomic execution |
| `/api/admin/transport/invoices` | `POST` | ADMIN | Bulk monthly transport billing run with idempotency guard |
| `/api/portal/transport` | `GET` | GUARDIAN | Linked child transport overview with strict IDOR protection |
| `/api/portal/transport/request` | `POST` | GUARDIAN | Submit transport enrollment/transfer request for linked child |
| `/api/teacher/transport` | `GET` | TEACHER | Scoped read-only student transport schedule roster |

---

### 5. FINANCE INTEGRATION & IDEMPOTENCY INVARIANTS

1. **Deterministic Idempotency Key:**
   ```typescript
   idempotencyKey = `TR_INV_${studentId}_${billingMonth}_${sessionId}`;
   ```
   Prevents double-billing even if the billing routine is triggered multiple times by administrators.
2. **Canonical Billing Category:** Transport invoices are created using `type: "TRANSPORT_FEE"` and automatically integrate into the student's unified ledger in Phase 6 Finance Engine.
3. **Historical Preservation:** Modifying a student's route or cancelling service does not retroactively adjust or delete historical invoices. Future billing uses the new route's monthly rate.

---

### 6. NOTIFICATION TEMPLATES (PHASE 8 INTEGRATION)

Six dedicated notification templates registered in `src/lib/communicationEngine.ts`:
1. `TRANSPORT_REQUEST_SUBMITTED`: Dispatched upon guardian application submission.
2. `TRANSPORT_REQUEST_APPROVED`: Informs guardian that child has been assigned to route.
3. `TRANSPORT_REQUEST_REJECTED`: Informs guardian with review notes if application cannot be accommodated.
4. `TRANSPORT_ENROLLMENT_ACTIVATED`: Direct administrative student enrollment alert.
5. `TRANSPORT_ROUTE_CHANGED`: Notification of route or stop transfer with updated timings.
6. `TRANSPORT_ENROLLMENT_CANCELLED`: Confirmation of transport service termination.

---

### 7. VERIFICATION & QUALITY AUDIT EVIDENCE

- **TypeScript Compilation:** `npx tsc --noEmit` passed with 0 errors.
- **Production Build:** `npm run build` compiled all static and dynamic routes cleanly with exit code 0.
- **Automated API Test Suite (`scratch/test_phase11_api.mjs`):**
  - Total Tests: 23
  - Passed: 23
  - Failed: 0
  - Key Verified Behaviors:
    1. Public route accessible without authentication.
    2. Admin stats calculation and capacity warning thresholds.
    3. Full CRUD on Drivers, Vehicles, Routes, and Ordered Stops.
    4. Concurrency-safe capacity guard blocking assignment when vehicle is at maximum capacity (2/2).
    5. Route transfer with automatic status transition and assignment history logging.
    6. Monthly invoice generation idempotency preventing duplicate bills.
    7. Guardian child data isolation and strict IDOR rejection (403 Forbidden) on unlinked students.
    8. Admin approval workflow transitioning requests to `APPROVED` and activating student enrollment.
    9. Teacher read-only transport roster access.
