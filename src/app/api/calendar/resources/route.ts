import { NextRequest, NextResponse } from "next/server";
import {
  getInstitutionalResources,
  getResourceBookings,
} from "@/lib/calendar/calendarStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let resources = getInstitutionalResources();
    if (type) {
      resources = resources.filter((r) => r.type === type);
    }

    const bookings = getResourceBookings().filter(
      (b) => b.status === "CONFIRMED" || b.status === "PENDING_APPROVAL"
    );

    return NextResponse.json({
      success: true,
      count: resources.length,
      resources,
      activeBookings: bookings,
    });
  } catch (error: any) {
    console.error("[API /api/calendar/resources] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load resources" },
      { status: 500 }
    );
  }
}
