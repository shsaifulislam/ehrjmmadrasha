import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createNewSurveyVersion } from "@/lib/surveys";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/surveys/[id]/version
 * Duplicates a published survey into a new editable DRAFT version (e.g. v1 -> v2)
 * Preserving historical responses and question immutability.
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

    const newVersion = createNewSurveyVersion(
      params.id,
      session.userId || "ADMIN",
      session.role || "ADMIN"
    );

    return NextResponse.json({
      success: true,
      data: newVersion,
      message: `নতুন সংস্করণ সফলভাবে তৈরি করা হয়েছে (সংস্করণ: ${newVersion.version})`,
    });
  } catch (err: any) {
    console.error(`[API POST /api/surveys/${params.id}/version] Error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create new survey version" },
      { status: 400 }
    );
  }
}
