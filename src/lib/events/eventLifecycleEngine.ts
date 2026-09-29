/**
 * EHRJ Institutional Event Lifecycle Engine
 * Checkpoint: EHRJ-AI-2026-PHASE35
 * Strict state machine for event lifecycle and governance.
 */

import { EventStatus, InstitutionalEvent } from "./types";
import {
  getEvents,
  saveEvents,
  getEventById,
  appendEventAudit,
} from "./eventStore";
import { syncEventToCalendar, removeOrCancelEventCalendarBooking } from "./calendarBridge";

const ALLOWED_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  DRAFT: ["REVIEW", "CANCELLED"],
  REVIEW: ["APPROVED", "DRAFT", "CANCELLED"],
  APPROVED: ["PUBLISHED", "REGISTRATION_OPEN", "IN_PROGRESS", "CANCELLED"],
  PUBLISHED: ["REGISTRATION_OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
  REGISTRATION_OPEN: ["REGISTRATION_CLOSED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
  REGISTRATION_CLOSED: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: [],
  CANCELLED: [],
};

export interface TransitionResult {
  success: boolean;
  event?: InstitutionalEvent;
  error?: string;
}

/**
 * Validates whether a state transition is legal
 */
export function canTransitionStatus(
  currentStatus: EventStatus,
  targetStatus: EventStatus
): boolean {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

/**
 * Transition an event to a new status with validation, calendar synchronization and audit logging
 */
export function transitionEventStatus(params: {
  eventId: string;
  targetStatus: EventStatus;
  actorId: string;
  actorRole: string;
  reason?: string;
}): TransitionResult {
  const { eventId, targetStatus, actorId, actorRole, reason } = params;

  // Authorization check: only ADMIN or PRINCIPAL can approve, publish or cancel events
  if (
    ["APPROVED", "PUBLISHED", "CANCELLED", "ARCHIVED"].includes(targetStatus) &&
    !["ADMIN", "PRINCIPAL"].includes(actorRole)
  ) {
    return {
      success: false,
      error: `অননুমোদিত ভূমিকা: শুধুমাত্র অ্যাডমিন বা মুহতামিম/অধ্যক্ষ ইভেন্ট ${targetStatus} করতে পারবেন।`,
    };
  }

  const events = getEvents();
  const eventIndex = events.findIndex((e) => e.id === eventId);

  if (eventIndex < 0) {
    return { success: false, error: "ইভেন্টটি সিস্টেমে পাওয়া যায়নি।" };
  }

  const event = events[eventIndex];

  if (!canTransitionStatus(event.status, targetStatus)) {
    return {
      success: false,
      error: `অবৈধ স্ট্যাটাস পরিবর্তন: '${event.status}' থেকে '${targetStatus}'-এ রূপান্তর অনুমোদিত নয়।`,
    };
  }

  const prevStatus = event.status;
  event.status = targetStatus;
  event.updatedAt = new Date().toISOString();
  event.updatedBy = actorId;
  event.version += 1;

  if (targetStatus === "CANCELLED") {
    event.cancellationReason = reason || "অনিবার্য কারণে স্থগিত/বাতিল করা হলো।";
    event.cancelledAt = new Date().toISOString();
    event.cancelledBy = actorId;
    // Release calendar and resource booking
    removeOrCancelEventCalendarBooking(event, event.cancellationReason, actorId);
  } else if (["APPROVED", "PUBLISHED", "REGISTRATION_OPEN", "IN_PROGRESS"].includes(targetStatus)) {
    // Synchronize to Phase 33 Calendar
    const syncRes = syncEventToCalendar(event, actorId);
    event.calendarEventId = syncRes.calendarEventId;
    if (syncRes.bookingId) {
      event.bookingId = syncRes.bookingId;
    }
  }

  events[eventIndex] = event;
  saveEvents(events);

  // Record immutable audit
  appendEventAudit({
    eventId: event.id,
    action: targetStatus === "CANCELLED" ? "CANCEL_EVENT" : "STATUS_CHANGE",
    actorId,
    actorRole,
    details: `ইভেন্ট স্ট্যাটাস পরিবর্তিত: ${prevStatus} -> ${targetStatus}${reason ? ` (কারণ: ${reason})` : ""}`,
  });

  return { success: true, event };
}

/**
 * Creates a new Institutional Event
 */
export function createEvent(
  params: Omit<InstitutionalEvent, "id" | "registeredCount" | "waitlistedCount" | "version" | "createdAt" | "updatedAt">
): { success: boolean; event?: InstitutionalEvent; error?: string } {
  // Validate basic parameters
  if (!params.titleBn || !params.titleBn.trim()) {
    return { success: false, error: "ইভেন্টের বাংলা শিরোনাম আবশ্যক।" };
  }
  if (!params.startAt || !params.endAt) {
    return { success: false, error: "ইভেন্ট শুরুর ও সমাপ্তির সময় আবশ্যক।" };
  }
  if (new Date(params.startAt) >= new Date(params.endAt)) {
    return { success: false, error: "ইভেন্ট সমাপ্তির সময় অবশ্যই শুরুর সময়ের পরবর্তী হতে হবে।" };
  }

  const events = getEvents();
  const currentYear = new Date().getFullYear();
  const nextSeq = events.length + 1;
  const eventId = `EHRJ-EVT-${currentYear}-${String(nextSeq).padStart(6, "0")}`;

  const now = new Date().toISOString();
  const newEvent: InstitutionalEvent = {
    ...params,
    id: eventId,
    registeredCount: 0,
    waitlistedCount: 0,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };

  events.push(newEvent);
  saveEvents(events);

  appendEventAudit({
    eventId: newEvent.id,
    action: "CREATE_EVENT",
    actorId: newEvent.createdBy,
    actorRole: "ADMIN",
    details: `নতুন ইভেন্ট তৈরি করা হয়েছে: ${newEvent.titleBn} (${newEvent.id})`,
  });

  return { success: true, event: newEvent };
}
