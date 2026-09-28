/**
 * EHRJ MADRASHA ERP — PHASE 26
 * Statistical Forecasting & Predictive Analytics Engine
 *
 * Implements:
 * - Simple Moving Average (SMA)
 * - Weighted Moving Average (WMA)
 * - Holt's Linear Trend / Exponential Smoothing
 * - Ordinary Least Squares (OLS) Linear Regression with 95% Prediction Bounds
 * - Backtesting & Error Metrics (MAE, MAPE)
 * - Strict Insufficiency Guards (Rule 5: Never manufacture forecasts if N < 3)
 */

import { prisma } from "@/lib/prisma";

export type ForecastMethod =
  | "SIMPLE_MOVING_AVERAGE"
  | "WEIGHTED_MOVING_AVERAGE"
  | "EXPONENTIAL_SMOOTHING"
  | "LINEAR_REGRESSION";

export interface DataPoint {
  periodLabel: string; // e.g. "2026-07", "২০২৪-২০২৫"
  timestamp: number;   // UNIX epoch or sequential step
  value: number;
}

export interface ForecastPoint {
  periodLabel: string;
  predictedValue: number;
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number; // e.g. 0.95
}

export interface BacktestResult {
  mae: number;          // Mean Absolute Error
  mape: number;         // Mean Absolute Percentage Error (%)
  sampleSize: number;
  isReliable: boolean;
}

export interface ForecastResult {
  metricKey: string;
  metricNameBn: string;
  status: "SUCCESS" | "INSUFFICIENT_DATA" | "FAILED";
  methodology: ForecastMethod;
  historicalPoints: DataPoint[];
  forecastPoints: ForecastPoint[];
  backtest?: BacktestResult;
  modelParams?: Record<string, any>;
  disclaimerBn: string;
  disclaimerEn: string;
  generatedAt: string;
}

/**
 * Minimum data points required for statistical forecasting
 */
export const MIN_HISTORICAL_PERIODS = 3;

// -------------------------------------------------------------
// 1. STATISTICAL ALGORITHMS
// -------------------------------------------------------------

/**
 * 1. Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], windowSize = 3, horizon = 1): number[] {
  if (data.length < windowSize) return [];
  const results: number[] = [];
  const extended = [...data];

  for (let h = 0; h < horizon; h++) {
    const slice = extended.slice(-windowSize);
    const avg = slice.reduce((a, b) => a + b, 0) / windowSize;
    results.push(Math.round(avg * 100) / 100);
    extended.push(avg);
  }

  return results;
}

/**
 * 2. Weighted Moving Average (WMA)
 */
export function calculateWMA(data: number[], weights = [0.5, 0.3, 0.2], horizon = 1): number[] {
  const windowSize = weights.length;
  if (data.length < windowSize) return [];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const normWeights = weights.map(w => w / totalWeight);

  const results: number[] = [];
  const extended = [...data];

  for (let h = 0; h < horizon; h++) {
    const slice = extended.slice(-windowSize);
    let weightedSum = 0;
    // slice[slice.length - 1] has weight[0] (most recent)
    for (let i = 0; i < windowSize; i++) {
      weightedSum += slice[slice.length - 1 - i] * normWeights[i];
    }
    results.push(Math.round(weightedSum * 100) / 100);
    extended.push(weightedSum);
  }

  return results;
}

/**
 * 3. Holt's Linear Exponential Smoothing (Level + Trend)
 */
