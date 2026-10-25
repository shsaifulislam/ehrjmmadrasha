import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  RiskAssuranceStore,
  ControlRegisterEngine,
  ActorContext,
  RiskCategory,
  ControlStatus,
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
    const status = searchParams.get("status") as ControlStatus | null;
    const effectiveness = searchParams.get("effectiveness");
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    let list = RiskAssuranceStore.getControls();

    if (category) {
      list = list.filter((c) => c.category === category);
    }
    if (status) {
      list = list.filter((c) => c.status === status);
    }
    if (effectiveness) {
      list = list.filter((c) => c.lastTestResult === effectiveness);
    }
    if (search) {
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(search) ||
          c.nameBn.toLowerCase().includes(search) ||
          c.nameEn.toLowerCase().includes(search) ||
          c.descriptionBn.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      total: list.length,
      controls: list,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list controls." },
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
      nameBn,
      nameEn,
      descriptionBn,
      controlObjectiveBn,
      category,
      controlType,
      executionType,
      frequency,
      ownerName,
      ownerRole,
      relatedRiskIds,
      sourceModule,
      evidenceRequirementBn,
      testingMethodBn,
      nextTestDueDate,
    } = body;

    if (!nameBn || !descriptionBn || !controlObjectiveBn || !category || !controlType || !ownerName) {
      return NextResponse.json(
        { success: false, error: "নাম, বিবরণ, উদ্দেশ্য, ক্যাটাগরি, ধরণ এবং দায়িত্বপ্রাপ্ত কর্মকর্তা আবশ্যক।" },
        { status: 400 }
      );
    }

    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    const newControl = ControlRegisterEngine.createControl(
      {
        nameBn,
        nameEn,
        descriptionBn,
        controlObjectiveBn,
        category,
        controlType: controlType || "PREVENTIVE",
        executionType: executionType || "HYBRID",
        frequency: frequency || "MONTHLY",
        ownerName,
        ownerRole: ownerRole || "OFFICER",
        relatedRiskIds,
        sourceModule: sourceModule || "GOVERNANCE",
        evidenceRequirementBn: evidenceRequirementBn || "অডিট লগ ও যাচাইকরণ রেকর্ড",
        testingMethodBn: testingMethodBn || "নমুনা পরীক্ষা ও ডেটাবেস ভেরিফিকেশন",
        nextTestDueDate,
      },
      actor
    );

    return NextResponse.json({
      success: true,
      control: newControl,
      message: "অভ্যন্তরীণ নিয়ন্ত্রণ সফলভাবে রেজিস্টারে নিবন্ধিত হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create control." },
      { status: 500 }
    );
  }
}
