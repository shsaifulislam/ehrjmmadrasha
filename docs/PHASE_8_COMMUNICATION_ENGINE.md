# EHRJ DIGITAL CAMPUS
## PHASE 8 — COMMUNICATION, NOTIFICATION & OFFICIAL NOTICE ENGINE
### Master Production Architecture & Verification Documentation

---

### 1. OVERVIEW & OBJECTIVE

The **EHRJ Digital Campus Communication Engine** is a centralized institutional messaging, notice, and delivery infrastructure for **ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা (Eliotganj Hazi Rohmatollah Jamiria Madrasha)**. 

Prior to Phase 8, communication was fragmented across individual modules. Phase 8 unifies all communication channels (`PORTAL` and `EMAIL`) into an event-driven, decoupled, and idempotent architecture reusable across all modules:
- Admission (Phase 3)
- Attendance (Phase 4)
- Exams & Results (Phase 5)
- Finance & Fees (Phase 6)
- Certificate & Documents (Phase 7)
- Official Institutional Notices (CMS)

---

### 2. CORE ARCHITECTURE

```text
       [ Existing Modules ]
  Admission | Attendance | Exam | Finance | Documents
                     │
                     ▼ (Domain Event / API Request)
        ┌─────────────────────────────┐
        │    COMMUNICATION ENGINE     │
        │(src/lib/communicationEngine)│
        └──────────────┬──────────────┘
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
[Recipient Resolver] [Template Engine] [Preferences Guard]
       │               │               │
       └───────────────┼───────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
 [PORTAL NOTIFICATION]      [EMAIL DELIVERY OUTBOX]
  • In-app Bell & Badge      • Nodemailer / Gmail SMTP
  • Read / Unread Status     • Retry & Max Attempts (3)
  • Scoped to User (IDOR)    • Decoupled Transaction
```

---

### 3. DATABASE SCHEMA & MODELS

Implemented in `prisma/schema.prisma`:

1. **`Notice`**: Official notice CMS model with bilingual fields (`titleBn`, `titleEn`, `contentBn`, `contentEn`), audience targeting (`PUBLIC`, `ALL_GUARDIANS`, `ALL_TEACHERS`, `ALL_STAFF`, `CLASS`, `SECTION`, `STUDENT`, `TEACHER`, `CUSTOM`), status (`DRAFT`, `REVIEW`, `SCHEDULED`, `PUBLISHED`, `EXPIRED`, `ARCHIVED`), priority (`NORMAL`, `IMPORTANT`, `URGENT`), `isPinned`, `scheduledAt`, `expiresAt`, attachments, versioning, and author relations.
2. **`Notification`**: Central in-app notification record linked to recipient `User`, with type, channel, priority, action link, read status (`isRead`, `readAt`), and idempotency key.
3. **`NotificationDelivery`**: External email delivery log tracking `status` (`QUEUED`, `SENT`, `DELIVERED`, `FAILED`, `CANCELLED`), `destination`, `attemptCount`, `maxAttempts`, `providerMessageId`, `errorCode`, `errorMessage`, `lastAttemptAt`.
4. **`NotificationTemplate`**: Pre-configured institutional templates with safe variable interpolation (`{{student.nameBn}}`, `{{notice.title}}`, etc.), versioning, and mandatory flags.
5. **`NotificationPreference`**: User configurable category preferences (`emailEnabled`, `portalEnabled`) with strict mandatory policy protection for `SYSTEM` and `FINANCE`.
6. **`NotificationOutbox`**: Reliable transactional outbox preventing transaction failure due to external delivery latency.

---

### 4. NOTICE CMS LIFECYCLE

```text
DRAFT ──► REVIEW ──► SCHEDULED ──► PUBLISHED ──► EXPIRED ──► ARCHIVED
  │                     │              │
  └─────────────────────┴──────────────┴──► (Audit Trail Preserved)
```

