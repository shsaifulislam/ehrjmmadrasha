import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getLeaveRequests, submitLeaveRequest } from "@/lib/hrEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId") || undefined;
    const status = searchParams.get("status") || undefined;
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const requests = await getLeaveRequests({ employeeId, status, year, limit });
    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error("Get leave requests error:", error);
    return NextResponse.json(
      { error: error.message || "ছুটির আবেদন তালিকা লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { employeeId, leaveTypeId, startDate, endDate, reason, emergencyContact, attachmentUrl } = body;

    if (!employeeId || !leaveTypeId || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: "কর্মী, ছুটির ধরন, শুরুর তারিখ, শেষের তারিখ ও কারণ আবশ্যক।" }, { status: 400 });
    }

    const leaveRequest = await submitLeaveRequest({
      employeeId,
      leaveTypeId,
      startDate,
      endDate,
      reason,
      emergencyContact,
      attachmentUrl,
      recordedByUserId: user.userId,
    });

    return NextResponse.json({ success: true, request: leaveRequest }, { status: 201 });
  } catch (error: any) {
    console.error("Submit leave request error:", error);
    return NextResponse.json(
      { error: error.message || "ছুটির আবেদন দাখিল ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
