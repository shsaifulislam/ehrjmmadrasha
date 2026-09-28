import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getInventoryDashboardStats } from "@/lib/inventoryEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const stats = await getInventoryDashboardStats();
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    console.error("Get inventory stats error:", error);
    return NextResponse.json(
      { error: error.message || "ইনভেন্টরি পরিসংখ্যান লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