- **Drafting & Versioning**: Notices can be drafted, edited, and previewed. Any edit increments `version` and records an immutable audit log.
- **Audience Isolation**:
  - `PUBLIC`: Accessible on `/notices` without login. Private notes and internal details are stripped.
  - `CLASS` / `SECTION`: Resolved strictly via `Enrollment` -> `Student` -> `GuardianStudent` -> `Guardian` -> `User`.
  - `ALL_GUARDIANS` / `ALL_TEACHERS`: Broadcast to authorized active accounts only.
- **Scheduler & Auto-Expiry**: `/api/admin/notices/scheduler` publishes scheduled notices when `scheduledAt <= now()` and moves expired notices (`expiresAt <= now()`) to `EXPIRED` status without deleting historical records. Fully idempotent.

---

### 5. SECURITY, RBAC & IDOR BOUNDARIES

- **Cross-Guardian Isolation (IDOR)**: Guardian A attempting to mark Guardian B's notification as read or view unlinked student data is strictly rejected with `403 Forbidden` or `404 Not Found`.
- **Role Scoping**: Teachers cannot publish institutional notices or inspect delivery logs. Anonymous access to portal endpoints is rejected with `401 Unauthorized`.
- **XSS & Content Security**: Public notice board sanitizes rich-text and strictly controls allowed attachment types (`PDF`, approved images).
- **Decoupled Failure Isolation**: Email delivery failure never rolls back the underlying financial, admission, or certificate transaction. Delivery errors are queued for Admin retry.

---

### 6. AUTOMATED TEST SUITE & VERIFICATION EVIDENCE

A dedicated automated test suite (`scripts/test_phase8_communication.js`) verifies all 72 assertions:

1. **Authentication & Fixtures**: Admin, Teacher, Guardian A, Guardian B logins with session cookies.
2. **Notice CMS Lifecycle**: DRAFT creation (201), update (200), version increment, publish (200), unpin (200), future schedule (201), archive (200).
3. **Public Notice Privacy**: Public listing excludes draft, scheduled, and archived notices; public single notice returns 200 with sanitized content; unauthorized scheduled access returns 404/403.
4. **Targeted Notices & Recipient Resolution**: `ALL_GUARDIANS`, `CLASS`, and `ALL_TEACHERS` dispatches.
5. **Portal Notification Engine**: List notifications, unread count tracking, single mark read, mark all read.
6. **IDOR & Security Boundaries**: Cross-guardian mark read blocked (403/404), anonymous access blocked (401), teacher/guardian RBAC blocked (403).
7. **Email Delivery & Retry**: Delivery log inspection, simulated failure, retry with incremented attempt count.
8. **Preferences & Mandatory Protection**: Category preferences fetch, mandatory `SYSTEM` disable attempt rejected (400), optional `ACADEMIC` toggle saved (200).
9. **Outbox & Scheduler Idempotency**: Outbox duplicate rejection, scheduler multiple runs publish 0 duplicates.

#### Full Project Cumulative Verification Results:
- **Phase 1 (Foundation & Auth):** 39 / 39 PASSED
- **Phase 2 (Academic Core):** 42 / 42 PASSED
- **Phase 3 (Admissions):** 63 / 63 PASSED
- **Phase 4 (Attendance):** 50 / 50 PASSED
- **Phase 5 (Exams & Results):** 55 / 55 PASSED
- **Phase 6 (Finance & Fees):** 56 / 56 PASSED
- **Phase 7 (Document Factory):** 69 / 69 PASSED
- **Phase 8 (Communication Engine):** 72 / 72 PASSED
- **Cumulative Total:** **446 / 446 ASSERTIONS PASSED (100% SUCCESS, 0 FAILURES)**
- **Production Build:** 107 routes compiled with 0 errors
- **TypeScript:** `npx tsc --noEmit` exited with code 0

---

### 7. GIT CHECKPOINT

- **Tag / Checkpoint:** `EHRJ-AI-2026-PHASE8`
- **Commit Message:** `feat(communication): implement phase 8 communication notification and notice engine [EHRJ-AI-2026-PHASE8]`
