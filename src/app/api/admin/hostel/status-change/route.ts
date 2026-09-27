import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { changeResidentialStatus } from "@/lib/hostelEngine";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/hostel/status-change
 * Executes controlled residential status transition (e.g. NON_RESIDENTIAL -> RESIDENTIAL,
 * DAY_CARE -> RESIDENTIAL, RESIDENTIAL -> NON_RESIDENTIAL), preserves historical billing,
 * creates immutable ResidentialHistory, and dispatches notification.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন স্ট্যাটাস পরিবর্তন করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { studentId, sessionId, targetStatus, newStatus, effectiveDate, reason, notes } = body;
    const resolvedTargetStatus = targetStatus || newStatus;

    if (!studentId || !resolvedTargetStatus) {
      return NextResponse.json({ error: "শিক্ষার্থী আইডি এবং নতুন আবাসিক স্ট্যাটাস আবশ্যক।" }, { status: 400 });
    }

    if (!["RESIDENTIAL", "NON_RESIDENTIAL", "DAY_CARE"].includes(resolvedTargetStatus)) {
      return NextResponse.json({ error: "অবৈধ আবাসিক স্ট্যাটাস মান।" }, { status: 400 });
    }

    const result = await changeResidentialStatus({
      studentId,
      sessionId,
      targetStatus: resolvedTargetStatus,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
      reason: reason || "প্রশাসনিক স্ট্যাটাস পরিবর্তন",
      notes,
      adminUserId: user.userId,
    });

    return NextResponse.json({
      success: true,
      message: `আবাসিক স্ট্যাটাস সফলভাবে '${targetStatus}'-এ পরিবর্তিত হয়েছে।`,
      result,
    });
  } catch (error: any) {
    console.error("POST /api/admin/hostel/status-change error:", error);
    return NextResponse.json(
      { error: error.message || "স্ট্যাটাস পরিবর্তনে সমস্যা হয়েছে।" },
      { status: 400 }
    );
  }
}
