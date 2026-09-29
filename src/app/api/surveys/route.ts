import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getSurveys,
  createSurveyDraft,
  Survey,
} from "@/lib/surveys";

export const dynamic = "force-dynamic";

/**
 * GET /api/surveys
 * List surveys with filtering by status, surveyType, audience, isPublic
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const surveyType = searchParams.get("surveyType");
    const isPublic = searchParams.get("isPublic");
    const audienceType = searchParams.get("audienceType");

    const session = await getSessionUser();
    const isAdmin = session?.role === "ADMIN" || session?.role === "SUPER_ADMIN" || session?.role === "PRINCIPAL";

    let surveys = getSurveys();

    // If not admin and not explicitly requesting public, filter to public or open surveys
    if (!isAdmin) {
      surveys = surveys.filter(
        (s) => s.isPublic || s.status === "OPEN" || s.status === "PUBLISHED"
      );
    }

    if (status) {
      surveys = surveys.filter((s) => s.status === status);
    }
    if (surveyType) {
      surveys = surveys.filter((s) => s.surveyType === surveyType);
    }
    if (isPublic !== null && isPublic !== undefined && isPublic !== "") {
      const pubBool = isPublic === "true";
      surveys = surveys.filter((s) => s.isPublic === pubBool);
    }
    if (audienceType) {
      surveys = surveys.filter((s) => s.audience.type === audienceType);
    }

    return NextResponse.json({
      success: true,
      data: surveys,
      total: surveys.length,
    });
  } catch (err: any) {
    console.error("[API GET /api/surveys] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch surveys" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/surveys
 * Create a new survey draft (Admin / Staff authority)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN" && session.role !== "PRINCIPAL" && session.role !== "TEACHER")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin or academic authority required." },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.titleBn || !body.titleEn || !body.surveyType || !body.audience) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: titleBn, titleEn, surveyType, audience" },
        { status: 400 }
      );
    }

    const newSurvey = createSurveyDraft({
      titleBn: body.titleBn,
      titleEn: body.titleEn,
      titleAr: body.titleAr,
      descriptionBn: body.descriptionBn || "",
      descriptionEn: body.descriptionEn,
      surveyType: body.surveyType,
      ownerId: session.userId || "ADMIN",
      ownerName: session.username || "মাদরাসা প্রশাসন (Administration)",
      audience: body.audience,
      startDate: body.startDate || new Date().toISOString(),
      endDate: body.endDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      responseMode: body.responseMode || "IDENTIFIED",
      responseLimit: body.responseLimit || "ONE_PER_USER",
      instructionsBn: body.instructionsBn,
      relatedModule: body.relatedModule,
      relatedEntityId: body.relatedEntityId,
      isPublic: Boolean(body.isPublic),
      questions: body.questions || [],
      allowHelpdeskConversion: body.allowHelpdeskConversion !== false,
    });

    return NextResponse.json({
      success: true,
      data: newSurvey,
      message: "জরিপের খসড়া সফলভাবে সংরক্ষিত হয়েছে।",
    });
  } catch (err: any) {
    console.error("[API POST /api/surveys] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create survey" },
      { status: 500 }
    );
  }
}
