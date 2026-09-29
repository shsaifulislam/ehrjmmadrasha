import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSurveys, getSurveyResponses } from "@/lib/surveys";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/surveys
 * Returns list of eligible surveys for the current authenticated portal user
 * (Guardian, Teacher, Alumni, Student) with participation status.
 */
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const surveys = getSurveys();
    const responses = getSurveyResponses();

    // Filter surveys applicable to user's role
    const activeSurveys = surveys.filter(
      (s) => s.status === "OPEN" || s.status === "PUBLISHED"
    );

    const eligibleSurveys = activeSurveys.filter((s) => {
      if (s.isPublic) return true;
      if (session.role === "GUARDIAN") {
        return (
          s.audience.type === "ALL_GUARDIANS" ||
          s.audience.type === "GUARDIANS_SESSION" ||
          s.audience.type === "GUARDIANS_JAMAT"
        );
      }
      if (session.role === "TEACHER") {
        return s.audience.type === "TEACHERS";
      }
      if (session.role === "ALUMNI") {
        return s.audience.type === "ALUMNI";
      }
      if (session.role === "ADMIN" || session.role === "SUPER_ADMIN" || session.role === "PRINCIPAL") {
        return true;
      }
      return false;
    });

    // Attach participation status
    const result = eligibleSurveys.map((survey) => {
      const userResponse = responses.find(
        (r) =>
          r.surveyId === survey.id &&
          r.surveyVersion === survey.version &&
          r.isComplete &&
          r.respondentId === session.userId
      );

      return {
        ...survey,
        hasResponded: Boolean(userResponse),
        responseId: userResponse?.id,
        submittedAt: userResponse?.submittedAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      total: result.length,
    });
  } catch (err: any) {
    console.error("[API GET /api/portal/surveys] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch portal surveys" },
      { status: 500 }
    );
  }
}
