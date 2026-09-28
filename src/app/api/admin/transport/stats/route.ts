import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getTransportDashboardStats } from "@/lib/transportEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const stats = await getTransportDashboardStats();
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    console.error("Transport stats error:", error);
    return NextResponse.json(
      { error: error.message || "পরিসংখ্যান লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
