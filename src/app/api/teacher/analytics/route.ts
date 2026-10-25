import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getTeacherScopedAnalytics } from "@/lib/analyticsEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "অননুমোদিত শিক্ষক অ্যাক্সেস।" }, { status: 403 });
    }

    const data = await getTeacherScopedAnalytics(user.userId);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Teacher Analytics Error:", error);
    return NextResponse.json(
      { error: error.message || "শিক্ষকের শ্রেণি পরিসংখ্যান লোড করতে ব্যর্থ।" },
      { status: 500 }
    );
  }
}
