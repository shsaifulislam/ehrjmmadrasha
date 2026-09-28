import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getOperationsAnalytics } from "@/lib/analyticsEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const data = await getOperationsAnalytics();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Operations Analytics Error:", error);
    return NextResponse.json(
      { error: error.message || "প্রাতিষ্ঠানিক কার্যক্রম পরিসংখ্যান লোড করতে ব্যর্থ।" },
      { status: 500 }
    );
  }
}
