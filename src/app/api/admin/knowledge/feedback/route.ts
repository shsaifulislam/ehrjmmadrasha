import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { submitKnowledgeFeedback } from "@/lib/knowledge/knowledgeStore";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const body = await req.json();
    const { documentId, query, feedbackType, comment } = body;

    if (!feedbackType || !comment) {
      return NextResponse.json({ error: "ফিডব্যাকের ধরন ও মন্তব্য আবশ্যক।" }, { status: 400 });
    }

    const feedback = submitKnowledgeFeedback({
      documentId,
      query,
      feedbackType,
      comment,
      submittedByUserId: user?.userId,
      role: user?.role || "PUBLIC",
    });

    return NextResponse.json({
      success: true,
      message: "আপনার মূল্যবান ফিডব্যাক সফলভাবে সংরক্ষিত হয়েছে। ধন্যবাদ।",
      feedback,
    });
  } catch (err: any) {
    console.error("Feedback Submission Error:", err);
    return NextResponse.json({ error: err.message || "ফিডব্যাক সংরক্ষণ ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
