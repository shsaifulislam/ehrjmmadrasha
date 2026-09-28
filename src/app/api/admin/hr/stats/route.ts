import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getHrDashboardStats } from "@/lib/hrEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const stats = await getHrDashboardStats();
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    console.error("HR Stats error:", error);
    return NextResponse.json(
      { error: error.message || "পরিসংখ্যান লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
