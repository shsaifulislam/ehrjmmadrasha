import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { adminCorrectAttendanceRecord } from "@/lib/attendanceService";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/attendance/correct
 * Allows Admin to correct any locked or existing attendance record.
 * Requires a mandatory correction reason and logs to AuditLog.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন হাজিরা সংশোধন করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { attendanceId, newStatus, leaveReason, correctionReason } = body;

    if (!attendanceId || !newStatus) {
      return NextResponse.json(
        { error: "হাজিরা আইডি এবং নতুন স্ট্যাটাস প্রদান আবশ্যক।" },
        { status: 400 }
      );
    }

    if (!["PRESENT", "ABSENT", "LATE", "LEAVE"].includes(newStatus)) {
      return NextResponse.json(
        { error: "অকার্যকর হাজিরা স্ট্যাটাস।" },
        { status: 400 }
      );
    }

    if (!correctionReason || !correctionReason.trim()) {
      return NextResponse.json(
        { error: "হাজিরা সংশোধনের কারণ উল্লেখ করা বাধ্যতামূলক।" },
        { status: 400 }
      );
    }

    const updated = await adminCorrectAttendanceRecord({
      attendanceId,
      newStatus,
      leaveReason: newStatus === "LEAVE" ? leaveReason : null,
      correctionReason: correctionReason.trim(),
      adminUserId: user.userId,
    });

    return NextResponse.json({
      success: true,
      message: "হাজিরা সফলভাবে সংশোধন করা হয়েছে এবং অডিট ট্রেইলে সংরক্ষিত হয়েছে।",
      record: updated,
    });
  } catch (error: any) {
    console.error("Admin attendance correct error:", error);
    return NextResponse.json(
      { error: error.message || "হাজিরা সংশোধন করতে সমস্যা হয়েছে।" },
      { status: error.statusCode || 500 }
    );
  }
}
