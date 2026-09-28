/**
 * EHRJ MADRASHA ERP — PHASE 26
 * Financial & Operational Scenario Analysis Engine (What-If Modeling)
 *
 * Implements:
 * - Scenarios: BASE, CONSERVATIVE, STRESS, CUSTOM
 * - Cash Flow Runway & Reserve Depletion Simulation
 * - Governed Invariant: STRICT ISOLATION FROM REAL DATABASE LEDGER
 * - Labeled with IS_HYPOTHETICAL watermark
 */

import { prisma } from "@/lib/prisma";

export type ScenarioType = "BASE" | "CONSERVATIVE" | "STRESS" | "CUSTOM";

export interface ScenarioParams {
  type: ScenarioType;
  collectionDeltaPct: number; // e.g. -15 for 15% reduction
  expenseDeltaPct: number;    // e.g. +10 for 10% increase
  enrollmentDeltaPct: number; // e.g. -5 for 5% drop
  horizonMonths: number;      // 1 to 12
  customTitleBn?: string;
}

export interface ScenarioMonthProjection {
  monthIndex: number;
  periodLabel: string;
  projectedCollections: number;
  projectedExpenses: number;
  netCashFlow: number;
  projectedClosingReserve: number;
  isDeficit: boolean;
}

export interface ScenarioRunResult {
  scenarioId: string;
  scenarioType: ScenarioType;
  titleBn: string;
  isHypothetical: true;       // Strict invariant: cannot be mistaken for real ledger
  parameters: ScenarioParams;
  initialCashReserve: number;
  baselineMonthlyCollection: number;
  baselineMonthlyExpense: number;
  monthlyProjections: ScenarioMonthProjection[];
  summary: {
    totalProjectedCollections: number;
    totalProjectedExpenses: number;
    netCumulativeBalance: number;
    finalReserveBalance: number;
    cashRunwayMonths: number | "SUSTAINABLE";
    riskClassification: "HEALTHY" | "MODERATE_RISK" | "HIGH_RISK" | "CRITICAL_DEFICIT";
    primaryRiskFactorBn: string;
    recommendationBn: string;
  };
  generatedAt: string;
}

