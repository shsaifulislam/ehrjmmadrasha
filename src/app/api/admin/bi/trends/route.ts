import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDomainHistoricalTrends } from "@/lib/biEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const domain = (searchParams.get("domain") || "FINANCE").toUpperCase() as
      | "FINANCE"
      | "ATTENDANCE"
      | "STUDENTS"
      | "ACADEMIC"
      | "OPERATIONS";

    const trends = await getDomainHistoricalTrends(domain);
    return NextResponse.json({ success: true, data: trends });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "অভ্যন্তরীণ সার্ভার ত্রুটি।" }, { status: 500 });
  }
}
