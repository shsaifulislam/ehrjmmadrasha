/**
 * EHRJ Institutional Calendar & Scheduling Engine — Recurrence Engine
 * Checkpoint: EHRJ-AI-2026-PHASE33
 * Handles bounded recurrence expansion and exception handling (SKIP, MOVE, CANCEL, REPLACE).
 */

import {
  CalendarEvent,
  ClassRoutineSlot,
  RecurrenceRule,
  RecurrenceException,
} from "./types";

const MAX_OCCURRENCES_LIMIT = 365; // Safe bounded ceiling

/**
 * Expands a recurring CalendarEvent within a query window [startRange, endRange]
 */
export function expandRecurringEvent(
  event: CalendarEvent,
  startRange: Date,
  endRange: Date
): CalendarEvent[] {
  if (!event.isRecurring || !event.recurrenceRule) {
    return [event];
  }

  const rule = event.recurrenceRule;
  const exceptions = event.recurrenceExceptions || [];
  const results: CalendarEvent[] = [];

  const originalStart = new Date(event.startAt);
  const originalEnd = new Date(event.endAt);
  const durationMs = originalEnd.getTime() - originalStart.getTime();

  let currentDate = new Date(originalStart);
  let count = 0;
  const untilDate = rule.until ? new Date(rule.until) : endRange;
  const maxIterations = Math.min(rule.count || MAX_OCCURRENCES_LIMIT, MAX_OCCURRENCES_LIMIT);

  while (currentDate <= endRange && currentDate <= untilDate && count < maxIterations) {
    const dateStr = currentDate.toISOString().split("T")[0];

    // Check if currentDate matches the recurrence pattern
    let isMatch = false;

    if (rule.frequency === "DAILY") {
      isMatch = true;
    } else if (rule.frequency === "WEEKLY") {
      const day = currentDate.getUTCDay();
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        isMatch = rule.daysOfWeek.includes(day);
      } else {
        isMatch = day === originalStart.getUTCDay();
      }
    } else if (rule.frequency === "MONTHLY") {
      isMatch = currentDate.getUTCDate() === originalStart.getUTCDate();
    }

    if (isMatch && currentDate >= startRange) {
      // Check for RecurrenceException
      const exception = exceptions.find((ex) => ex.originalDate === dateStr);

      if (!exception || exception.exceptionType === "REPLACE" || exception.exceptionType === "MOVE") {
        const occStart = exception?.newStartAt
          ? new Date(exception.newStartAt)
          : new Date(currentDate.getTime());
        const occEnd = exception?.newEndAt
          ? new Date(exception.newEndAt)
          : new Date(occStart.getTime() + durationMs);

        results.push({
          ...event,
          id: `${event.id}_OCC_${dateStr}`,
          startAt: occStart.toISOString(),
          endAt: occEnd.toISOString(),
          title: exception?.reason
            ? `${event.title} (${exception.reason})`
            : event.title,
        });
        count++;
      } else if (exception.exceptionType === "SKIP" || exception.exceptionType === "CANCEL") {
        // Occurrence is skipped or cancelled; do not include
      }
    }

    // Advance according to frequency & interval
    const interval = Math.max(rule.interval || 1, 1);
    if (rule.frequency === "DAILY") {
      currentDate.setUTCDate(currentDate.getUTCDate() + interval);
    } else if (rule.frequency === "WEEKLY") {
      // Step day-by-day if multiple daysOfWeek are specified, else by interval * 7 days
      if (rule.daysOfWeek && rule.daysOfWeek.length > 1) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      } else {
        currentDate.setUTCDate(currentDate.getUTCDate() + interval * 7);
      }
    } else if (rule.frequency === "MONTHLY") {
      currentDate.setUTCMonth(currentDate.getUTCMonth() + interval);
    } else {
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
  }

  return results;
}

/**
 * Expands weekly ClassRoutineSlot instances across a date range [startRange, endRange]
 */
export function expandRoutineSlot(
  slot: ClassRoutineSlot,
  startRange: Date,
  endRange: Date
): Array<{
  id: string;
  slotId: string;
  date: string;
  startAt: string;
  endAt: string;
  classNameBn: string;
  subjectNameBn: string;
  teacherName: string;
  roomNo?: string;
}> {
  if (slot.status !== "ACTIVE") return [];

  const results: Array<{
    id: string;
    slotId: string;
    date: string;
    startAt: string;
    endAt: string;
    classNameBn: string;
    subjectNameBn: string;
    teacherName: string;
    roomNo?: string;
  }> = [];

  const cur = new Date(startRange);
  // Normalize to midnight UTC
  cur.setUTCHours(0, 0, 0, 0);

  const end = new Date(endRange);
  end.setUTCHours(23, 59, 59, 999);

  let iterations = 0;
  while (cur <= end && iterations < MAX_OCCURRENCES_LIMIT) {
    if (cur.getUTCDay() === slot.dayOfWeek) {
      const dateStr = cur.toISOString().split("T")[0];
      const [startH, startM] = slot.startTime.split(":").map(Number);
      const [endH, endM] = slot.endTime.split(":").map(Number);

      const startDateTime = new Date(cur);
      startDateTime.setUTCHours(startH, startM, 0, 0);

      const endDateTime = new Date(cur);
      endDateTime.setUTCHours(endH, endM, 0, 0);

      results.push({
        id: `OCC_RTN_${slot.id}_${dateStr}`,
        slotId: slot.id,
        date: dateStr,
        startAt: startDateTime.toISOString(),
        endAt: endDateTime.toISOString(),
        classNameBn: slot.classNameBn,
        subjectNameBn: slot.subjectNameBn,
        teacherName: slot.teacherName,
        roomNo: slot.roomNo,
      });
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
    iterations++;
  }

  return results;
}
