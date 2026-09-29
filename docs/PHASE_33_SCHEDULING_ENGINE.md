# PHASE 33 COMPLETION REPORT: INSTITUTIONAL CALENDAR, SCHEDULING, ROUTINE & RESOURCE BOOKING ENGINE

**Madrasha:** ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা (Eliotganj Hazi Rohmatollah Jamiria Madrasha - EHRJ)  
**System Checkpoint:** `EHRJ-AI-2026-PHASE33`  
**Execution Status:** COMPLETE & VERIFIED  
**Verification Suite:** `scratch/test_phase33_calendar_engine.ts` (47 Passed, 0 Failed)

---

## 1. Executive Summary

Phase 33 establishes the unified Institutional Calendar, Scheduling, Routine, and Resource Booking Engine for Eliotganj Hazi Rohmatollah Jamiria Madrasha. The engine operates strictly as a **coordination and projection layer** over authoritative academic, financial, exam, and event subsystems. It guarantees that existing modules remain authoritative (e.g. `ExamRoutine` in Phase 5, CMS public events in Phase 31, fee deadlines in Phase 6) while projecting an integrated, conflict-safe calendar experience across all user roles.

Key invariants upheld:
- **No Duplicate Authority**: Calendar is a projection of authority — not a second authority.
- **Strict Conflict Detection**: Blocks simultaneous teacher assignments, class period overlaps, physical room collisions, and exclusive resource double-bookings.
- **Madrasa Holiday Engine**: Automatically enforces date blocking during institutional holidays (e.g. Ramadan & Eid-ul-Fitr vacation).
- **Standards-Compliant ICS Export**: Generates RFC 5545 iCalendar feeds for Google Calendar, Apple Calendar, and Outlook.
- **RBAC & IDOR Scoping**: Public and guardian views strictly filter out internal meetings, teacher private routines, and unlinked student data.

---

## 2. Existing Routine / Calendar Audit

An audit of the codebase confirmed existing authoritative components:
- **Phase 5 Exam Engine**: `model Exam` and `model ExamRoutine` in Prisma (`prisma.examRoutine`, `prisma.examSubject`).
- **Academic Structure**: `AcademicSession`, `JamatClass`, `Section`, `Subject`, `TeacherAssignment`.
- **Phase 31 CMS Events**: `getCmsEvents()` in `src/lib/cms/cmsStore.ts`.
- **Teacher Panel**: Existing routine tab in `src/app/teacher/page.tsx`.

Phase 33 connects these modules without duplicating database tables or creating conflicting date records.

---

## 3. Architecture Overview

The system architecture follows a projection model:
```text
Authoritative ERP Modules (Exams, Routines, CMS Events, Fees, Holidays, Meetings)
        ↓
Calendar Projection Layer (getUnifiedCalendar)
        ↓
Conflict Detection Engine (Teacher, Class, Room, Resource, Holiday)
        ↓
Role Scoping & IDOR Defense (Public / Guardian / Teacher / Admin)
        ↓
Calendar Views, iCal RFC 5545 Feeds & Notifications (Phase 8 / 32)
```

Engine components in `src/lib/calendar/`:
- `types.ts`: Comprehensive TypeScript interfaces for events, routines, bookings, meetings, holidays, and conflicts.
- `calendarStore.ts`: Atomic JSON datastore with file locking for `calendar_events.json`, `class_routines.json`, `holidays.json`, `resources.json`, `bookings.json`, `meetings.json`, `reminders.json`, and `audit_log.json`.
- `conflictEngine.ts`: Real-time collision detection across teachers, classes, rooms, resources, and holidays with severity classification (`BLOCKING`, `ERROR`, `WARNING`, `INFO`).
- `recurrenceEngine.ts`: Bounded expansion of recurring events and weekly routine slots with exception handling (`SKIP`, `MOVE`, `CANCEL`, `REPLACE`).
- `resourceBookingEngine.ts`: Concurrency-safe physical facility reservation, double-booking prevention, capacity checking, and approval workflow.
- `unifiedCalendarProjection.ts`: Central projection layer synthesizing multi-domain events into a unified calendar stream.
- `icsExportEngine.ts`: RFC 5545 iCalendar (.ics) generator.
- `reminderEngine.ts`: Idempotent schedule reminder dispatcher integrating with Phase 8 delivery.
- `index.ts`: Public barrel exports.

---

## 4. Academic Calendar

