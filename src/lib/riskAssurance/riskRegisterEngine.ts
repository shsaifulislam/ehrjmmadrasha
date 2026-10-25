/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 42
 * Institutional Risk Register Engine
 * Checkpoint: EHRJ-AI-2026-PHASE42
 */

import { RiskAssuranceStore } from "./riskAssuranceStore";
import {
  InstitutionalRisk,
  RiskCategory,
  RiskSourceModule,
  RiskLikelihood,
  RiskImpact,
  RiskLevel,
  RiskStatus,
  RiskTreatmentType,
  ActorContext,
} from "./types";

export class RiskRegisterEngine {
  /**
   * Generates next institutional Risk ID: EHRJ-RISK-YYYY-XXXX
   */
  static generateNextRiskId(year = new Date().getFullYear()): string {
    const risks = RiskAssuranceStore.getRisks();
    const prefix = `EHRJ-RISK-${year}-`;
    const yearRisks = risks.filter((r) => r.id.startsWith(prefix));
    let maxSeq = 0;

    for (const r of yearRisks) {
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
   * Evaluates Risk Score and Level based on 5x5 Matrix
   * Likelihood (1-5) x Impact (1-5) -> Score (1-25)
   */
  static evaluateRiskLevel(likelihood: RiskLikelihood, impact: RiskImpact): {
    score: number;
    level: RiskLevel;
  } {
    const score = likelihood * impact;
    let level: RiskLevel = "LOW";

    if (score >= 15) {
      level = "CRITICAL";
    } else if (score >= 10) {
      level = "HIGH";
    } else if (score >= 5) {
      level = "MEDIUM";
    } else {
      level = "LOW";
    }

    return { score, level };
  }

  /**
   * Creates a new Institutional Risk Record
   */
  static createRisk(
    data: {
      titleBn: string;
      titleEn?: string;
      descriptionBn: string;
      riskCategory: RiskCategory;
      sourceModule: RiskSourceModule;
      relatedEntityId?: string;
      ownerName: string;
      ownerRole: string;
      reviewerName?: string;
      reviewerRole?: string;
      inherentLikelihood: RiskLikelihood;
      inherentImpact: RiskImpact;
      existingControlIds?: string[];
      residualLikelihood?: RiskLikelihood;
      residualImpact?: RiskImpact;
      treatmentType?: RiskTreatmentType;
      treatmentPlanBn?: string;
      treatmentOwner?: string;
      treatmentTargetDate?: string;
      nextReviewDate?: string;
      evidenceDocRefs?: string[];
      notes?: string;
    },
    actor: ActorContext
  ): InstitutionalRisk {
    const id = this.generateNextRiskId();
    const riskCode = id.replace("EHRJ-", "");
    const now = new Date().toISOString();

    const inherentEval = this.evaluateRiskLevel(data.inherentLikelihood, data.inherentImpact);
    const resLikelihood = data.residualLikelihood || data.inherentLikelihood;
    const resImpact = data.residualImpact || data.inherentImpact;
    const residualEval = this.evaluateRiskLevel(resLikelihood, resImpact);

    const defaultNextReview = new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0];

    const risk: InstitutionalRisk = {
      id,
      riskCode,
      titleBn: data.titleBn.trim(),
      titleEn: data.titleEn?.trim() || data.titleBn.trim(),
      descriptionBn: data.descriptionBn.trim(),
      riskCategory: data.riskCategory,
      sourceModule: data.sourceModule,
      relatedEntityId: data.relatedEntityId,
      ownerName: data.ownerName,
      ownerRole: data.ownerRole,
      reviewerName: data.reviewerName || "মুহতামিম সাহেব (অধ্যক্ষ)",
      reviewerRole: data.reviewerRole || "PRINCIPAL",

      inherentLikelihood: data.inherentLikelihood,
      inherentImpact: data.inherentImpact,
      inherentScore: inherentEval.score,
      inherentLevel: inherentEval.level,

      existingControlIds: data.existingControlIds || [],
      residualLikelihood: resLikelihood,
      residualImpact: resImpact,
      residualScore: residualEval.score,
      residualLevel: residualEval.level,

      treatmentType: data.treatmentType || "MITIGATE",
      treatmentPlanBn: data.treatmentPlanBn || "নিয়ন্ত্রণ কার্যক্রম পর্যালোচনা ও পর্যবেক্ষণ",
      treatmentOwner: data.treatmentOwner || data.ownerName,
      treatmentTargetDate: data.treatmentTargetDate || defaultNextReview,

      status: "OPEN",
      nextReviewDate: data.nextReviewDate || defaultNextReview,
      evidenceDocRefs: data.evidenceDocRefs || [],
      notes: data.notes,

      createdBy: actor.actorId,
      createdAt: now,
      updatedBy: actor.actorId,
      updatedAt: now,
    };

    RiskAssuranceStore.saveRisk(risk, actor);
    return risk;
  }

  /**
   * Updates Risk Assessment (Likelihood, Impact, Control Mapping)
   */
  static assessRisk(
    riskId: string,
    assessment: {
      inherentLikelihood?: RiskLikelihood;
      inherentImpact?: RiskImpact;
      existingControlIds?: string[];
      residualLikelihood?: RiskLikelihood;
      residualImpact?: RiskImpact;
      assessmentNotesBn?: string;
    },
    actor: ActorContext
  ): InstitutionalRisk {
    const risk = RiskAssuranceStore.getRiskById(riskId);
    if (!risk) throw new Error(`Risk not found: ${riskId}`);

    if (assessment.inherentLikelihood || assessment.inherentImpact) {
      const l = assessment.inherentLikelihood || risk.inherentLikelihood;
      const i = assessment.inherentImpact || risk.inherentImpact;
      const inhEval = this.evaluateRiskLevel(l, i);
      risk.inherentLikelihood = l;
      risk.inherentImpact = i;
      risk.inherentScore = inhEval.score;
      risk.inherentLevel = inhEval.level;
    }

    if (assessment.existingControlIds) {
      risk.existingControlIds = assessment.existingControlIds;
    }

    if (assessment.residualLikelihood || assessment.residualImpact) {
      const rl = assessment.residualLikelihood || risk.residualLikelihood;
      const ri = assessment.residualImpact || risk.residualImpact;
      const resEval = this.evaluateRiskLevel(rl, ri);
      risk.residualLikelihood = rl;
      risk.residualImpact = ri;
      risk.residualScore = resEval.score;
      risk.residualLevel = resEval.level;
    }

    if (risk.status === "OPEN") {
      risk.status = "UNDER_ASSESSMENT";
    }

    if (assessment.assessmentNotesBn) {
      risk.notes = `${risk.notes ? risk.notes + " | " : ""}${assessment.assessmentNotesBn}`;
    }

    risk.updatedBy = actor.actorId;
    risk.updatedAt = new Date().toISOString();

    RiskAssuranceStore.saveRisk(risk, actor);
    return risk;
  }

  /**
   * Updates Risk Treatment Plan
   */
  static updateTreatment(
    riskId: string,
    treatment: {
      treatmentType: RiskTreatmentType;
      treatmentPlanBn: string;
      treatmentOwner: string;
      treatmentTargetDate: string;
      targetStatus?: RiskStatus;
    },
    actor: ActorContext
  ): InstitutionalRisk {
    const risk = RiskAssuranceStore.getRiskById(riskId);
    if (!risk) throw new Error(`Risk not found: ${riskId}`);

    risk.treatmentType = treatment.treatmentType;
    risk.treatmentPlanBn = treatment.treatmentPlanBn.trim();
    risk.treatmentOwner = treatment.treatmentOwner;
    risk.treatmentTargetDate = treatment.treatmentTargetDate;

    if (treatment.targetStatus) {
      risk.status = treatment.targetStatus;
    } else if (risk.status === "OPEN" || risk.status === "UNDER_ASSESSMENT") {
      risk.status = "TREATMENT_PLANNED";
    }

    risk.updatedBy = actor.actorId;
    risk.updatedAt = new Date().toISOString();

    RiskAssuranceStore.saveRisk(risk, actor);
    return risk;
  }

  /**
   * Formally Accepts Risk (Controlled Human Authority: Principal / Mudir Only)
   * AI or automated jobs CANNOT autonomously accept risks.
   */
  static acceptRisk(
    riskId: string,
    data: {
      acceptanceReasonBn: string;
      nextReviewDate: string;
      conditionsBn?: string;
    },
    actor: ActorContext
  ): InstitutionalRisk {
    const risk = RiskAssuranceStore.getRiskById(riskId);
    if (!risk) throw new Error(`Risk not found: ${riskId}`);

    if (actor.actorRole !== "PRINCIPAL" && actor.actorRole !== "ADMIN") {
      throw new Error("শুধুমাত্র অধ্যক্ষ অথবা দায়িত্বপ্রাপ্ত প্রশাসনিক প্রধান প্রাতিষ্ঠানিক ঝুঁকি গ্রহণ (Accept Risk) অনুমোদন করতে পারবেন।");
    }

    if (!data.acceptanceReasonBn || !data.acceptanceReasonBn.trim() || !data.nextReviewDate) {
      throw new Error("ঝুঁকি গ্রহণের কারণ এবং পরবর্তী পর্যালোচনার তারিখ আবশ্যক।");
    }

    const now = new Date().toISOString();
    risk.status = "ACCEPTED";
    risk.treatmentType = "ACCEPT";
    risk.acceptanceReasonBn = data.acceptanceReasonBn.trim();
    risk.acceptedBy = actor.actorName;
    risk.acceptedAt = now;
    risk.nextReviewDate = data.nextReviewDate;

    if (data.conditionsBn) {
      risk.notes = `${risk.notes ? risk.notes + " | " : ""}শর্তাবলী: ${data.conditionsBn}`;
    }

    risk.updatedBy = actor.actorId;
    risk.updatedAt = now;

    RiskAssuranceStore.saveRisk(risk, actor);

    RiskAssuranceStore.recordAudit({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      entityType: "RISK",
      entityId: risk.id,
      action: "FORMAL_RISK_ACCEPTANCE",
      actorId: actor.actorId,
      actorName: actor.actorName,
      actorRole: actor.actorRole,
      notes: `ঝুঁকি আনুষ্ঠানিকভাবে গৃহীত (Accepted): ${risk.titleBn}. কারণ: ${data.acceptanceReasonBn}`,
      details: { riskId: risk.id, residualLevel: risk.residualLevel, acceptedBy: actor.actorName },
    });

    return risk;
  }

  /**
   * Formally Closes Risk (Requires Evidence and Verification)
   */
  static closeRisk(
    riskId: string,
    data: {
      closureReasonBn: string;
      evidenceRef?: string;
    },
    actor: ActorContext
  ): InstitutionalRisk {
    const risk = RiskAssuranceStore.getRiskById(riskId);
    if (!risk) throw new Error(`Risk not found: ${riskId}`);

    if (actor.actorRole !== "PRINCIPAL" && actor.actorRole !== "ADMIN") {
      throw new Error("শুধুমাত্র অধ্যক্ষ অথবা প্রশাসনিক প্রধান ঝুঁকি সমাপ্ত/নিষ্পত্তি (Close Risk) করতে পারবেন।");
    }

    if (!data.closureReasonBn || !data.closureReasonBn.trim()) {
      throw new Error("ঝুঁকি সমাপ্তির কারণ (closureReasonBn) আবশ্যক।");
    }

    const now = new Date().toISOString();
    risk.status = "CLOSED";
    risk.closureReasonBn = data.closureReasonBn.trim();
    risk.closedBy = actor.actorName;
    risk.closedAt = now;

    if (data.evidenceRef) {
      risk.evidenceDocRefs.push(data.evidenceRef);
    }

    risk.updatedBy = actor.actorId;
    risk.updatedAt = now;

    RiskAssuranceStore.saveRisk(risk, actor);

    RiskAssuranceStore.recordAudit({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      entityType: "RISK",
      entityId: risk.id,
      action: "CLOSE_RISK",
      actorId: actor.actorId,
      actorName: actor.actorName,
      actorRole: actor.actorRole,
      notes: `ঝুঁকি সমাপ্ত ঘোষণা: ${risk.titleBn}. নিষ্পত্তি নোট: ${data.closureReasonBn}`,
      details: { riskId: risk.id, closedBy: actor.actorName },
    });

    return risk;
  }
}
