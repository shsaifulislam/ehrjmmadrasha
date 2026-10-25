import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { transitionSurveyStatus, SurveyStatus } from "@/lib/surveys";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/surveys/[id]/status
 * Transitions survey status through the validated state machine.
 */
export async function POST(req: NextRequest, { params: paramsPromise }: RouteParams) {
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
    const { status, reason } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Missing required 'status' field" },
        { status: 400 }
      );
    }

    const updated = transitionSurveyStatus(
      params.id,
      status as SurveyStatus,
      session.userId || "ADMIN",
      session.role || "ADMIN",
      reason
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: `জরিপের স্ট্যাটাস পরিবর্তন সফল: ${status}`,
    });
  } catch (err: any) {
    console.error(`[API POST /api/surveys/${params.id}/status] Error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update survey status" },
      { status: 400 }
    );
  }
}
