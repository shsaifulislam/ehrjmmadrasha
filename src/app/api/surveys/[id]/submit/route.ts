import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { submitSurveyResponse } from "@/lib/surveys";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

/**
 * POST /api/surveys/[id]/submit
 * Submits response to survey with eligibility, duplicate, and question validation.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionUser();
    const body = await req.json();

    const {
      answers,
      participationToken,
      linkedStudentId,
      linkedStudentName,
      isDraft,
    } = body;

    if (!Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, error: "Answers array is required." },
        { status: 400 }
      );
    }

    // IP / UA hash placeholder for rate protection on anonymous
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const ua = req.headers.get("user-agent") || "unknown";
    const ipHash = Buffer.from(ip).toString("base64").substring(0, 16);
    const userAgentHash = Buffer.from(ua).toString("base64").substring(0, 16);

    const response = submitSurveyResponse({
      surveyId: params.id,
      respondentId: session?.userId,
      respondentType: (session?.role as any) || "PUBLIC",
      respondentName: session?.username,
      linkedStudentId,
      linkedStudentName,
      participationToken,
      answers,
      isDraft: Boolean(isDraft),
      ipHash,
      userAgentHash,
    });

    return NextResponse.json({
      success: true,
      data: response,
      message: isDraft
        ? "খসড়া সফলভাবে সংরক্ষিত হয়েছে।"
        : "আপনার মূল্যবান মতামত ও প্রতিক্রিয়া সফলভাবে গৃহীত হয়েছে। জাযাকাল্লাহু খাইরান।",
    });
  } catch (err: any) {
    console.error(`[API POST /api/surveys/${params.id}/submit] Error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to submit survey response" },
      { status: 400 }
    );
  }
}
