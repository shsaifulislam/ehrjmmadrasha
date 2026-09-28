import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSessionComparison } from "@/lib/analyticsEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const sessionAId = searchParams.get("sessionAId");
    const sessionBId = searchParams.get("sessionBId");

    if (!sessionAId || !sessionBId) {
      return NextResponse.json(
        { error: "তুলনার জন্য sessionAId এবং sessionBId উভয়ই আবশ্যক।" },
        { status: 400 }
      );
    }

    const data = await getSessionComparison(sessionAId, sessionBId);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Session Comparison Error:", error);
    return NextResponse.json(
      { error: error.message || "শিক্ষাবর্ষ তুলনা লোড করতে ব্যর্থ।" },
      { status: 500 }
    );
  }
}
