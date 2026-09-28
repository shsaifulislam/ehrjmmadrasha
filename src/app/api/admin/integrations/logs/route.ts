import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { loadIntegrationLogs } from "@/lib/integration";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || 50)));
    const code = searchParams.get("code");

    let logs = loadIntegrationLogs(limit);
    if (code) {
      logs = logs.filter((l: any) => l.integrationCode.toLowerCase() === code.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load logs" }, { status: 500 });
  }
}
