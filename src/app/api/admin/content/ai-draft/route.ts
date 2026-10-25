import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { INSTITUTION_INFO } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * AI Content Draft Assistant (Phase 21 Integration)
 * Strictly generates DRAFT suggestions requiring human review and approval.
 * Never automatically publishes content to the public portal.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) return auth.response;

    const { task, topic, context } = await req.json();

    if (!task || !topic) {
      return NextResponse.json(
        { success: false, error: "Task and topic are required" },
        { status: 400 }
      );
    }

    let draftOutput: any = {};

    switch (task) {
      case "FAQ_DRAFT":
        draftOutput = {
          questionBn: `${topic} সম্পর্কিত নিয়মাবলী কী?`,
          answerBn: `ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় ${topic} সংক্রান্ত প্রাতিষ্ঠানিক নীতিমালা অনুযায়ী যথাযথ প্রক্রিয়া অনুসরণ করতে হবে। বিস্তারিত তথ্যের জন্য মাদরাসা অফিসে যোগাযোগ করার জন্য অনুরোধ করা হচ্ছে। [খসড়া - মানবিক যাচাই আবশ্যক]`,
          category: "GENERAL",
          status: "DRAFT",
          isApproved: false,
          note: "এটি এআই দ্বারা প্রস্তুতকৃত খসড়া। প্রকাশের পূর্বে মুহতামিম বা অ্যাডমিন কর্তৃক অনুমোদন বাধ্যতামূলক।",
        };
        break;

      case "NOTICE_SUMMARY":
        draftOutput = {
          summaryBn: `ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার সকল শিক্ষক ও অভিভাবকবৃন্দের অবগতির জন্য জানানো যাচ্ছে যে, ${topic} সংক্রান্ত বিশেষ নোটিশ জারি করা হয়েছে।`,
          suggestedTags: ["বিজ্ঞপ্তি", "জরুরি", "প্রাতিষ্ঠানিক"],
          isDraft: true,
        };
        break;

      case "SEO_META":
        draftOutput = {
          suggestedTitle: `${topic} | ${INSTITUTION_INFO.nameBn}`,
          suggestedDescription: `${INSTITUTION_INFO.nameBn} — ${topic} সংক্রান্ত তথ্য, নিয়মাবলী এবং বিস্তারিত বিবরণী।`,
          suggestedKeywords: [
            INSTITUTION_INFO.nameBn,
            topic,
            "ইলিয়টগঞ্জ",
            "দাউদকান্দি",
            "কওমি মাদরাসা",
          ],
        };
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Unsupported AI draft task" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      task,
      topic,
      draft: draftOutput,
      disclaimer: "AI generated draft strictly requires human review before publication.",
    });
  } catch (error) {
    console.error("AI Draft API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate AI draft" },
      { status: 500 }
    );
  }
}
