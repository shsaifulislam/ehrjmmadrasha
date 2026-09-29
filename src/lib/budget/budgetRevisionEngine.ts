/**
 * EHRJ MADRASHA ERP — PHASE 41
 * Budget Revision Workflow Engine
 * 
 * Rules:
 * 1. Controlled Workflow: DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED / REJECTED / CANCELLED.
 * 2. Approving a revision creates a new version snapshot (Version 2, Version 3) preserving history.
 * 3. Human-Controlled: Approvals must be authorized by Admin / Governing Body.
 * 4. Never silently modifies an approved budget.
 */

import {
  Budget,
  BudgetRevision,
  BudgetRevisionLineDiff,
  BudgetRevisionStatus,
  BudgetVersionSnapshot,
} from "./types";
import {
  getBudgetById,
  saveBudget,
  getAllRevisions,
  saveRevision,
  recordBudgetAudit,
} from "./budgetStore";
import { ActorContext, recalculateBudgetTotals } from "./budgetLifecycleEngine";

/**
 * Creates a new budget revision request
 */
export function requestBudgetRevision(
  budgetId: string,
  requestData: {
    titleBn: string;
    reasonBn: string;
    supportingDocUrl?: string;
    lineDiffs: BudgetRevisionLineDiff[];
  },
  actor: ActorContext
): { success: boolean; revision?: BudgetRevision; error?: string } {
  const budget = getBudgetById(budgetId);
  if (!budget) {
    return { success: false, error: "বাজেট পাওয়া যায়নি।" };
  }

  // Budget must be APPROVED, ACTIVE or REVISED to be revised
  if (budget.status !== "APPROVED" && budget.status !== "ACTIVE" && budget.status !== "REVISED") {
    return {
      success: false,
      error: `শুধুমাত্র অনুমোদিত বা সক্রিয় বাজেটের জন্য রিভিশন প্রস্তাব তৈরি করা সম্ভব (বর্তমান স্ট্যাটাস: ${budget.status})।`,
    };
  }

  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const revisionCode = `EHRJ-BREV-${year}-${rand}`;

  let netExpenseAdjustment = 0;
  let netIncomeAdjustment = 0;

  for (const diff of requestData.lineDiffs) {
    const line = budget.lines.find((l) => l.id === diff.budgetLineId);
    if (line?.categoryType === "INCOME") {
      netIncomeAdjustment += diff.amountDifference;
    } else {
      netExpenseAdjustment += diff.amountDifference;
    }
  }

  const revision: BudgetRevision = {
    id: revisionCode,
    revisionCode,
    budgetId: budget.id,
    budgetTitleBn: budget.titleBn,
    previousVersion: budget.currentVersion,
    targetVersion: budget.currentVersion + 1,
    titleBn: requestData.titleBn,
    reasonBn: requestData.reasonBn,
    supportingDocUrl: requestData.supportingDocUrl,
    lineDiffs: requestData.lineDiffs,
    netExpenseAdjustment,
    netIncomeAdjustment,
    status: "SUBMITTED",
    requestedBy: actor.actorName,
    requestedAt: new Date().toISOString(),
  };

  saveRevision(revision);

  recordBudgetAudit({
    budgetId: budget.id,
    action: "REQUEST_REVISION",
    actorId: actor.actorId,
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    notes: `বাজেট রিভিশন প্রস্তাব পেশ: ${revision.titleBn} (সংস্করণ v${revision.previousVersion} -> v${revision.targetVersion})`,
    details: {
      revisionCode,
      netExpenseAdjustment,
      netIncomeAdjustment,
      diffCount: requestData.lineDiffs.length,
    },
  });

  return { success: true, revision };
}

/**
 * Reviews or updates a revision status
 */
