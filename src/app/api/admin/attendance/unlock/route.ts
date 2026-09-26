import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { setAttendanceLockState } from "@/lib/attendanceService";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/attendance/unlock
 * Admin unlocks attendance for a given session, class, section, and date.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন হাজিরা আনলক করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { sessionId, classId, sectionId, date, reason } = body;

    if (!sessionId || !classId || !date) {
      return NextResponse.json(
        { error: "সেশন, জামাত এবং তারিখ প্রদান আবশ্যক।" },
        { status: 400 }
      );
    }

    const lock = await setAttendanceLockState({
      sessionId,
      classId,
      sectionId: sectionId || null,
      date,
      isLocked: false,
      reason: reason || "অ্যাডমিন কর্তৃক হাজিরা সম্পাদনার জন্য উন্মুক্ত করা হয়েছে",
      adminUserId: user.userId,
    });

    return NextResponse.json({
      success: true,
      message: "হাজিরা সফলভাবে আনলক করা হয়েছে।",
      lock,
    });
  } catch (error: any) {
    console.error("Admin attendance unlock error:", error);
    return NextResponse.json(
      { error: error.message || "হাজিরা আনলক করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
