/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 33 VERIFICATION SUITE
 * Comprehensive tests for Institutional Calendar, Scheduling, Routine & Resource Booking Engine
 * Checkpoint: EHRJ-AI-2026-PHASE33
 */

import {
  getInstitutionalResources,
  getInstitutionalHolidays,
  getCalendarEvents,
  saveCalendarEvents,
  getClassRoutineSlots,
  saveClassRoutineSlots,
  getResourceBookings,
  saveResourceBookings,
  getInternalMeetings,
  saveInternalMeetings,
  getCalendarAuditLog,
} from "../src/lib/calendar/calendarStore";

import {
  validateRoutineSlotConflicts,
  validateResourceBookingConflicts,
  checkHolidayConflict,
  timeSlotsOverlap,
  dateTimeRangesOverlap,
} from "../src/lib/calendar/conflictEngine";

import {
  expandRecurringEvent,
  expandRoutineSlot,
} from "../src/lib/calendar/recurrenceEngine";

import {
  requestResourceBooking,
  approveResourceBooking,
  rejectResourceBooking,
  cancelResourceBooking,
} from "../src/lib/calendar/resourceBookingEngine";

import { getUnifiedCalendar } from "../src/lib/calendar/unifiedCalendarProjection";
import { generateIcsCalendar } from "../src/lib/calendar/icsExportEngine";
import { registerScheduleReminder } from "../src/lib/calendar/reminderEngine";
import {
  CalendarEvent,
  ClassRoutineSlot,
  RecurrenceRule,
} from "../src/lib/calendar/types";
import prisma from "../src/lib/prisma";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failedCount++;
  }
}

