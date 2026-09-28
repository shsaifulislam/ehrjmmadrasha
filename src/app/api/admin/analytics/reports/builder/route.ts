import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { executeReportBuilder } from "@/lib/analyticsEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.module) {
      return NextResponse.json({ error: "রিপোর্টের মডিউল নির্বাচন আবশ্যক।" }, { status: 400 });
    }

    const result = await executeReportBuilder({
      module: body.module,
      startDate: body.startDate,
      endDate: body.endDate,
      sessionId: body.sessionId,
      classId: body.classId,
      limit: body.limit || 50,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Report Builder Error:", error);
    return NextResponse.json(
      { error: error.message || "রিপোর্ট তৈরি করতে ব্যর্থ।" },
      { status: 500 }
    );
  }
}
