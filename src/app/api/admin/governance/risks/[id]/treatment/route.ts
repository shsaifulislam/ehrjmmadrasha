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

    // If action is ACCEPT_RISK, enforce human authority Principal check
    if (body.action === "ACCEPT_RISK") {
      if (!body.acceptanceReasonBn || !body.nextReviewDate) {
        return NextResponse.json(
          { success: false, error: "ঝুঁকি গ্রহণের কারণ এবং পরবর্তী পর্যালোচনার তারিখ আবশ্যক।" },
          { status: 400 }
        );
      }

      const accepted = RiskRegisterEngine.acceptRisk(
        id,
        {
          acceptanceReasonBn: body.acceptanceReasonBn,
          nextReviewDate: body.nextReviewDate,
          conditionsBn: body.conditionsBn,
        },
        actor
      );

      return NextResponse.json({
        success: true,
        risk: accepted,
        message: "ঝুঁকি আনুষ্ঠানিকভাবে গৃহীত (Accepted) হয়েছে।",
      });
    }

    // Standard treatment update
    if (!body.treatmentType || !body.treatmentPlanBn || !body.treatmentOwner || !body.treatmentTargetDate) {
      return NextResponse.json(
        { success: false, error: "প্রতিকার ধরণ, পরিকল্পনা, দায়িত্বপ্রাপ্ত ব্যক্তি এবং লক্ষ্যমাত্রা তারিখ আবশ্যক।" },
        { status: 400 }
      );
    }

    const updated = RiskRegisterEngine.updateTreatment(
      id,
      {
        treatmentType: body.treatmentType,
        treatmentPlanBn: body.treatmentPlanBn,
        treatmentOwner: body.treatmentOwner,
        treatmentTargetDate: body.treatmentTargetDate,
        targetStatus: body.targetStatus,
      },
      actor
    );

    return NextResponse.json({
      success: true,
      risk: updated,
      message: "ঝুঁকি প্রতিকার পরিকল্পনা সফলভাবে সংরক্ষিত হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update risk treatment." },
      { status: 500 }
    );
  }
}