async function runPhase33Tests() {
  console.log("=======================================================================");
  console.log("  EHRJ PHASE 33 — CALENDAR, SCHEDULING & BOOKING VERIFICATION SUITE    ");
  console.log("=======================================================================\n");

  // -------------------------------------------------------------
  // TEST GROUP 1: Datastore & Seed Data Integrity
  // -------------------------------------------------------------
  console.log("[TEST GROUP 1] Datastore & Pre-Seeded Institutional Inventory");
  const resources = getInstitutionalResources();
  assert(resources.length >= 4, "Institutional physical resources initialized");
  assert(resources.some((r) => r.type === "AUDITORIUM"), "Darul Hadith Auditorium resource present");
  assert(resources.some((r) => r.type === "MEETING_ROOM"), "Faculty conference room present");
  assert(resources.some((r) => r.type === "LAB"), "Digital learning lab present");

  const holidays = getInstitutionalHolidays();
  assert(holidays.length >= 6, "Institutional & national holidays initialized");
  assert(holidays.some((h) => h.holidayType === "RELIGIOUS"), "Religious holidays (Eid/Ramadan) present");
  assert(holidays.some((h) => h.holidayType === "NATIONAL"), "National holidays (Independence/Victory) present");

  // -------------------------------------------------------------
  // TEST GROUP 2: Time & Date Overlap Primitives
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 2] Time & Date Overlap Mathematics");
  assert(timeSlotsOverlap("08:00", "09:00", "08:30", "09:30"), "Overlapping time slots detected (partial)");
  assert(timeSlotsOverlap("08:00", "10:00", "08:30", "09:30"), "Overlapping time slots detected (contained)");
  assert(!timeSlotsOverlap("08:00", "09:00", "09:00", "10:00"), "Adjacent time slots do NOT overlap");
  assert(!timeSlotsOverlap("08:00", "09:00", "10:00", "11:00"), "Disjoint time slots do NOT overlap");

  // -------------------------------------------------------------
  // TEST GROUP 3: Conflict Engine — Teacher Overlap Detection
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 3] Conflict Engine — Teacher Collision Safety");
  const baseSlots: ClassRoutineSlot[] = [
    {
      id: "RTN-TEST-1",
      sessionId: "SESS-2026",
      classId: "CLS-NOORANI",
      classNameBn: "নূরানী ১ম শ্রেণি",
      subjectId: "SUB-QURAN",
      subjectNameBn: "কুরআন ও তাজবীদ",
      teacherId: "TEA-USTADH-ZAKARIA",
      teacherName: "উস্তাদ যাকারিয়া",
      dayOfWeek: 0, // Sunday
      startTime: "08:00",
      endTime: "08:50",
      roomNo: "১০১",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Attempt to assign the same teacher to another class at the same time
  const teacherCollisionSlot: Partial<ClassRoutineSlot> = {
    classId: "CLS-HIFZ",
    classNameBn: "হিফজুল কুরআন",
    subjectId: "SUB-HIFZ",
    subjectNameBn: "হিফজ সবক",
    teacherId: "TEA-USTADH-ZAKARIA",
    teacherName: "উস্তাদ যাকারিয়া",
    dayOfWeek: 0,
    startTime: "08:20",
    endTime: "09:10",
    roomNo: "১০২",
    status: "ACTIVE",
  };

  const teacherCheck = validateRoutineSlotConflicts(teacherCollisionSlot, baseSlots);
  assert(teacherCheck.hasBlockingConflicts, "Same teacher assigned to 2 classes simultaneously produces BLOCKING conflict");
  assert(teacherCheck.conflicts.some((c) => c.conflictType === "TEACHER_CONFLICT"), "Conflict identified as TEACHER_CONFLICT");

  // -------------------------------------------------------------
  // TEST GROUP 4: Conflict Engine — Class & Section Collision
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 4] Conflict Engine — Class & Period Collision");
  const classCollisionSlot: Partial<ClassRoutineSlot> = {
    classId: "CLS-NOORANI",
    classNameBn: "নূরানী ১ম শ্রেণি",
    subjectId: "SUB-BANGLA",
    subjectNameBn: "বাংলা সাহিত্য",
    teacherId: "TEA-USTADH-MAHMUD",
    teacherName: "উস্তাদ মাহমুদ",
    dayOfWeek: 0,
    startTime: "08:30",
    endTime: "09:20",
    roomNo: "১০৩",
    status: "ACTIVE",
  };

  const classCheck = validateRoutineSlotConflicts(classCollisionSlot, baseSlots);
  assert(classCheck.hasBlockingConflicts, "Same class assigned two subjects simultaneously produces BLOCKING conflict");
  assert(classCheck.conflicts.some((c) => c.conflictType === "CLASS_CONFLICT"), "Conflict identified as CLASS_CONFLICT");

  // -------------------------------------------------------------
  // TEST GROUP 5: Conflict Engine — Physical Room Collision
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 5] Conflict Engine — Physical Room Collision");
  const roomCollisionSlot: Partial<ClassRoutineSlot> = {
    classId: "CLS-KITAB",
    classNameBn: "মিযান জামাত",
    subjectId: "SUB-SARF",
    subjectNameBn: "ইলমুস সারফ",
    teacherId: "TEA-USTADH-HABIB",
    teacherName: "উস্তাদ হাবিব",
    dayOfWeek: 0,
    startTime: "08:15",
    endTime: "09:05",
    roomNo: "১০১", // Same room as baseSlot
    status: "ACTIVE",
  };

  const roomCheck = validateRoutineSlotConflicts(roomCollisionSlot, baseSlots);
  assert(roomCheck.hasBlockingConflicts, "Same room assigned to two classes simultaneously produces BLOCKING conflict");
  assert(roomCheck.conflicts.some((c) => c.conflictType === "ROOM_CONFLICT"), "Conflict identified as ROOM_CONFLICT");

  // -------------------------------------------------------------
  // TEST GROUP 6: Conflict Engine — Holiday Block Verification
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 6] Holiday Engine — Operational Date Blocking");
  const holidayCheckBlocked = checkHolidayConflict("2026-03-20", "ROUTINE");
  assert(holidayCheckBlocked.isBlocked, "Class routine detected as blocked during Eid-ul-Fitr / Ramadan vacation");
  assert(holidayCheckBlocked.conflict?.conflictType === "HOLIDAY_CONFLICT", "Conflict flagged as HOLIDAY_CONFLICT");

  const holidayCheckNormal = checkHolidayConflict("2026-04-05", "ROUTINE");
  assert(!holidayCheckNormal.isBlocked, "Normal academic working day is not blocked");

  // -------------------------------------------------------------
  // TEST GROUP 7: Recurrence Engine & Bounded Expansion
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 7] Recurrence Engine — Bounded Expansion");
  const recurringEvent: CalendarEvent = {
    id: "CAL-REC-TEST",
    title: "সাপ্তাহিক তারবিয়াতি আলোচনা ও নসীহত",
    eventType: "INSTITUTIONAL",
    startAt: "2026-04-03T16:00:00.000Z", // Friday
    endAt: "2026-04-03T17:30:00.000Z",
    timezone: "Asia/Dhaka",
    allDay: false,
    status: "SCHEDULED",
    visibility: "INSTITUTIONAL",
    sourceModule: "MANUAL",
    isRecurring: true,
    recurrenceRule: {
      frequency: "WEEKLY",
      interval: 1,
      until: "2026-04-30",
    },
    createdBy: "admin",
    updatedBy: "admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const expanded = expandRecurringEvent(
    recurringEvent,
    new Date("2026-04-01"),
    new Date("2026-04-30")
  );
  assert(expanded.length >= 4, "Weekly recurring event expanded correctly into 4+ occurrences");
  assert(expanded[0].id.includes("_OCC_"), "Generated occurrences contain canonical occurrence suffix");

  // -------------------------------------------------------------
  // TEST GROUP 8: Recurrence Exceptions (SKIP / MOVE)
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 8] Recurrence Engine — Exception Handling (SKIP & MOVE)");
  const eventWithExceptions: CalendarEvent = {
    ...recurringEvent,
    id: "CAL-REC-EXC",
    recurrenceExceptions: [
      {
        originalDate: "2026-04-10",
        exceptionType: "SKIP",
        reason: "বিশেষ সম্মেলন উপলক্ষে স্থগিত",
      },
      {
        originalDate: "2026-04-17",
        exceptionType: "MOVE",
        newStartAt: "2026-04-17T18:00:00.000Z",
        newEndAt: "2026-04-17T19:30:00.000Z",
        reason: "মাগরিবের পর পুনঃনির্ধারিত",
      },
    ],
  };

  const expandedWithEx = expandRecurringEvent(
    eventWithExceptions,
    new Date("2026-04-01"),
    new Date("2026-04-30")
  );
  assert(!expandedWithEx.some((e) => e.startAt.startsWith("2026-04-10")), "Skipped occurrence is excluded from calendar");
  const movedOcc = expandedWithEx.find((e) => e.startAt.startsWith("2026-04-17"));
  assert(Boolean(movedOcc && movedOcc.startAt.includes("18:00:00")), "Moved occurrence starts at adjusted time");

  // -------------------------------------------------------------
  // TEST GROUP 9: Resource Booking Lifecycle & Double-Booking Guard
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 9] Resource Booking — Double-Booking & Approval Lifecycle");
  const booking1 = requestResourceBooking({
    resourceId: "RES-001", // Darul Hadith Auditorium (Exclusive)
    title: "বার্ষিক ক্বিরাআত প্রতিযোগিতা ২০২৬",
    purpose: "হিফজ শিক্ষার্থীদের কুরআন ক্বিরাআত মাহফিল",
    requestedBy: "teacher_qari@ehrj.edu.bd",
    requestedByName: "ক্বারী মাওলানা ইব্রাহীম",
    requestedByRole: "TEACHER",
    startAt: "2026-04-15T09:00:00.000Z",
    endAt: "2026-04-15T13:00:00.000Z",
    participantCount: 300,
  });

  assert(booking1.success, "Valid booking request created successfully");
  assert(booking1.booking?.status === "PENDING_APPROVAL", "Auditorium booking initializes as PENDING_APPROVAL");

  // Approve booking 1
  const approvalRes = approveResourceBooking(booking1.booking!.id, "admin@ehrj.edu.bd", "যাচাইপূর্বক অনুমতি প্রদান করা হলো");
  assert(approvalRes.success, "Booking successfully approved by Admin");
  assert(approvalRes.booking?.status === "CONFIRMED", "Booking transitions to CONFIRMED");

  // Attempt overlapping booking 2 for the same exclusive auditorium
  const booking2 = requestResourceBooking({
    resourceId: "RES-001",
    title: "বিতর্ক ও সাধারণ জ্ঞান প্রতিযোগিতা",
    purpose: "কিতাব বিভাগের বিতর্ক প্রতিযোগিতা",
    requestedBy: "teacher_debat@ehrj.edu.bd",
    requestedByName: "মাওলানা হাসান",
    requestedByRole: "TEACHER",
    startAt: "2026-04-15T11:00:00.000Z", // Overlaps with 09:00 - 13:00!
    endAt: "2026-04-15T14:00:00.000Z",
    participantCount: 150,
  });

  assert(!booking2.success, "CRITICAL INVARIANT: Double booking on exclusive resource is strictly REJECTED");
  assert(Boolean(booking2.error && booking2.error.includes("ইতিমধ্যে")), "Informative collision message returned in Bengali");

  // Capacity overload warning test
  const bookingCapacityExceeded = validateResourceBookingConflicts(
    "RES-002", // Conference room capacity: 35
    "2026-04-20T10:00:00.000Z",
    "2026-04-20T11:30:00.000Z",
    120 // 120 > 35!
  );
  assert(bookingCapacityExceeded.conflicts.some((c) => c.severity === "WARNING"), "Capacity overflow triggers WARNING severity");

  // -------------------------------------------------------------
  // TEST GROUP 10: Unified Calendar Multi-Source Synthesis
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 10] Unified Calendar Multi-Source Synthesis");
  const unifiedAdminEvents = await getUnifiedCalendar({
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    userRole: "ADMIN",
    includeRoutineOccurrences: true,
  });

  assert(unifiedAdminEvents.length > 0, "Unified calendar returned populated event set");
  assert(unifiedAdminEvents.some((e) => e.eventType === "INSTITUTIONAL"), "Unified calendar contains institutional holidays");
  assert(unifiedAdminEvents.some((e) => e.sourceModule === "CMS"), "Unified calendar projects Phase 31 CMS public events");

  // -------------------------------------------------------------
  // TEST GROUP 11: RBAC & IDOR Privacy Isolation
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 11] RBAC & IDOR Privacy Isolation");

  // Public Calendar query
  const publicEvents = await getUnifiedCalendar({
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    userRole: "PUBLIC",
  });

  assert(publicEvents.every((e) => e.visibility === "PUBLIC"), "SECURITY INVARIANT: Public calendar contains ONLY public events");
  assert(!publicEvents.some((e) => e.eventType === "MEETING"), "Internal administrative meetings strictly excluded from public calendar");

  // -------------------------------------------------------------
  // TEST GROUP 12: RFC 5545 iCalendar (ICS) Export Compliance
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 12] RFC 5545 iCalendar (ICS) Export Compliance");
  const sampleEvents: CalendarEvent[] = [
    {
      id: "CAL-ICS-001",
      title: "বার্ষিক খতমে বুখারী ও দুআ মজলিস",
      description: "দাওরায়ে হাদিস শিক্ষার্থীদের পাগড়ি প্রদান ও সমাপনী দুআ।",
      eventType: "INSTITUTIONAL",
      startAt: "2026-04-10T09:00:00.000Z",
      endAt: "2026-04-10T14:00:00.000Z",
      timezone: "Asia/Dhaka",
      allDay: false,
      status: "SCHEDULED",
      visibility: "PUBLIC",
      sourceModule: "MANUAL",
      location: "দারুল হাদিস অডিটোরিয়াম",
      createdBy: "admin",
      updatedBy: "admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const icsOutput = generateIcsCalendar(sampleEvents, "EHRJ Master Calendar");
  assert(icsOutput.includes("BEGIN:VCALENDAR"), "ICS contains BEGIN:VCALENDAR header");
  assert(icsOutput.includes("VERSION:2.0"), "ICS conforms to VERSION:2.0");
  assert(icsOutput.includes("BEGIN:VEVENT"), "ICS contains BEGIN:VEVENT record");
  assert(icsOutput.includes("SUMMARY:বার্ষিক খতমে বুখারী ও দুআ মজলিস"), "ICS encodes Bengali event title");
  assert(icsOutput.includes("LOCATION:দারুল হাদিস অডিটোরিয়াম"), "ICS encodes event location");
  assert(icsOutput.includes("END:VCALENDAR"), "ICS contains END:VCALENDAR closing tag");

  // -------------------------------------------------------------
  // TEST GROUP 13: Reminder Engine Idempotency
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 13] Reminder Engine — Deterministic Idempotency");
  const rem1 = registerScheduleReminder(
    "CAL-EVT-2026-0001",
    "USER-TEA-001",
    "TEACHER",
    "IN_APP" as any,
    60,
    "2026-04-10T09:00:00.000Z"
  );
  assert(rem1.success, "Schedule reminder registered");

  const rem2 = registerScheduleReminder(
    "CAL-EVT-2026-0001",
    "USER-TEA-001",
    "TEACHER",
    "IN_APP" as any,
    60,
    "2026-04-10T09:00:00.000Z"
  );
  assert(rem2.reminder?.id === rem1.reminder?.id, "IDEMPOTENCY INVARIANT: Duplicate reminder registration produces identical ID");

  // -------------------------------------------------------------
  // TEST GROUP 14: Audit Logging
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 14] Calendar Audit Trail Integrity");
  const auditLogs = getCalendarAuditLog();
  assert(auditLogs.length > 0, "Calendar actions recorded in audit log");
  assert(auditLogs.some((a) => a.action === "BOOK_RESOURCE"), "Audit log recorded BOOK_RESOURCE event");
  assert(auditLogs.some((a) => a.action === "APPROVE_BOOKING"), "Audit log recorded APPROVE_BOOKING event");

  // Summary
  console.log("\n=======================================================================");
  console.log(`  PHASE 33 TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase33Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
