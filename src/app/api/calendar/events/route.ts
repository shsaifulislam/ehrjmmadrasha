import { NextRequest, NextResponse } from "next/server";
import { getUnifiedCalendar } from "@/lib/calendar/unifiedCalendarProjection";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

    const startDate = searchParams.get("start") || defaultStart;
    const endDate = searchParams.get("end") || defaultEnd;
    const userRole = searchParams.get("role") || "PUBLIC";
    const userId = searchParams.get("userId") || undefined;
    const classId = searchParams.get("classId") || undefined;
    const search = searchParams.get("search") || undefined;
    const typeParam = searchParams.get("type");
    const types = typeParam ? (typeParam.split(",") as any[]) : undefined;

    const events = await getUnifiedCalendar({
      startDate,
      endDate,
      userRole,
      userId,
      classId,
      search,
      types,
      includeRoutineOccurrences: true,
    });

    return NextResponse.json({
      success: true,
      count: events.length,
      startDate,
      endDate,
      userRole,
      data: events,
    });
  } catch (error: any) {
    console.error("[API /api/calendar/events] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load calendar events" },
      { status: 500 }
    );
  }
}
