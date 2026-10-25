import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getSurveys,
  saveSurveys,
  updateSurvey,
  appendSurveyAudit,
} from "@/lib/surveys";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/surveys/[id]
 * Fetch single survey definition
 */
export async function GET(req: NextRequest, { params: paramsPromise }: RouteParams) {
  const params = await paramsPromise;
  try {
    const { id } = params;
    const surveys = getSurveys();
    const survey = surveys.find((s) => s.id === id);

    if (!survey) {
      return NextResponse.json(
        { success: false, error: "Survey not found" },
        { status: 404 }
      );
    }

    const session = await getSessionUser();
    const isAdmin =
      session?.role === "ADMIN" ||
      session?.role === "SUPER_ADMIN" ||
      session?.role === "PRINCIPAL";

    // If survey is DRAFT or REVIEW and user is not admin, deny access
    if ((survey.status === "DRAFT" || survey.status === "REVIEW") && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Survey is not yet published" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: survey,
    });
  } catch (err: any) {
    console.error(`[API GET /api/surveys/${params.id}] Error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch survey" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/surveys/[id]
 * Update survey definition or metadata (Guards against modifying questions on locked versions)
 */
export async function PATCH(req: NextRequest, { params: paramsPromise }: RouteParams) {
  const params = await paramsPromise;
  try {
    const session = await getSessionUser();
    if (
      !session ||
      (session.role !== "ADMIN" &&
        session.role !== "SUPER_ADMIN" &&
        session.role !== "PRINCIPAL")
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin authority required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updated = updateSurvey(
      params.id,
      body,
      session.userId || "ADMIN",
      session.role || "ADMIN"
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: "জরিপের তথ্য সফলভাবে হালনাগাদ করা হয়েছে।",
    });
  } catch (err: any) {
    console.error(`[API PATCH /api/surveys/${params.id}] Error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update survey" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/surveys/[id]
 * Cancels or archives the survey
 */
export async function DELETE(req: NextRequest, { params: paramsPromise }: RouteParams) {
  const params = await paramsPromise;
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const surveys = getSurveys();
    const index = surveys.findIndex((s) => s.id === params.id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Survey not found" },
        { status: 404 }
      );
    }

    const survey = surveys[index];
    if (survey.status === "DRAFT") {
      surveys.splice(index, 1);
    } else {
      survey.status = "CANCELLED";
      survey.updatedAt = new Date().toISOString();
      surveys[index] = survey;
    }

    saveSurveys(surveys);

    appendSurveyAudit({
      surveyId: params.id,
      action: "ARCHIVE_SURVEY",
      actorId: session.userId || "ADMIN",
      actorRole: session.role || "ADMIN",
      details: `জরিপ বাতিল বা মুছে ফেলা হয়েছে [আইডি: ${params.id}]`,
    });

    return NextResponse.json({
      success: true,
      message: "জরিপটি সফলভাবে বাতিল করা হয়েছে।",
    });
  } catch (err: any) {
    console.error(`[API DELETE /api/surveys/${params.id}] Error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete survey" },
      { status: 500 }
    );
  }
}