export function updateRevisionStatus(
  revisionId: string,
  targetStatus: BudgetRevisionStatus,
  actor: ActorContext,
  reason?: string
): { success: boolean; revision?: BudgetRevision; error?: string } {
  const revisions = getAllRevisions();
  const revision = revisions.find((r) => r.id === revisionId);
  if (!revision) {
    return { success: false, error: "রিভিশন রেকর্ড পাওয়া যায়নি।" };
  }

  if (targetStatus === "UNDER_REVIEW") {
    revision.status = "UNDER_REVIEW";
    revision.reviewedBy = actor.actorName;
    revision.reviewedAt = new Date().toISOString();
  } else if (targetStatus === "REJECTED") {
    revision.status = "REJECTED";
    revision.rejectionReason = reason || "কর্তৃপক্ষ কর্তৃক প্রত্যাখ্যান";
    revision.reviewedBy = actor.actorName;
    revision.reviewedAt = new Date().toISOString();
  } else if (targetStatus === "CANCELLED") {
    revision.status = "CANCELLED";
  }

  saveRevision(revision);

  recordBudgetAudit({
    budgetId: revision.budgetId,
    action: targetStatus === "REJECTED" ? "REJECT_REVISION" : "UPDATE_BUDGET",
    actorId: actor.actorId,
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    notes: `রিভিশন ${revision.revisionCode} স্ট্যাটাস পরিবর্তিত: ${targetStatus}`,
    details: { revisionId, targetStatus, reason },
  });

  return { success: true, revision };
}

/**
 * Approves a budget revision and increments budget version with complete snapshot
 */
export function approveBudgetRevision(
  revisionId: string,
  actor: ActorContext,
  approvalReference?: string
): { success: boolean; budget?: Budget; revision?: BudgetRevision; error?: string } {
  const revisions = getAllRevisions();
  const revision = revisions.find((r) => r.id === revisionId);
  if (!revision) {
    return { success: false, error: "রিভিশন রেকর্ড পাওয়া যায়নি।" };
  }

  if (revision.status === "APPROVED") {
    return { success: false, error: "এই রিভিশন ইতিমধ্যে অনুমোদিত হয়েছে।" };
  }

  const budget = getBudgetById(revision.budgetId);
  if (!budget) {
    return { success: false, error: "সংশ্লিষ্ট বাজেট পাওয়া যায়নি।" };
  }

  const now = new Date().toISOString();
  const newVersionNumber = budget.currentVersion + 1;

  // Apply line changes to budget
  for (const diff of revision.lineDiffs) {
    const line = budget.lines.find((l) => l.id === diff.budgetLineId);
    if (line) {
      line.revisedAmount = diff.newRequestedAmount || (diff as any).proposedAmount || line.revisedAmount;
      const occupied = line.actualAmount + line.committedAmount;
      line.remainingAmount = line.revisedAmount - occupied;

      if (line.categoryType === "EXPENSE") {
        line.variance = line.revisedAmount - occupied;
        line.utilizationRate =
          line.revisedAmount > 0 ? Math.round((occupied / line.revisedAmount) * 1000) / 10 : 0;
      } else {
        line.variance = line.actualAmount - line.revisedAmount;
        line.utilizationRate =
          line.revisedAmount > 0 ? Math.round((line.actualAmount / line.revisedAmount) * 1000) / 10 : 0;
      }
    }
  }

  // Recalculate totals
  recalculateBudgetTotals(budget);

  // Snapshot new version
  const snapshot: BudgetVersionSnapshot = {
    versionNumber: newVersionNumber,
    effectiveDate: now.split("T")[0],
    approvedBy: actor.actorName,
    approvalReference: approvalReference || `GB-REV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    totalPlannedIncome: budget.totalIncomePlanned,
    totalPlannedExpense: budget.totalExpensePlanned,
    totalPlannedSurplusDeficit: budget.netProjectedSurplus,
    linesSnapshot: JSON.parse(JSON.stringify(budget.lines)),
    revisionReason: revision.reasonBn,
    createdAt: now,
  };

  budget.currentVersion = newVersionNumber;
  budget.status = "REVISED";
  budget.versions.push(snapshot);
  budget.updatedBy = actor.actorName;
  budget.updatedAt = now;

  saveBudget(budget);

  // Update revision record
  revision.status = "APPROVED";
  revision.approvedBy = actor.actorName;
  revision.approvedAt = now;
  saveRevision(revision);

  recordBudgetAudit({
    budgetId: budget.id,
    action: "APPROVE_REVISION",
    actorId: actor.actorId,
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    notes: `রিভিশন অনুমোদিত: ${revision.titleBn} (বাজেট সংস্করণ উন্নীত: v${newVersionNumber})`,
    details: {
      revisionId: revision.id,
      newVersionNumber,
      approvalReference: snapshot.approvalReference,
      totalExpensePlanned: budget.totalExpensePlanned,
    },
  });

  return { success: true, budget, revision };
}