// -------------------------------------------------------------
// RUN SCENARIO SIMULATION
// -------------------------------------------------------------
export async function runScenarioSimulation(params: ScenarioParams): Promise<ScenarioRunResult> {
  // 1. Fetch live baseline from authoritative database
  const generalFund = await prisma.cashFund.findFirst({
    where: { code: "GENERAL" },
    select: { currentBalance: true }
  });
  const initialCashReserve = generalFund?.currentBalance || 150000;

  // Monthly receipts baseline
  const receiptsAgg = await prisma.paymentReceipt.aggregate({
    where: { paymentStatus: "SUCCESSFUL" },
    _sum: { amount: true },
    _count: true
  });
  // Use representative baseline or actual monthly
  const baselineCollection = Math.max(50000, receiptsAgg._sum.amount || 75000);

  // Monthly expense baseline
  const txAgg = await prisma.cashTransaction.aggregate({
    where: { type: "EXPENSE" },
    _sum: { amount: true },
    _count: true
  });
  const baselineExpense = Math.max(45000, txAgg._sum.amount || 65000);

  // 2. Adjust baseline according to scenario parameters
  const colMultiplier = 1 + params.collectionDeltaPct / 100;
  const expMultiplier = 1 + params.expenseDeltaPct / 100;

  const adjustedMonthlyCollection = Math.max(0, Math.round(baselineCollection * colMultiplier));
  const adjustedMonthlyExpense = Math.max(0, Math.round(baselineExpense * expMultiplier));

  // 3. Project month-by-month cash flow
  const projections: ScenarioMonthProjection[] = [];
  let currentReserve = initialCashReserve;
  let runwayMonths: number | "SUSTAINABLE" = "SUSTAINABLE";

  const now = new Date();
  const horizon = Math.min(12, Math.max(1, params.horizonMonths || 6));

  for (let m = 1; m <= horizon; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() + m, 1);
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const netFlow = adjustedMonthlyCollection - adjustedMonthlyExpense;
    currentReserve += netFlow;

    if (currentReserve <= 0 && runwayMonths === "SUSTAINABLE") {
      runwayMonths = m;
    }

    projections.push({
      monthIndex: m,
      periodLabel: label,
      projectedCollections: adjustedMonthlyCollection,
      projectedExpenses: adjustedMonthlyExpense,
      netCashFlow: netFlow,
      projectedClosingReserve: currentReserve,
      isDeficit: netFlow < 0
    });
  }

  // 4. Risk Classification
  let riskClass: "HEALTHY" | "MODERATE_RISK" | "HIGH_RISK" | "CRITICAL_DEFICIT" = "HEALTHY";
  let primaryRisk = "কোনো বিশেষ আর্থিক ঝুঁকি পরিলক্ষিত হয়নি। নগদ প্রবাহ ইতিবাচক রয়েছে।";
  let recommendation = "বর্তমান আর্থিক শৃঙ্খলা বজায় রাখুন এবং নিয়মিত বাজেট মনিটর করুন।";

  if (runwayMonths !== "SUSTAINABLE" && runwayMonths <= 3) {
    riskClass = "CRITICAL_DEFICIT";
    primaryRisk = `নগদ তহবিল মাত্র ${runwayMonths} মাসের মধ্যে সম্পূর্ণ নিঃশেষ হওয়ার উপক্রম হতে পারে।`;
    recommendation = "জরুরি ব্যয় সংকোচন, অনাদায়ী ফি দ্রুত আদায় জোরদার এবং বিকল্প অনুদান সংগ্রহের উদ্যোগ গ্রহণ করা প্রয়োজন।";
  } else if (runwayMonths !== "SUSTAINABLE" && runwayMonths <= 6) {
    riskClass = "HIGH_RISK";
    primaryRisk = `পরবর্তী ${runwayMonths} মাসের মধ্যে সাধারণ পরিচালন তহবিল ঋণাত্মক হওয়ার ঝুঁকি রয়েছে।`;
    recommendation = "অনাবশ্যক কেনাকাটা স্থগিত রাখুন এবং মাসিক বাজেট পুনর্বিন্যাস করুন।";
  } else if (adjustedMonthlyCollection < adjustedMonthlyExpense) {
    riskClass = "MODERATE_RISK";
    primaryRisk = "প্রতি মাসে আয়ের চেয়ে ব্যয় বেশি হওয়ায় সংরক্ষিত স্থিতি ধীরে ধীরে হ্রাস পাচ্ছে।";
    recommendation = "আদায় হার বৃদ্ধি এবং পরিচালন ব্যয় নিয়ন্ত্রণে সক্রিয় পদক্ষেপ নিন।";
  }

  // Scenario title
  let title = "বর্তমান ট্রেন্ডের ধারাবাহিকতা (Base Scenario)";
  if (params.type === "CONSERVATIVE") title = "রক্ষণশীল আর্থিক প্রক্ষেপণ (Conservative Scenario: -15% Collection, +5% Cost)";
  else if (params.type === "STRESS") title = "চরম আর্থিক চাপ ও সংকট মডেল (Stress Scenario: -30% Collection, +15% Cost)";
  else if (params.type === "CUSTOM" && params.customTitleBn) title = params.customTitleBn;

  return {
    scenarioId: `SCENARIO-${Date.now()}`,
    scenarioType: params.type,
    titleBn: title,
    isHypothetical: true,
    parameters: params,
    initialCashReserve,
    baselineMonthlyCollection: baselineCollection,
    baselineMonthlyExpense: baselineExpense,
    monthlyProjections: projections,
    summary: {
      totalProjectedCollections: adjustedMonthlyCollection * horizon,
      totalProjectedExpenses: adjustedMonthlyExpense * horizon,
      netCumulativeBalance: (adjustedMonthlyCollection - adjustedMonthlyExpense) * horizon,
      finalReserveBalance: currentReserve,
      cashRunwayMonths: runwayMonths,
      riskClassification: riskClass,
      primaryRiskFactorBn: primaryRisk,
      recommendationBn: recommendation
    },
    generatedAt: new Date().toISOString()
  };
}
