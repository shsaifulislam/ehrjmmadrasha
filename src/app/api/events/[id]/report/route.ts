import { NextRequest, NextResponse } from "next/server";
import { generateEventSummaryReport, getEventById } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const event = getEventById(params.id);
    if (!event) {
      return NextResponse.json({ success: false, error: "ইভেন্টটি পাওয়া যায়নি।" }, { status: 404 });
    }

    const report = generateEventSummaryReport(params.id);
    if (!report) {
      return NextResponse.json({ success: false, error: "প্রতিবেদন তৈরি সম্ভব হয়নি।" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    console.error("[API /api/events/[id]/report] GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}
