import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import {
  getCalendarEvents,
  saveCalendarEvents,
  appendCalendarAuditLog,
} from "@/lib/calendar/calendarStore";
import { CalendarEvent } from "@/lib/calendar/types";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (!auth.authorized) return auth.response;

    const events = getCalendarEvents();
    return NextResponse.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error: any) {
    console.error("[API /api/admin/calendar/events] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load events" },
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
      titleBn,
      description,
      descriptionBn,
      eventType,
      startAt,
      endAt,
      visibility,
      location,
      resourceId,
      allDay,
      isRecurring,
      recurrenceRule,
      actorId,
      actorRole,
    } = body;

    if (!title || !startAt || !endAt) {
      return NextResponse.json(
        { success: false, error: "শিরোনাম, শুরুর সময় এবং শেষ সময় আবশ্যক।" },
        { status: 400 }
      );
    }

    const newEvent: CalendarEvent = {
      id: `CAL-EVT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      title,
      titleBn: titleBn || title,
      description,
      descriptionBn,
      eventType: eventType || "INSTITUTIONAL",
      startAt,
      endAt,
      timezone: "Asia/Dhaka",
      allDay: Boolean(allDay),
      status: "SCHEDULED",
      visibility: visibility || "INSTITUTIONAL",
      sourceModule: "MANUAL",
      location,
      resourceId,
      isRecurring: Boolean(isRecurring),
      recurrenceRule,
      createdBy: actorId || "admin",
      updatedBy: actorId || "admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const events = getCalendarEvents();
    events.unshift(newEvent);
    saveCalendarEvents(events);

    appendCalendarAuditLog({
      action: "CREATE_EVENT",
      entityType: "EVENT",
      entityId: newEvent.id,
      actorId: actorId || "admin",
      actorRole: actorRole || "ADMIN",
      details: `নতুন ক্যালেন্ডার ইভেন্ট তৈরি: ${newEvent.title} (${newEvent.eventType})`,
    });

    return NextResponse.json({
      success: true,
      message: "ক্যালেন্ডার ইভেন্ট সফলভাবে সংরক্ষণ করা হয়েছে",
      event: newEvent,
    });
  } catch (error: any) {
    console.error("[API /api/admin/calendar/events POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create event" },
      { status: 500 }
    );
  }
}
