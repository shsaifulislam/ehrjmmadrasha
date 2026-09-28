import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSystemHealth } from "@/lib/operationsEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const scope = user.role === "ADMIN" ? "ADMIN" : "PRINCIPAL";
    const health = await getSystemHealth(scope);
    return NextResponse.json({ success: true, health });
  } catch (error: any) {
    console.error("Operations Health Check Error:", error);
    return NextResponse.json(
      { error: error.message || "স্বাস্থ্য রিপোর্ট লোড করতে ব্যর্থ।" },
      { status: 500 }
    );
  }
}
