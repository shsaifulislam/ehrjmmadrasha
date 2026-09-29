/**
 * EHRJ MADRASHA ERP — PHASE 41
 * Budget Calculation & Variance Engine
 * 
 * Invariants:
 * 1. Financial reconciliation without duplicating Phase 6 accounting ledgers.
 * 2. Strict Fund Restrictions (Zakat, Lillah, Construction, Orphan).
 * 3. Accurate Distinction: Actual (Paid), Committed (PO/Contract), Available (Remaining), Forecast.
 */

import {
  Budget,
  BudgetLine,
  BudgetFundCode,
} from "./types";
import { getBudgetById, saveBudget } from "./budgetStore";
import { recalculateBudgetTotals } from "./budgetLifecycleEngine";

export interface FundBudgetSummary {
  fundCode: BudgetFundCode;
  fundNameBn: string;
  totalIncomePlanned: number;
  totalIncomeActual: number;
  totalExpensePlanned: number;
  totalExpenseActual: number;
  totalExpenseCommitted: number;
  totalRemaining: number;
  utilizationRate: number; // %
  netBalance: number;
}

export interface VarianceReportItem {
  lineId: string;
  categoryNameBn: string;
  fundCode: BudgetFundCode;
  categoryType: "INCOME" | "EXPENSE";
  planned: number;
  actual: number;
  committed: number;
  forecast: number;
  variance: number;
  variancePercentage: number;
  status: "FAVORABLE" | "UNFAVORABLE" | "ON_TRACK";
  notes?: string;
}

/**
 * Validates fund allocation restrictions (e.g. Zakat expenses strictly for eligible students)
 */
export function validateFundAllocationRule(
  fundCode: BudgetFundCode,
  categoryCode: string,
  categoryType: "INCOME" | "EXPENSE"
): { isValid: boolean; ruleNoticeBn?: string } {
  if (fundCode === "ZAKAT" && categoryType === "EXPENSE") {
    // Only student welfare, clothing, poor student food, and urgent medical are allowed
    const zakatPermitted = [
      "ZAKAT_WELFARE",
      "STUDENT_WELFARE",
      "POOR_STUDENT_AID",
      "ORPHAN_AID",
      "MEDICAL_AID",
    ];
    const isPermitted = zakatPermitted.some((c) => categoryCode.toUpperCase().includes(c));
    if (!isPermitted) {
      return {
        isValid: false,
        ruleNoticeBn: "শরীয়াহ লঙ্ঘন সতর্কতা: যাকাত তহবিল থেকে অবকাঠামো, সাধারণ বেতন বা প্রাতিষ্ঠানিক পরিচালনা খরচ নির্বাহ নিষিদ্ধ। শুধুমাত্র উপযুক্ত হকদার শিক্ষার্থীদের কল্যাণে বরাদ্দযোগ্য।",
      };
    }
  }

  if (fundCode === "LILLAH" && categoryType === "EXPENSE") {
    // Lillah fund is strictly for boarding food, student meals, and kitchen operations
    const lillahPermitted = [
      "FOOD",
      "GROCERY",
      "BOARDING",
      "KITCHEN",
      "GAS",
      "UTENSILS",
    ];
    const isPermitted = lillahPermitted.some((c) => categoryCode.toUpperCase().includes(c));
    if (!isPermitted) {
      return {
        isValid: false,
        ruleNoticeBn: "লিল্লাহ ফান্ড বিধি: লিল্লাহ তহবিলের অর্থ কেবলমাত্র আবাসিক পাকঘর, খাদ্যদ্রব্য ও এতিম/দরিদ্র ছাত্রদের আহার্য বাবদ ব্যয়যোগ্য।",
      };
    }
  }

  return { isValid: true };
}

/**
 * Synchronizes external financial actuals and commitments to budget lines
 */
export function updateBudgetLineActuals(
  budgetId: string,
  lineId: string,
  updates: {
    actualAmount?: number;
    committedAmount?: number;
    forecastAmount?: number;
  }
): { success: boolean; line?: BudgetLine; budget?: Budget; error?: string } {
  const budget = getBudgetById(budgetId);
  if (!budget) {
    return { success: false, error: "বাজেট পাওয়া যায়নি।" };
  }

  const line = budget.lines.find((l) => l.id === lineId);
  if (!line) {
    return { success: false, error: "বাজেট লাইন পাওয়া যায়নি।" };
  }

  if (updates.actualAmount !== undefined) {
    line.actualAmount = updates.actualAmount;
  }
  if (updates.committedAmount !== undefined) {
    line.committedAmount = updates.committedAmount;
  }
  if (updates.forecastAmount !== undefined) {
    line.forecastAmount = updates.forecastAmount;
  }

  // Recalculate line variance and utilization
  const totalOccupied = line.actualAmount + line.committedAmount;
  line.remainingAmount = line.revisedAmount - totalOccupied;

  if (line.categoryType === "EXPENSE") {
    line.variance = line.revisedAmount - totalOccupied;
    line.utilizationRate =
      line.revisedAmount > 0 ? Math.round((totalOccupied / line.revisedAmount) * 1000) / 10 : 0;
  } else {
    line.variance = line.actualAmount - line.revisedAmount;
    line.utilizationRate =
      line.revisedAmount > 0 ? Math.round((line.actualAmount / line.revisedAmount) * 1000) / 10 : 0;
  }

  recalculateBudgetTotals(budget);
  budget.updatedAt = new Date().toISOString();
  saveBudget(budget);

  return { success: true, line, budget };
}

