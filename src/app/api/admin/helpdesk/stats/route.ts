import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getHelpdeskDashboardStats } from "@/lib/helpdeskEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const stats = await getHelpdeskDashboardStats();
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    console.error("Helpdesk Stats error:", error);
    return NextResponse.json(
      { error: error.message || "হেল্পডেস্ক পরিসংখ্যান লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
