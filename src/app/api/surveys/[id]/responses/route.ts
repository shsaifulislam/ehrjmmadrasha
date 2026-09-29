import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getSurveys,
  getSurveyResponses,
  sanitizeResponseList,
} from "@/lib/surveys";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/surveys/[id]/responses
 * Returns privacy-sanitized list of responses for the survey.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionUser();
    const isAdmin =
      session?.role === "ADMIN" ||
      session?.role === "SUPER_ADMIN" ||
      session?.role === "PRINCIPAL";

    // Non-admins cannot inspect full responses list unless specifically authorized
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin authority required." },
        { status: 403 }
      );
    }

    const surveys = getSurveys();
    const survey = surveys.find((s) => s.id === params.id);
    if (!survey) {
      return NextResponse.json(
        { success: false, error: "Survey not found" },
        { status: 404 }
      );
    }

    const allResponses = getSurveyResponses().filter(
      (r) => r.surveyId === params.id && r.surveyVersion === survey.version
    );

    const { responses, isSmallGroupSuppressed, totalCount } =
      sanitizeResponseList(allResponses, survey, session?.role);

    return NextResponse.json({
      success: true,
      data: responses,
      isSmallGroupSuppressed,
      total: totalCount,
      responseMode: survey.responseMode,
    });
  } catch (err: any) {
    console.error(`[API GET /api/surveys/${params.id}/responses] Error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch survey responses" },
      { status: 500 }
    );
  }
}
