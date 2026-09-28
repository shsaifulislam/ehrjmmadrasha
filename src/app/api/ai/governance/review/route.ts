import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { processHumanReviewDecision } from "@/lib/ai/aiGovernance";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/governance/review
 * Human review gate: Authorized admin reviews an AI recommendation (Approved / Rejected / Modified).
 * Authorized: ADMIN only.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন AI রিকমেন্ডেশন রিভিউ করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { reviewId, decision, decisionNotes } = body;

    if (!reviewId || !decision) {
      return NextResponse.json({ error: "reviewId এবং decision প্যারামিটার আবশ্যক।" }, { status: 400 });
    }

    const result = await processHumanReviewDecision({
      reviewId,
      reviewerName: user.name,
      reviewerUserId: user.userId,
      decision,
      decisionNotes,
    });

    return NextResponse.json({
      success: true,
      review: result,
    });
  } catch (error: any) {
    console.error("AI Review Decision Error:", error);
    return NextResponse.json(
      { error: error.message || "AI রিভিউ সিদ্ধান্ত সংরক্ষণ করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
