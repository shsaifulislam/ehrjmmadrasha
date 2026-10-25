import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { resolveStudentDocumentCenterOverview } from "@/lib/documentAutomation";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/documents/student-center?studentId=...
 * Returns complete document control center data for a student
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "শিক্ষার্থী আইডি আবশ্যক।" }, { status: 400 });
    }

    const overview = await resolveStudentDocumentCenterOverview(studentId);
    if (!overview) {
      return NextResponse.json({ error: "শিক্ষার্থী রেকর্ড পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      overview,
    });
  } catch (error: any) {
    console.error("Student Document Center API error:", error);
    return NextResponse.json(
      { error: error.message || "শিক্ষার্থীর ডকুমেন্ট সেন্টার ডেটা লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
