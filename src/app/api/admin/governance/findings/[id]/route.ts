import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  RiskAssuranceStore,
  FindingsActionEngine,
  ActorContext,
} from "@/lib/riskAssurance";

export const dynamic = "force-dynamic";

export async function GET(
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
    const finding = RiskAssuranceStore.getFindingById(id);

    if (!finding) {
      return NextResponse.json(
        { success: false, error: "পর্যবেক্ষণ রেকর্ড পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const linkedActions = RiskAssuranceStore.getActions().filter((a) => a.findingId === finding.id);
    const relatedRisk = finding.relatedRiskId ? RiskAssuranceStore.getRiskById(finding.relatedRiskId) : null;
    const relatedControl = finding.relatedControlId ? RiskAssuranceStore.getControlById(finding.relatedControlId) : null;

    return NextResponse.json({
      success: true,
      finding,
      linkedActions,
      relatedRisk,
      relatedControl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get finding details." },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const finding = RiskAssuranceStore.getFindingById(id);

    if (!finding) {
      return NextResponse.json(
        { success: false, error: "পর্যবেক্ষণ রেকর্ড পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    if (body.action === "VERIFY_AND_CLOSE") {
      if (!body.resolutionNotesBn) {
        return NextResponse.json(
          { success: false, error: "নিষ্পত্তি ও যাচাইকরণ নোট (resolutionNotesBn) আবশ্যক।" },
          { status: 400 }
        );
      }

      const closed = FindingsActionEngine.verifyAndCloseFinding(
        id,
        {
          resolutionNotesBn: body.resolutionNotesBn,
          evidenceRef: body.evidenceRef,
        },
        actor
      );

      return NextResponse.json({
        success: true,
        finding: closed,
        message: "পর্যবেক্ষণ সফলভাবে যাচাইকৃত ও নিষ্পত্তি ঘোষণা করা হয়েছে।",
      });
    }

    // General updates
    const allowed = ["titleBn", "titleEn", "descriptionBn", "recommendationBn", "ownerName", "dueDate", "status"];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        (finding as any)[key] = body[key];
      }
    }

    finding.updatedAt = new Date().toISOString();
    RiskAssuranceStore.saveFinding(finding, actor);

    return NextResponse.json({
      success: true,
      finding,
      message: "পর্যবেক্ষণ তথ্য সফলভাবে হালনাগাদ করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update finding." },
      { status: 500 }
    );
  }
}
