import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getEmployeeRegisterReport,
  getTeacherRegisterReport,
  getLeaveReport,
  getExpiringDocuments,
} from "@/lib/hrEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "EMPLOYEE_REGISTER";

    if (type === "EMPLOYEE_REGISTER") {
      const departmentId = searchParams.get("departmentId") || undefined;
      const designationId = searchParams.get("designationId") || undefined;
      const employeeType = searchParams.get("employeeType") || undefined;
      const status = searchParams.get("status") || undefined;

      const data = await getEmployeeRegisterReport({
        departmentId,
        designationId,
        employeeType,
        status,
      });
      return NextResponse.json({ success: true, type, data });
    }

    if (type === "TEACHER_REGISTER") {
      const data = await getTeacherRegisterReport();
      return NextResponse.json({ success: true, type, data });
    }

    if (type === "LEAVE_REPORT") {
      const status = searchParams.get("status") || undefined;
      const leaveTypeId = searchParams.get("leaveTypeId") || undefined;
      const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : undefined;

      const data = await getLeaveReport({ status, leaveTypeId, year });
      return NextResponse.json({ success: true, type, data });
    }

    if (type === "DOCUMENT_EXPIRY") {
      const days = searchParams.get("days") ? parseInt(searchParams.get("days")!, 10) : 30;
      const data = await getExpiringDocuments(days);
      return NextResponse.json({ success: true, type, data });
    }

    return NextResponse.json({ error: "অজানা রিপোর্ট ধরন।" }, { status: 400 });
  } catch (error: any) {
    console.error("HR reports error:", error);
    return NextResponse.json(
      { error: error.message || "রিপোর্ট লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
