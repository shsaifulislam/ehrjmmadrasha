/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 43
 * Institutional Compliance Review & Remediation Engine
 * Checkpoint: EHRJ-AI-2026-PHASE43
 */

import { ComplianceStore } from "./complianceStore";
import {
  ComplianceReview,
  ComplianceRemediation,
  ReviewDecision,
  ActorContext,
} from "./types";

export class ComplianceReviewEngine {
  /**
   * Generates formatted Review ID: EHRJ-REV-CMP-YYYY-XXXX
   */
  static generateReviewId(year: number = new Date().getFullYear()): string {
    const reviews = ComplianceStore.getReviews();
    const prefix = `EHRJ-REV-CMP-${year}-`;
    const matching = reviews
      .map((r) => r.id)
      .filter((id) => id.startsWith(prefix));

    let maxNum = 0;
    for (const id of matching) {
      const parts = id.split("-");
      const numStr = parts[parts.length - 1];
      const parsed = parseInt(numStr, 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
    const nextNum = (maxNum + 1).toString().padStart(4, "0");
    return `${prefix}${nextNum}`;
  }

  /**
   * Generates formatted Remediation ID: EHRJ-REM-CMP-YYYY-XXXX
   */
  static generateRemediationId(year: number = new Date().getFullYear()): string {
    const remediations = ComplianceStore.getRemediations();
    const prefix = `EHRJ-REM-CMP-${year}-`;
    const matching = remediations
      .map((r) => r.id)
      .filter((id) => id.startsWith(prefix));

    let maxNum = 0;
    for (const id of matching) {
      const parts = id.split("-");
      const numStr = parts[parts.length - 1];
      const parsed = parseInt(numStr, 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
    const nextNum = (maxNum + 1).toString().padStart(4, "0");
    return `${prefix}${nextNum}`;
  }

  /**
   * Records a formal compliance review by authorized reviewer (Section 16, 17)
   */
  static recordComplianceReview(
    params: {
      obligationId: string;
      requirementId: string;
      evidenceReviewed: string[];
      checklistAnswers: Record<string, boolean>;
      decision: ReviewDecision;
      findingsNotes: string;
      nextReviewDate: string;
      remediationRequired?: boolean;
      linkedFindingId?: string; // Phase 42 Finding ID
    },
    actor: ActorContext
  ): ComplianceReview {
    if (actor.userRole !== "PRINCIPAL" && actor.userRole !== "ADMIN") {
      throw new Error("শুধুমাত্র অধ্যক্ষ অথবা দায়িত্বপ্রাপ্ত প্রশাসনিক কর্মকর্তা কমপ্লায়েন্স পর্যালোচনা চূড়ান্ত করতে পারেন।");
    }
    if (!params.findingsNotes?.trim()) {
      throw new Error("পর্যালোচনার ফলাফল ও পর্যবেক্ষণ নোট (Findings Notes) প্রদান আবশ্যক।");
    }

    const id = this.generateReviewId();
    const now = new Date().toISOString();

    const isNonCompliant =
      params.decision === "NON_COMPLIANT" ||
      params.decision === "PARTIALLY_COMPLIANT" ||
      params.decision === "INSUFFICIENT_EVIDENCE";

    const remediationRequired =
      params.remediationRequired !== undefined
        ? params.remediationRequired
        : isNonCompliant;

    const newReview: ComplianceReview = {
      id,
      obligationId: params.obligationId.trim(),
      requirementId: params.requirementId.trim(),
      reviewerId: actor.userId,
      reviewerName: actor.userName,
      reviewerRole: actor.userRole,
      reviewDate: now.slice(0, 10),
      evidenceReviewed: params.evidenceReviewed || [],
      checklistAnswers: params.checklistAnswers || {},
      decision: params.decision,
      findingsNotes: params.findingsNotes.trim(),
      remediationRequired,
      linkedFindingId: params.linkedFindingId?.trim(),
      nextReviewDate: params.nextReviewDate || now.slice(0, 10),
      createdAt: now,
    };

    const reviews = ComplianceStore.getReviews();
    reviews.unshift(newReview);
    ComplianceStore.saveReviews(reviews);

    // Update obligation state reflecting review decision
    const obligations = ComplianceStore.getObligations();
    const oblIndex = obligations.findIndex((o) => o.id === params.obligationId);
    if (oblIndex !== -1) {
      obligations[oblIndex].latestReviewId = id;
      if (params.decision === "COMPLIANT") {
        obligations[oblIndex].status = "COMPLIANT";
        obligations[oblIndex].completionDate = now.slice(0, 10);
      } else if (params.decision === "PARTIALLY_COMPLIANT") {
        obligations[oblIndex].status = "PARTIALLY_COMPLIANT";
      } else if (params.decision === "NON_COMPLIANT") {
        obligations[oblIndex].status = "NON_COMPLIANT";
      }
      obligations[oblIndex].updatedAt = now;
      ComplianceStore.saveObligations(obligations);
    }

    ComplianceStore.logAudit(
      "REVIEW",
      id,
      "COMPLIANCE_REVIEW_CONDUCTED",
      actor,
      { review: newReview, decision: params.decision }
    );

    return newReview;
  }

  /**
   * Creates a remediation action when non-compliant or partially compliant (Section 19)
   */
  static createRemediation(
    params: {
      obligationId: string;
      problem: string;
      rootCause: string;
      correctiveAction: string;
      ownerId: string;
      ownerName: string;
      dueDate: string;
      phase42FindingId?: string;
      phase42ActionId?: string;
      evidenceRef?: string;
    },
    actor: ActorContext
  ): ComplianceRemediation {
    if (!params.problem?.trim()) {
      throw new Error("সমস্যার বিবরণ (Problem) প্রদান আবশ্যক।");
    }
    if (!params.correctiveAction?.trim()) {
      throw new Error("সংশোধনমূলক ব্যবস্থা (Corrective Action) উল্লেখ করা আবশ্যক।");
    }
    if (!params.ownerId?.trim() || !params.ownerName?.trim()) {
      throw new Error("দায়িত্বশীল কর্মকর্তা (Owner) নির্বাচন আবশ্যক।");
    }
    if (!params.dueDate?.trim()) {
      throw new Error("চূড়ান্ত তারিখ (Due Date) নির্ধারণ বাধ্যতামূলক।");
    }

    const id = this.generateRemediationId();
    const now = new Date().toISOString();

    const newRemediation: ComplianceRemediation = {
      id,
      obligationId: params.obligationId.trim(),
      problem: params.problem.trim(),
      rootCause: params.rootCause?.trim() || "প্রক্রিয়াগত বিলম্ব",
      correctiveAction: params.correctiveAction.trim(),
      ownerId: params.ownerId.trim(),
      ownerName: params.ownerName.trim(),
      dueDate: params.dueDate.trim(),
      phase42FindingId: params.phase42FindingId?.trim(),
      phase42ActionId: params.phase42ActionId?.trim(),
      evidenceRef: params.evidenceRef?.trim(),
      isVerified: false,
      status: "OPEN",
      createdAt: now,
    };

    const remediations = ComplianceStore.getRemediations();
    remediations.unshift(newRemediation);
    ComplianceStore.saveRemediations(remediations);

    ComplianceStore.logAudit(
      "REMEDIATION",
      id,
      "REMEDIATION_CREATED",
      actor,
      { newRemediation }
    );

    return newRemediation;
  }

  /**
   * Verifies and closes remediation with human review (Anti-Silent Closure)
   */
  static verifyAndCloseRemediation(
    id: string,
    isVerified: boolean,
    verificationNotes: string,
    actor: ActorContext
  ): ComplianceRemediation {
    if (actor.userRole !== "PRINCIPAL" && actor.userRole !== "ADMIN") {
      throw new Error("শুধুমাত্র অধ্যক্ষ অথবা দায়িত্বপ্রাপ্ত প্রশাসনিক কর্মকর্তা প্রতিকার যাচাই ও সমাপ্ত করতে পারেন।");
    }
    if (!verificationNotes?.trim()) {
      throw new Error("যাচাইকরণ নোট (Verification Notes) প্রদান আবশ্যক।");
    }

    const remediations = ComplianceStore.getRemediations();
    const index = remediations.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`প্রতিকার রেকর্ড পাওয়া যায়নি: ${id}`);
    }

    const existing = remediations[index];
    const now = new Date().toISOString();

    const updated: ComplianceRemediation = {
      ...existing,
      isVerified,
      verifiedBy: `${actor.userName} (${actor.userId})`,
      verificationNotes: verificationNotes.trim(),
      status: isVerified ? "CLOSED" : "IN_PROGRESS",
      completionDate: isVerified ? now.slice(0, 10) : undefined,
    };

    remediations[index] = updated;
    ComplianceStore.saveRemediations(remediations);

    ComplianceStore.logAudit(
      "REMEDIATION",
      id,
      isVerified ? "REMEDIATION_VERIFIED_AND_CLOSED" : "REMEDIATION_REOPENED",
      actor,
      { isVerified, verificationNotes }
    );

    return updated;
  }
}
