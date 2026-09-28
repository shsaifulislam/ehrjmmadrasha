import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  forecastStudentEnrollment,
  forecastMonthlyCollections,
  forecastMonthlyExpenses,
  forecastInventoryRunway
} from "@/lib/forecastingEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। অ্যাডমিন বা অধ্যক্ষের অনুমোদন প্রয়োজন।" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const metricKey = body.metricKey || "TOTAL_FEES_COLLECTED";
    const horizon = Number(body.horizon) || 3;

    let result: any;
    if (metricKey === "ACTIVE_STUDENTS_COUNT") {
      result = await forecastStudentEnrollment(horizon);
    } else if (metricKey === "TOTAL_FEES_COLLECTED") {
      result = await forecastMonthlyCollections(horizon);
    } else if (metricKey === "TOTAL_OPERATING_EXPENSES") {
      result = await forecastMonthlyExpenses(horizon);
    } else if (metricKey === "INVENTORY_RUNWAY") {
      result = await forecastInventoryRunway();
    } else {
      return NextResponse.json({ error: `অসমর্থিত পূর্বাভাস সূচক: ${metricKey}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "অভ্যন্তরীণ সার্ভার ত্রুটি।" }, { status: 500 });
  }
}
