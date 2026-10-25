import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  RiskAssuranceStore,
  FindingsActionEngine,
  ActorContext,
  FindingStatus,
  RiskLevel,
  RootCauseCategory,
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
    const status = searchParams.get("status") as FindingStatus | null;
    const severity = searchParams.get("severity") as RiskLevel | null;
    const rootCause = searchParams.get("rootCause") as RootCauseCategory | null;
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    let list = RiskAssuranceStore.getFindings();

    if (status) {
      list = list.filter((f) => f.status === status);
    }
    if (severity) {
      list = list.filter((f) => f.severity === severity);
    }
    if (rootCause) {
      list = list.filter((f) => f.rootCauseCategory === rootCause);
    }
    if (search) {
      list = list.filter(
        (f) =>
          f.id.toLowerCase().includes(search) ||
          f.titleBn.toLowerCase().includes(search) ||
          f.titleEn.toLowerCase().includes(search) ||
          f.descriptionBn.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      total: list.length,
      findings: list,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list findings." },
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
      sourceType,
      sourceReferenceId,
      relatedRiskId,
      relatedControlId,
      severity,
      ownerName,
      rootCauseCategory,
      rootCauseAnalysisBn,
      recommendationBn,
      dueDate,
      evidenceDocRefs,
    } = body;

    if (!titleBn || !descriptionBn || !sourceType || !severity || !ownerName || !rootCauseCategory || !recommendationBn) {
      return NextResponse.json(
        { success: false, error: "শিরোনাম, বিবরণ, উৎস, তীব্রতা, দায়িত্বপ্রাপ্ত কর্মকর্তা, মূল কারণ এবং সুপারিশ আবশ্যক।" },
        { status: 400 }
      );
    }

    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    const newFinding = FindingsActionEngine.createFinding(
      {
        titleBn,
        titleEn,
        descriptionBn,
        sourceType,
        sourceReferenceId,
        relatedRiskId,
        relatedControlId,
        severity,
        ownerName,
        rootCauseCategory,
        rootCauseAnalysisBn: rootCauseAnalysisBn || "মূল কারণ বিশ্লেষণ চলমান",
        recommendationBn,
        dueDate,
        evidenceDocRefs,
      },
      actor
    );

    return NextResponse.json({
      success: true,
      finding: newFinding,
      message: "পর্যবেক্ষণ ও ত্রুটি সফলভাবে নথিভুক্ত হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create finding." },
      { status: 500 }
    );
  }
}
