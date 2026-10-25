import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { getCommunicationOverviewMetrics } from "@/lib/communications";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) return auth.response;

    const metrics = getCommunicationOverviewMetrics();
    return NextResponse.json({ success: true, metrics });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
