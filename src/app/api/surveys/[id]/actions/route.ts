import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getSurveyActions,
  createSurveyAction,
  updateSurveyActionStatus,
  convertFeedbackToHelpdeskTicket,
} from "@/lib/surveys";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/surveys/[id]/actions
 * List improvement actions for this survey
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
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const actions = getSurveyActions().filter((a) => a.surveyId === params.id);

    return NextResponse.json({
      success: true,
      data: actions,
      total: actions.length,
    });
  } catch (err: any) {
    console.error(`[API GET /api/surveys/${params.id}/actions] Error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch survey actions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/surveys/[id]/actions
 * Create improvement action, update action status, or convert to Helpdesk Ticket
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
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

    // 1. Convert to Helpdesk Ticket
    if (body.action === "CONVERT_TO_HELPDESK") {
      const { actionId, categoryCode } = body;
      if (!actionId) {
        return NextResponse.json(
          { success: false, error: "actionId is required for helpdesk conversion" },
          { status: 400 }
        );
      }

      const result = await convertFeedbackToHelpdeskTicket({
        actionId,
        categoryCode,
        actorId: session.userId || "ADMIN",
        actorRole: session.role || "ADMIN",
      });

      return NextResponse.json({
        success: true,
        data: result,
        message: `হেল্পডেস্ক টিকিট তৈরি সফল হয়েছে: ${result.ticketNumber}`,
      });
    }

    // 2. Update status of action
    if (body.action === "UPDATE_STATUS") {
      const { actionId, status, notes } = body;
      if (!actionId || !status) {
        return NextResponse.json(
          { success: false, error: "actionId and status are required" },
          { status: 400 }
        );
      }

      const updated = updateSurveyActionStatus(
        actionId,
        status,
        notes,
        session.userId || "ADMIN",
        session.role || "ADMIN"
      );

      return NextResponse.json({
        success: true,
        data: updated,
        message: "পদক্ষেপের স্ট্যাটাস হালনাগাদ করা হয়েছে।",
      });
    }

    // 3. Create new action
    if (!body.findingBn || !body.ownerName || !body.dueDate) {
      return NextResponse.json(
        { success: false, error: "findingBn, ownerName, and dueDate are required" },
        { status: 400 }
      );
    }

    const newAction = createSurveyAction({
      surveyId: params.id,
      relatedQuestionId: body.relatedQuestionId,
      findingBn: body.findingBn,
      findingEn: body.findingEn,
      priority: body.priority,
      ownerId: body.ownerId || session.userId || "ADMIN",
      ownerName: body.ownerName,
      assignedRole: body.assignedRole || "STAFF",
      dueDate: body.dueDate,
      evidenceDescription: body.evidenceDescription,
      actorId: session.userId || "ADMIN",
      actorRole: session.role || "ADMIN",
    });

    return NextResponse.json({
      success: true,
      data: newAction,
      message: "প্রাতিষ্ঠানিক উন্নয়ন পদক্ষেপ সফলভাবে গৃহীত হয়েছে।",
    });
  } catch (err: any) {
    console.error(`[API POST /api/surveys/${params.id}/actions] Error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process survey action" },
      { status: 400 }
    );
  }
}
