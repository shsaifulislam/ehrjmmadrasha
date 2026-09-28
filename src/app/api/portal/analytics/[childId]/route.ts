import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getGuardianChildAnalytics } from "@/lib/analyticsEngine";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { childId: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "GUARDIAN") {
      return NextResponse.json({ error: "অননুমোদিত অভিভাবক অ্যাক্সেস।" }, { status: 403 });
    }

    const data = await getGuardianChildAnalytics(user.userId, params.childId);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Guardian Child Analytics Error:", error);
    const status = error.message?.includes("অননুমোদিত") ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "শিক্ষার্থীর অগ্রগতি পরিসংখ্যান লোড করতে ব্যর্থ।" },
      { status }
    );
  }
}
