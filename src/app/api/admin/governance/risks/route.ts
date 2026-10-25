import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  RiskAssuranceStore,
  RiskRegisterEngine,
  ActorContext,
  RiskCategory,
  RiskLevel,
  RiskStatus,
} from "@/lib/riskAssurance";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত প্রবেশাধিকার।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as RiskCategory | null;
    const level = searchParams.get("level") as RiskLevel | null;
    const status = searchParams.get("status") as RiskStatus | null;
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    let list = RiskAssuranceStore.getRisks();

    if (category) {
      list = list.filter((r) => r.riskCategory === category);
    }
    if (level) {
      list = list.filter((r) => r.residualLevel === level || r.inherentLevel === level);
    }
    if (status) {
      list = list.filter((r) => r.status === status);
    }
    if (search) {
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(search) ||
          r.titleBn.toLowerCase().includes(search) ||
          r.titleEn.toLowerCase().includes(search) ||
          r.descriptionBn.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      total: list.length,
      risks: list,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list risks." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত প্রবেশাধিকার।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      titleBn,
      titleEn,
      descriptionBn,
      riskCategory,
      sourceModule,
      relatedEntityId,
      ownerName,
      ownerRole,
      inherentLikelihood,
      inherentImpact,
      existingControlIds,
      residualLikelihood,
      residualImpact,
      treatmentType,
      treatmentPlanBn,
      treatmentOwner,
      treatmentTargetDate,
      notes,
    } = body;

    if (!titleBn || !descriptionBn || !riskCategory || !sourceModule || !ownerName) {
      return NextResponse.json(
        { success: false, error: "শিরোনাম, বিবরণ, ক্যাটাগরি, উৎস মডিউল এবং দায়িত্বপ্রাপ্ত কর্মকর্তার নাম আবশ্যক।" },
        { status: 400 }
      );
    }

    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    const newRisk = RiskRegisterEngine.createRisk(
      {
        titleBn,
        titleEn,
        descriptionBn,
        riskCategory,
        sourceModule,
        relatedEntityId,
        ownerName,
        ownerRole: ownerRole || "OFFICER",
        inherentLikelihood: inherentLikelihood || 3,
        inherentImpact: inherentImpact || 3,
        existingControlIds,
        residualLikelihood,
        residualImpact,
        treatmentType,
        treatmentPlanBn,
        treatmentOwner,
        treatmentTargetDate,
        notes,
      },
      actor
    );

    return NextResponse.json({
      success: true,
      risk: newRisk,
      message: "প্রাতিষ্ঠানিক ঝুঁকি সফলভাবে রেজিস্টারে অন্তর্ভুক্ত হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create risk record." },
      { status: 500 }
    );
  }
}
