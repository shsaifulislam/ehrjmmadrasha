import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  RiskAssuranceStore,
  ControlRegisterEngine,
} from "@/lib/riskAssurance";

export const dynamic = "force-dynamic";

export type GovernanceReportType =
  | "RISK_REGISTER"
  | "RISK_ASSESSMENT"
  | "CONTROL_REGISTER"
  | "CONTROL_EFFECTIVENESS"
  | "FINDINGS"
  | "CORRECTIVE_ACTIONS"
  | "OVERDUE_ACTIONS"
  | "EXCEPTIONS"
  | "GOVERNANCE_REVIEW"
  | "MANAGEMENT_ASSURANCE"
  | "RISK_TREND"
  | "CONTROL_GAP";

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
    const reportType = (searchParams.get("type") as GovernanceReportType) || "RISK_REGISTER";
    const today = new Date().toISOString().split("T")[0];

    const institutionHeader = {
      nameBn: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা",
      nameEn: "Eliotganj Hazi Rohmatollah Jamiria Madrasha",
      addressBn: "ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা",
      engine: "Phase 42 Institutional Risk Management & Internal Control Engine",
      checkpoint: "EHRJ-AI-2026-PHASE42",
      generatedAt: new Date().toISOString(),
      generatedBy: user.name || "Administrator",
    };

    let reportTitle = "";
    let data: any = null;

    switch (reportType) {
      case "RISK_REGISTER":
        reportTitle = "প্রাতিষ্ঠানিক ঝুঁকি রেজিস্টার রিপোর্ট (Institutional Risk Register)";
        data = RiskAssuranceStore.getRisks().map((r) => ({
          riskId: r.id,
          titleBn: r.titleBn,
          category: r.riskCategory,
          module: r.sourceModule,
          owner: `${r.ownerName} (${r.ownerRole})`,
          inherentScore: `${r.inherentScore} (${r.inherentLevel})`,
          residualScore: `${r.residualScore} (${r.residualLevel})`,
          treatment: r.treatmentType,
          status: r.status,
          nextReviewDate: r.nextReviewDate,
        }));
        break;

      case "RISK_ASSESSMENT":
        reportTitle = "ঝুঁকি স্কোরিং ও অবশিষ্ট ঝুঁকি ম্যাট্রিক্স রিপোর্ট";
        data = RiskAssuranceStore.getRisks().map((r) => ({
          riskId: r.id,
          titleBn: r.titleBn,
          inherent: { likelihood: r.inherentLikelihood, impact: r.inherentImpact, score: r.inherentScore, level: r.inherentLevel },
          controlsMappedCount: r.existingControlIds.length,
          residual: { likelihood: r.residualLikelihood, impact: r.residualImpact, score: r.residualScore, level: r.residualLevel },
          varianceScore: r.inherentScore - r.residualScore,
        }));
        break;

      case "CONTROL_REGISTER":
        reportTitle = "অভ্যন্তরীণ নিয়ন্ত্রণ রেজিস্টার ও নির্দেশিকা রিপোর্ট";
        data = RiskAssuranceStore.getControls().map((c) => ({
          controlId: c.id,
          nameBn: c.nameBn,
          category: c.category,
          type: c.controlType,
          execution: c.executionType,
          frequency: c.frequency,
          owner: `${c.ownerName} (${c.ownerRole})`,
          status: c.status,
          lastTested: c.lastTestedDate || "পরীক্ষিত নয়",
          lastResult: c.lastTestResult || "NOT_TESTED",
        }));
        break;

      case "CONTROL_EFFECTIVENESS":
        reportTitle = "অভ্যন্তরীণ নিয়ন্ত্রণ টেস্টিং ও কার্যকারিতা রিপোর্ট";
        data = RiskAssuranceStore.getControlTests().map((t) => ({
          testId: t.id,
          controlId: t.controlId,
          testDate: t.testDate,
          tester: `${t.testerName} (${t.testerRole})`,
          sampleSize: t.sampleSize,
          result: t.result,
          exceptions: t.exceptionCount,
          evidenceRef: t.evidenceRef,
        }));
        break;

      case "FINDINGS":
        reportTitle = "অডিট ও নিয়ন্ত্রণ পর্যবেক্ষণ ও ত্রুটি বিবরণী রিপোর্ট";
        data = RiskAssuranceStore.getFindings().map((f) => ({
          findingId: f.id,
          titleBn: f.titleBn,
          source: f.sourceType,
          severity: f.severity,
          rootCause: f.rootCauseCategory,
          owner: f.ownerName,
          status: f.status,
          dueDate: f.dueDate,
          isOverdue: f.dueDate < today && f.status !== "CLOSED",
        }));
        break;

      case "CORRECTIVE_ACTIONS":
        reportTitle = "সংশোধনমূলক ও প্রতিরোধমূলক ব্যবস্থা (CAPA) বাস্তবায়ন রিপোর্ট";
        data = RiskAssuranceStore.getActions().map((a) => ({
          actionId: a.id,
          findingId: a.findingId,
          type: a.actionType,
          description: a.actionDescriptionBn,
          assignedTo: a.assignedTo,
          dueDate: a.dueDate,
          priority: a.priority,
          status: a.status,
          isOverdue: a.dueDate < today && a.status !== "COMPLETED" && a.status !== "VERIFIED",
        }));
        break;

      case "OVERDUE_ACTIONS":
        reportTitle = "সময়সীমা উত্তীর্ণ সংশোধনমূলক ব্যবস্থা (Overdue CAPA) রিপোর্ট";
        data = RiskAssuranceStore.getActions()
          .filter((a) => a.dueDate < today && a.status !== "COMPLETED" && a.status !== "VERIFIED")
          .map((a) => ({
            actionId: a.id,
            findingId: a.findingId,
            description: a.actionDescriptionBn,
            assignedTo: a.assignedTo,
            dueDate: a.dueDate,
            daysOverdue: Math.ceil((new Date(today).getTime() - new Date(a.dueDate).getTime()) / 86400000),
            priority: a.priority,
          }));
        break;

      case "EXCEPTIONS":
        reportTitle = "নিয়ন্ত্রণ ব্যতিক্রম ও ক্ষতিপূরণমূলক বিকল্প ব্যবস্থা রিপোর্ট";
        data = RiskAssuranceStore.getExceptions().map((e) => ({
          exceptionId: e.id,
          controlId: e.controlId,
          reason: e.exceptionReasonBn,
          startDate: e.startDate,
          endDate: e.endDate,
          compensatingControl: e.compensatingControlBn,
          approvedBy: e.approvedBy,
          status: e.status,
        }));
        break;

      case "GOVERNANCE_REVIEW":
        reportTitle = "শাসনকার্য ও নিয়ন্ত্রণ পর্যালোচনা অধিবেশন রেজোলিউশন রিপোর্ট";
        data = RiskAssuranceStore.getReviews().map((r) => ({
          reviewId: r.id,
          periodTitle: r.periodTitleBn,
          reviewDate: r.reviewDate,
          leadReviewer: `${r.leadReviewerName} (${r.leadReviewerRole})`,
          risksCovered: r.risksReviewedCount,
          controlsCovered: r.controlsReviewedCount,
          findingsCovered: r.findingsReviewedCount,
          decisions: r.summaryDecisionsBn,
          status: r.status,
        }));
        break;

      case "MANAGEMENT_ASSURANCE":
        reportTitle = "প্রাতিষ্ঠানিক নির্বাহী ব্যবস্থাপনা সুশাসন নিশ্চয়তা রিপোর্ট (Management Assurance)";
        const stats = RiskAssuranceStore.getDashboardStats();
        data = {
          riskPosture: {
            total: stats.totalRisks,
            criticalAndHigh: stats.criticalRisks + stats.highRisks,
            mitigatedRate: stats.totalRisks > 0 ? `${Math.round((stats.mitigatedRisks / stats.totalRisks) * 100)}%` : "100%",
          },
          controlHealth: {
            total: stats.totalControls,
            active: stats.activeControls,
            healthPercentage: `${stats.controlHealthPercentage}%`,
          },
          remediationVelocity: {
            openFindings: stats.openFindings,
            overdueFindings: stats.overdueFindings,
            remediationCompliance: stats.totalActions > 0 ? `${Math.round((stats.completedActions / stats.totalActions) * 100)}%` : "100%",
          },
        };
        break;

      case "RISK_TREND":
        reportTitle = "প্রাতিষ্ঠানিক ঝুঁকি প্রবৃত্তি ও স্তরভিত্তিক বিন্যাস রিপোর্ট";
        const allRisks = RiskAssuranceStore.getRisks();
        data = {
          byCategory: {
            FINANCIAL: allRisks.filter((r) => r.riskCategory === "FINANCIAL").length,
            SHARIAH: allRisks.filter((r) => r.riskCategory === "SHARIAH_COMPLIANCE").length,
            ACADEMIC: allRisks.filter((r) => r.riskCategory === "ACADEMIC").length,
            SECURITY: allRisks.filter((r) => r.riskCategory === "SECURITY").length,
            OPERATIONAL: allRisks.filter((r) => r.riskCategory === "OPERATIONAL").length,
            VENDOR: allRisks.filter((r) => r.riskCategory === "VENDOR_PROCUREMENT").length,
          },
          byResidualLevel: {
            CRITICAL: allRisks.filter((r) => r.residualLevel === "CRITICAL").length,
            HIGH: allRisks.filter((r) => r.residualLevel === "HIGH").length,
            MEDIUM: allRisks.filter((r) => r.residualLevel === "MEDIUM").length,
            LOW: allRisks.filter((r) => r.residualLevel === "LOW").length,
          },
        };
        break;

      case "CONTROL_GAP":
        reportTitle = "নিয়ন্ত্রণ ব্যবস্থার ঘাটতি ও দুর্বলতা বিশ্লেষণ রিপোর্ট (Control Gap Analysis)";
        data = ControlRegisterEngine.performControlGapAnalysis();
        break;

      default:
        reportTitle = "সুশাসন সাধারণ প্রতিবেদন";
        data = [];
    }

    return NextResponse.json({
      success: true,
      reportType,
      reportTitle,
      institutionHeader,
      summaryStats: RiskAssuranceStore.getDashboardStats(),
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate governance report." },
      { status: 500 }
    );
  }
}