- Manages annual academic session dates, term commencements, admission periods, examination blocks, result publication milestones, and institutional holidays.
- Configurable through Admin Calendar Hub (`/admin/calendar`).

---

## 5. Class Routine Engine

- Stores weekly routine slots linking `AcademicSession`, `JamatClass`, `Section`, `Subject`, `User` (teacher), `dayOfWeek` (0-6), `startTime`, `endTime`, and `roomNo`.
- Every candidate routine slot undergoes conflict detection prior to persistence:
  - Fails with `BLOCKING` severity if teacher is already assigned to another class during overlapping hours.
  - Fails with `BLOCKING` severity if class/section already has another subject in that slot.
  - Fails with `BLOCKING` severity if the physical classroom is already occupied.

---

## 6. Teacher Schedule Integration

- Teacher panel (`/teacher?tab=ROUTINE`) is powered by `TeacherRoutineViewer`:
  - Dynamically fetches assigned weekly slots.
  - Displays day, period, subject, class, and room.
  - Provides a one-click iCal download button (`/api/calendar/export?role=TEACHER`) for syncing with mobile devices.

---

## 7. Exam Routine Integration (Phase 5)

- Authoritative `ExamRoutine` records from Prisma are projected directly into the unified calendar.
- Exam rescheduling automatically reflects in the projected calendar stream without manual re-entry.

---

## 8. Holiday Engine & Operational Date Blocking

- Pre-seeded with institutional and national holidays:
  - Holy Shab-e-Barat (2026-02-04)
  - International Mother Language Day (2026-02-21)
  - Holy Ramadan & Eid-ul-Fitr Vacation (2026-03-10 to 2026-03-27)
  - Independence Day (2026-03-26)
  - Eid-ul-Adha Vacation (2026-05-24 to 2026-06-03)
  - Holy Ashura (2026-07-24)
  - Victory Day (2026-12-16)
- Automatically blocks class routine scheduling during holiday periods.

---

## 9. Public Events Integration (Phase 31)

- Projects approved CMS events (`UPCOMING` / `ONGOING`) into the calendar.
- Displays religious gatherings, annual Khatm-e-Bukhari, competitions, and convocations.

---

## 10. Internal Meetings Management

- Supports `ADMINISTRATIVE`, `ACADEMIC_COUNCIL`, `TEACHER_STAFF`, and `DEPARTMENTAL` meetings.
- Tracks agendas, participants, and locations.
- Restricts meeting visibility: private meetings are strictly hidden from public and guardian views.

---

## 11. Resource Booking Engine

Bookable physical facilities:
- **Darul Hadith Auditorium** (Capacity: 450, Exclusive, requires approval)
- **Central Conference Room** (Capacity: 35, Exclusive, requires approval)
- **Computer & Digital Lab** (Capacity: 40, Exclusive, requires approval)
- **Portable Digital Projector Unit 1** (Exclusive, auto-confirm)
- **Central Library Study Hall** (Capacity: 90, Non-exclusive)

Booking Lifecycle:
`REQUESTED` $\rightarrow$ `PENDING_APPROVAL` $\rightarrow$ `CONFIRMED` / `REJECTED` / `CANCELLED`.
Double-booking on exclusive resources is strictly rejected with an informative Bengali message.

---

## 12. Conflict Detection Matrix

| Conflict Type | Scope | Severity | Enforcement |
| :--- | :--- | :--- | :--- |
| `TEACHER_CONFLICT` | Same teacher in overlapping slots | `BLOCKING` | Rejected at API |
| `CLASS_CONFLICT` | Same class in two subjects simultaneously | `BLOCKING` | Rejected at API |
| `ROOM_CONFLICT` | Same classroom assigned to multiple classes | `BLOCKING` | Rejected at API |
| `RESOURCE_CONFLICT` | Exclusive resource booked simultaneously | `BLOCKING` | Rejected at API |
| `HOLIDAY_CONFLICT` | Scheduling class on institutional holiday | `ERROR` | Blocked & Flagged |
| `CAPACITY_WARNING` | Participants exceed room capacity | `WARNING` | Warning issued |

---

## 13. Recurrence & Exception Engine

- Supports `DAILY`, `WEEKLY`, `MONTHLY`, and `CUSTOM` recurring intervals.
- Enforces safe recurrence limits (max 365 days / 500 instances) to prevent runaway execution.
- Handles `RecurrenceException`:
  - `SKIP`: Excludes specific occurrence.
  - `MOVE`: Adjusts start/end datetime for a single occurrence.
  - `CANCEL`: Marks occurrence as cancelled.
  - `REPLACE`: Drops in custom replacement metadata.

