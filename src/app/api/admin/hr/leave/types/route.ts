import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getLeaveTypes } from "@/lib/hrEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const leaveTypes = await getLeaveTypes();
    return NextResponse.json({ success: true, leaveTypes });
  } catch (error: any) {
    console.error("Get leave types error:", error);
    return NextResponse.json(
      { error: error.message || "ছুটির ধরন তালিকা লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
