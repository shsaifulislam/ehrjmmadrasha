/**
 * EHRJ MADRASHA ERP — PHASE 41
 * Budget Lifecycle & Versioning Engine
 * 
 * Invariants:
 * 1. Strictly protects budget state transitions:
 *    DRAFT -> PREPARATION -> UNDER_REVIEW -> APPROVED -> ACTIVE -> REVISED -> CLOSED -> ARCHIVED
 * 2. Never overwrites historical approved versions.
 * 3. Approved budgets are snapshotted with immutable line versions.
 * 4. Human-controlled approval; AI cannot approve budgets autonomously.
 */

import {
  Budget,
  BudgetLifecycleStatus,
  BudgetLine,
  BudgetVersionSnapshot,
} from "./types";
import {
  getAllBudgets,
  getBudgetById,
  saveBudget,
  recordBudgetAudit,
} from "./budgetStore";

const ALLOWED_TRANSITIONS: Record<BudgetLifecycleStatus, BudgetLifecycleStatus[]> = {
  DRAFT: ["PREPARATION", "ARCHIVED"],
  PREPARATION: ["UNDER_REVIEW", "DRAFT", "ARCHIVED"],
  UNDER_REVIEW: ["APPROVED", "PREPARATION", "ARCHIVED"],
  APPROVED: ["ACTIVE", "REVISED", "ARCHIVED"],
  ACTIVE: ["REVISED", "CLOSED"],
  REVISED: ["ACTIVE", "CLOSED"],
  CLOSED: ["ARCHIVED"],
  ARCHIVED: [],
};

export interface ActorContext {
  actorId: string;
  actorName: string;
  actorRole: string; // e.g. ADMIN, PRINCIPAL
}

export function canTransitionBudget(
  current: BudgetLifecycleStatus,
  target: BudgetLifecycleStatus
): boolean {
  return ALLOWED_TRANSITIONS[current]?.includes(target) ?? false;
}

/**
 * Transitions a budget lifecycle status with validation and audit logging
 */
