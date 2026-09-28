import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getEmployeeAttendance, recordEmployeeAttendance } from "@/lib/hrEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId") || undefined;
    const date = searchParams.get("date") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const status = searchParams.get("status") || undefined;

    const attendances = await getEmployeeAttendance({
      employeeId,
      date,
      startDate,
      endDate,
      status,
    });

    return NextResponse.json({ success: true, attendances });
  } catch (error: any) {
    console.error("Get employee attendance error:", error);
    return NextResponse.json(
      { error: error.message || "উপস্থিতি তথ্য লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন উপস্থিতি এন্ট্রি করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { employeeId, date, status, checkInTime, checkOutTime, remarks } = body;

    if (!employeeId || !date || !status) {
      return NextResponse.json({ error: "কর্মী, তারিখ ও উপস্থিতি স্ট্যাটাস আবশ্যক।" }, { status: 400 });
    }

    const record = await recordEmployeeAttendance({
      employeeId,
      date,
      status,
      checkInTime,
      checkOutTime,
      remarks,
      recordedByUserId: user.userId,
    });

    return NextResponse.json({ success: true, attendance: record }, { status: 201 });
  } catch (error: any) {
    console.error("Record employee attendance error:", error);
    return NextResponse.json(
      { error: error.message || "উপস্থিতি এন্ট্রি ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
