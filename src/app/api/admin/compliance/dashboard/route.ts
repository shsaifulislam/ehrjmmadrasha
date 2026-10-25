import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ComplianceStore,
  ComplianceCrossModuleBridge,
  ObligationEngine,
  EvidenceVerificationEngine,
} from "@/lib/compliance";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত প্রবেশাধিকার। শুধুমাত্র অ্যাডমিন ও অধ্যক্ষ মহোদয়ের অনুমতি রয়েছে।" },
        { status: 403 }
      );
    }

    // Auto-scan expired exceptions and evidence
    ObligationEngine.scanExpiredExceptions();
    EvidenceVerificationEngine.scanExpiredEvidence();

    const requirements = ComplianceStore.getRequirements();
    const obligations = ComplianceStore.getObligations();
    const evidenceList = ComplianceStore.getEvidence();
    const reviews = ComplianceStore.getReviews();
    const exceptions = ComplianceStore.getExceptions();
    const remediations = ComplianceStore.getRemediations();
    const auditLogs = ComplianceStore.getAuditLogs().slice(0, 15);

    const nowStr = new Date().toISOString().slice(0, 10);
    const overdueObligations = obligations.filter(
      (o) =>
        o.dueDate < nowStr &&
        o.status !== "COMPLIANT" &&
        o.status !== "CLOSED" &&
        o.status !== "ARCHIVED"
    );

    const compliantCount = obligations.filter((o) => o.status === "COMPLIANT").length;
    const complianceRate = obligations.length > 0 ? Math.round((compliantCount / obligations.length) * 100) : 100;

    const matrix = ComplianceCrossModuleBridge.buildComplianceMatrix();
    const gaps = matrix.filter((row) => row.gapType && row.gapType !== "NONE");
    const earlyWarnings = ObligationEngine.generateEarlyWarnings();

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRequirements: requirements.length,
          activeRequirements: requirements.filter((r) => r.status === "ACTIVE").length,
          totalObligations: obligations.length,
          compliantObligations: compliantCount,
          overdueObligations: overdueObligations.length,
          pendingEvidence: evidenceList.filter((e) => e.verificationStatus === "PENDING").length,
          activeExceptions: exceptions.filter((e) => e.status === "APPROVED").length,
          openRemediations: remediations.filter((r) => r.status === "OPEN" || r.status === "IN_PROGRESS").length,
          complianceRate,
        },
        statusCounts: {
          NOT_STARTED: obligations.filter((o) => o.status === "NOT_STARTED").length,
          IN_PROGRESS: obligations.filter((o) => o.status === "IN_PROGRESS").length,
          READY_FOR_REVIEW: obligations.filter((o) => o.status === "READY_FOR_REVIEW").length,
          SUBMITTED: obligations.filter((o) => o.status === "SUBMITTED").length,
          UNDER_REVIEW: obligations.filter((o) => o.status === "UNDER_REVIEW").length,
          COMPLIANT: compliantCount,
          PARTIALLY_COMPLIANT: obligations.filter((o) => o.status === "PARTIALLY_COMPLIANT").length,
          NON_COMPLIANT: obligations.filter((o) => o.status === "NON_COMPLIANT").length,
          EXCEPTION_GRANTED: obligations.filter((o) => o.status === "EXCEPTION_GRANTED").length,
          OVERDUE: overdueObligations.length,
        },
        earlyWarnings,
        gaps,
        recentAudits: auditLogs,
      },
    });
  } catch (err: any) {
    console.error("[API Compliance Dashboard] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "অভ্যন্তরীণ সার্ভার ত্রুটি।" },
      { status: 500 }
    );
  }
}
