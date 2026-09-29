import { NextResponse } from "next/server";
import { getCommunicationOverviewMetrics } from "@/lib/communications";

export async function GET() {
  try {
    const metrics = getCommunicationOverviewMetrics();
    return NextResponse.json({ success: true, metrics });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
