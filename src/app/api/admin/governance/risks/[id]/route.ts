import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  RiskAssuranceStore,
  RiskRegisterEngine,
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
    const risk = RiskAssuranceStore.getRiskById(id);

    if (!risk) {
      return NextResponse.json(
        { success: false, error: "ঝুঁকি রেকর্ড পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    // Fetch linked controls, findings, and audits
    const allControls = RiskAssuranceStore.getControls();
    const linkedControls = allControls.filter((c) =>
      risk.existingControlIds.includes(c.id) || c.relatedRiskIds.includes(risk.id)
    );

    const linkedFindings = RiskAssuranceStore.getFindings().filter(
      (f) => f.relatedRiskId === risk.id
    );

    const audits = RiskAssuranceStore.getAuditLogs().filter(
      (a) => a.entityType === "RISK" && a.entityId === risk.id
    );

    return NextResponse.json({
      success: true,
      risk,
      linkedControls,
      linkedFindings,
      audits,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get risk details." },
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
    const risk = RiskAssuranceStore.getRiskById(id);

    if (!risk) {
      return NextResponse.json(
        { success: false, error: "ঝুঁকি রেকর্ড পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    if (body.action === "CLOSE_RISK") {
      if (!body.closureReasonBn) {
        return NextResponse.json(
          { success: false, error: "ঝুঁকি সমাপ্তির কারণ (closureReasonBn) আবশ্যক।" },
          { status: 400 }
        );
      }
      const closed = RiskRegisterEngine.closeRisk(
        id,
        { closureReasonBn: body.closureReasonBn, evidenceRef: body.evidenceRef },
        actor
      );
      return NextResponse.json({
        success: true,
        risk: closed,
        message: "ঝুঁকি সফলভাবে সমাপ্ত ও ক্লোজ করা হয়েছে।",
      });
    }

    // General updates
    const allowed = ["titleBn", "titleEn", "descriptionBn", "ownerName", "ownerRole", "notes", "nextReviewDate", "status"];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        (risk as any)[key] = body[key];
      }
    }

    risk.updatedBy = actor.actorId;
    risk.updatedAt = new Date().toISOString();
    RiskAssuranceStore.saveRisk(risk, actor);

    return NextResponse.json({
      success: true,
      risk,
      message: "ঝুঁকি বিবরণ সফলভাবে হালনাগাদ করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update risk." },
      { status: 500 }
    );
  }
}