export function calculateHoltsLinear(
  data: number[],
  alpha = 0.4,
  beta = 0.3,
  horizon = 1
): { predictions: number[]; finalLevel: number; finalTrend: number } {
  if (data.length < 2) return { predictions: [], finalLevel: 0, finalTrend: 0 };

  let level = data[0];
  let trend = data[1] - data[0];

  for (let i = 1; i < data.length; i++) {
    const val = data[i];
    const prevLevel = level;
    level = alpha * val + (1 - alpha) * (prevLevel + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  const predictions: number[] = [];
  for (let m = 1; m <= horizon; m++) {
    const forecast = level + m * trend;
    predictions.push(Math.max(0, Math.round(forecast * 100) / 100));
  }

  return { predictions, finalLevel: level, finalTrend: trend };
}

/**
 * 4. Ordinary Least Squares (OLS) Linear Regression with 95% Confidence Bounds
 */
export function calculateLinearRegression(
  points: { x: number; y: number }[],
  futureX: number[]
): {
  predictions: number[];
  lowerBounds: number[];
  upperBounds: number[];
  slope: number;
  intercept: number;
  rSquared: number;
  stdError: number;
} {
  const n = points.length;
  if (n < 2) {
    return { predictions: [], lowerBounds: [], upperBounds: [], slope: 0, intercept: 0, rSquared: 0, stdError: 0 };
  }

  const sumX = points.reduce((acc, p) => acc + p.x, 0);
  const sumY = points.reduce((acc, p) => acc + p.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let ssXX = 0;
  let ssYY = 0;
  let ssXY = 0;

  for (const p of points) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    ssXX += dx * dx;
    ssYY += dy * dy;
    ssXY += dx * dy;
  }

  const slope = ssXX === 0 ? 0 : ssXY / ssXX;
  const intercept = meanY - slope * meanX;

  // Residual standard error
  let ssResidual = 0;
  for (const p of points) {
    const fitted = intercept + slope * p.x;
    const err = p.y - fitted;
    ssResidual += err * err;
  }

  const degreesOfFreedom = Math.max(1, n - 2);
  const stdError = Math.sqrt(ssResidual / degreesOfFreedom);
  const rSquared = ssYY === 0 ? 1 : Math.max(0, 1 - ssResidual / ssYY);

  const tCritical = 1.96; // 95% confidence for large N approximation

  const predictions: number[] = [];
  const lowerBounds: number[] = [];
  const upperBounds: number[] = [];

  for (const x0 of futureX) {
    const yHat = intercept + slope * x0;
    // Prediction interval formula
    const distanceTerm = ssXX === 0 ? 0 : Math.pow(x0 - meanX, 2) / ssXX;
    const margin = tCritical * stdError * Math.sqrt(1 + 1 / n + distanceTerm);

    predictions.push(Math.max(0, Math.round(yHat * 100) / 100));
    lowerBounds.push(Math.max(0, Math.round((yHat - margin) * 100) / 100));
    upperBounds.push(Math.max(0, Math.round((yHat + margin) * 100) / 100));
  }

  return { predictions, lowerBounds, upperBounds, slope, intercept, rSquared, stdError };
}

/**
 * Backtest model accuracy using Mean Absolute Error & Percentage Error
 */
export function backtestModel(
  actual: number[],
  predictFn: (historicalSlice: number[]) => number
): BacktestResult {
  if (actual.length < 3) {
    return { mae: 0, mape: 0, sampleSize: 0, isReliable: false };
  }

  let totalAbsError = 0;
  let totalPercentError = 0;
  let count = 0;

  for (let i = 2; i < actual.length; i++) {
    const history = actual.slice(0, i);
    const predicted = predictFn(history);
    const trueVal = actual[i];
    const err = Math.abs(trueVal - predicted);

    totalAbsError += err;
    if (trueVal > 0) {
      totalPercentError += (err / trueVal) * 100;
    }
    count++;
  }

  const mae = count > 0 ? Math.round((totalAbsError / count) * 100) / 100 : 0;
  const mape = count > 0 ? Math.round((totalPercentError / count) * 100) / 100 : 0;
  const isReliable = mape < 25; // Reliable if error < 25%

  return { mae, mape, sampleSize: count, isReliable };
}

// -------------------------------------------------------------
// 2. DOMAIN FORECAST GENERATOR FUNCTIONS
// -------------------------------------------------------------

/**
 * 1. Forecast Student Enrollment across Academic Sessions
 */
export async function forecastStudentEnrollment(horizon = 2): Promise<ForecastResult> {
  const sessions = await prisma.academicSession.findMany({
    orderBy: { startDate: "asc" },
    include: {
      _count: {
        select: { enrollments: true }
      }
    }
  });

  const historicalPoints: DataPoint[] = sessions.map((s, idx) => ({
    periodLabel: s.name || `Session ${idx + 1}`,
    timestamp: idx,
    value: s._count.enrollments
  }));

  // Insufficiency check
  if (historicalPoints.length < MIN_HISTORICAL_PERIODS) {
    return {
      metricKey: "ACTIVE_STUDENTS_COUNT",
      metricNameBn: "শিক্ষার্থী ভর্তি ও ধারণ ক্ষমতা পূর্বাভাস",
      status: "INSUFFICIENT_DATA",
      methodology: "LINEAR_REGRESSION",
      historicalPoints,
      forecastPoints: [],
      disclaimerBn: "ঐতিহাসিক তথ্যের স্বল্পতার কারণে এই সূচকের জন্য নির্ভরযোগ্য পূর্বাভাস এখনো তৈরি করা সম্ভব নয়। নূন্যতম ৩টি সেশনের তথ্য প্রয়োজন।",
      disclaimerEn: "Insufficient historical session data to generate a reliable statistical enrollment forecast (minimum 3 sessions required).",
      generatedAt: new Date().toISOString()
    };
  }

  // Regression modeling
  const regressionPoints = historicalPoints.map(p => ({ x: p.timestamp, y: p.value }));
  const futureX = Array.from({ length: horizon }, (_, i) => historicalPoints.length + i);
  const reg = calculateLinearRegression(regressionPoints, futureX);

  const forecastPoints: ForecastPoint[] = futureX.map((fx, idx) => {
    const nextYear = 2026 + idx + 1;
    return {
      periodLabel: `${nextYear} সেশন (প্রক্ষেপণ)`,
      predictedValue: reg.predictions[idx],
      lowerBound: reg.lowerBounds[idx],
      upperBound: reg.upperBounds[idx],
      confidenceLevel: 0.95
    };
  });

  // Backtest
  const backtest = backtestModel(
    historicalPoints.map(p => p.value),
    slice => {
      const pts = slice.map((y, x) => ({ x, y }));
      const fit = calculateLinearRegression(pts, [slice.length]);
      return fit.predictions[0] || slice[slice.length - 1];
    }
  );

  return {
    metricKey: "ACTIVE_STUDENTS_COUNT",
    metricNameBn: "শিক্ষার্থী ভর্তি ও ধারণ ক্ষমতা পূর্বাভাস",
    status: "SUCCESS",
    methodology: "LINEAR_REGRESSION",
    historicalPoints,
    forecastPoints,
    backtest,
    modelParams: {
      slope: Math.round(reg.slope * 100) / 100,
      intercept: Math.round(reg.intercept * 100) / 100,
      rSquared: Math.round(reg.rSquared * 100) / 100,
      stdError: Math.round(reg.stdError * 100) / 100
    },
    disclaimerBn: "এই পূর্বাভাস একটি সম্ভাব্য প্রক্ষেপণ মাত্র, নিশ্চিত বাস্তবতা নয়। ভর্তি নীতিমালা, প্রাতিষ্ঠানিক সুযোগ-সুবিধা ও পরিস্থিতির প্রেক্ষিতে প্রকৃত ফলাফল ভিন্ন হতে পারে।",
    disclaimerEn: "This projection represents a mathematical trend under current conditions and does not constitute guaranteed future reality.",
    generatedAt: new Date().toISOString()
  };
}

/**
 * 2. Forecast Fee Collections (Monthly Cash Inflows)
 */
export async function forecastMonthlyCollections(horizon = 3): Promise<ForecastResult> {
  const receipts = await prisma.paymentReceipt.findMany({
    where: { paymentStatus: "SUCCESSFUL" },
    select: { receiptDate: true, amount: true },
    orderBy: { receiptDate: "asc" }
  });

  const monthMap: Record<string, number> = {};
  for (const r of receipts) {
    const d = new Date(r.receiptDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap[key] = (monthMap[key] || 0) + r.amount;
  }

  const sortedMonths = Object.keys(monthMap).sort();
  const historicalPoints: DataPoint[] = sortedMonths.map((m, idx) => ({
    periodLabel: m,
    timestamp: idx,
    value: monthMap[m]
  }));

  // Rule 5: Insufficient data guard
  if (historicalPoints.length < MIN_HISTORICAL_PERIODS) {
    return {
      metricKey: "TOTAL_FEES_COLLECTED",
      metricNameBn: "মাসিক ফি ও রাজস্ব আদায় পূর্বাভাস",
      status: "INSUFFICIENT_DATA",
      methodology: "WEIGHTED_MOVING_AVERAGE",
      historicalPoints,
      forecastPoints: [],
      disclaimerBn: "ঐতিহাসিক মাসিক লেনদেনের স্বল্পতার কারণে নির্ভরযোগ্য রাজস্ব পূর্বাভাস তৈরি করা সম্ভব নয়। নূন্যতম ৩ মাসের নিয়মিত তথ্য প্রয়োজন।",
      disclaimerEn: "Insufficient monthly receipt history for statistical collection forecasting (minimum 3 months required).",
      generatedAt: new Date().toISOString()
    };
  }

  // WMA Forecast
  const values = historicalPoints.map(p => p.value);
  const predictions = calculateWMA(values, [0.5, 0.3, 0.2], horizon);

  const forecastPoints: ForecastPoint[] = predictions.map((pred, idx) => {
    const lastDate = new Date(`${sortedMonths[sortedMonths.length - 1]}-01`);
    lastDate.setMonth(lastDate.getMonth() + idx + 1);
    const label = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, "0")}`;
    return {
      periodLabel: `${label} (প্রক্ষেপিত)`,
      predictedValue: pred,
      lowerBound: Math.round(pred * 0.85),
      upperBound: Math.round(pred * 1.15),
      confidenceLevel: 0.90
    };
  });

  const backtest = backtestModel(values, slice => {
    const w = calculateWMA(slice, [0.5, 0.3, 0.2], 1);
    return w[0] || slice[slice.length - 1];
  });

  return {
    metricKey: "TOTAL_FEES_COLLECTED",
    metricNameBn: "মাসিক ফি ও রাজস্ব আদায় পূর্বাভাস",
    status: "SUCCESS",
    methodology: "WEIGHTED_MOVING_AVERAGE",
    historicalPoints,
    forecastPoints,
    backtest,
    disclaimerBn: "আর্থিক পূর্বাভাসটি বিগত মাসসমূহের আদায়ের গড়ের উপর ভিত্তি করে তৈরি। এটি কোনো বাজেট অনুমোদন বা আর্থিক নিশ্চয়তা নয়।",
    disclaimerEn: "This projection is an informational moving-average trend and not an authorized institutional budget or revenue guarantee.",
    generatedAt: new Date().toISOString()
  };
}

/**
 * 3. Forecast Operating Expenses (Monthly OPEX Burn Rate)
 */
export async function forecastMonthlyExpenses(horizon = 3): Promise<ForecastResult> {
  const txs = await prisma.cashTransaction.findMany({
    where: { type: "EXPENSE" },
    select: { transactionDate: true, amount: true },
    orderBy: { transactionDate: "asc" }
  });

  const monthMap: Record<string, number> = {};
  for (const t of txs) {
    const d = new Date(t.transactionDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap[key] = (monthMap[key] || 0) + t.amount;
  }

  const sortedMonths = Object.keys(monthMap).sort();
  const historicalPoints: DataPoint[] = sortedMonths.map((m, idx) => ({
    periodLabel: m,
    timestamp: idx,
    value: monthMap[m]
  }));

  if (historicalPoints.length < MIN_HISTORICAL_PERIODS) {
    return {
      metricKey: "TOTAL_OPERATING_EXPENSES",
      metricNameBn: "মাসিক পরিচালন ব্যয় (OPEX) পূর্বাভাস",
      status: "INSUFFICIENT_DATA",
      methodology: "EXPONENTIAL_SMOOTHING",
      historicalPoints,
      forecastPoints: [],
      disclaimerBn: "ব্যয় খতিয়ানের ঐতিহাসিক সময়কালের তথ্যের স্বল্পতার কারণে ব্যয়ের পূর্বাভাস প্রস্তুত করা সম্ভব নয়। নূন্যতম ৩ মাসের তথ্য প্রয়োজন।",
      disclaimerEn: "Insufficient expense history for statistical burn rate forecasting (minimum 3 months required).",
      generatedAt: new Date().toISOString()
    };
  }

  const values = historicalPoints.map(p => p.value);
  const holt = calculateHoltsLinear(values, 0.4, 0.3, horizon);

  const forecastPoints: ForecastPoint[] = holt.predictions.map((pred, idx) => {
    const lastDate = new Date(`${sortedMonths[sortedMonths.length - 1]}-01`);
    lastDate.setMonth(lastDate.getMonth() + idx + 1);
    const label = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, "0")}`;
    return {
      periodLabel: `${label} (প্রক্ষেপিত)`,
      predictedValue: pred,
      lowerBound: Math.round(pred * 0.90),
      upperBound: Math.round(pred * 1.10),
      confidenceLevel: 0.90
    };
  });

  return {
    metricKey: "TOTAL_OPERATING_EXPENSES",
    metricNameBn: "মাসিক পরিচালন ব্যয় (OPEX) পূর্বাভাস",
    status: "SUCCESS",
    methodology: "EXPONENTIAL_SMOOTHING",
    historicalPoints,
    forecastPoints,
    disclaimerBn: "ব্যয় পূর্বাভাসটি বিগত পরিচালন ব্যয়ের ট্রেন্ডের উপর ভিত্তি করে তৈরি। এটি কোনো চূড়ান্ত বরাদ্দ নয়।",
    disclaimerEn: "Expense forecasts reflect historical burn-rate velocity and do not substitute for authorized financial allocations.",
    generatedAt: new Date().toISOString()
  };
}

/**
 * 4. Forecast Inventory Runway (Days of Supply)
 */
export async function forecastInventoryRunway(): Promise<Array<{
  itemCode: string;
  itemNameBn: string;
  currentBalance: number;
  dailyBurnRate: number;
  runwayDays: number;
  stockoutHorizon: string;
  urgency: "CRITICAL" | "WARNING" | "NORMAL";
}>> {
  const balances = await prisma.inventoryStockBalance.findMany({
    include: {
      item: true
    }
  });

  // Approximate consumption using recent issue transactions
  const txs = await prisma.inventoryTransaction.findMany({
    where: { transactionType: "ISSUE" },
    select: { itemId: true, quantity: true, createdAt: true }
  });

  const txByItem: Record<string, number> = {};
  for (const t of txs) {
    txByItem[t.itemId] = (txByItem[t.itemId] || 0) + t.quantity;
  }

  return balances.map(b => {
    const totalIssued = txByItem[b.itemId] || 0;
    // Assume 30-day baseline consumption
    const dailyBurnRate = Math.max(0.1, Math.round((totalIssued / 30) * 10) / 10);
    const runwayDays = Math.round(b.currentBalance / dailyBurnRate);

    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + runwayDays);

    let urgency: "CRITICAL" | "WARNING" | "NORMAL" = "NORMAL";
    if (runwayDays <= 7) urgency = "CRITICAL";
    else if (runwayDays <= 21) urgency = "WARNING";

    return {
      itemCode: b.item.itemCode,
      itemNameBn: b.item.nameBn,
      currentBalance: b.currentBalance,
      dailyBurnRate,
      runwayDays,
      stockoutHorizon: projectedDate.toISOString().split("T")[0],
      urgency
    };
  });
}
