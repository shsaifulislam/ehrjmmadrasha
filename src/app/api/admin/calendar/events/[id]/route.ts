import { NextRequest, NextResponse } from "next/server";
import {
  getCalendarEvents,
  saveCalendarEvents,
  appendCalendarAuditLog,
} from "@/lib/calendar/calendarStore";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const events = getCalendarEvents();
    const event = events.find((e) => e.id === params.id);
    if (!event) {
      return NextResponse.json(
        { success: false, error: "ইভেন্টটি পাওয়া যায়নি।" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const events = getCalendarEvents();
    const index = events.findIndex((e) => e.id === params.id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "ইভেন্টটি পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const current = events[index];

    // Check if rescheduling
    let rescheduledFrom = current.rescheduledFrom;
    if (
      body.startAt &&
      body.startAt !== current.startAt &&
      body.rescheduleReason
    ) {
      rescheduledFrom = {
        startAt: current.startAt,
        endAt: current.endAt,
        reason: body.rescheduleReason,
        timestamp: new Date().toISOString(),
      };
    }

    const updated = {
      ...current,
      ...body,
      rescheduledFrom,
      updatedBy: body.actorId || current.updatedBy,
      updatedAt: new Date().toISOString(),
    };

    events[index] = updated;
    saveCalendarEvents(events);

    appendCalendarAuditLog({
      action: "UPDATE_EVENT",
      entityType: "EVENT",
      entityId: updated.id,
      actorId: body.actorId || "admin",
      actorRole: body.actorRole || "ADMIN",
      details: `ইভেন্ট হালনাগাদ: ${updated.title} ${body.rescheduleReason ? `(পুনঃনির্ধারণ: ${body.rescheduleReason})` : ""}`,
    });

    return NextResponse.json({
      success: true,
      message: "ইভেন্ট সফলভাবে হালনাগাদ করা হয়েছে",
      event: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const cancelReason = searchParams.get("reason") || "প্রশাসনিক সিদ্ধান্ত";
    const actorId = searchParams.get("actorId") || "admin";

    const events = getCalendarEvents();
    const index = events.findIndex((e) => e.id === params.id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "ইভেন্টটি পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    events[index].status = "CANCELLED";
    events[index].cancelledReason = cancelReason;
    events[index].updatedAt = new Date().toISOString();

    saveCalendarEvents(events);

    appendCalendarAuditLog({
      action: "CANCEL_EVENT",
      entityType: "EVENT",
      entityId: params.id,
      actorId,
      actorRole: "ADMIN",
      details: `ইভেন্ট বাতিল করা হয়েছে: ${events[index].title} - কারণ: ${cancelReason}`,
    });

    return NextResponse.json({
      success: true,
      message: "ইভেন্ট সফলভাবে বাতিল করা হয়েছে",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
