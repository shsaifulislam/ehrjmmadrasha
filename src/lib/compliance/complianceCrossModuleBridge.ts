/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 43
 * Cross-Module Compliance Bridge, Compliance Matrix & Institutional Reports Engine
 * Checkpoint: EHRJ-AI-2026-PHASE43
 */

import { ComplianceStore } from "./complianceStore";
import {
  ComplianceMatrixRow,
  ComplianceRequirement,
  ComplianceObligation,
  ComplianceEvidence,
  ComplianceReview,
  ComplianceException,
  ComplianceRemediation,
} from "./types";

export type ComplianceReportType =
  | "REQUIREMENT_REGISTER"
  | "OBLIGATION_REGISTER"
  | "COMPLIANCE_STATUS_REPORT"
  | "OVERDUE_OBLIGATIONS_REPORT"
  | "EVIDENCE_STATUS_REPORT"
  | "EXPIRY_REPORT"
  | "EXCEPTION_REPORT"
  | "REMEDIATION_REPORT"
  | "POLICY_TO_REQUIREMENT_MAPPING"
  | "REQUIREMENT_TO_CONTROL_MAPPING"
  | "CONTRACT_COMPLIANCE_REPORT"
  | "MANAGEMENT_ASSURANCE_REPORT";

export interface InstitutionalReportPayload {
  reportType: ComplianceReportType;
  reportTitleBn: string;
  generatedAt: string;
  institutionName: string;
  summary: {
    totalRequirements: number;
    activeRequirements: number;
    totalObligations: number;
    compliantObligations: number;
    overdueObligations: number;
    pendingEvidenceCount: number;
    activeExceptionsCount: number;
    openRemediationsCount: number;
  };
  data: any[];
}

export class ComplianceCrossModuleBridge {
  /**
   * Generates the multi-dimensional Compliance Matrix (Section 44)
   * Requirement -> Obligation -> Owner -> Evidence -> Control -> Risk -> Status
   * Detects Assignment gaps, Evidence gaps, Renewal gaps, and Risk link gaps.
   */
  static buildComplianceMatrix(): ComplianceMatrixRow[] {
    const requirements = ComplianceStore.getRequirements();
    const obligations = ComplianceStore.getObligations();
    const evidenceList = ComplianceStore.getEvidence();
    const nowStr = new Date().toISOString().slice(0, 10);

    const rows: ComplianceMatrixRow[] = [];

    for (const req of requirements) {
      const relatedObligations = obligations.filter((o) => o.requirementId === req.id);

      if (relatedObligations.length === 0) {
        // Requirement exists but no obligation created
        rows.push({
          requirementId: req.id,
          requirementTitle: req.title,
          category: req.category,
          status: "NOT_STARTED",
          evidenceCount: 0,
          relatedControlId: req.relatedControlId,
          relatedRiskId: req.relatedRiskId,
          gapType: "ASSIGNMENT_GAP",
        });
      } else {
        for (const obl of relatedObligations) {
          const oblEvidence = evidenceList.filter((e) => e.obligationId === obl.id);
          const verifiedEvidence = oblEvidence.find((e) => e.verificationStatus === "VERIFIED");

          let gapType: ComplianceMatrixRow["gapType"] = "NONE";

          if (!obl.ownerId || !obl.ownerName) {
            gapType = "ASSIGNMENT_GAP";
          } else if (oblEvidence.length === 0) {
            gapType = "EVIDENCE_GAP";
          } else if (
            verifiedEvidence?.expiryDate &&
            verifiedEvidence.expiryDate < nowStr
          ) {
            gapType = "RENEWAL_GAP";
          } else if (!obl.relatedControlId && !req.relatedControlId) {
            gapType = "RISK_LINK_GAP";
          }

          rows.push({
            requirementId: req.id,
            requirementTitle: req.title,
            category: req.category,
            obligationId: obl.id,
            obligationTitle: obl.title,
            ownerName: obl.ownerName,
            dueDate: obl.dueDate,
            status: obl.status,
            evidenceCount: oblEvidence.length,
            latestVerifiedEvidence: verifiedEvidence?.title,
            relatedControlId: obl.relatedControlId || req.relatedControlId,
            relatedRiskId: obl.relatedRiskId || req.relatedRiskId,
            gapType,
          });
        }
      }
    }

    return rows;
  }

