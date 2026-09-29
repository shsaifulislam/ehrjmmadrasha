/**
 * EHRJ Institutional Calendar & Scheduling Engine — Conflict Detection Engine
 * Checkpoint: EHRJ-AI-2026-PHASE33
 * Detects teacher overlaps, class collisions, room collisions, resource double-bookings, and holiday blocks.
 */

import {
  ClassRoutineSlot,
  ScheduleConflict,
  InstitutionalHoliday,
  ResourceBooking,
  InternalMeeting,
  CalendarEvent,
} from "./types";
import {
  getClassRoutineSlots,
  getInstitutionalHolidays,
  getResourceBookings,
  getInstitutionalResources,
} from "./calendarStore";

/**
 * Checks if two time strings "HH:mm" overlap
 */
export function timeSlotsOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  // Convert "08:30" to minutes from midnight
  const toMinutes = (timeStr: string): number => {
    const parts = timeStr.trim().split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  };

  const aStart = toMinutes(startA);
  const aEnd = toMinutes(endA);
  const bStart = toMinutes(startB);
  const bEnd = toMinutes(endB);

  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}

/**
 * Checks if two ISO datetimes overlap
 */
export function dateTimeRangesOverlap(
  startA: string | Date,
  endA: string | Date,
  startB: string | Date,
  endB: string | Date
): boolean {
  const aStart = new Date(startA).getTime();
  const aEnd = new Date(endA).getTime();
  const bStart = new Date(startB).getTime();
  const bEnd = new Date(endB).getTime();

  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}

/**
 * Validates a candidate class routine slot against existing slots
 */
