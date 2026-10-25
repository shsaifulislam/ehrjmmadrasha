import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import {
  validateRoutineSlotConflicts,
  validateResourceBookingConflicts,
  checkHolidayConflict,
} from "@/lib/calendar/conflictEngine";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { type, candidateSlot, candidateBooking, candidateDate } = body;

    if (type === "ROUTINE" && candidateSlot) {
      const result = validateRoutineSlotConflicts(candidateSlot);
      return NextResponse.json({
        success: true,
        type: "ROUTINE",
        hasBlockingConflicts: result.hasBlockingConflicts,
        conflicts: result.conflicts,
      });
    }

    if (type === "BOOKING" && candidateBooking) {
      const result = validateResourceBookingConflicts(
        candidateBooking.resourceId,
        candidateBooking.startAt,
        candidateBooking.endAt,
        candidateBooking.participantCount,
        candidateBooking.excludeBookingId
      );
      return NextResponse.json({
        success: true,
        type: "BOOKING",
        hasBlockingConflicts: result.hasBlockingConflicts,
        conflicts: result.conflicts,
      });
    }

    if (type === "HOLIDAY" && candidateDate) {
      const result = checkHolidayConflict(candidateDate, body.contextType);
      return NextResponse.json({
        success: true,
        type: "HOLIDAY",
        isBlocked: result.isBlocked,
        holiday: result.holiday,
        conflict: result.conflict,
      });
    }

    return NextResponse.json(
      { success: false, error: "অবৈধ কনফ্লিক্ট চেকিং অনুরোধ।" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API check-conflicts] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check conflicts" },
      { status: 500 }
    );
  }
}
