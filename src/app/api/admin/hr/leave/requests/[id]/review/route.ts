import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { reviewLeaveRequest } from "@/lib/hrEngine";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন ছুটির আবেদন অনুমোদন বা বাতিল করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { decision, decisionReason } = body;

    if (!decision || (decision !== "APPROVED" && decision !== "REJECTED")) {
      return NextResponse.json({ error: "সিদ্ধান্ত (APPROVED বা REJECTED) আবশ্যক।" }, { status: 400 });
    }

    const reviewed = await reviewLeaveRequest({
      requestId: params.id,
      decision,
      decisionReason,
      reviewedByUserId: user.userId,
    });

    return NextResponse.json({ success: true, request: reviewed });
  } catch (error: any) {
    console.error("Review leave request error:", error);
    return NextResponse.json(
      { error: error.message || "ছুটির সিদ্ধান্ত রেকর্ড ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
