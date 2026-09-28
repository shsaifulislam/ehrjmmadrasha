import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getIntegrationHubOverview } from "@/lib/integration";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। অ্যাডমিন বা অধ্যক্ষের পারমিশন প্রয়োজন।" },
        { status: 403 }
      );
    }

    const overview = getIntegrationHubOverview();
    return NextResponse.json({
      success: true,
      data: overview,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load integration hub overview" },
      { status: 500 }
    );
  }
}
