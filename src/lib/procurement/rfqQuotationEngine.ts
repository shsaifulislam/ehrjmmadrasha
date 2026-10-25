/**
 * EHRJ MADRASHA ERP — PHASE 40
 * RFQ, Quotation & Evaluation Engine
 * 
 * Governs Request For Quotations, Quotation Management & Versioning,
 * Factual Comparison Matrices, and Human-Supervised Evaluations.
 * 
 * Strict Principle:
 * "The system presents factual comparisons. It must NOT automatically decide which vendor wins."
 * "AI ASSISTS. AUTHORIZED HUMANS DECIDE."
 */

import { ProcurementStore } from "./procurementStore";
import {
  RFQ,
  RFQStatus,
  RFQItem,
  EvaluationCriterion,
  Quotation,
  QuotationItem,
  QuotationComparisonMatrix,
  QuotationComparisonEntry,
  ProcurementEvaluation,
  VendorEvaluationScore,
  VendorCategoryCode,
  ActorContext,
} from "./types";

export class RfqQuotationEngine {
  /**
   * Generates next institutional RFQ ID: EHRJ-RFQ-YYYY-XXXX
   */
  static generateNextRfqId(year = new Date().getFullYear()): string {
    const rfqs = ProcurementStore.getRFQs();
    const prefix = `EHRJ-RFQ-${year}-`;
    const yearRfqs = rfqs.filter((r) => r.id.startsWith(prefix));
    let maxSeq = 0;

    for (const r of yearRfqs) {
      const parts = r.id.split("-");
      const seq = parseInt(parts[3], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }

    const nextSeq = String(maxSeq + 1).padStart(4, "0");
    return `${prefix}${nextSeq}`;
  }

  /**
   * Generates next institutional Quotation ID: EHRJ-QUO-YYYY-XXXX
   */
  static generateNextQuotationId(year = new Date().getFullYear()): string {
    const quotations = ProcurementStore.getQuotations();
    const prefix = `EHRJ-QUO-${year}-`;
    const yearQuotes = quotations.filter((q) => q.id.startsWith(prefix));
    let maxSeq = 0;

    for (const q of yearQuotes) {
      const parts = q.id.split("-");
      const seq = parseInt(parts[3], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }

    const nextSeq = String(maxSeq + 1).padStart(4, "0");
    return `${prefix}${nextSeq}`;
  }

  /**
   * Generates next institutional Evaluation ID: EHRJ-EVAL-YYYY-XXXX
   */
  static generateNextEvaluationId(year = new Date().getFullYear()): string {
    const evals = ProcurementStore.getEvaluations();
    const prefix = `EHRJ-EVAL-${year}-`;
    const yearEvals = evals.filter((e) => e.id.startsWith(prefix));
    let maxSeq = 0;

    for (const e of yearEvals) {
      const parts = e.id.split("-");
      const seq = parseInt(parts[3], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }

    const nextSeq = String(maxSeq + 1).padStart(4, "0");
    return `${prefix}${nextSeq}`;
  }

  // =================================================================
  // 1. RFQ LIFECYCLE
  // =================================================================

  static createRFQ(
    data: {
      titleBn: string;
      titleEn?: string;
      descriptionBn: string;
      categoryCode: VendorCategoryCode;
      purchaseRequestId?: string;
      budgetId?: string;
      fundCode?: string;
      submissionDeadline: string;
      items: Omit<RFQItem, "id">[];
      evaluationCriteria?: EvaluationCriterion[];
      invitedVendorIds?: string[];
    },
    actor: ActorContext
  ): RFQ {
    const rfqId = this.generateNextRfqId();
    const rfqCode = rfqId.replace("EHRJ-", "");
    const now = new Date().toISOString();

    const items: RFQItem[] = data.items.map((it, idx) => ({
      ...it,
      id: `rfq-item-${Date.now()}-${idx + 1}`,
    }));

    const defaultCriteria: EvaluationCriterion[] = data.evaluationCriteria || [
      { id: "crt-1", nameBn: "মূল্য ও সাশ্রয়ী হার (Price & Commercial)", weightPercent: 40, description: "মোট উদ্ধৃত মূল্য এবং বিশেষ ছাড়" },
      { id: "crt-2", nameBn: "গুণগত মান ও স্পেসিফিকেশন (Quality & Spec)", weightPercent: 30, description: "প্রদত্ত নমুনার মান ও স্থায়ীত্ব" },
      { id: "crt-3", nameBn: "সরবরাহের সময়সীমা (Delivery Timeline)", weightPercent: 20, description: "নির্ধারিত সময়ের মধ্যে সরবরাহের নিশ্চয়তা" },
      { id: "crt-4", nameBn: "ওয়ারেন্টি ও সেবা (Warranty & Terms)", weightPercent: 10, description: "ত্রুটিপূর্ণ সামগ্রী প্রতিস্থাপনের নিশ্চয়তা" },
    ];

    const rfq: RFQ = {
      id: rfqId,
      rfqCode,
      titleBn: data.titleBn.trim(),
      titleEn: data.titleEn?.trim() || data.titleBn.trim(),
      descriptionBn: data.descriptionBn.trim(),
      purchaseRequestId: data.purchaseRequestId,
      budgetId: data.budgetId,
      fundCode: data.fundCode || "GENERAL",
      categoryCode: data.categoryCode,
      status: "DRAFT",
      submissionDeadline: data.submissionDeadline,
      items,
      evaluationCriteria: defaultCriteria,
      invitedVendorIds: data.invitedVendorIds || [],
      createdBy: actor.actorId,
      createdAt: now,
      updatedAt: now,
    };

    ProcurementStore.saveRFQ(rfq, actor);
    return rfq;
  }

  static transitionRfqStatus(
    rfqId: string,
    targetStatus: RFQStatus,
    notes: string,
    actor: ActorContext
  ): RFQ {
    const rfq = ProcurementStore.getRFQById(rfqId);
    if (!rfq) throw new Error(`RFQ not found: ${rfqId}`);

    const previousStatus = rfq.status;
    rfq.status = targetStatus;
    rfq.updatedAt = new Date().toISOString();

    if (targetStatus === "OPEN" && !rfq.approvedBy) {
      rfq.approvedBy = actor.actorId;
      rfq.approvedAt = new Date().toISOString();
    }

    ProcurementStore.saveRFQ(rfq, actor);

    ProcurementStore.recordAudit({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      entityType: "RFQ",
      entityId: rfq.id,
      action: "RFQ_STATUS_CHANGE",
      actorId: actor.actorId,
      actorName: actor.actorName,
      actorRole: actor.actorRole,
      notes: `RFQ বিজ্ঞপ্তি স্ট্যাটাস পরিবর্তন: ${previousStatus} -> ${targetStatus}. নোট: ${notes}`,
      details: { previousStatus, targetStatus, notes },
    });

    return rfq;
  }

  // =================================================================
  // 2. QUOTATION SUBMISSION & IMMUTABLE VERSIONING
  // =================================================================

  static submitQuotation(
    data: {
      rfqId: string;
      vendorId: string;
      validUntilDate: string;
      items: QuotationItem[];
      deliveryTimeDays: number;
      warrantyPeriodMonths: number;
      paymentTermsBn: string;
      supportingDocToken?: string;
      previousQuotationId?: string;
      revisionReason?: string;
    },
    actor: ActorContext
  ): Quotation {
    const rfq = ProcurementStore.getRFQById(data.rfqId);
    if (!rfq) throw new Error(`RFQ not found: ${data.rfqId}`);

    const vendor = ProcurementStore.getVendorById(data.vendorId);
    if (!vendor) throw new Error(`Vendor not found: ${data.vendorId}`);

    if (vendor.status !== "ACTIVE") {
      throw new Error(`সক্রিয় (ACTIVE) ছাড়া অন্য কোনো ভেন্ডর কোটেশন দাখিল করতে পারবে না। বর্তমান স্ট্যাটাস: ${vendor.status}`);
    }

    // Check existing quotations from this vendor for this RFQ
    const existingQuotes = ProcurementStore.getQuotationsByRFQ(data.rfqId).filter(
      (q) => q.vendorId === data.vendorId
    );

    let versionNumber = 1;
    let previousVersionId: string | undefined = data.previousQuotationId;
    if (existingQuotes.length > 0) {
      const maxVer = Math.max(...existingQuotes.map((q) => q.versionNumber));
      versionNumber = maxVer + 1;
      const latestPrev = existingQuotes.find((q) => q.versionNumber === maxVer);
      if (latestPrev) {
        previousVersionId = latestPrev.id;
      }

      // Mark older versions as SUPERSEDED (Historical immutability preserved)
      for (const oldQ of existingQuotes) {
        if (oldQ.status !== "SUPERSEDED") {
          oldQ.status = "SUPERSEDED";
          oldQ.updatedAt = new Date().toISOString();
          ProcurementStore.saveQuotation(oldQ);
        }
      }
    }

    // Calculate totals
    const subTotal = data.items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    const totalTax = data.items.reduce((sum, it) => sum + (it.taxAmount || 0), 0);
    const totalDiscount = data.items.reduce((sum, it) => sum + (it.discountAmount || 0), 0);
    const deliveryCharge = 0;
    const netTotal = subTotal + totalTax - totalDiscount + deliveryCharge;

    const quoteId = this.generateNextQuotationId();
    const quotationCode = quoteId.replace("EHRJ-", "");
    const now = new Date().toISOString();

    const quotation: Quotation = {
      id: quoteId,
      quotationCode,
      rfqId: rfq.id,
      rfqTitleBn: rfq.titleBn,
      vendorId: vendor.id,
      vendorNameBn: vendor.legalNameBn,
      versionNumber,
      previousVersionId,
      status: "SUBMITTED",
      quotationDate: now.split("T")[0],
      validUntilDate: data.validUntilDate,
      items: data.items,
      subTotal,
      totalTax,
      totalDiscount,
      deliveryCharge,
      netTotalAmount: netTotal,
      deliveryTimeDays: data.deliveryTimeDays,
      warrantyPeriodMonths: data.warrantyPeriodMonths,
      paymentTermsBn: data.paymentTermsBn,
      supportingDocToken: data.supportingDocToken,
      revisionReason: data.revisionReason,
      submittedBy: actor.actorName,
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    ProcurementStore.saveQuotation(quotation, actor);
    return quotation;
  }

  // =================================================================
  // 3. FACTUAL QUOTATION COMPARISON MATRIX (UNBIASED)
  // =================================================================

  static generateComparisonMatrix(rfqId: string): QuotationComparisonMatrix {
    const rfq = ProcurementStore.getRFQById(rfqId);
    if (!rfq) throw new Error(`RFQ not found: ${rfqId}`);

    // Get active (SUBMITTED / UNDER_EVALUATION / ACCEPTED) latest quotations per vendor
    const allQuotes = ProcurementStore.getQuotationsByRFQ(rfqId);
    const latestByVendor = new Map<string, Quotation>();

    for (const q of allQuotes) {
      if (q.status === "SUPERSEDED" || q.status === "WITHDRAWN") continue;
      const existing = latestByVendor.get(q.vendorId);
      if (!existing || q.versionNumber > existing.versionNumber) {
        latestByVendor.set(q.vendorId, q);
      }
    }

    const entries: QuotationComparisonEntry[] = [];
    let lowestPrice = Infinity;
    let fastestDelivery = Infinity;
    let longestWarranty = 0;

    for (const quote of Array.from(latestByVendor.values())) {
      const vendor = ProcurementStore.getVendorById(quote.vendorId);
      if (quote.netTotalAmount < lowestPrice) lowestPrice = quote.netTotalAmount;
      if (quote.deliveryTimeDays < fastestDelivery) fastestDelivery = quote.deliveryTimeDays;
      if (quote.warrantyPeriodMonths > longestWarranty) longestWarranty = quote.warrantyPeriodMonths;

      entries.push({
        vendorId: quote.vendorId,
        vendorName: quote.vendorNameBn,
        quotationId: quote.id,
        version: quote.versionNumber,
        netTotalAmount: quote.netTotalAmount,
        deliveryDays: quote.deliveryTimeDays,
        warrantyMonths: quote.warrantyPeriodMonths,
        paymentTerms: quote.paymentTermsBn,
        verificationStatus: vendor?.verificationStatus || "PENDING",
        pastOnTimeRate: vendor?.ratingSummary.onTimeDeliveryRate || 100,
        itemLevelPrices: quote.items.map((it: QuotationItem) => ({
          itemName: it.itemDescriptionBn,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: it.lineTotal,
        })),
      });
    }

    return {
      rfqId: rfq.id,
      rfqTitleBn: rfq.titleBn,
      comparisonDate: new Date().toISOString(),
      lowestPrice: lowestPrice === Infinity ? 0 : lowestPrice,
      fastestDeliveryDays: fastestDelivery === Infinity ? 0 : fastestDelivery,
      longestWarrantyMonths: longestWarranty,
      entries,
    };
  }

  // =================================================================
  // 4. PROCUREMENT EVALUATION & HUMAN RECOMMENDATION
  // =================================================================

  static recordEvaluation(
    data: {
      rfqId: string;
      vendorScores: VendorEvaluationScore[];
      recommendedVendorId: string;
      recommendedQuotationId: string;
      recommendationJustificationBn: string;
    },
    evaluator: ActorContext
  ): ProcurementEvaluation {
    const rfq = ProcurementStore.getRFQById(data.rfqId);
    if (!rfq) throw new Error(`RFQ not found: ${data.rfqId}`);

    const recVendor = ProcurementStore.getVendorById(data.recommendedVendorId);
    if (!recVendor) throw new Error(`Recommended vendor not found: ${data.recommendedVendorId}`);

    const evalId = this.generateNextEvaluationId();
    const now = new Date().toISOString();

    const evaluation: ProcurementEvaluation = {
      id: evalId,
      rfqId: rfq.id,
      rfqTitleBn: rfq.titleBn,
      evaluatorId: evaluator.actorId,
      evaluatorName: evaluator.actorName,
      evaluatorRole: evaluator.actorRole,
      evaluationDate: now.split("T")[0],
      vendorScores: data.vendorScores,
      recommendedVendorId: recVendor.id,
      recommendedVendorName: recVendor.legalNameBn,
      recommendedQuotationId: data.recommendedQuotationId,
      recommendationJustificationBn: data.recommendationJustificationBn.trim(),
      decisionStatus: "PENDING_APPROVAL",
      createdAt: now,
      updatedAt: now,
    };

    ProcurementStore.saveEvaluation(evaluation, evaluator);

    // Update RFQ status to EVALUATION
    if (rfq.status === "OPEN") {
      rfq.status = "EVALUATION";
      rfq.updatedAt = now;
      ProcurementStore.saveRFQ(rfq);
    }

    return evaluation;
  }

  /**
   * Approves evaluation and awards the RFQ to the chosen vendor (Authorized Human Decision)
   */
  static approveAward(
    evaluationId: string,
    decisionNotes: string,
    approver: ActorContext
  ): { evaluation: ProcurementEvaluation; rfq: RFQ; quotation: Quotation } {
    const evaluations = ProcurementStore.getEvaluations();
    const evaluation = evaluations.find((e) => e.id === evaluationId);
    if (!evaluation) throw new Error(`Evaluation not found: ${evaluationId}`);

    if (approver.actorRole !== "ADMIN" && approver.actorRole !== "PRINCIPAL") {
      throw new Error("শুধুমাত্র অধ্যক্ষ অথবা অ্যাডমিন প্রকিউরমেন্ট মূল্যায়ন ও কার্যাদেশ অনুমোদন করতে পারবেন।");
    }

    const rfq = ProcurementStore.getRFQById(evaluation.rfqId);
    if (!rfq) throw new Error(`RFQ not found: ${evaluation.rfqId}`);

    const quotation = ProcurementStore.getQuotationById(evaluation.recommendedQuotationId);
    if (!quotation) throw new Error(`Quotation not found: ${evaluation.recommendedQuotationId}`);

    const now = new Date().toISOString();

    // 1. Update Evaluation
    evaluation.decisionStatus = "APPROVED";
    evaluation.approvedBy = approver.actorName;
    evaluation.approvedAt = now;
    evaluation.decisionNotes = decisionNotes;
    evaluation.updatedAt = now;
    ProcurementStore.saveEvaluation(evaluation, approver);

    // 2. Award RFQ
    rfq.status = "AWARDED";
    rfq.awardedQuotationId = quotation.id;
    rfq.awardedVendorId = quotation.vendorId;
    rfq.awardNotes = decisionNotes;
    rfq.updatedAt = now;
    ProcurementStore.saveRFQ(rfq, approver);

    // 3. Accept Quotation and reject other active ones
    quotation.status = "ACCEPTED";
    quotation.updatedAt = now;
    ProcurementStore.saveQuotation(quotation);

    const otherQuotes = ProcurementStore.getQuotationsByRFQ(rfq.id);
    for (const q of otherQuotes) {
      if (q.id !== quotation.id && (q.status === "SUBMITTED" || q.status === "UNDER_EVALUATION")) {
        q.status = "REJECTED";
        q.updatedAt = now;
        ProcurementStore.saveQuotation(q);
      }
    }

    ProcurementStore.recordAudit({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      entityType: "EVALUATION",
      entityId: evaluation.id,
      action: "AWARD_PROCUREMENT",
      actorId: approver.actorId,
      actorName: approver.actorName,
      actorRole: approver.actorRole,
      notes: `প্রকিউরমেন্ট মূল্যায়ন ও কার্যাদেশ চূড়ান্ত অনুমোদন: ভেন্ডর ${evaluation.recommendedVendorName} (কোটেশন ৳${quotation.netTotalAmount.toLocaleString("bn-BD")})`,
      details: { evaluationId, rfqId: rfq.id, awardedVendorId: quotation.vendorId, netTotalAmount: quotation.netTotalAmount },
    });

    return { evaluation, rfq, quotation };
  }

  static awardProcurementDecision(
    evaluationId: string,
    decisionNotes: string,
    approver: ActorContext
  ) {
    return this.approveAward(evaluationId, decisionNotes, approver);
  }
}
