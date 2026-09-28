import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getFinanceAnalytics } from "@/lib/analyticsEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || undefined;
    const start = searchParams.get("start") || undefined;
    const end = searchParams.get("end") || undefined;

    const data = await getFinanceAnalytics(filter, start, end);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Finance Analytics Error:", error);
    return NextResponse.json(
      { error: error.message || "আর্থিক পরিসংখ্যান লোড করতে ব্যর্থ।" },
      { status: 500 }
    );
  }
}
