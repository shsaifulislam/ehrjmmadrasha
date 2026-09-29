/**
 * EHRJ Institutional Calendar Bridge for Student Life & Events
 * Checkpoint: EHRJ-AI-2026-PHASE35
 * Integrates Phase 35 Events with Phase 33 Calendar & Resource Booking Engine.
 * Invariant: EVENT OWNS THE EVENT. CALENDAR OWNS THE SCHEDULE.
 */

import { InstitutionalEvent } from "./types";
import {
  getCalendarEvents,
  saveCalendarEvents,
  getResourceBookings,
  saveResourceBookings,
} from "../calendar/calendarStore";
import { CalendarEvent, ResourceBooking } from "../calendar/types";
import { requestResourceBooking } from "../calendar/resourceBookingEngine";

/**
 * Synchronizes an institutional event into Phase 33 Calendar
 */
export function syncEventToCalendar(
  event: InstitutionalEvent,
  actorId: string = "system@ehrj.edu.bd"
): { calendarEventId: string; bookingId?: string; error?: string } {
  const calendarEvents = getCalendarEvents();
  const existingCalIndex = calendarEvents.findIndex(
    (ce) => ce.sourceEntityId === event.id || (event.calendarEventId && ce.id === event.calendarEventId)
  );

  let calStatus: CalendarEvent["status"] = "SCHEDULED";
  if (event.status === "DRAFT" || event.status === "REVIEW") {
    calStatus = "DRAFT";
  } else if (event.status === "CANCELLED") {
    calStatus = "CANCELLED";
  } else if (event.status === "COMPLETED" || event.status === "ARCHIVED") {
    calStatus = "COMPLETED";
  }

  let calendarEventId = event.calendarEventId;
  let bookingId = event.bookingId;

  // 1. If resource booking requested and not yet booked
  if (event.resourceId && !bookingId && event.status !== "CANCELLED" && event.status !== "DRAFT") {
    const bookingResult = requestResourceBooking({
      resourceId: event.resourceId,
      title: event.titleBn,
      purpose: `ইভেন্ট আয়োজন: ${event.titleBn} (${event.id})`,
      requestedBy: actorId,
      requestedByName: event.organizer || "মাদরাসা প্রশাসন",
      requestedByRole: "ADMIN",
      startAt: event.startAt,
      endAt: event.endAt,
      participantCount: event.maxCapacity > 0 ? event.maxCapacity : 100,
    });

    if (bookingResult.success && bookingResult.booking) {
      bookingId = bookingResult.booking.id;
    }
  }

  // 2. Upsert Calendar Event
  const now = new Date().toISOString();
  if (existingCalIndex >= 0) {
    calendarEvents[existingCalIndex] = {
      ...calendarEvents[existingCalIndex],
      title: event.titleEn || event.titleBn,
      titleBn: event.titleBn,
      description: event.descriptionEn || event.descriptionBn,
      descriptionBn: event.descriptionBn,
      startAt: event.startAt,
      endAt: event.endAt,
      status: calStatus,
      location: event.venueText,
      resourceId: event.resourceId,
      visibility: event.isPublic ? "PUBLIC" : "INSTITUTIONAL",
      cancelledReason: event.cancellationReason,
      updatedBy: actorId,
      updatedAt: now,
    };
    calendarEventId = calendarEvents[existingCalIndex].id;
  } else {
    calendarEventId = `CAL-EVT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newCalEvent: CalendarEvent = {
      id: calendarEventId,
      title: event.titleEn || event.titleBn,
      titleBn: event.titleBn,
      description: event.descriptionEn || event.descriptionBn,
      descriptionBn: event.descriptionBn,
      eventType: "EVENT",
      startAt: event.startAt,
      endAt: event.endAt,
      timezone: "Asia/Dhaka",
      allDay: false,
      status: calStatus,
      visibility: event.isPublic ? "PUBLIC" : "INSTITUTIONAL",
      sourceModule: "CMS",
      sourceEntityId: event.id,
      location: event.venueText,
      resourceId: event.resourceId,
      createdBy: actorId,
      updatedBy: actorId,
      createdAt: now,
      updatedAt: now,
    };
    calendarEvents.push(newCalEvent);
  }

  saveCalendarEvents(calendarEvents);

  return {
    calendarEventId: calendarEventId || "",
    bookingId,
  };
}

/**
 * Handle Event Cancellation in Phase 33 Calendar & Resource Bookings
 */
export function removeOrCancelEventCalendarBooking(
  event: InstitutionalEvent,
  reason: string,
  actorId: string
): void {
  // 1. Update calendar event status
  const calendarEvents = getCalendarEvents();
  const calIndex = calendarEvents.findIndex(
    (ce) => ce.sourceEntityId === event.id || (event.calendarEventId && ce.id === event.calendarEventId)
  );
  if (calIndex >= 0) {
    calendarEvents[calIndex].status = "CANCELLED";
    calendarEvents[calIndex].cancelledReason = reason;
    calendarEvents[calIndex].updatedBy = actorId;
    calendarEvents[calIndex].updatedAt = new Date().toISOString();
    saveCalendarEvents(calendarEvents);
  }

  // 2. Release resource booking
  if (event.bookingId) {
    const bookings = getResourceBookings();
    const bIndex = bookings.findIndex((b) => b.id === event.bookingId);
    if (bIndex >= 0) {
      bookings[bIndex].status = "CANCELLED";
      bookings[bIndex].updatedAt = new Date().toISOString();
      saveResourceBookings(bookings);
    }
  }
}
