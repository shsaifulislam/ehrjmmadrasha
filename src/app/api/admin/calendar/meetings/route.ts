import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import {
  getInternalMeetings,
  saveInternalMeetings,
  appendCalendarAuditLog,
} from "@/lib/calendar/calendarStore";
import { validateResourceBookingConflicts } from "@/lib/calendar/conflictEngine";
import { InternalMeeting } from "@/lib/calendar/types";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (!auth.authorized) return auth.response;

    const meetings = getInternalMeetings();
    return NextResponse.json({
      success: true,
      count: meetings.length,
      data: meetings,
    });
  } catch (error: any) {
    console.error("[API /api/admin/calendar/meetings] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load meetings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const {
      title,
      agenda,
      meetingType,
      startAt,
      endAt,
      location,
      resourceId,
      visibility,
      participants,
      organizerId,
      organizerName,
    } = body;

    if (!title || !startAt || !endAt || !organizerId) {
      return NextResponse.json(
        { success: false, error: "শিরোনাম, সময় এবং আয়োজকের তথ্য আবশ্যক।" },
        { status: 400 }
      );
    }

    // If resource assigned, check for conflict
    if (resourceId) {
      const conflictCheck = validateResourceBookingConflicts(
        resourceId,
        startAt,
        endAt,
        Array.isArray(participants) ? participants.length : 1
      );
      if (conflictCheck.hasBlockingConflicts) {
        return NextResponse.json(
          {
            success: false,
            error: `রিসোর্সের সাথে সংঘাত: ${conflictCheck.conflicts.map((c) => c.messageBn).join(" ")}`,
            conflicts: conflictCheck.conflicts,
          },
          { status: 409 }
        );
      }
    }

    const newMeeting: InternalMeeting = {
      id: `MTG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      title,
      agenda: agenda || "",
      meetingType: meetingType || "ADMINISTRATIVE",
      startAt,
      endAt,
      location: location || "মাদরাসা কনফারেন্স রুম",
      resourceId: resourceId || undefined,
      status: "SCHEDULED",
      organizerId,
      organizerName: organizerName || "প্রশাসন",
      participants: Array.isArray(participants) ? participants : [],
      visibility: visibility || "ADMIN_ONLY",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const meetings = getInternalMeetings();
    meetings.unshift(newMeeting);
    saveInternalMeetings(meetings);

    appendCalendarAuditLog({
      action: "SCHEDULE_MEETING",
      entityType: "MEETING",
      entityId: newMeeting.id,
      actorId: organizerId,
      actorRole: "ADMIN",
      details: `অভ্যন্তরীণ সভা আহ্বান: ${newMeeting.title} (${newMeeting.meetingType})`,
    });

    return NextResponse.json({
      success: true,
      message: "সভা সফলভাবে আহ্বান করা হয়েছে",
      meeting: newMeeting,
    });
  } catch (error: any) {
    console.error("[API /api/admin/calendar/meetings POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to schedule meeting" },
      { status: 500 }
    );
  }
}
