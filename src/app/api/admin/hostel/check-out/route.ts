import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { checkOutResident } from "@/lib/hostelEngine";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/hostel/check-out
 * Executes student check-out, updates student status to NON_RESIDENTIAL,
 * records residential history, triggers Phase 8 notification and audit log.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন চেক-আউট সম্পন্ন করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { studentId, sessionId, checkOutDate, effectiveDate, reason, notes } = body;

    if (!studentId) {
      return NextResponse.json({ error: "শিক্ষার্থী আইডি আবশ্যক।" }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({ error: "চেক-আউটের কারণ উল্লেখ করা আবশ্যক।" }, { status: 400 });
    }

    const dateVal = checkOutDate || effectiveDate;
    const enrollment = await checkOutResident({
      studentId,
      sessionId,
      checkOutDate: dateVal ? new Date(dateVal) : undefined,
      reason,
      notes,
      adminUserId: user.userId,
    });

    return NextResponse.json({
      success: true,
      message: "হোস্টেল চেক-আউট সফলভাবে সম্পন্ন হয়েছে।",
      enrollment,
    });
  } catch (error: any) {
    console.error("POST /api/admin/hostel/check-out error:", error);
    return NextResponse.json(
      { error: error.message || "চেক-আউট প্রক্রিয়ায় সমস্যা হয়েছে।" },
      { status: 400 }
    );
  }
}
