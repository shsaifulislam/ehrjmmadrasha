import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAcademicAnalytics } from "@/lib/analyticsEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId") || undefined;
    const sessionId = searchParams.get("sessionId") || undefined;

    const data = await getAcademicAnalytics(examId, sessionId);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Academic Analytics Error:", error);
    return NextResponse.json(
      { error: error.message || "পরীক্ষা ও ফলাফল পরিসংখ্যান লোড করতে ব্যর্থ।" },
      { status: 500 }
    );
  }
}
