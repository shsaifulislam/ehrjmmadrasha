import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { calculateSurveyAnalytics } from "@/lib/surveys";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/surveys/[id]/analytics
 * Returns quantitative distributions, completion rates, and bounded AI qualitative themes.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionUser();
    const isAdmin =
      session?.role === "ADMIN" ||
      session?.role === "SUPER_ADMIN" ||
      session?.role === "PRINCIPAL" ||
      session?.role === "TEACHER";

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Institutional access required." },
        { status: 403 }
      );
    }

    const analytics = calculateSurveyAnalytics(params.id);

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (err: any) {
    console.error(`[API GET /api/surveys/${params.id}/analytics] Error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to calculate survey analytics" },
      { status: 500 }
    );
  }
}
