import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getGovernanceStats } from "@/lib/policies";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const stats = getGovernanceStats();
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (err: any) {
    console.error("GET /api/governance/stats error:", err);
    return NextResponse.json({ error: err.message || "Failed to load governance stats" }, { status: 500 });
  }
}
