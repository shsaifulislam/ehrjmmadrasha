import { NextRequest, NextResponse } from "next/server";
import { getInstitutionalHolidays } from "@/lib/calendar/calendarStore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicOnly = searchParams.get("publicOnly") === "true";

    let holidays = getInstitutionalHolidays();
    if (publicOnly) {
      holidays = holidays.filter((h) => h.isPublic);
    }

    // Sort chronologically by start date
    holidays.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return NextResponse.json({
      success: true,
      count: holidays.length,
      data: holidays,
    });
  } catch (error: any) {
    console.error("[API /api/calendar/holidays] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load holidays" },
      { status: 500 }
    );
  }
}
