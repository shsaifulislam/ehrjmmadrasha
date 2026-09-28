# EHRJ MADRASHA DIGITAL CAMPUS & ERP
## PHASE 14 — HELP DESK, COMPLAINT & SERVICE REQUEST MANAGEMENT ENGINE
### MASTER ARCHITECTURE & SPECIFICATION REPORT

Institution:
- Bengali: ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
- English: Eliotganj Hazi Rohmatollah Jamiria Madrasha
- Arabic: الجامعة الإسلامية رحمة الله إليوت غنج
- Established: 2021
- Location: পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা, বাংলাদেশ

Checkpoint: `EHRJ-AI-2026-PHASE14`

---

## 1. Executive Summary & Objective

Phase 14 establishes the centralized, production-grade **Help Desk, Complaint & Service Request Management Engine** for the Eliotganj Hazi Rohmatollah Jamiria Madrasha ERP platform.

### Core Architectural Decisions:
1. **Case & Request Workflow Layer (Not a Replacement or Duplicate):**
   - Phase 14 does NOT replace or duplicate existing institutional modules (Finance, Documents, Admission, Attendance, Results, Library, Hostel, Transport, Inventory, HR, or Phase 8 Notifications).
   - Instead, it acts as a structured case management and orchestration layer where guardians, teachers, and admins log traceable requests with optional secure entity references.
2. **Strictly Ticket-Based (Zero Real-Time Chat):**
   - The platform strictly rejects direct messaging, public chat, or messenger-like interaction. All communications are timestamped, attributed, auditable ticket messages categorized as either user-visible official responses or private internal notes.
3. **No Artificial Roles:**
   - Retains the institution's authentic 4-tier role architecture (`ADMIN`, `PRINCIPAL`, `TEACHER`, `GUARDIAN`). No artificial `SUPPORT_AGENT`, `HELPDESK_AGENT`, or `MODERATOR` roles exist. Admins handle operational tickets and Principals maintain oversight.
4. **Guardian Child-Switcher & Strict IDOR Isolation:**
   - Guardians file requests within their portal (`/portal/helpdesk`) scoped to their authorized children via the existing `GuardianStudent` link. Any attempt to file a ticket or access tickets/attachments for an unlinked student is rejected with an HTTP 403 Forbidden.
5. **Private Internal Notes (`isInternal: true`):**
   - Administrators can log investigative findings, technical debugging notes, and cross-departmental commentary. These are completely redacted from Guardian Portal responses and guardian-facing exports.
6. **Controlled Server-Side State Machine:**
   - Status transitions strictly follow predefined workflows:
     `SUBMITTED` -> `UNDER_REVIEW` -> `IN_PROGRESS` -> `WAITING_FOR_INFORMATION` -> `RESOLVED` -> `CLOSED` (or `REJECTED`, `REOPEN_REQUESTED`).
     Arbitrary client-side state manipulation is blocked.
7. **Atomic, Concurrency-Safe Ticket Numbering:**
   - Formatted as `EHRJ-REQ-YYYY-XXXXXX` (e.g., `EHRJ-REQ-2026-000001`), powered by Prisma database transactions on `SupportRequestSequence`.

---

## 2. Database Models & Schema Design

The engine introduces 6 specialized models into `prisma/schema.prisma`:

| Model | Purpose | Key Constraints & Relations |
| :--- | :--- | :--- |
| `SupportRequestCategory` | Configurable institutional ticket categories | `code` unique (`ADMISSION`, `FEE_PAYMENT`, `ATTENDANCE`, `RESULT`, `CERTIFICATE_DOCUMENT`, `STUDENT_INFORMATION`, `LIBRARY`, `HOSTEL_RESIDENTIAL`, `TRANSPORT`, `TECHNICAL`, `INVENTORY`, `GENERAL`), sort order, active flag |
| `SupportRequest` | Central institutional ticket entity | `ticketNumber` unique (`EHRJ-REQ-YYYY-XXXXXX`), links to `Student?`, `Guardian?`, `submittedByUser`, `assignedToUser?`, `resolvedByUser?`, stores type, priority, status, SLA deadline, and related entity references |
| `SupportRequestMessage` | Timestamped communication entries | `requestId`, `authorUserId`, `messageType` (`USER_RESPONSE`, `ADMIN_RESPONSE`, `INTERNAL_NOTE`), `isInternal` boolean |
| `SupportRequestStatusHistory` | Audit trail of status transitions | `requestId`, `fromStatus`, `toStatus`, `reason`, `recordedByUserId` |
| `SupportRequestAttachment` | Secure file attachments | `requestId`, `fileName`, `fileUrl`, `fileSize`, `mimeType`, `uploadedByUserId`, `isPublic` |
| `SupportRequestSequence` | Transaction-safe sequence generator | Compound unique `[prefix, year]`, tracks auto-incrementing `currentValue` |