  /**
   * Phase 33 Calendar Integration:
   * Synchronizes Compliance Obligation Due Dates to Institutional Calendar
   */
  static async syncObligationToCalendar(obligationId: string): Promise<{
    success: boolean;
    calendarEventId?: string;
    message: string;
  }> {
    try {
      const obligation = ComplianceStore.getObligations().find((o) => o.id === obligationId);
      if (!obligation) {
        return { success: false, message: "কমপ্লায়েন্স দায়িত্ব পাওয়া যায়নি।" };
      }

      const { getCalendarEvents, saveCalendarEvents } = await import("../calendar/calendarStore");
      const events = getCalendarEvents();
      const eventId = `CAL-CMP-${obligation.id}`;
      const existingIdx = events.findIndex(
        (e) => e.sourceEntityId === obligation.id || e.id === eventId
      );

      const now = new Date().toISOString();
      const calEvent = {
        id: eventId,
        title: `[কমপ্লায়েন্স সময়সীমা] ${obligation.title}`,
        titleBn: `[কমপ্লায়েন্স সময়সীমা] ${obligation.title}`,
        eventType: "INSTITUTIONAL" as const,
        startAt: `${obligation.dueDate}T09:00:00.000Z`,
        endAt: `${obligation.dueDate}T17:00:00.000Z`,
        timezone: "Asia/Dhaka",
        allDay: true,
        status: (obligation.status === "COMPLIANT" ? "COMPLETED" : "SCHEDULED") as any,
        visibility: "ADMIN_ONLY" as const,
        sourceModule: "COMPLIANCE" as any,
        sourceEntityId: obligation.id,
        location: "প্রশাসনিক শাখা, ইলিয়টগঞ্জ মাদরাসা",
        descriptionBn: `দায়িত্বশীল: ${obligation.ownerName} (${obligation.ownerRole}). সময়সীমার ভিত্তি: ${obligation.deadlineSource}. স্থিতি: ${obligation.status}`,
        createdBy: "compliance-engine",
        updatedBy: "compliance-engine",
        createdAt: now,
        updatedAt: now,
      };

      if (existingIdx >= 0) {
        events[existingIdx] = { ...events[existingIdx], ...calEvent, updatedAt: now };
      } else {
        events.unshift(calEvent as any);
      }

      saveCalendarEvents(events);

      return {
        success: true,
        calendarEventId: eventId,
        message: "প্রাতিষ্ঠানিক ক্যালেন্ডারে কমপ্লায়েন্স সময়সীমা সফলভাবে হালনাগাদ হয়েছে।",
      };
    } catch (err: any) {
      console.error("[ComplianceCrossModuleBridge] Calendar sync error:", err);
      return { success: false, message: `ক্যালেন্ডার সিঙ্ক ত্রুটি: ${err.message}` };
    }
  }

