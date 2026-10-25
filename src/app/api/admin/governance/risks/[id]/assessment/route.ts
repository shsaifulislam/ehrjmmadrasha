import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  RiskRegisterEngine,
  ActorContext,
} from "@/lib/riskAssurance";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত প্রবেশাধিকার।" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    const updatedRisk = RiskRegisterEngine.assessRisk(
      id,
      {
        inherentLikelihood: body.inherentLikelihood,
        inherentImpact: body.inherentImpact,
        existingControlIds: body.existingControlIds,
        residualLikelihood: body.residualLikelihood,
        residualImpact: body.residualImpact,
        assessmentNotesBn: body.assessmentNotesBn,
      },
      actor
    );

    return NextResponse.json({
      success: true,
      risk: updatedRisk,
      message: "ঝুঁকি মূল্যায়ন ও স্কোর সফলভাবে সংরক্ষিত হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to assess risk." },
      { status: 500 }
    );
  }
}