---

## 14. Schedule Reminders (Phase 8 / 32)

- Configurable reminder offsets (1 day before, 1 hour before, 30 minutes before).
- Deterministic idempotency key: `REM-${eventId}-${recipientId}-${offsetMinutes}`.
- Dispatches reminders through Phase 8 `dispatchNotification`.

---

## 15. Communication Integration

- Schedule changes, postponements, cancellations, and meeting invitations link to Phase 32 communication templates.

---

## 16. Public Website Integration (Phase 31)

- Public calendar accessible at `/calendar`.
- Features categorized views (Holidays, Events, Academic schedules), responsive cards, and an iCal subscription link (`/api/calendar/export?role=PUBLIC`).

---

## 17. Universal Command Search Integration (Phase 30)

- Registered `CMD-NAV-CALENDAR` (`G K`) in `src/lib/search/commandShortcuts.ts`.

---

## 18. PWA & Mobile Responsiveness

- Clean, mobile-friendly agenda view on smaller screens with large touch targets.
- Standard iCalendar feed can be added directly to iOS Calendar or Android Google Calendar.

---

## 19. Security, RBAC & IDOR Protections

- **Server-Side Filtering**: Permissions are evaluated on the backend projection layer.
- **Guardian IDOR Defense**: Guardians only receive schedules corresponding to classes where their linked child has an active enrollment.
- **Teacher Isolation**: Teachers cannot view private administrative meetings or other teachers' unshared schedules.
- **Public Isolation**: Public API only returns `visibility === "PUBLIC"` events.

---

## 20. Concurrency Safety

- Atomic file write mechanisms ensure that simultaneous resource booking attempts cannot produce race conditions or double-bookings.

---

## 21. Browser QA & Cockpit URLs

- **Admin Calendar Hub**: `/admin/calendar` (6 tabs: Calendar, Routines, Resources, Meetings, Holidays, Conflicts)
- **Teacher Routine Viewer**: `/teacher?tab=ROUTINE`
- **Guardian Portal Calendar**: `/portal/calendar`
- **Public Calendar**: `/calendar`

---

## 22. End-to-End User Verification Matrix

| Flow | Starting Point | Action | Expected Outcome | Verification |
| :--- | :--- | :--- | :--- | :--- |
| **Routine Creation** | Admin Hub | Add Period Slot | Validates conflict, persists slot | Verified |
| **Teacher Collision** | Admin Hub | Overlap Teacher | Throws `TEACHER_CONFLICT` | Verified |
| **Resource Booking** | Admin / Teacher | Book Auditorium | Creates `PENDING_APPROVAL` | Verified |
| **Double Booking** | Admin / Teacher | Overlap Booking | Rejects with Bengali notice | Verified |
| **Booking Approval** | Admin Hub | Approve Request | Transitions to `CONFIRMED` | Verified |
| **iCal Export** | Public / Portal | Download `.ics` | RFC 5545 valid calendar | Verified |

---

## 23. Regression Testing

All regression test suites passed with 0 failures:
- **Phase 33 Suite** (`scratch/test_phase33_calendar_engine.ts`): **47 PASSED, 0 FAILED**
- **Phase 32 Suite** (`scratch/test_phase32_communication_engine.ts`): **42 PASSED, 0 FAILED**
- **Phase 31 Suite** (`scratch/test_phase31_portal_cms.ts`): **37 PASSED, 0 FAILED**
- **Phase 30 Suite** (`scratch/test_phase30_global_search.ts`): **22 PASSED, 0 FAILED**
- **Phase 29 Suite** (`scratch/test_phase29_document_intelligence.ts`): **37 PASSED, 0 FAILED**
- **TypeScript Static Verification (`npx tsc --noEmit`)**: **0 ERRORS**
- **Next.js Production Build (`npm run build`)**: **COMPILED SUCCESSFULLY (Exit code 0)**

---

## 24. Known Limitations

- **Offline Booking**: As specified in the offline invariant, resource booking requires online verification to prevent double-booking race conditions.

---

## 25. Production Readiness

The Phase 33 engine is fully production-ready, featuring atomic datastore persistence, strict conflict detection, type-safe API routes, and a bilingual user interface.

---

## 26. Git Checkpoint Verification

- **Commit Message**: `feat(calendar): complete phase 33 institutional scheduling and resource booking engine`
- **Git Tag**: `EHRJ-AI-2026-PHASE33`
