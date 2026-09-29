/**
 * EHRJ Institutional Calendar — Unified Calendar Projection Engine
 * Checkpoint: EHRJ-AI-2026-PHASE33
 * Core Principle: The Scheduling Engine is a coordination layer, NOT a duplicate source of truth.
 * Projects events dynamically from Academic Routine, Exams, CMS Events, Holidays, Meetings, and Deadlines.
 */

import prisma from "@/lib/prisma";
import {
  CalendarEvent,
  CalendarQueryOptions,
  ClassRoutineSlot,
  InstitutionalHoliday,
  InternalMeeting,
} from "./types";
import {
  getCalendarEvents,
  getClassRoutineSlots,
  getInstitutionalHolidays,
  getInternalMeetings,
  getResourceBookings,
} from "./calendarStore";
import { expandRecurringEvent, expandRoutineSlot } from "./recurrenceEngine";
import { getCmsEvents } from "@/lib/cms/cmsStore";

/**
 * Projects a unified calendar view honoring RBAC, IDOR scoping, and date window filters
 */
export async function getUnifiedCalendar(
  options: CalendarQueryOptions
): Promise<CalendarEvent[]> {
  const startRange = new Date(options.startDate);
  const endRange = new Date(options.endDate);
  const role = options.userRole || "PUBLIC";
  const userId = options.userId;

  const events: CalendarEvent[] = [];

  // 1. HOLIDAYS PROJECTION
  const holidays = getInstitutionalHolidays();
  for (const h of holidays) {
    const hStart = new Date(h.startDate);
    const hEnd = new Date(h.endDate);
    hEnd.setUTCHours(23, 59, 59, 999);

    if (hEnd >= startRange && hStart <= endRange) {
      events.push({
        id: `EVT_HOL_${h.id}`,
        title: h.titleBn,
        titleBn: h.titleBn,
        description: h.descriptionBn,
        descriptionBn: h.descriptionBn,
        eventType: "INSTITUTIONAL",
        startAt: `${h.startDate}T00:00:00.000Z`,
        endAt: `${h.endDate}T23:59:59.000Z`,
        timezone: "Asia/Dhaka",
        allDay: true,
        status: "SCHEDULED",
        visibility: h.isPublic ? "PUBLIC" : "INSTITUTIONAL",
        sourceModule: "MANUAL",
        sourceEntityId: h.id,
        createdBy: "system",
        updatedBy: "system",
        createdAt: h.createdAt,
        updatedAt: h.createdAt,
      });
    }
  }

  // 2. CMS PUBLIC EVENTS PROJECTION
  const cmsEvents = getCmsEvents();
  for (const ce of cmsEvents) {
    if (ce.status === "UPCOMING" || ce.status === "ONGOING") {
      const eDate = new Date(ce.eventDate);
      if (eDate >= startRange && eDate <= endRange) {
        const startAt = ce.startTime
          ? `${ce.eventDate}T${ce.startTime}:00.000Z`
          : `${ce.eventDate}T09:00:00.000Z`;
        const endAt = ce.endTime
          ? `${ce.eventDate}T${ce.endTime}:00.000Z`
          : `${ce.eventDate}T12:00:00.000Z`;

        events.push({
          id: `EVT_CMS_${ce.id}`,
          title: ce.titleBn,
          titleBn: ce.titleBn,
          description: ce.descriptionBn,
          descriptionBn: ce.descriptionBn,
          eventType: "EVENT",
          startAt,
          endAt,
          timezone: "Asia/Dhaka",
          allDay: !ce.startTime,
          status: "SCHEDULED",
          visibility: ce.isPublic ? "PUBLIC" : "INSTITUTIONAL",
          sourceModule: "CMS",
          sourceEntityId: ce.id,
          location: ce.location,
          createdBy: ce.createdBy,
          updatedBy: ce.createdBy,
          createdAt: ce.createdAt,
          updatedAt: ce.updatedAt,
        });
      }
    }
  }

  // 3. PERSISTENT MANUAL & INSTITUTIONAL CALENDAR EVENTS
  const manualEvents = getCalendarEvents();
  for (const me of manualEvents) {
    if (me.status === "CANCELLED" || me.status === "ARCHIVED") continue;
    const expanded = expandRecurringEvent(me, startRange, endRange);
    for (const exp of expanded) {
      const expStart = new Date(exp.startAt);
      if (expStart >= startRange && expStart <= endRange) {
        events.push(exp);
      }
    }
  }

  // 4. AUTHORITATIVE EXAM ROUTINES (Prisma: ExamRoutine & Exam)
  if (role !== "PUBLIC") {
    try {
      const examRoutines = await prisma.examRoutine.findMany({
        where: {
          examDate: {
            gte: startRange,
            lte: endRange,
          },
          status: { in: ["PUBLISHED", "DRAFT"] },
        },
        include: {
          exam: true,
          jamatClass: true,
          section: true,
          subject: true,
        },
      });

      for (const er of examRoutines) {
        const dateStr = er.examDate.toISOString().split("T")[0];
        const startAt = `${dateStr}T${er.startTime || "09:30"}:00.000Z`;
        const endAt = `${dateStr}T${er.endTime || "12:30"}:00.000Z`;

        events.push({
          id: `EVT_EXAM_${er.id}`,
          title: `${er.exam.nameBn} - ${er.subject.nameBn} (${er.jamatClass.nameBn})`,
          titleBn: `${er.exam.nameBn} - ${er.subject.nameBn} (${er.jamatClass.nameBn})`,
          description: er.instructions || undefined,
          eventType: "EXAMINATION",
          startAt,
          endAt,
          timezone: "Asia/Dhaka",
          allDay: false,
          status: "SCHEDULED",
          visibility: "INSTITUTIONAL",
          sourceModule: "EXAM",
          sourceEntityId: er.id,
          location: er.roomNo ? `কক্ষ: ${er.roomNo}` : undefined,
          targetAudience: {
            classId: er.classId,
            sectionId: er.sectionId || undefined,
          },
          createdBy: "academic_admin",
          updatedBy: "academic_admin",
          createdAt: er.createdAt.toISOString(),
          updatedAt: er.updatedAt.toISOString(),
        });
      }
    } catch (err) {
      console.error("[UnifiedCalendar] Error loading exam routines:", err);
    }
  }

  // 5. CLASS ROUTINES PROJECTION (Expanded occurrences across date window)
  if (options.includeRoutineOccurrences !== false && role !== "PUBLIC") {
    const routineSlots = getClassRoutineSlots();
    for (const slot of routineSlots) {
      if (slot.status !== "ACTIVE") continue;

      // Scoping: If user is teacher, filter to assigned slots
      if (role === "TEACHER" && userId && slot.teacherId !== userId) {
        continue;
      }

      // Scoping: If classId specified, filter
      if (options.classId && slot.classId !== options.classId) {
        continue;
      }

      const occurrences = expandRoutineSlot(slot, startRange, endRange);
      for (const occ of occurrences) {
        events.push({
          id: occ.id,
          title: `${occ.classNameBn}: ${occ.subjectNameBn} (${occ.teacherName})`,
          titleBn: `${occ.classNameBn}: ${occ.subjectNameBn} (${occ.teacherName})`,
          description: `উস্তাদ: ${occ.teacherName}${occ.roomNo ? ` | রুম: ${occ.roomNo}` : ""}`,
          eventType: "ACADEMIC",
          startAt: occ.startAt,
          endAt: occ.endAt,
          timezone: "Asia/Dhaka",
          allDay: false,
          status: "SCHEDULED",
          visibility: "TEACHER",
          sourceModule: "ACADEMIC",
          sourceEntityId: occ.slotId,
          location: occ.roomNo,
          targetAudience: {
            classId: slot.classId,
            sectionId: slot.sectionId,
            teacherId: slot.teacherId,
          },
          createdBy: "academic_admin",
          updatedBy: "academic_admin",
          createdAt: slot.createdAt,
          updatedAt: slot.updatedAt,
        });
      }
    }
  }

  // 6. INTERNAL MEETINGS PROJECTION (With strict privacy & RBAC)
  if (role === "ADMIN" || role === "PRINCIPAL" || role === "TEACHER") {
    const meetings = getInternalMeetings();
    for (const m of meetings) {
      if (m.status === "CANCELLED") continue;

      // Privacy check: Teachers only see meetings they are invited to or general faculty meetings
      if (role === "TEACHER") {
        const isInvited = m.participants.some((p) => p.userId === userId);
        const isFaculty = m.visibility === "TEACHER" || m.meetingType === "TEACHER_STAFF";
        if (!isInvited && !isFaculty) continue;
      }

      const mStart = new Date(m.startAt);
      if (mStart >= startRange && mStart <= endRange) {
        events.push({
          id: `EVT_MTG_${m.id}`,
          title: m.title,
          titleBn: m.title,
          description: m.agenda,
          eventType: "MEETING",
          startAt: m.startAt,
          endAt: m.endAt,
          timezone: "Asia/Dhaka",
          allDay: false,
          status: "SCHEDULED",
          visibility: m.visibility,
          sourceModule: "MANUAL",
          sourceEntityId: m.id,
          location: m.location,
          resourceId: m.resourceId,
          createdBy: m.organizerId,
          updatedBy: m.organizerId,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        });
      }
    }
  }

  // 7. CONFIRMED RESOURCE BOOKINGS (Admin & Principal oversight)
  if (role === "ADMIN" || role === "PRINCIPAL") {
    const bookings = getResourceBookings();
    for (const b of bookings) {
      if (b.status === "CONFIRMED") {
        const bStart = new Date(b.startAt);
        if (bStart >= startRange && bStart <= endRange) {
          events.push({
            id: `EVT_BKG_${b.id}`,
            title: `রিসোর্স বুকিং: ${b.resourceNameBn} - ${b.title}`,
            titleBn: `রিসোর্স বুকিং: ${b.resourceNameBn} - ${b.title}`,
            description: `${b.purpose} (অনুরোধকারী: ${b.requestedByName})`,
            eventType: "INSTITUTIONAL",
            startAt: b.startAt,
            endAt: b.endAt,
            timezone: "Asia/Dhaka",
            allDay: false,
            status: "SCHEDULED",
            visibility: "ADMIN_ONLY",
            sourceModule: "MANUAL",
            sourceEntityId: b.id,
            location: b.resourceNameBn,
            resourceId: b.resourceId,
            createdBy: b.requestedBy,
            updatedBy: b.approvedBy || b.requestedBy,
            createdAt: b.createdAt,
            updatedAt: b.updatedAt,
          });
        }
      }
    }
  }

  // 8. GUARDIAN IDOR SCOPING FILTER
  if (role === "GUARDIAN") {
    // A guardian may only see:
    // 1. PUBLIC events
    // 2. Institutional holidays
    // 3. Exam & routine events belonging to their linked children
    if (!userId) {
      return events.filter((e) => e.visibility === "PUBLIC");
    }

    try {
      const guardianRecord = await prisma.guardian.findFirst({
        where: { userId },
        include: {
          students: {
            include: {
              student: {
                include: {
                  enrollments: {
                    where: { status: "ACTIVE" },
                  },
                },
              },
            },
          },
        },
      });

      if (!guardianRecord) {
        return events.filter((e) => e.visibility === "PUBLIC");
      }

      const linkedClassIds = new Set<string>();
      const linkedSectionIds = new Set<string>();

      for (const link of guardianRecord.students) {
        for (const enroll of link.student.enrollments) {
          linkedClassIds.add(enroll.classId);
          if (enroll.sectionId) linkedSectionIds.add(enroll.sectionId);
        }
      }

      return events.filter((e) => {
        if (e.visibility === "PUBLIC") return true;
        if (e.eventType === "INSTITUTIONAL" && e.allDay) return true; // Holidays
        if (e.targetAudience?.classId) {
          return linkedClassIds.has(e.targetAudience.classId);
        }
        return false;
      });
    } catch (err) {
      console.error("[UnifiedCalendar] Error resolving guardian scope:", err);
      return events.filter((e) => e.visibility === "PUBLIC");
    }
  }

  // 9. PUBLIC SCOPING FILTER
  if (role === "PUBLIC") {
    return events.filter((e) => e.visibility === "PUBLIC");
  }

  // 10. OPTIONAL FILTERS (Types, search)
  let filtered = events;
  if (options.types && options.types.length > 0) {
    filtered = filtered.filter((e) => options.types!.includes(e.eventType));
  }
  if (options.search) {
    const q = options.search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.location && e.location.toLowerCase().includes(q))
    );
  }

  // Sort chronologically
  return filtered.sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );
}
