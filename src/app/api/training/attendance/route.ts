import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getAllAttendanceRecords,
  recordSessionAttendance,
  verifyQrCheckIn,
} from "@/lib/training";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);

    const programId = searchParams.get("programId");
    const sessionId = searchParams.get("sessionId");
    const employeeId = searchParams.get("employeeId");

    let records = getAllAttendanceRecords();

    // Privacy rule: non-admin can only see their own attendance
    const isAdmin = user?.role === "ADMIN" || user?.role === "PRINCIPAL";
    if (!isAdmin && user) {
      records = records.filter((r) => r.employeeId === user.userId || r.employeeName === user.username);
    }

    if (programId) {
      records = records.filter((r) => r.trainingProgramId === programId);
    }
    if (sessionId) {
      records = records.filter((r) => r.sessionId === sessionId);
    }
    if (employeeId && isAdmin) {
      records = records.filter((r) => r.employeeId === employeeId);
    }

    return NextResponse.json({
      success: true,
      total: records.length,
      records,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const actor = {
      actorId: user.userId,
      actorName: user.username || "User",
      actorRole: user.role,
    };

    // Mode 1: QR Verification
    if (body.qrPayload && body.sessionId) {
      const result = verifyQrCheckIn(
        body.qrPayload,
        body.sessionId,
        {
          employeeId: body.employeeId || user.userId,
          employeeName: body.employeeName || user.username || "Participant",
        },
        actor
      );

      return NextResponse.json({
        success: result.success,
        record: result.record,
        error: result.error,
        message: result.success ? "কিউআর কোড যাচাইপূর্বক উপস্থিতি গৃহীত হয়েছে।" : undefined,
      });
    }

    // Mode 2: Manual Check-in / Attendance recording (Admin / Instructor only)
    const isAdminOrInstructor = user.role === "ADMIN" || user.role === "PRINCIPAL" || user.role === "TEACHER";
    if (!isAdminOrInstructor) {
      return NextResponse.json(
        { success: false, error: "উপস্থিতি নথিভুক্ত করার অনুমতি নেই।" },
        { status: 403 }
      );
    }

    if (!body.trainingProgramId || !body.sessionId || !body.employeeId || !body.status) {
      return NextResponse.json(
        { success: false, error: "প্রোগ্রাম, সেশন, কর্মী এবং উপস্থিতির স্ট্যাটাস আবশ্যক।" },
        { status: 400 }
      );
    }

    const result = recordSessionAttendance(
      {
        trainingProgramId: body.trainingProgramId,
        sessionId: body.sessionId,
        employeeId: body.employeeId,
        employeeName: body.employeeName || "Participant",
        status: body.status,
        checkInTime: body.checkInTime,
        checkOutTime: body.checkOutTime,
        qrVerified: !!body.qrVerified,
        notes: body.notes,
      },
      actor
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "প্রশিক্ষণ উপস্থিতি সফলভাবে সংরক্ষিত হয়েছে।",
      record: result.record,
      updatedRate: result.updatedRate,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record attendance" },
      { status: 500 }
    );
  }
}