export function validateRoutineSlotConflicts(
  candidate: Partial<ClassRoutineSlot>,
  existingSlots?: ClassRoutineSlot[]
): { hasBlockingConflicts: boolean; conflicts: ScheduleConflict[] } {
  const slots = existingSlots || getClassRoutineSlots();
  const conflicts: ScheduleConflict[] = [];

  if (
    candidate.dayOfWeek === undefined ||
    !candidate.startTime ||
    !candidate.endTime
  ) {
    return { hasBlockingConflicts: false, conflicts: [] };
  }

  const activeSlots = slots.filter(
    (s) => s.status === "ACTIVE" && s.id !== candidate.id
  );

  for (const slot of activeSlots) {
    // Only check slots on the same day of week
    if (slot.dayOfWeek !== candidate.dayOfWeek) continue;

    // Check if times overlap
    if (
      !timeSlotsOverlap(
        candidate.startTime,
        candidate.endTime,
        slot.startTime,
        slot.endTime
      )
    ) {
      continue;
    }

    // 1. TEACHER CONFLICT: Same teacher assigned simultaneously
    if (candidate.teacherId && slot.teacherId === candidate.teacherId) {
      conflicts.push({
        id: `CONF-TCH-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        conflictType: "TEACHER_CONFLICT",
        severity: "BLOCKING",
        messageBn: `উস্তাদ ${slot.teacherName} এই সময়ে (${candidate.startTime} - ${candidate.endTime}) ইতিমধ্যে '${slot.classNameBn}' ক্লাসে নির্ধারিত আছেন।`,
        messageEn: `Teacher ${slot.teacherName} is already assigned to class '${slot.classNameBn}' during this time (${candidate.startTime} - ${candidate.endTime}).`,
        entityA: {
          type: "TEACHER",
          id: candidate.teacherId,
          name: candidate.teacherName || "Current Teacher",
        },
        entityB: {
          type: "ROUTINE_SLOT",
          id: slot.id,
          name: `${slot.classNameBn} - ${slot.subjectNameBn}`,
        },
        timeRange: {
          startAt: candidate.startTime,
          endAt: candidate.endTime,
        },
      });
    }

    // 2. CLASS / SECTION CONFLICT: Same class/section assigned two subjects simultaneously
    const sameClass = candidate.classId && slot.classId === candidate.classId;
    const sameSection =
      !candidate.sectionId ||
      !slot.sectionId ||
      candidate.sectionId === slot.sectionId;

    if (sameClass && sameSection) {
      conflicts.push({
        id: `CONF-CLS-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        conflictType: "CLASS_CONFLICT",
        severity: "BLOCKING",
        messageBn: `এই শ্রেণি ও শাখায় (${slot.classNameBn}) একই সময়ে (${candidate.startTime} - ${candidate.endTime}) ইতিমধ্যে '${slot.subjectNameBn}' এর ক্লাস নির্ধারিত রয়েছে।`,
        messageEn: `Class '${slot.classNameBn}' already has subject '${slot.subjectNameBn}' assigned during this time (${candidate.startTime} - ${candidate.endTime}).`,
        entityA: {
          type: "CLASS",
          id: candidate.classId || "",
          name: candidate.classNameBn || "Current Class",
        },
        entityB: {
          type: "ROUTINE_SLOT",
          id: slot.id,
          name: slot.subjectNameBn,
        },
        timeRange: {
          startAt: candidate.startTime,
          endAt: candidate.endTime,
        },
      });
    }

    // 3. ROOM CONFLICT: Same physical room assigned twice simultaneously
    if (
      candidate.roomNo &&
      slot.roomNo &&
      candidate.roomNo.trim().toLowerCase() === slot.roomNo.trim().toLowerCase()
    ) {
      conflicts.push({
        id: `CONF-ROOM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        conflictType: "ROOM_CONFLICT",
        severity: "BLOCKING",
        messageBn: `কক্ষ নম্বর '${candidate.roomNo}' একই সময়ে (${candidate.startTime} - ${candidate.endTime}) ইতিমধ্যে '${slot.classNameBn}' ক্লাসে ব্যবহৃত হচ্ছে।`,
        messageEn: `Room '${candidate.roomNo}' is already occupied by '${slot.classNameBn}' during this time (${candidate.startTime} - ${candidate.endTime}).`,
        entityA: {
          type: "ROOM",
          id: candidate.roomNo,
          name: candidate.roomNo,
        },
        entityB: {
          type: "ROUTINE_SLOT",
          id: slot.id,
          name: `${slot.classNameBn} (${slot.teacherName})`,
        },
        timeRange: {
          startAt: candidate.startTime,
          endAt: candidate.endTime,
        },
      });
    }
  }

  const hasBlockingConflicts = conflicts.some(
    (c) => c.severity === "BLOCKING" || c.severity === "ERROR"
  );
  return { hasBlockingConflicts, conflicts };
}

/**
 * Validates a resource booking request for double-booking or capacity conflicts
 */
export function validateResourceBookingConflicts(
  resourceId: string,
  startAt: string,
  endAt: string,
  participantCount?: number,
  excludeBookingId?: string
): { hasBlockingConflicts: boolean; conflicts: ScheduleConflict[] } {
  const resources = getInstitutionalResources();
  const bookings = getResourceBookings();
  const conflicts: ScheduleConflict[] = [];

  const resource = resources.find((r) => r.id === resourceId);
  if (!resource) {
    return {
      hasBlockingConflicts: true,
      conflicts: [
        {
          id: `CONF-NOTFOUND-${Date.now()}`,
          conflictType: "RESOURCE_CONFLICT",
          severity: "BLOCKING",
          messageBn: "অনুরোধকৃত রিসোর্সটি সিস্টেমে পাওয়া যায়নি।",
          messageEn: "Requested institutional resource not found.",
          entityA: { type: "RESOURCE", id: resourceId, name: resourceId },
          entityB: { type: "SYSTEM", id: "SYSTEM", name: "System" },
          timeRange: { startAt, endAt },
        },
      ],
    };
  }

  // Check resource status
  if (resource.status !== "AVAILABLE") {
    conflicts.push({
      id: `CONF-MAINT-${Date.now()}`,
      conflictType: "RESOURCE_CONFLICT",
      severity: "BLOCKING",
      messageBn: `রিসোর্স '${resource.nameBn}' বর্তমানে অনুপলব্ধ (${resource.status})।`,
      messageEn: `Resource '${resource.nameEn}' is currently unavailable (${resource.status}).`,
      entityA: { type: "RESOURCE", id: resource.id, name: resource.nameBn },
      entityB: { type: "STATUS", id: resource.status, name: resource.status },
      timeRange: { startAt, endAt },
    });
  }

  // Check capacity limit
  if (
    participantCount &&
    resource.capacity > 0 &&
    participantCount > resource.capacity
  ) {
    conflicts.push({
      id: `CONF-CAP-${Date.now()}`,
      conflictType: "RESOURCE_CONFLICT",
      severity: "WARNING",
      messageBn: `অনুরোধকৃত অংশগ্রহণকারী সংখ্যা (${participantCount}) রিসোর্সের মোট ধারণক্ষমতা (${resource.capacity}) ছাড়িয়ে গেছে।`,
      messageEn: `Requested participant count (${participantCount}) exceeds resource capacity (${resource.capacity}).`,
      entityA: { type: "RESOURCE", id: resource.id, name: resource.nameBn },
      entityB: {
        type: "PARTICIPANTS",
        id: String(participantCount),
        name: `Participants: ${participantCount}`,
      },
      timeRange: { startAt, endAt },
    });
  }

  // If resource is exclusive, verify no overlapping confirmed or pending booking
  if (resource.isExclusive) {
    const overlappingBookings = bookings.filter((b) => {
      if (b.resourceId !== resourceId) return false;
      if (excludeBookingId && b.id === excludeBookingId) return false;
      if (b.status !== "CONFIRMED" && b.status !== "PENDING_APPROVAL")
        return false;
      return dateTimeRangesOverlap(startAt, endAt, b.startAt, b.endAt);
    });

    for (const ob of overlappingBookings) {
      conflicts.push({
        id: `CONF-DOUBLEBOOK-${Date.now()}-${ob.id}`,
        conflictType: "RESOURCE_CONFLICT",
        severity: "BLOCKING",
        messageBn: `'${resource.nameBn}' ইতিমধ্যে '${ob.title}' প্রোগ্রামের জন্য নির্ধারিত রয়েছে (${new Date(ob.startAt).toLocaleTimeString()} - ${new Date(ob.endAt).toLocaleTimeString()})।`,
        messageEn: `'${resource.nameEn}' is already booked for '${ob.title}' during this time.`,
        entityA: { type: "RESOURCE", id: resource.id, name: resource.nameBn },
        entityB: { type: "BOOKING", id: ob.id, name: ob.title },
        timeRange: { startAt, endAt },
      });
    }
  }

  const hasBlockingConflicts = conflicts.some(
    (c) => c.severity === "BLOCKING" || c.severity === "ERROR"
  );
  return { hasBlockingConflicts, conflicts };
}

/**
 * Checks if a target date falls inside any institutional holiday
 */
export function checkHolidayConflict(
  targetDateStr: string,
  contextType: "ROUTINE" | "EXAM" | "MEETING" | "EVENT" = "ROUTINE"
): { isBlocked: boolean; holiday?: InstitutionalHoliday; conflict?: ScheduleConflict } {
  const holidays = getInstitutionalHolidays();
  const targetTime = new Date(targetDateStr.split("T")[0]).getTime();

  for (const holiday of holidays) {
    const start = new Date(holiday.startDate).getTime();
    const end = new Date(holiday.endDate).getTime();

    if (targetTime >= start && targetTime <= end) {
      const isAffected =
        (contextType === "ROUTINE" && holiday.affectsClassRoutine) ||
        (contextType === "EXAM" && holiday.affectsExamRoutine) ||
        holiday.holidayType === "RELIGIOUS" ||
        holiday.holidayType === "EMERGENCY";

      if (isAffected) {
        return {
          isBlocked: true,
          holiday,
          conflict: {
            id: `CONF-HOL-${Date.now()}-${holiday.id}`,
            conflictType: "HOLIDAY_CONFLICT",
            severity: "ERROR",
            messageBn: `উক্ত তারিখে (${holiday.startDate}) মাদরাসায় সরকারি/প্রাতিষ্ঠানিক ছুটি '${holiday.titleBn}' বলবৎ রয়েছে।`,
            messageEn: `Institutional holiday '${holiday.titleEn}' is in effect on this date (${holiday.startDate}).`,
            entityA: { type: "DATE", id: targetDateStr, name: targetDateStr },
            entityB: {
              type: "HOLIDAY",
              id: holiday.id,
              name: holiday.titleBn,
            },
            timeRange: {
              startAt: `${holiday.startDate}T00:00:00.000Z`,
              endAt: `${holiday.endDate}T23:59:59.000Z`,
            },
          },
        };
      }
    }
  }

  return { isBlocked: false };
}
