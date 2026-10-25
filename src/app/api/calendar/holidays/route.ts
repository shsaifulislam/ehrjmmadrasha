import { NextRequest, NextResponse } from "next/server";
import {
  getPublicInstitutionalHolidays,
  getInstitutionalHolidays,
} from "@/lib/calendar/calendarStore";
import { requireAdminAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includePrivate = searchParams.get("publicOnly") === "false";
    if (includePrivate) {
      const auth = await requireAdminAuth(request);
      if (!auth.authorized) return auth.response;
    }

    const holidays = includePrivate
      ? getInstitutionalHolidays()
      : getPublicInstitutionalHolidays();

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
