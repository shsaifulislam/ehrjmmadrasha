/**
 * EHRJ MADRASHA ERP — PHASE 40
 * Vendor Performance, Supplier Risk & Conflict Declaration Engine
 * 
 * Factual metrics, risk mitigation logs, and institutional conflict-of-interest declarations.
 */

import { ProcurementStore } from "./procurementStore";
import {
  VendorPerformanceReview,
  VendorRiskRecord,
  ConflictDeclaration,
  VendorRiskLevel,
  ActorContext,
} from "./types";

export class VendorPerformanceEngine {
  /**
   * Records a factual performance review and updates the vendor's rating summary
   */
  static recordPerformanceReview(
    data: {
      vendorId: string;
      reviewPeriod: string;
      totalOrders: number;
      onTimeDeliveries: number;
      delayedDeliveries: number;
      qualityPassedOrders: number;
      qualityIssueOrders: number;
      disputeCount: number;
      averageResponseDays: number;
      factualSummaryBn: string;
      recommendedAction: "CONTINUE" | "REVIEW_REQUIRED" | "SUSPEND_REVIEW";
    },
    reviewer: ActorContext
  ): VendorPerformanceReview {
    const vendor = ProcurementStore.getVendorById(data.vendorId);
    if (!vendor) throw new Error(`Vendor not found: ${data.vendorId}`);

    const onTimeRate =
      data.totalOrders > 0
        ? Math.round((data.onTimeDeliveries / data.totalOrders) * 100)
        : 100;
    const qualityRate =
      data.totalOrders > 0
        ? Math.round((data.qualityPassedOrders / data.totalOrders) * 100)
        : 100;

    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const review: VendorPerformanceReview = {
      id: reviewId,
      vendorId: vendor.id,
      vendorName: vendor.legalNameBn,
      reviewPeriod: data.reviewPeriod,
      totalOrders: data.totalOrders,
      onTimeDeliveries: data.onTimeDeliveries,
      delayedDeliveries: data.delayedDeliveries,
      onTimeRatePercent: onTimeRate,
      qualityPassedOrders: data.qualityPassedOrders,
      qualityIssueOrders: data.qualityIssueOrders,
      qualityComplianceRatePercent: qualityRate,
      disputeCount: data.disputeCount,
      averageResponseDays: data.averageResponseDays,
      factualSummaryBn: data.factualSummaryBn.trim(),
      recommendedAction: data.recommendedAction,
      reviewerName: reviewer.actorName,
      reviewedAt: now,
      createdAt: now,
    };

    ProcurementStore.saveReview(review, reviewer);

    // Update Vendor's master rating summary
    vendor.ratingSummary = {
      totalOrdersFulfilled: vendor.ratingSummary.totalOrdersFulfilled + data.totalOrders,
      onTimeDeliveryRate: onTimeRate,
      qualityComplianceRate: qualityRate,
      disputeCount: vendor.ratingSummary.disputeCount + data.disputeCount,
      averageResponseDays: data.averageResponseDays,
    };

    // Auto flag risk if quality or delivery is low
    if (onTimeRate < 75 || qualityRate < 80 || data.disputeCount > 2) {
      vendor.riskLevel = "HIGH";
    } else if (onTimeRate < 85 || qualityRate < 90) {
      vendor.riskLevel = "MEDIUM";
    } else {
      vendor.riskLevel = "LOW";
    }

    ProcurementStore.saveVendor(vendor);
    return review;
  }

  /**
   * Registers a supplier risk record
   */
  static recordSupplierRisk(
    data: {
      vendorId: string;
      riskCategory: "SINGLE_SOURCE" | "FINANCIAL_DEPENDENCY" | "COMPLIANCE_EXPIRY" | "DELIVERY_INSTABILITY" | "QUALITY_ISSUE";
      severity: VendorRiskLevel;
      descriptionBn: string;
      mitigationPlanBn: string;
    },
    actor: ActorContext
  ): VendorRiskRecord {
    const vendor = ProcurementStore.getVendorById(data.vendorId);
    if (!vendor) throw new Error(`Vendor not found: ${data.vendorId}`);

    const riskId = `rsk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const risk: VendorRiskRecord = {
      id: riskId,
      vendorId: vendor.id,
      vendorName: vendor.legalNameBn,
      riskCategory: data.riskCategory,
      severity: data.severity,
      descriptionBn: data.descriptionBn.trim(),
      mitigationPlanBn: data.mitigationPlanBn.trim(),
      isMitigated: false,
      reviewedAt: now,
    };

    ProcurementStore.saveRisk(risk);

    // Adjust vendor risk level if severity is higher
    if (data.severity === "CRITICAL" || data.severity === "HIGH") {
      vendor.riskLevel = data.severity;
      ProcurementStore.saveVendor(vendor);
    }

    ProcurementStore.recordAudit({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      entityType: "PERFORMANCE",
      entityId: risk.id,
      action: "RECORD_RISK",
      actorId: actor.actorId,
      actorName: actor.actorName,
      actorRole: actor.actorRole,
      notes: `সাপ্লায়ার ঝুঁকি নথিভুক্ত: ${vendor.legalNameBn} (${data.riskCategory}, মাত্রা: ${data.severity})`,
      details: { riskCategory: data.riskCategory, severity: data.severity },
    });

    return risk;
  }

  /**
   * Records a Conflict-of-Interest Declaration for procurement committee members
   */
  static declareConflict(
    data: {
      procurementId: string;
      hasConflict: boolean;
      natureOfConflictBn?: string;
    },
    declarant: ActorContext
  ): ConflictDeclaration {
    const conflictId = `cnf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const conflict: ConflictDeclaration = {
      id: conflictId,
      procurementId: data.procurementId,
      declarantId: declarant.actorId,
      declarantName: declarant.actorName,
      declarantRole: declarant.actorRole,
      hasConflict: data.hasConflict,
      natureOfConflictBn: data.natureOfConflictBn?.trim(),
      declarationDate: now.split("T")[0],
      status: data.hasConflict ? "RECUSED" : "CLEARED", // If conflict declared, recused by default
      createdAt: now,
    };

    ProcurementStore.saveConflict(conflict, declarant);
    return conflict;
  }
}
