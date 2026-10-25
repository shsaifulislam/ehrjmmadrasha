/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 42
 * Governance Findings, Deficiencies & Corrective/Preventive Action (CAPA) Engine
 * Checkpoint: EHRJ-AI-2026-PHASE42
 */

import { RiskAssuranceStore } from "./riskAssuranceStore";
import {
  GovernanceFinding,
  CorrectiveAction,
  FindingSourceType,
  FindingStatus,
  RootCauseCategory,
  RiskLevel,
  ActionStatus,
  ActorContext,
} from "./types";

export class FindingsActionEngine {
  /**
   * Generates next institutional Finding ID: EHRJ-FND-YYYY-XXXX
   */
  static generateNextFindingId(year = new Date().getFullYear()): string {
    const findings = RiskAssuranceStore.getFindings();
    const prefix = `EHRJ-FND-${year}-`;
    const yearFindings = findings.filter((f) => f.id.startsWith(prefix));
    let maxSeq = 0;

    for (const f of yearFindings) {
      const parts = f.id.split("-");
      const seq = parseInt(parts[3], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }

    const nextSeq = String(maxSeq + 1).padStart(4, "0");
    return `${prefix}${nextSeq}`;
  }

  /**
   * Generates next Corrective Action ID: EHRJ-ACT-YYYY-XXXX
   */
  static generateNextActionId(year = new Date().getFullYear()): string {
    const actions = RiskAssuranceStore.getActions();
    const prefix = `EHRJ-ACT-${year}-`;
    const yearActions = actions.filter((a) => a.id.startsWith(prefix));
    let maxSeq = 0;

    for (const a of yearActions) {
      const parts = a.id.split("-");
      const seq = parseInt(parts[3], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }

    const nextSeq = String(maxSeq + 1).padStart(4, "0");
    return `${prefix}${nextSeq}`;
  }

  /**
   * Records a new Governance/Audit Finding
   */
  static createFinding(
    data: {
      titleBn: string;
      titleEn?: string;
      descriptionBn: string;
      sourceType: FindingSourceType;
      sourceReferenceId?: string;
      relatedRiskId?: string;
      relatedControlId?: string;
      severity: RiskLevel;
      ownerName: string;
      rootCauseCategory: RootCauseCategory;
      rootCauseAnalysisBn: string;
      recommendationBn: string;
      dueDate?: string;
      evidenceDocRefs?: string[];
    },
    actor: ActorContext
  ): GovernanceFinding {
    const id = this.generateNextFindingId();
    const now = new Date().toISOString();
    const defaultDueDate = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

    const finding: GovernanceFinding = {
      id,
      titleBn: data.titleBn.trim(),
      titleEn: data.titleEn?.trim() || data.titleBn.trim(),
      descriptionBn: data.descriptionBn.trim(),
      sourceType: data.sourceType,
      sourceReferenceId: data.sourceReferenceId,
      relatedRiskId: data.relatedRiskId,
      relatedControlId: data.relatedControlId,
      severity: data.severity,
      ownerName: data.ownerName,
      status: "OPEN",
      rootCauseCategory: data.rootCauseCategory,
      rootCauseAnalysisBn: data.rootCauseAnalysisBn.trim(),
      recommendationBn: data.recommendationBn.trim(),
      evidenceDocRefs: data.evidenceDocRefs || [],
      dueDate: data.dueDate || defaultDueDate,
      createdAt: now,
      updatedAt: now,
    };

    RiskAssuranceStore.saveFinding(finding, actor);
    return finding;
  }

  /**
   * Creates a Corrective or Preventive Action (CAPA) linked to a finding
   */
  static createAction(
    data: {
      findingId: string;
      actionType: "CORRECTIVE" | "PREVENTIVE";
      actionDescriptionBn: string;
      assignedTo: string;
      dueDate: string;
      priority?: RiskLevel;
    },
    actor: ActorContext
  ): CorrectiveAction {
    const finding = RiskAssuranceStore.getFindingById(data.findingId);
    if (!finding) throw new Error(`Finding not found: ${data.findingId}`);

    const id = this.generateNextActionId();
    const now = new Date().toISOString();

    const actionItem: CorrectiveAction = {
      id,
      findingId: finding.id,
      actionType: data.actionType,
      actionDescriptionBn: data.actionDescriptionBn.trim(),
      assignedTo: data.assignedTo,
      dueDate: data.dueDate,
      priority: data.priority || finding.severity,
      status: "PLANNED",
      createdAt: now,
      updatedAt: now,
    };

    RiskAssuranceStore.saveAction(actionItem, actor);

    // Transition finding status to ACTION_REQUIRED or IN_PROGRESS
    if (finding.status === "OPEN" || finding.status === "UNDER_REVIEW") {
      finding.status = "IN_PROGRESS";
      finding.updatedAt = now;
      RiskAssuranceStore.saveFinding(finding);
    }

    return actionItem;
  }

  /**
   * Marks a Corrective Action completed
   */
  static completeAction(
    actionId: string,
    data: {
      completionNotesBn: string;
      evidenceRef?: string;
    },
    actor: ActorContext
  ): CorrectiveAction {
    const actionItem = RiskAssuranceStore.getActionById(actionId);
    if (!actionItem) throw new Error(`Action not found: ${actionId}`);

    const now = new Date().toISOString();
    actionItem.status = "COMPLETED";
    actionItem.completionNotesBn = data.completionNotesBn.trim();
    actionItem.evidenceRef = data.evidenceRef;
    actionItem.completedAt = now;
    actionItem.updatedAt = now;

    RiskAssuranceStore.saveAction(actionItem, actor);

    // Check finding status
    const finding = RiskAssuranceStore.getFindingById(actionItem.findingId);
    if (finding) {
      finding.status = "PENDING_VERIFICATION";
      finding.updatedAt = now;
      RiskAssuranceStore.saveFinding(finding);
    }

    return actionItem;
  }

  /**
   * Formally Verifies Action and Closes Finding
   * Invariant: A finding must NOT become CLOSED simply because someone marked it resolved.
   * Authorized verification is mandatory!
   */
  static verifyAndCloseFinding(
    findingId: string,
    data: {
      resolutionNotesBn: string;
      evidenceRef?: string;
    },
    verifier: ActorContext
  ): GovernanceFinding {
    const finding = RiskAssuranceStore.getFindingById(findingId);
    if (!finding) throw new Error(`Finding not found: ${findingId}`);

    if (verifier.actorRole !== "PRINCIPAL" && verifier.actorRole !== "ADMIN") {
      throw new Error("শুধুমাত্র অধ্যক্ষ অথবা দায়িত্বপ্রাপ্ত প্রশাসনিক নিরীক্ষক পর্যবেক্ষণ নিষ্পত্তি ও বন্ধ (Close Finding) করতে পারবেন।");
    }

    if (!data.resolutionNotesBn || !data.resolutionNotesBn.trim()) {
      throw new Error("পর্যবেক্ষণ নিষ্পত্তির জন্য নিরপেক্ষ যাচাইকরণ নোট (resolutionNotesBn) আবশ্যক।");
    }

    const now = new Date().toISOString();

    // Verify all linked actions are marked verified
    const actions = RiskAssuranceStore.getActions().filter((a) => a.findingId === finding.id);
    for (const a of actions) {
      if (a.status !== "VERIFIED") {
        a.status = "VERIFIED";
        a.verifiedBy = verifier.actorName;
        a.verifiedAt = now;
        a.verificationNotesBn = data.resolutionNotesBn;
        a.updatedAt = now;
        RiskAssuranceStore.saveAction(a);
      }
    }

    finding.status = "CLOSED";
    finding.resolutionNotesBn = data.resolutionNotesBn.trim();
    if (data.evidenceRef) {
      finding.evidenceDocRefs.push(data.evidenceRef);
    }
    finding.verifiedBy = verifier.actorName;
    finding.verifiedAt = now;
    finding.closedBy = verifier.actorName;
    finding.closedAt = now;
    finding.updatedAt = now;

    RiskAssuranceStore.saveFinding(finding, verifier);

    RiskAssuranceStore.recordAudit({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      entityType: "FINDING",
      entityId: finding.id,
      action: "VERIFY_AND_CLOSE_FINDING",
      actorId: verifier.actorId,
      actorName: verifier.actorName,
      actorRole: verifier.actorRole,
      notes: `পর্যবেক্ষণ ও ত্রুটি চূড়ান্তভাবে যাচাইকৃত ও নিষ্পত্তি: ${finding.titleBn}`,
      details: { findingId: finding.id, closedBy: verifier.actorName },
    });

    return finding;
  }

  /**
   * Retrieves overdue CAPA actions
   */
  static getOverdueActions(): CorrectiveAction[] {
    const actions = RiskAssuranceStore.getActions();
    const today = new Date().toISOString().split("T")[0];
    return actions.filter(
      (a) => a.status !== "COMPLETED" && a.status !== "VERIFIED" && a.dueDate < today
    );
  }
}
