/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 43
 * Institutional Compliance Requirement Register Engine
 * Checkpoint: EHRJ-AI-2026-PHASE43
 */

import { ComplianceStore } from "./complianceStore";
import {
  ComplianceRequirement,
  RequirementSource,
  RequirementCategory,
  ComplianceScope,
  RequirementStatus,
  ActorContext,
} from "./types";

export class RequirementRegisterEngine {
  /**
   * Generates formatted Requirement ID: EHRJ-REQ-CMP-YYYY-XXXX
   */
  static generateRequirementId(year: number = new Date().getFullYear()): string {
    const reqs = ComplianceStore.getRequirements();
    const prefix = `EHRJ-REQ-CMP-${year}-`;
    const matching = reqs
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
   * Creates a new institutional compliance requirement
   */
  static createRequirement(
    params: {
      title: string;
      description: string;
      source: RequirementSource;
      sourceReference: string;
      isLegallyMandatedVerified?: boolean;
      authoritativeSourceRef?: string;
      jurisdiction: string;
      category: RequirementCategory;
      applicabilityScope: ComplianceScope;
      effectiveDate: string;
      reviewDate: string;
      relatedPolicyId?: string;
      relatedRiskId?: string;
      relatedControlId?: string;
      relatedContractId?: string;
      relatedDocumentToken?: string;
    },
    actor: ActorContext
  ): ComplianceRequirement {
    if (!params.title?.trim()) {
      throw new Error("প্রয়োজনীয়তার শিরোনাম (Title) বাধ্যতামূলক।");
    }
    if (!params.jurisdiction?.trim()) {
      throw new Error("এখতিয়ার বা আইনি ক্ষেত্র (Jurisdiction) প্রদান করা আবশ্যক।");
    }

    const id = this.generateRequirementId();
    const now = new Date().toISOString();

    const newReq: ComplianceRequirement = {
      id,
      version: 1,
      title: params.title.trim(),
      description: params.description?.trim() || "",
      source: params.source,
      sourceReference: params.sourceReference?.trim() || "প্রাতিষ্ঠানিক সিদ্ধান্ত",
      isLegallyMandatedVerified: Boolean(params.isLegallyMandatedVerified),
      authoritativeSourceRef: params.authoritativeSourceRef?.trim() || "যাচাইকৃত নথি রেফারেন্স",
      jurisdiction: params.jurisdiction.trim(),
      category: params.category,
      applicabilityScope: params.applicabilityScope,
      isApplicable: true,
      effectiveDate: params.effectiveDate || now.slice(0, 10),
      reviewDate: params.reviewDate || now.slice(0, 10),
      status: "ACTIVE",
      relatedPolicyId: params.relatedPolicyId,
      relatedRiskId: params.relatedRiskId,
      relatedControlId: params.relatedControlId,
      relatedContractId: params.relatedContractId,
      relatedDocumentToken: params.relatedDocumentToken,
      createdBy: `${actor.userName} (${actor.userId})`,
      updatedBy: `${actor.userName} (${actor.userId})`,
      createdAt: now,
      updatedAt: now,
    };

    const reqs = ComplianceStore.getRequirements();
    reqs.unshift(newReq);
    ComplianceStore.saveRequirements(reqs);

    ComplianceStore.logAudit(
      "REQUIREMENT",
      newReq.id,
      "REQUIREMENT_CREATED",
      actor,
      { newRequirement: newReq }
    );

    return newReq;
  }

  /**
   * Updates an existing requirement, enforcing versioning (Section 39)
   */
  static updateRequirement(
    id: string,
    updates: Partial<Omit<ComplianceRequirement, "id" | "createdAt" | "createdBy">>,
    actor: ActorContext,
    isMajorChange: boolean = false
  ): ComplianceRequirement {
    const reqs = ComplianceStore.getRequirements();
    const index = reqs.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`প্রয়োজনীয়তা পাওয়া যায়নি: ${id}`);
    }

    const existing = reqs[index];
    const newVersion = isMajorChange ? existing.version + 1 : existing.version;
    const now = new Date().toISOString();

    const updated: ComplianceRequirement = {
      ...existing,
      ...updates,
      version: newVersion,
      updatedBy: `${actor.userName} (${actor.userId})`,
      updatedAt: now,
    };

    reqs[index] = updated;
    ComplianceStore.saveRequirements(reqs);

    ComplianceStore.logAudit(
      "REQUIREMENT",
      id,
      isMajorChange ? "REQUIREMENT_VERSION_INCREMENTED" : "REQUIREMENT_UPDATED",
      actor,
      { previous: existing, updated }
    );

    return updated;
  }

  /**
   * Updates applicability state with mandatory justification, reviewer, and evidence ref (Section 9/40)
   */
  static updateApplicability(
    id: string,
    isApplicable: boolean,
    params: {
      reason: string;
      reviewer: string;
      evidenceRef?: string;
    },
    actor: ActorContext
  ): ComplianceRequirement {
    if (!params.reason?.trim()) {
      throw new Error("প্রযোজ্যতা পরিবর্তনের কারণ (Reason) প্রদান করা বাধ্যতামূলক।");
    }
    if (!params.reviewer?.trim()) {
      throw new Error("অনুমোদনকারী পর্যালোচকের নাম (Reviewer) প্রদান করা আবশ্যক।");
    }

    const reqs = ComplianceStore.getRequirements();
    const index = reqs.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`প্রয়োজনীয়তা পাওয়া যায়নি: ${id}`);
    }

    const existing = reqs[index];
    const now = new Date().toISOString();

    const updated: ComplianceRequirement = {
      ...existing,
      isApplicable,
      applicabilityReason: params.reason.trim(),
      applicabilityReviewer: params.reviewer.trim(),
      applicabilityEvidenceRef: params.evidenceRef?.trim() || "নথি সংরক্ষিত",
      applicabilityDate: now.slice(0, 10),
      updatedBy: `${actor.userName} (${actor.userId})`,
      updatedAt: now,
    };

    reqs[index] = updated;
    ComplianceStore.saveRequirements(reqs);

    ComplianceStore.logAudit(
      "REQUIREMENT",
      id,
      "APPLICABILITY_CHANGED",
      actor,
      { isApplicable, reason: params.reason, reviewer: params.reviewer }
    );

    return updated;
  }

  /**
   * Retrieves single requirement
   */
  static getRequirementById(id: string): ComplianceRequirement | undefined {
    return ComplianceStore.getRequirements().find((r) => r.id === id);
  }

  /**
   * List filtered requirements
   */
  static getFilteredRequirements(filters?: {
    category?: RequirementCategory;
    source?: RequirementSource;
    scope?: ComplianceScope;
    status?: RequirementStatus;
    isApplicable?: boolean;
    search?: string;
  }): ComplianceRequirement[] {
    let list = ComplianceStore.getRequirements();

    if (!filters) return list;

    if (filters.category) {
      list = list.filter((r) => r.category === filters.category);
    }
    if (filters.source) {
      list = list.filter((r) => r.source === filters.source);
    }
    if (filters.scope) {
      list = list.filter((r) => r.applicabilityScope === filters.scope);
    }
    if (filters.status) {
      list = list.filter((r) => r.status === filters.status);
    }
    if (filters.isApplicable !== undefined) {
      list = list.filter((r) => r.isApplicable === filters.isApplicable);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.jurisdiction.toLowerCase().includes(q)
      );
    }

    return list;
  }
}
