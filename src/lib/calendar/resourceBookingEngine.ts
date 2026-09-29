/**
 * EHRJ Institutional Calendar — Resource Booking Engine
 * Checkpoint: EHRJ-AI-2026-PHASE33
 * Handles exclusive resource reservation, double-booking prevention, capacity validation, and approval workflows.
 */

import { ResourceBooking, InstitutionalResource, BookingStatus } from "./types";
import {
  getInstitutionalResources,
  getResourceBookings,
  saveResourceBookings,
  appendCalendarAuditLog,
} from "./calendarStore";
import { validateResourceBookingConflicts } from "./conflictEngine";

export interface CreateBookingRequest {
  resourceId: string;
  title: string;
  purpose: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRole: string;
  startAt: string; // ISO datetime
  endAt: string; // ISO datetime
  participantCount?: number;
}

/**
 * Creates a new resource booking with conflict validation
 */
export function requestResourceBooking(req: CreateBookingRequest): {
  success: boolean;
  booking?: ResourceBooking;
  error?: string;
} {
  const resources = getInstitutionalResources();
  const resource = resources.find((r) => r.id === req.resourceId);

  if (!resource) {
    return { success: false, error: "রিসোর্সটি সিস্টেমে বিদ্যমান নয়।" };
  }

  if (resource.status !== "AVAILABLE") {
    return {
      success: false,
      error: `রিসোর্সটি বর্তমানে ব্যবহারের জন্য অনুপলব্ধ (${resource.status})।`,
    };
  }

  // Validate conflicts
  const conflictCheck = validateResourceBookingConflicts(
    req.resourceId,
    req.startAt,
    req.endAt,
    req.participantCount
  );

  if (conflictCheck.hasBlockingConflicts) {
    const errorMsg = conflictCheck.conflicts
      .map((c) => c.messageBn)
      .join(" ");
    return { success: false, error: errorMsg };
  }

  // Determine initial status based on approval requirement
  const initialStatus: BookingStatus = resource.requiresApproval
    ? "PENDING_APPROVAL"
    : "CONFIRMED";

  const newBooking: ResourceBooking = {
    id: `BKG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    resourceId: req.resourceId,
    resourceNameBn: resource.nameBn,
    title: req.title,
    purpose: req.purpose,
    requestedBy: req.requestedBy,
    requestedByName: req.requestedByName,
    requestedByRole: req.requestedByRole,
    startAt: req.startAt,
    endAt: req.endAt,
    participantCount: req.participantCount || 0,
    status: initialStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const bookings = getResourceBookings();
  bookings.unshift(newBooking);
  saveResourceBookings(bookings);

  appendCalendarAuditLog({
    action: "BOOK_RESOURCE",
    entityType: "BOOKING",
    entityId: newBooking.id,
    actorId: req.requestedBy,
    actorRole: req.requestedByRole,
    details: `রিসোর্স বুকিং আবেদন: ${resource.nameBn} (${req.title}) - স্ট্যাটাস: ${initialStatus}`,
  });

  return { success: true, booking: newBooking };
}

/**
 * Approves a pending resource booking
 */
export function approveResourceBooking(
  bookingId: string,
  approvedBy: string,
  approvalNotes?: string
): { success: boolean; booking?: ResourceBooking; error?: string } {
  const bookings = getResourceBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);

  if (index === -1) {
    return { success: false, error: "বুকিং রেকর্ড পাওয়া যায়নি।" };
  }

  const booking = bookings[index];

  // Re-verify conflicts at approval time to guard against race conditions
  const conflictCheck = validateResourceBookingConflicts(
    booking.resourceId,
    booking.startAt,
    booking.endAt,
    booking.participantCount,
    booking.id
  );

  if (conflictCheck.hasBlockingConflicts) {
    return {
      success: false,
      error: `অনুমোদনের সময় সংঘর্ষ পাওয়া গেছে: ${conflictCheck.conflicts.map((c) => c.messageBn).join(" ")}`,
    };
  }

  booking.status = "CONFIRMED";
  booking.approvedBy = approvedBy;
  booking.approvedAt = new Date().toISOString();
  if (approvalNotes) booking.approvalNotes = approvalNotes;
  booking.updatedAt = new Date().toISOString();

  bookings[index] = booking;
  saveResourceBookings(bookings);

  appendCalendarAuditLog({
    action: "APPROVE_BOOKING",
    entityType: "BOOKING",
    entityId: booking.id,
    actorId: approvedBy,
    actorRole: "ADMIN",
    details: `বুকিং অনুমোদন করা হয়েছে: ${booking.resourceNameBn} (${booking.title})`,
  });

  return { success: true, booking };
}

/**
 * Rejects a resource booking request
 */
export function rejectResourceBooking(
  bookingId: string,
  rejectedBy: string,
  rejectionReason: string
): { success: boolean; booking?: ResourceBooking; error?: string } {
  const bookings = getResourceBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);

  if (index === -1) {
    return { success: false, error: "বুকিং রেকর্ড পাওয়া যায়নি।" };
  }

  const booking = bookings[index];
  booking.status = "REJECTED";
  booking.rejectionReason = rejectionReason;
  booking.updatedAt = new Date().toISOString();

  bookings[index] = booking;
  saveResourceBookings(bookings);

  appendCalendarAuditLog({
    action: "REJECT_BOOKING",
    entityType: "BOOKING",
    entityId: booking.id,
    actorId: rejectedBy,
    actorRole: "ADMIN",
    details: `বুকিং প্রত্যাখ্যান: ${booking.resourceNameBn} - কারণ: ${rejectionReason}`,
  });

  return { success: true, booking };
}

/**
 * Cancels a confirmed or pending booking
 */
export function cancelResourceBooking(
  bookingId: string,
  cancelledBy: string,
  reason?: string
): { success: boolean; booking?: ResourceBooking; error?: string } {
  const bookings = getResourceBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);

  if (index === -1) {
    return { success: false, error: "বুকিং রেকর্ড পাওয়া যায়নি।" };
  }

  const booking = bookings[index];
  booking.status = "CANCELLED";
  booking.rejectionReason = reason;
  booking.updatedAt = new Date().toISOString();

  bookings[index] = booking;
  saveResourceBookings(bookings);

  appendCalendarAuditLog({
    action: "CANCEL_BOOKING",
    entityType: "BOOKING",
    entityId: booking.id,
    actorId: cancelledBy,
    actorRole: "USER",
    details: `বুকিং বাতিল করা হয়েছে: ${booking.resourceNameBn} (${booking.title})`,
  });

  return { success: true, booking };
}