---

## 3. Server-Side State Machine & Lifecycle

Status transitions are governed by `VALID_TRANSITIONS` in `src/lib/helpdeskEngine.ts`:

```
               ┌─────────────┐
               │  SUBMITTED  │
               └──────┬──────┘
                      │
         ┌────────────┴────────────┐
         ▼                         ▼
  ┌──────────────┐          ┌──────────────┐
  │ UNDER_REVIEW │          │   REJECTED   │
  └──────┬───────┘          └──────────────┘
         │
         ▼
  ┌──────────────┐
  │ IN_PROGRESS  │◄─────────────────────────┐
  └──────┬───────┘                          │
         │                                  │
         ├──────────────────┐               │
         ▼                  ▼               │
┌─────────────────┐  ┌─────────────┐        │
│ WAITING_FOR_INF │  │  RESOLVED   │        │
└────────┬────────┘  └──────┬──────┘        │
         │                  │               │
         └──────────────────┘               │
                            │               │
                            ▼               │
                     ┌─────────────┐        │
                     │   CLOSED    │        │
                     └──────┬──────┘        │
                            │               │
                            ▼               │
                    ┌──────────────┐        │
                    │ REOPEN_REQ   │────────┘
                    └──────────────┘
```

- When transitioning to `RESOLVED`, the system requires a `resolutionSummary`, records `resolvedByUserId`, and stamps `resolutionDate`.
- When transitioning to `CLOSED`, tickets are archived. Guardians can submit a `REOPEN_REQUESTED` within the allowed period, which Admins can approve (moving back to `IN_PROGRESS`) or close permanently.

---

## 4. Related Entity Linking & Authorization Verification

When creating or viewing tickets, users may associate existing records without duplication:

1. **Fee & Payment Issues (`INVOICE`, `PAYMENT`):**
   - Validates that the invoice or payment belongs to the specified student or guardian.
2. **Academic & Certificate Issues (`RESULT`, `DOCUMENT_REQUEST`):**
   - Validates that the examination result or document request is registered to the student.
3. **Admission Issues (`ADMISSION_APPLICATION`):**
   - Validates that the application corresponds to the guardian's phone or linked child.
4. **Campus Life Issues (`LIBRARY_ISSUE`, `HOSTEL_ENROLLMENT`, `TRANSPORT_ENROLLMENT`):**
   - Validates that the library book issue, hostel room, or transport route enrollment belongs to the student.

---

## 5. Official Response Composer vs. Internal Notes

- **`ADMIN_RESPONSE` / `USER_RESPONSE` (`isInternal: false`):**
  - Visible to both Guardians and Staff.
  - Automatically triggers a notification to the counterpart (Guardian notified when Admin responds; Admin notified when Guardian responds).
- **`INTERNAL_NOTE` (`isInternal: true`):**
  - Strictly visible to `ADMIN` and `PRINCIPAL`.
  - Filtered out at the database query level for guardian requests: `messages.filter(m => !m.isInternal)`.
  - Guardian API endpoints never serialize internal notes into responses.

---

## 6. Notification Engine Integration (Phase 8 Outbox)

The helpdesk engine dispatches notifications through `dispatchNotification` in `src/lib/communicationEngine.ts`:

