import { NextRequest, NextResponse } from "next/server";
import { getUnifiedCalendar } from "@/lib/calendar/unifiedCalendarProjection";
import { generateIcsCalendar } from "@/lib/calendar/icsExportEngine";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), 0, 1).toISOString();
    const defaultEnd = new Date(now.getFullYear(), 11, 31).toISOString();

    const startDate = searchParams.get("start") || defaultStart;
    const endDate = searchParams.get("end") || defaultEnd;
    const userRole = searchParams.get("role") || "PUBLIC";
    const userId = searchParams.get("userId") || undefined;
    const title = searchParams.get("title") || "EHRJ Madrasha Calendar";

    // Obtain strictly authorized events
    const events = await getUnifiedCalendar({
      startDate,
      endDate,
      userRole,
      userId,
      includeRoutineOccurrences: true,
    });

    const icsContent = generateIcsCalendar(events, title);

    return new Response(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="ehrj-calendar.ics"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("[API /api/calendar/export] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to export calendar" },
      { status: 500 }
    );
  }
}
