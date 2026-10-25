/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 43
 * Institutional Compliance Obligation & Execution Engine
 * Checkpoint: EHRJ-AI-2026-PHASE43
 */

import { ComplianceStore } from "./complianceStore";
import {
  ComplianceObligation,
  ComplianceException,
  ObligationFrequency,
  ComplianceStatus,
  ResponsibilityType,
  ActorContext,
  ComplianceEarlyWarning,
} from "./types";

export class ObligationEngine {
  /**
   * Generates formatted Obligation ID: EHRJ-COMP-YYYY-XXXX
   */
  static generateObligationId(year: number = new Date().getFullYear()): string {
    const obligations = ComplianceStore.getObligations();
    const prefix = `EHRJ-COMP-${year}-`;
    const matching = obligations
      .map((o) => o.id)
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
   * Generates formatted Exception ID: EHRJ-EXC-CMP-YYYY-XXXX
   */
  static generateExceptionId(year: number = new Date().getFullYear()): string {
    const exceptions = ComplianceStore.getExceptions();
    const prefix = `EHRJ-EXC-CMP-${year}-`;
    const matching = exceptions
      .map((e) => e.id)
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
   * Creates a new compliance obligation linked to a requirement
   */
  static createObligation(
    params: {
      requirementId: string;
      title: string;
      description: string;
      ownerId: string;
      ownerName: string;
      ownerRole: string;
      reviewerId: string;
      reviewerName: string;
      backupOwnerId?: string;
      backupOwnerName?: string;
      responsibilityType: ResponsibilityType;
      frequency: ObligationFrequency;
      startDate: string;
      dueDate: string;
      deadlineSource: string;
      reminderDate?: string;
      escalationDate?: string;
      relatedRiskId?: string;
      relatedControlId?: string;
      relatedFindingId?: string;
      notes?: string;
    },
    actor: ActorContext
  ): ComplianceObligation {
    if (!params.requirementId?.trim()) {
      throw new Error("বাধ্যতামূলক প্রয়োজনীয়তা আইডি (Requirement ID) প্রদান আবশ্যক।");
    }
    if (!params.title?.trim()) {
      throw new Error("দায়িত্বের শিরোনাম (Title) বাধ্যতামূলক।");
    }
    if (!params.ownerId?.trim() || !params.ownerName?.trim()) {
      throw new Error("দায়িত্বশীল কর্মকর্তা (Owner) নির্বাচন আবশ্যক।");
    }
    if (!params.dueDate?.trim()) {
      throw new Error("চূড়ান্ত তারিখ (Due Date) নির্ধারণ বাধ্যতামূলক।");
    }
    if (!params.deadlineSource?.trim()) {
      throw new Error("সময়সীমার উৎস (Deadline Source) উল্লেখ করা আবশ্যক।");
    }

    const id = this.generateObligationId();
    const now = new Date().toISOString();

    const newObligation: ComplianceObligation = {
      id,
      requirementId: params.requirementId.trim(),
      title: params.title.trim(),
      description: params.description?.trim() || "",
      ownerId: params.ownerId.trim(),
      ownerName: params.ownerName.trim(),
      ownerRole: params.ownerRole.trim(),
      reviewerId: params.reviewerId.trim(),
      reviewerName: params.reviewerName.trim(),
      backupOwnerId: params.backupOwnerId?.trim(),
      backupOwnerName: params.backupOwnerName?.trim(),
      responsibilityType: params.responsibilityType,
      frequency: params.frequency,
      startDate: params.startDate || now.slice(0, 10),
      dueDate: params.dueDate,
      deadlineSource: params.deadlineSource.trim(),
      reminderDate: params.reminderDate,
      escalationDate: params.escalationDate,
      status: "NOT_STARTED",
      evidenceIds: [],
      relatedRiskId: params.relatedRiskId,
      relatedControlId: params.relatedControlId,
      relatedFindingId: params.relatedFindingId,
      notes: params.notes?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const obligations = ComplianceStore.getObligations();
    obligations.unshift(newObligation);
    ComplianceStore.saveObligations(obligations);

    ComplianceStore.logAudit(
      "OBLIGATION",
      newObligation.id,
      "OBLIGATION_CREATED",
      actor,
      { newObligation }
    );

    return newObligation;
  }

  /**
   * Updates obligation status with transition safeguards
   */
  static updateObligationStatus(
    id: string,
    newStatus: ComplianceStatus,
    notes: string | undefined,
    actor: ActorContext
  ): ComplianceObligation {
    const obligations = ComplianceStore.getObligations();
    const index = obligations.findIndex((o) => o.id === id);
    if (index === -1) {
      throw new Error(`দায়িত্ব পাওয়া যায়নি: ${id}`);
    }

    const existing = obligations[index];
    const now = new Date().toISOString();

    let completionDate = existing.completionDate;
    if (newStatus === "COMPLIANT" && !completionDate) {
      completionDate = now.slice(0, 10);
    }

    const updated: ComplianceObligation = {
      ...existing,
      status: newStatus,
      completionDate,
      notes: notes !== undefined ? notes.trim() : existing.notes,
      updatedAt: now,
    };

    obligations[index] = updated;
    ComplianceStore.saveObligations(obligations);

    ComplianceStore.logAudit(
      "OBLIGATION",
      id,
      "STATUS_UPDATED",
      actor,
      { previousStatus: existing.status, newStatus, notes }
    );

    return updated;
  }

  /**
   * Assigns or transfers owner
   */
  static assignOwner(
    id: string,
    owner: {
      ownerId: string;
      ownerName: string;
      ownerRole: string;
      backupOwnerId?: string;
      backupOwnerName?: string;
    },
    actor: ActorContext
  ): ComplianceObligation {
    const obligations = ComplianceStore.getObligations();
    const index = obligations.findIndex((o) => o.id === id);
    if (index === -1) {
      throw new Error(`দায়িত্ব পাওয়া যায়নি: ${id}`);
    }

    const existing = obligations[index];
    const now = new Date().toISOString();

    const updated: ComplianceObligation = {
      ...existing,
      ownerId: owner.ownerId.trim(),
      ownerName: owner.ownerName.trim(),
      ownerRole: owner.ownerRole.trim(),
      backupOwnerId: owner.backupOwnerId?.trim(),
      backupOwnerName: owner.backupOwnerName?.trim(),
      updatedAt: now,
    };

    obligations[index] = updated;
    ComplianceStore.saveObligations(obligations);

    ComplianceStore.logAudit(
      "OBLIGATION",
      id,
      "OWNER_REASSIGNED",
      actor,
      { previousOwner: existing.ownerName, newOwner: owner.ownerName }
    );

    return updated;
  }

  /**
   * Request a compliance exception
   */
  static requestException(
    params: {
      obligationId: string;
      requirementId: string;
      reason: string;
      scope: string;
      startDate: string;
      endDate: string;
      compensatingControl: string;
      evidenceRef?: string;
    },
    actor: ActorContext
  ): ComplianceException {
    if (!params.reason?.trim()) {
      throw new Error("ব্যতিক্রম বা রেয়াতের কারণ (Reason) প্রদান করা বাধ্যতামূলক।");
    }
    if (!params.compensatingControl?.trim()) {
      throw new Error("বিকল্প বা ক্ষতিপূরণমূলক নিয়ন্ত্রণ (Compensating Control) উল্লেখ করা আবশ্যক।");
    }

    const id = this.generateExceptionId();
    const now = new Date().toISOString();

    const newException: ComplianceException = {
      id,
      obligationId: params.obligationId.trim(),
      requirementId: params.requirementId.trim(),
      reason: params.reason.trim(),
      scope: params.scope?.trim() || "সাধারণ ছাড়",
      startDate: params.startDate || now.slice(0, 10),
      endDate: params.endDate,
      compensatingControl: params.compensatingControl.trim(),
      requestedBy: `${actor.userName} (${actor.userId})`,
      status: "REQUESTED",
      evidenceRef: params.evidenceRef?.trim(),
      reviewDate: params.endDate,
      createdAt: now,
      updatedAt: now,
    };

    const exceptions = ComplianceStore.getExceptions();
    exceptions.unshift(newException);
    ComplianceStore.saveExceptions(exceptions);

    ComplianceStore.logAudit(
      "EXCEPTION",
      id,
      "EXCEPTION_REQUESTED",
      actor,
      { newException }
    );

    return newException;
  }

  /**
   * Human authority decision on exception (Principle: Automate process, not authority)
   */
  static decideException(
    exceptionId: string,
    decision: "APPROVED" | "REJECTED",
    reason: string,
    actor: ActorContext
  ): ComplianceException {
    if (actor.userRole !== "PRINCIPAL" && actor.userRole !== "ADMIN") {
      throw new Error("শুধুমাত্র অধ্যক্ষ / প্রধান মহোদয় ব্যতিক্রম অনুমোদন বা প্রত্যাখ্যান করতে পারেন।");
    }
    if (decision === "REJECTED" && !reason?.trim()) {
      throw new Error("প্রত্যাখ্যানের সুস্পষ্ট কারণ প্রদান করা আবশ্যক।");
    }

    const exceptions = ComplianceStore.getExceptions();
    const index = exceptions.findIndex((e) => e.id === exceptionId);
    if (index === -1) {
      throw new Error(`ব্যতিক্রম রেকর্ড পাওয়া যায়নি: ${exceptionId}`);
    }

    const existing = exceptions[index];
    const now = new Date().toISOString();

    const updated: ComplianceException = {
      ...existing,
      status: decision,
      approvedBy: decision === "APPROVED" ? `${actor.userName} (${actor.userId})` : undefined,
      approvedAt: decision === "APPROVED" ? now : undefined,
      rejectionReason: decision === "REJECTED" ? reason.trim() : undefined,
      updatedAt: now,
    };

    exceptions[index] = updated;
    ComplianceStore.saveExceptions(exceptions);

    // If approved, update obligation status to EXCEPTION_GRANTED
    if (decision === "APPROVED") {
      const obligations = ComplianceStore.getObligations();
      const oblIndex = obligations.findIndex((o) => o.id === existing.obligationId);
      if (oblIndex !== -1) {
        obligations[oblIndex].status = "EXCEPTION_GRANTED";
        obligations[oblIndex].updatedAt = now;
        ComplianceStore.saveObligations(obligations);
      }
    }

    ComplianceStore.logAudit(
      "EXCEPTION",
      exceptionId,
      `EXCEPTION_${decision}`,
      actor,
      { decision, reason }
    );

    return updated;
  }

  /**
   * Scans and updates expired exceptions (Section 18/39)
   */
  static scanExpiredExceptions(): number {
    const exceptions = ComplianceStore.getExceptions();
    const nowStr = new Date().toISOString().slice(0, 10);
    let expiredCount = 0;

    for (let i = 0; i < exceptions.length; i++) {
      if (
        exceptions[i].status === "APPROVED" &&
        exceptions[i].endDate &&
        exceptions[i].endDate < nowStr
      ) {
        exceptions[i].status = "EXPIRED";
        exceptions[i].updatedAt = new Date().toISOString();
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      ComplianceStore.saveExceptions(exceptions);
    }
    return expiredCount;
  }

  /**
   * Generates early warning forecasts (Section 36)
   */
  static generateEarlyWarnings(): ComplianceEarlyWarning[] {
    const obligations = ComplianceStore.getObligations();
    const exceptions = ComplianceStore.getExceptions();
    const nowStr = new Date().toISOString().slice(0, 10);
    const warnings: ComplianceEarlyWarning[] = [];

    // Scan obligations due within 7 days
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().slice(0, 10);

    for (const obl of obligations) {
      if (obl.status !== "COMPLIANT" && obl.status !== "CLOSED" && obl.status !== "ARCHIVED") {
        if (obl.dueDate < nowStr) {
          warnings.push({
            type: "OVERDUE_IMMINENT",
            obligationId: obl.id,
            requirementId: obl.requirementId,
            severity: "CRITICAL",
            message: `দায়িত্বের সময়সীমা অতিক্রম করেছে (${obl.dueDate}): ${obl.title}`,
            dueDate: obl.dueDate,
            owner: obl.ownerName,
            isForecast: true,
          });
        } else if (obl.dueDate <= nextWeekStr) {
          warnings.push({
            type: "OVERDUE_IMMINENT",
            obligationId: obl.id,
            requirementId: obl.requirementId,
            severity: "HIGH",
            message: `আগামী ৭ দিনের মধ্যে সময়সীমা শেষ হচ্ছে (${obl.dueDate}): ${obl.title}`,
            dueDate: obl.dueDate,
            owner: obl.ownerName,
            isForecast: true,
          });
        }

        if (!obl.ownerId || !obl.ownerName) {
          warnings.push({
            type: "UNASSIGNED_OBLIGATION",
            obligationId: obl.id,
            requirementId: obl.requirementId,
            severity: "HIGH",
            message: `দায়িত্বপ্রাপ্ত কর্মকর্তা নির্ধারিত হয়নি: ${obl.title}`,
            dueDate: obl.dueDate,
            isForecast: true,
          });
        }
      }
    }

    for (const exc of exceptions) {
      if (exc.status === "APPROVED" && exc.endDate < nowStr) {
        warnings.push({
          type: "EXPIRED_EXCEPTION",
          obligationId: exc.obligationId,
          requirementId: exc.requirementId,
          severity: "HIGH",
          message: `অনুমোদিত ব্যতিক্রান্তের মেয়াদ উত্তীর্ণ হয়েছে (${exc.endDate})`,
          isForecast: true,
        });
      }
    }

    return warnings;
  }
}