  /**
   * Generates all 12 Institutional Compliance Reports (Section 43)
   */
  static generateInstitutionalReport(
    reportType: ComplianceReportType,
    filters?: { category?: string; status?: string }
  ): InstitutionalReportPayload {
    const requirements = ComplianceStore.getRequirements();
    const obligations = ComplianceStore.getObligations();
    const evidenceList = ComplianceStore.getEvidence();
    const reviews = ComplianceStore.getReviews();
    const exceptions = ComplianceStore.getExceptions();
    const remediations = ComplianceStore.getRemediations();

    const nowStr = new Date().toISOString().slice(0, 10);
    const overdueObligations = obligations.filter(
      (o) =>
        o.dueDate < nowStr &&
        o.status !== "COMPLIANT" &&
        o.status !== "CLOSED" &&
        o.status !== "ARCHIVED"
    );

    const summary = {
      totalRequirements: requirements.length,
      activeRequirements: requirements.filter((r) => r.status === "ACTIVE").length,
      totalObligations: obligations.length,
      compliantObligations: obligations.filter((o) => o.status === "COMPLIANT").length,
      overdueObligations: overdueObligations.length,
      pendingEvidenceCount: evidenceList.filter((e) => e.verificationStatus === "PENDING").length,
      activeExceptionsCount: exceptions.filter((e) => e.status === "APPROVED").length,
      openRemediationsCount: remediations.filter((r) => r.status === "OPEN" || r.status === "IN_PROGRESS").length,
    };

    let reportTitleBn = "প্রাতিষ্ঠানিক কমপ্লায়েন্স প্রতিবেদন";
    let data: any[] = [];

    switch (reportType) {
      case "REQUIREMENT_REGISTER":
        reportTitleBn = "প্রাতিষ্ঠানিক কমপ্লায়েন্স প্রয়োজনীয়তা রেজিস্টার";
        data = requirements;
        break;

      case "OBLIGATION_REGISTER":
        reportTitleBn = "প্রাতিষ্ঠানিক কমপ্লায়েন্স দায় ও অঙ্গীকার রেজিস্টার";
        data = obligations;
        break;

      case "COMPLIANCE_STATUS_REPORT":
        reportTitleBn = "সার্বিক প্রাতিষ্ঠানিক কমপ্লায়েন্স স্থিতি প্রতিবেদন";
        data = this.buildComplianceMatrix();
        break;

      case "OVERDUE_OBLIGATIONS_REPORT":
        reportTitleBn = "সময়োত্তীর্ণ কমপ্লায়েন্স দায় ও জরুরী সতর্কতা প্রতিবেদন";
        data = overdueObligations;
        break;

      case "EVIDENCE_STATUS_REPORT":
        reportTitleBn = "কমপ্লায়েন্স প্রমাণপত্র ও যাচাইকরণ স্থিতি প্রতিবেদন";
        data = evidenceList;
        break;

      case "EXPIRY_REPORT":
        reportTitleBn = "আসন্ন মেয়াদোত্তীর্ণ সনদ ও প্রমাণপত্র প্রতিবেদন";
        data = evidenceList.filter((e) => e.expiryDate && e.expiryDate <= nowStr);
        break;

      case "EXCEPTION_REPORT":
        reportTitleBn = "অনুমোদিত কমপ্লায়েন্স ব্যতিক্রম ও বিকল্প নিয়ন্ত্রণ প্রতিবেদন";
        data = exceptions;
        break;

      case "REMEDIATION_REPORT":
        reportTitleBn = "কমপ্লায়েন্স ঘাটতি সংশোধন ও প্রতিকারমূলক কর্মপরিকল্পনা";
        data = remediations;
        break;

      case "POLICY_TO_REQUIREMENT_MAPPING":
        reportTitleBn = "নীতিমালা (Phase 38) ও কমপ্লায়েন্স প্রয়োজনীয়তা ম্যাপিং";
        data = requirements
          .filter((r) => r.relatedPolicyId || r.source === "INTERNAL_POLICY" || r.source === "INSTITUTIONAL_SOP")
          .map((r) => ({
            requirementId: r.id,
            title: r.title,
            relatedPolicyId: r.relatedPolicyId || "নথি সংযুক্ত",
            sourceReference: r.sourceReference,
            jurisdiction: r.jurisdiction,
          }));
        break;

      case "REQUIREMENT_TO_CONTROL_MAPPING":
        reportTitleBn = "কমপ্লায়েন্স প্রয়োজনীয়তা ও অভ্যন্তরীণ নিয়ন্ত্রণ (Phase 42) ম্যাপিং";
        data = requirements
          .filter((r) => r.relatedControlId || r.relatedRiskId)
          .map((r) => ({
            requirementId: r.id,
            title: r.title,
            relatedControlId: r.relatedControlId,
            relatedRiskId: r.relatedRiskId,
            category: r.category,
          }));
        break;

      case "CONTRACT_COMPLIANCE_REPORT":
        reportTitleBn = "সরবরাহকারী চুক্তি ও শর্তাবলী (Phase 40) কমপ্লায়েন্স প্রতিবেদন";
        data = requirements
          .filter((r) => r.source === "CONTRACT" || r.relatedContractId)
          .map((r) => ({
            requirementId: r.id,
            title: r.title,
            relatedContractId: r.relatedContractId,
            sourceReference: r.sourceReference,
          }));
        break;

      case "MANAGEMENT_ASSURANCE_REPORT":
      default:
        reportTitleBn = "পরিচালনা পর্ষদ ও অধ্যক্ষ মহোদয়ের কমপ্লায়েন্স নিশ্চয়তা প্রতিবেদন";
        data = [
          {
            section: "সার্বিক কমপ্লায়েন্স হার",
            percentage: obligations.length > 0 ? Math.round((summary.compliantObligations / obligations.length) * 100) : 100,
            summary,
          },
          {
            section: "সতর্কবার্তা ও ঝুঁকির সংযোগ",
            overdueCount: summary.overdueObligations,
            remediationsCount: summary.openRemediationsCount,
          },
        ];
        break;
    }

    return {
      reportType,
      reportTitleBn,
      generatedAt: new Date().toISOString(),
      institutionName: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা",
      summary,
      data,
    };
  }
}
