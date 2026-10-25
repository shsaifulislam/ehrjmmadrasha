import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import {
  getInstitutionalHolidays,
  saveInstitutionalHolidays,
  appendCalendarAuditLog,
} from "@/lib/calendar/calendarStore";
import { InstitutionalHoliday } from "@/lib/calendar/types";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (!auth.authorized) return auth.response;

    const holidays = getInstitutionalHolidays();
    holidays.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    return NextResponse.json({
      success: true,
      count: holidays.length,
      data: holidays,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
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
      titleBn,
      titleEn,
      startDate,
      endDate,
      holidayType,
      descriptionBn,
      affectsClassRoutine,
      affectsExamRoutine,
      affectsOffices,
      isPublic,
      actorId,
    } = body;

    if (!titleBn || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: "ছুটির শিরোনাম, শুরুর তারিখ এবং সমাপ্তির তারিখ আবশ্যক।" },
        { status: 400 }
      );
    }

    const newHoliday: InstitutionalHoliday = {
      id: `HOL-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      titleBn,
      titleEn: titleEn || titleBn,
      startDate,
      endDate,
      holidayType: holidayType || "INSTITUTIONAL",
      descriptionBn: descriptionBn || "",
      affectsClassRoutine: affectsClassRoutine !== false,
      affectsExamRoutine: affectsExamRoutine !== false,
      affectsOffices: Boolean(affectsOffices),
      isPublic: isPublic !== false,
      createdAt: new Date().toISOString(),
    };

    const holidays = getInstitutionalHolidays();
    holidays.push(newHoliday);
    saveInstitutionalHolidays(holidays);

    appendCalendarAuditLog({
      action: "CREATE_HOLIDAY",
      entityType: "HOLIDAY",
      entityId: newHoliday.id,
      actorId: actorId || "admin",
      actorRole: "ADMIN",
      details: `ছুটি সংযোজন: ${newHoliday.titleBn} (${newHoliday.startDate} থেকে ${newHoliday.endDate})`,
    });

    return NextResponse.json({
      success: true,
      message: "ছুটি সফলভাবে সংযোজন করা হয়েছে",
      holiday: newHoliday,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
