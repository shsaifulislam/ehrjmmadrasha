import { NextResponse } from "next/server";
import { getCmsEvents } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = getCmsEvents(true);
    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Public Events API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load events" },
      { status: 500 }
    );
  }
}