export function transitionBudgetStatus(
  budgetId: string,
  targetStatus: BudgetLifecycleStatus,
  actor: ActorContext,
  reason?: string
): { success: boolean; budget?: Budget; error?: string } {
  const budget = getBudgetById(budgetId);
  if (!budget) {
    return { success: false, error: "বাজেট খুঁজে পাওয়া যায়নি।" };
  }

  if (budget.status === targetStatus) {
    return { success: true, budget };
  }

  if (!canTransitionBudget(budget.status, targetStatus)) {
    return {
      success: false,
      error: `অননুমোদিত স্ট্যাটাস পরিবর্তন: ${budget.status} থেকে সরাসরি ${targetStatus} এ রূপান্তর সম্ভব নয়।`,
    };
  }

  const previousStatus = budget.status;
  budget.status = targetStatus;
  budget.updatedBy = actor.actorName;
  budget.updatedAt = new Date().toISOString();

  // If transitioning to APPROVED, snapshot as Version 1 if not already versioned
  if (targetStatus === "APPROVED" && budget.versions.length === 0) {
    budget.currentVersion = 1;
    budget.approvedBy = actor.actorName;
    budget.approvedAt = new Date().toISOString();

    const snapshot: BudgetVersionSnapshot = {
      versionNumber: 1,
      effectiveDate: budget.startDate,
      approvedBy: actor.actorName,
      approvalReference: `GB-APP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      totalPlannedIncome: budget.totalIncomePlanned,
      totalPlannedExpense: budget.totalExpensePlanned,
      totalPlannedSurplusDeficit: budget.netProjectedSurplus,
      linesSnapshot: JSON.parse(JSON.stringify(budget.lines)),
      revisionReason: reason || "মূল অনুমোদিত বাজেট সংস্করণ",
      createdAt: new Date().toISOString(),
    };
    budget.versions.push(snapshot);
  }

  if (targetStatus === "CLOSED") {
    budget.lockedAt = new Date().toISOString();
  }

  saveBudget(budget);

  recordBudgetAudit({
    budgetId: budget.id,
    action: targetStatus === "APPROVED" ? "APPROVE_BUDGET" : targetStatus === "ACTIVE" ? "ACTIVATE_BUDGET" : targetStatus === "CLOSED" ? "CLOSE_BUDGET" : "UPDATE_BUDGET",
    actorId: actor.actorId,
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    notes: `বাজেট স্ট্যাটাস পরিবর্তিত: ${previousStatus} -> ${targetStatus}. কারণ: ${reason || "N/A"}`,
    details: { previousStatus, targetStatus, reason, version: budget.currentVersion },
  });

  return { success: true, budget };
}

/**
 * Creates a new budget in DRAFT status
 */
export function createBudget(
  data: {
    titleBn: string;
    titleEn: string;
    periodId: string;
    periodNameBn: string;
    fiscalYear: string;
    startDate: string;
    endDate: string;
    notes?: string;
  },
  actor: ActorContext
): Budget {
  const now = new Date().toISOString();
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const budgetCode = `EHRJ-BUD-${year}-${rand}`;

  const newBudget: Budget = {
    id: budgetCode,
    budgetCode,
    titleBn: data.titleBn,
    titleEn: data.titleEn,
    periodId: data.periodId,
    periodNameBn: data.periodNameBn,
    fiscalYear: data.fiscalYear,
    startDate: data.startDate,
    endDate: data.endDate,
    currency: "BDT",
    status: "DRAFT",
    currentVersion: 1,
    totalIncomePlanned: 0,
    totalIncomeActual: 0,
    totalExpensePlanned: 0,
    totalExpenseActual: 0,
    totalExpenseCommitted: 0,
    totalExpenseRemaining: 0,
    netProjectedSurplus: 0,
    overallUtilizationRate: 0,
    lines: [],
    versions: [],
    warningThresholdRate: 80,
    criticalThresholdRate: 90,
    hardEnforcementEnabled: false,
    createdBy: actor.actorName,
    createdAt: now,
    updatedBy: actor.actorName,
    updatedAt: now,
    notes: data.notes,
  };

  saveBudget(newBudget);

  recordBudgetAudit({
    budgetId: newBudget.id,
    action: "CREATE_BUDGET",
    actorId: actor.actorId,
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    notes: `নতুন বাজেট খসড়া তৈরি: ${newBudget.titleBn} (${newBudget.id})`,
    details: { budgetCode, fiscalYear: newBudget.fiscalYear },
  });

  return newBudget;
}

/**
 * Adds or updates a budget line in an editable budget (DRAFT / PREPARATION)
 */
export function addOrUpdateBudgetLine(
  budgetId: string,
  lineData: Omit<BudgetLine, "id" | "budgetId"> & { id?: string },
  actor: ActorContext
): { success: boolean; line?: BudgetLine; budget?: Budget; error?: string } {
  const budget = getBudgetById(budgetId);
  if (!budget) {
    return { success: false, error: "বাজেট পাওয়া যায়নি।" };
  }

  // Allow editing in DRAFT or PREPARATION
  if (budget.status !== "DRAFT" && budget.status !== "PREPARATION") {
    return {
      success: false,
      error: `অনুমোদিত বা সক্রিয় বাজেটের লাইন সরাসরি পরিবর্তনযোগ্য নয়। বাজেট রিভিশন রিকোয়েস্ট ব্যবহার করুন (বর্তমান স্ট্যাটাস: ${budget.status})।`,
    };
  }

  const lineId = lineData.id || `BLN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const line: BudgetLine = {
    ...lineData,
    id: lineId,
    budgetId: budget.id,
    revisedAmount: lineData.revisedAmount || lineData.plannedAmount,
    actualAmount: lineData.actualAmount || 0,
    committedAmount: lineData.committedAmount || 0,
    forecastAmount: lineData.forecastAmount || lineData.plannedAmount,
    remainingAmount: (lineData.revisedAmount || lineData.plannedAmount) - ((lineData.actualAmount || 0) + (lineData.committedAmount || 0)),
    variance: lineData.categoryType === "EXPENSE"
      ? (lineData.revisedAmount || lineData.plannedAmount) - ((lineData.actualAmount || 0) + (lineData.committedAmount || 0))
      : (lineData.actualAmount || 0) - (lineData.revisedAmount || lineData.plannedAmount),
    utilizationRate: (lineData.revisedAmount || lineData.plannedAmount) > 0
      ? Math.round((((lineData.actualAmount || 0) + (lineData.committedAmount || 0)) / (lineData.revisedAmount || lineData.plannedAmount)) * 1000) / 10
      : 0,
  };

  const existingIdx = budget.lines.findIndex((l) => l.id === lineId);
  if (existingIdx >= 0) {
    budget.lines[existingIdx] = line;
  } else {
    budget.lines.push(line);
  }

  // Recalculate budget totals
  recalculateBudgetTotals(budget);
  budget.updatedBy = actor.actorName;
  budget.updatedAt = new Date().toISOString();

  saveBudget(budget);

  recordBudgetAudit({
    budgetId: budget.id,
    action: "UPDATE_BUDGET",
    actorId: actor.actorId,
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    notes: `বাজেট লাইন সংরক্ষিত: ${line.categoryNameBn} (বরাদ্দ: ৳${line.plannedAmount})`,
    details: { lineId: line.id, category: line.categoryCode, plannedAmount: line.plannedAmount },
  });

  return { success: true, line, budget };
}

/**
 * Recalculates total income, expense, surplus and utilization for a budget
 */
export function recalculateBudgetTotals(budget: Budget): void {
  let totalIncomePlanned = 0;
  let totalIncomeActual = 0;
  let totalExpensePlanned = 0;
  let totalExpenseActual = 0;
  let totalExpenseCommitted = 0;

  for (const line of budget.lines) {
    if (line.categoryType === "INCOME") {
      totalIncomePlanned += line.revisedAmount;
      totalIncomeActual += line.actualAmount;
    } else {
      totalExpensePlanned += line.revisedAmount;
      totalExpenseActual += line.actualAmount;
      totalExpenseCommitted += line.committedAmount;
    }
  }

  budget.totalIncomePlanned = totalIncomePlanned;
  budget.totalIncomeActual = totalIncomeActual;
  budget.totalExpensePlanned = totalExpensePlanned;
  budget.totalExpenseActual = totalExpenseActual;
  budget.totalExpenseCommitted = totalExpenseCommitted;
  budget.totalExpenseRemaining = totalExpensePlanned - (totalExpenseActual + totalExpenseCommitted);
  budget.netProjectedSurplus = totalIncomePlanned - totalExpensePlanned;
  budget.overallUtilizationRate =
    totalExpensePlanned > 0
      ? Math.round(((totalExpenseActual + totalExpenseCommitted) / totalExpensePlanned) * 1000) / 10
      : 0;
}
