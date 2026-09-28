import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAttendanceAnalytics } from "@/lib/analyticsEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId") || undefined;
    const classId = searchParams.get("classId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const data = await getAttendanceAnalytics({ sessionId, classId, startDate, endDate });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Attendance Analytics Error:", error);
    return NextResponse.json(
      { error: error.message || "হাজিরা পরিসংখ্যান লোড করতে ব্যর্থ।" },
      { status: 500 }
    );
  }
}