/**
 * Generates fund-wise budget breakdown
 */
export function getFundBudgetSummaries(budgetId: string): FundBudgetSummary[] {
  const budget = getBudgetById(budgetId);
  if (!budget) return [];

  const fundMap: Record<BudgetFundCode, FundBudgetSummary> = {
    GENERAL: {
      fundCode: "GENERAL",
      fundNameBn: "সাধারণ ফান্ড",
      totalIncomePlanned: 0,
      totalIncomeActual: 0,
      totalExpensePlanned: 0,
      totalExpenseActual: 0,
      totalExpenseCommitted: 0,
      totalRemaining: 0,
      utilizationRate: 0,
      netBalance: 0,
    },
    LILLAH: {
      fundCode: "LILLAH",
      fundNameBn: "লিল্লাহ বোর্ডিং ফান্ড",
      totalIncomePlanned: 0,
      totalIncomeActual: 0,
      totalExpensePlanned: 0,
      totalExpenseActual: 0,
      totalExpenseCommitted: 0,
      totalRemaining: 0,
      utilizationRate: 0,
      netBalance: 0,
    },
    ZAKAT: {
      fundCode: "ZAKAT",
      fundNameBn: "যাকাত ফান্ড",
      totalIncomePlanned: 0,
      totalIncomeActual: 0,
      totalExpensePlanned: 0,
      totalExpenseActual: 0,
      totalExpenseCommitted: 0,
      totalRemaining: 0,
      utilizationRate: 0,
      netBalance: 0,
    },
    CONSTRUCTION: {
      fundCode: "CONSTRUCTION",
      fundNameBn: "নির্মাণ ও উন্নয়ন ফান্ড",
      totalIncomePlanned: 0,
      totalIncomeActual: 0,
      totalExpensePlanned: 0,
      totalExpenseActual: 0,
      totalExpenseCommitted: 0,
      totalRemaining: 0,
      utilizationRate: 0,
      netBalance: 0,
    },
    ORPHAN_SUPPORT: {
      fundCode: "ORPHAN_SUPPORT",
      fundNameBn: "এতিম স্পনসরশিপ ফান্ড",
      totalIncomePlanned: 0,
      totalIncomeActual: 0,
      totalExpensePlanned: 0,
      totalExpenseActual: 0,
      totalExpenseCommitted: 0,
      totalRemaining: 0,
      utilizationRate: 0,
      netBalance: 0,
    },
    OTHER: {
      fundCode: "OTHER",
      fundNameBn: "অন্যান্য বিবিধ ফান্ড",
      totalIncomePlanned: 0,
      totalIncomeActual: 0,
      totalExpensePlanned: 0,
      totalExpenseActual: 0,
      totalExpenseCommitted: 0,
      totalRemaining: 0,
      utilizationRate: 0,
      netBalance: 0,
    },
  };

  for (const line of budget.lines) {
    const f = fundMap[line.fundCode] || fundMap.OTHER;
    if (line.categoryType === "INCOME") {
      f.totalIncomePlanned += line.revisedAmount;
      f.totalIncomeActual += line.actualAmount;
    } else {
      f.totalExpensePlanned += line.revisedAmount;
      f.totalExpenseActual += line.actualAmount;
      f.totalExpenseCommitted += line.committedAmount;
    }
  }

  return Object.values(fundMap).map((f) => {
    f.totalRemaining = f.totalExpensePlanned - (f.totalExpenseActual + f.totalExpenseCommitted);
    f.utilizationRate =
      f.totalExpensePlanned > 0
        ? Math.round(((f.totalExpenseActual + f.totalExpenseCommitted) / f.totalExpensePlanned) * 1000) / 10
        : 0;
    f.netBalance = f.totalIncomeActual - f.totalExpenseActual;
    return f;
  });
}

/**
 * Generates comprehensive Variance Report
 */
export function generateVarianceReport(budgetId: string): VarianceReportItem[] {
  const budget = getBudgetById(budgetId);
  if (!budget) return [];

  return budget.lines.map((line) => {
    const isExpense = line.categoryType === "EXPENSE";
    const occupied = line.actualAmount + line.committedAmount;
    const planned = line.revisedAmount;

    let variance = 0;
    let variancePercentage = 0;
    let status: "FAVORABLE" | "UNFAVORABLE" | "ON_TRACK" = "ON_TRACK";

    if (isExpense) {
      // Expense: Positive variance is FAVORABLE (under budget). Negative is UNFAVORABLE (over budget).
      variance = planned - occupied;
      variancePercentage = planned > 0 ? Math.round((variance / planned) * 1000) / 10 : 0;
      if (occupied > planned) {
        status = "UNFAVORABLE";
      } else if (variancePercentage >= 10) {
        status = "FAVORABLE";
      }
    } else {
      // Income: Positive variance is FAVORABLE (exceeded collection). Negative is UNFAVORABLE (shortfall).
      variance = line.actualAmount - planned;
      variancePercentage = planned > 0 ? Math.round((variance / planned) * 1000) / 10 : 0;
      if (variance < 0) {
        status = "UNFAVORABLE";
      } else if (variance > 0) {
        status = "FAVORABLE";
      }
    }

    return {
      lineId: line.id,
      categoryNameBn: line.categoryNameBn,
      fundCode: line.fundCode,
      categoryType: line.categoryType,
      planned,
      actual: line.actualAmount,
      committed: line.committedAmount,
      forecast: line.forecastAmount,
      variance,
      variancePercentage,
      status,
      notes: line.notes,
    };
  });
}
