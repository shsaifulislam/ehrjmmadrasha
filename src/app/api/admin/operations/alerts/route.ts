import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listOperationalAlerts } from "@/lib/operationsEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") as any) || undefined;

    const alerts = await listOperationalAlerts(status);
    return NextResponse.json({ success: true, alerts });
  } catch (error: any) {
    console.error("Alerts List Error:", error);
    return NextResponse.json(
      { error: error.message || "অপারেশনাল অ্যালার্ট লোড করতে ব্যর্থ।" },
      { status: 500 }
    );
  }
}
