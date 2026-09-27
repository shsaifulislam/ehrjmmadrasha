import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { checkInResident } from "@/lib/hostelEngine";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/hostel/check-in
 * Executes atomic student check-in, updates authoritative student residential state,
 * records residential history, triggers Phase 8 notification and audit log.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন চেক-ইন সম্পন্ন করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { studentId, sessionId, effectiveDate, checkInDate, roomOrWardLabel, bedOrSeatLabel, notes } = body;

    if (!studentId) {
      return NextResponse.json({ error: "শিক্ষার্থী আইডি আবশ্যক।" }, { status: 400 });
    }

    const dateVal = effectiveDate || checkInDate;
    const enrollment = await checkInResident({
      studentId,
      sessionId,
      effectiveDate: dateVal ? new Date(dateVal) : undefined,
      roomOrWardLabel,
      bedOrSeatLabel,
      notes,
      adminUserId: user.userId,
    });

    return NextResponse.json({
      success: true,
      message: "হোস্টেল চেক-ইন সফলভাবে সম্পন্ন হয়েছে।",
      enrollment,
    });
  } catch (error: any) {
    console.error("POST /api/admin/hostel/check-in error:", error);
    return NextResponse.json(
      { error: error.message || "চেক-ইন প্রক্রিয়ায় সমস্যা হয়েছে।" },
      { status: 400 }
    );
  }
}