| Event Code | Trigger Condition | Target Audience | Channels |
| :--- | :--- | :--- | :--- |
| `HELPDESK_TICKET_CREATED` | New ticket submitted | Admins | Portal & Email |
| `HELPDESK_STATUS_CHANGED` | Status updated | Ticket Creator (Guardian) | Portal & Email |
| `HELPDESK_RESPONSE_ADDED` | Official reply posted | Ticket Creator (Guardian) | Portal & Email |
| `HELPDESK_INFO_REQUIRED` | Status set to `WAITING_FOR_INFORMATION` | Ticket Creator (Guardian) | Portal & Email |
| `HELPDESK_TICKET_RESOLVED` | Ticket marked as `RESOLVED` | Ticket Creator (Guardian) | Portal & Email |
| `HELPDESK_TICKET_REOPENED` | Guardian requests reopen | Admins | Portal & Email |

All notification events utilize deterministic idempotency keys (`helpdesk-<ticketNumber>-<event>-<timestamp>`), preventing duplicate messages during network retries.

---

## 7. Service Level Agreements (SLA) & Resolution Metrics

SLA target durations are established by priority:
- **`URGENT`:** 12-hour resolution target.
- **`IMPORTANT`:** 48-hour resolution target.
- **`NORMAL`:** 96-hour resolution target.

Tracked metrics:
- First Review Timestamp
- In-Progress Timestamp
- First Response Timestamp
- Resolution Duration (Hours from submission to resolution)
- SLA Compliance Flag (`isSlaBreached`: calculated if current time exceeds `slaDeadline` while uncompleted)

---

## 8. API Endpoints

### Admin Endpoints (`/api/admin/helpdesk/*`):
- `GET /api/admin/helpdesk/stats` — Overall statistics, priority counts, SLA breaches, category distribution.
- `GET /api/admin/helpdesk/categories` & `POST /api/admin/helpdesk/categories` — Category management.
- `PUT /api/admin/helpdesk/categories/[id]` — Category update/archival.
- `GET /api/admin/helpdesk/requests` — Paginated request list with multi-field search and filters.
- `POST /api/admin/helpdesk/requests` — Create operational requests on behalf of users.
- `GET /api/admin/helpdesk/requests/[id]` — Detailed ticket view including internal notes, audit history, and related entity data.
- `PATCH /api/admin/helpdesk/requests/[id]/status` — Perform validated status transitions.
- `POST /api/admin/helpdesk/requests/[id]/messages` — Post official responses or internal notes.
- `POST /api/admin/helpdesk/requests/[id]/attachments` — Secure file upload.
- `GET /api/admin/helpdesk/reports` — Comprehensive analytical reports for SLA, volume, and categories.

### Guardian Portal Endpoints (`/api/portal/helpdesk/*`):
- `GET /api/portal/helpdesk` — List guardian's own tickets and tickets for linked children.
- `POST /api/portal/helpdesk` — Submit new ticket with child linkage and entity reference verification.
- `GET /api/portal/helpdesk/[id]` — Retrieve ticket detail with internal notes stripped.
- `POST /api/portal/helpdesk/[id]/messages` — Submit supplementary information or responses.
- `POST /api/portal/helpdesk/[id]/reopen` — Request ticket reopening with justification.

---

## 9. Test Evidence & Regression Status

### Test Summary:
1. **Core Engine Unit & Integration Tests (`scratch/test_phase14_api.ts`):**
   - 44 tests covering category seeding, ticket numbering, link verification, state machine rules, internal note isolation, and SLA metrics.
   - **Result: 44/44 PASSED (100%)**
2. **HTTP API & Security Tests (`scratch/test_phase14_http_api.ts`):**
   - 13 end-to-end HTTP tests verifying authentication, RBAC, IDOR isolation, message redaction, and reports.
   - **Result: 13/13 PASSED (100%)**
3. **Full System Regression Tests:**
   - `npm run test:phase14`: **PASSED**
   - `npm run test:phase13` (HR & Staff Management): **PASSED**
   - `npm run test:phase12` (Inventory & Asset Management): **PASSED**
   - `npx tsc --noEmit` (TypeScript Type Check): **Clean, 0 errors**
   - `npm run build` (Next.js Production Build): **PASSED**
