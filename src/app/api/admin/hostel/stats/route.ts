import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getHostelDashboardStats } from "@/lib/hostelEngine";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/hostel/stats
 * Provides real-time, database-derived stats for Admin and Principal oversight.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন এবং প্রিন্সিপাল হোস্টেল ড্যাশবোর্ড দেখতে পারেন।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId") || undefined;

    const stats = await getHostelDashboardStats(sessionId);
    const enrichedStats = {
      ...stats,
      totalResidents: stats.residentialStudents,
      dayCareCount: stats.dayCareStudents,
      nonResidentialCount: stats.nonResidentialStudents,
    };
    return NextResponse.json({ success: true, stats: enrichedStats });
  } catch (error: any) {
    console.error("GET /api/admin/hostel/stats error:", error);
    return NextResponse.json(
      { error: error.message || "পরিসংখ্যান সংগ্রহে ত্রুটি ঘটেছে।" },
      { status: 500 }
    );
  }
}
