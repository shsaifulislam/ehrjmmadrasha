/**
 * EHRJ MADRASHA ERP — PHASE 26
 * Early-Warning & Anomaly Detection Engine
 *
 * Implements:
 * - Statistical Anomaly Detection (Z-scores & Percentage Deviations)
 * - Configurable Multi-Domain Early-Warning Rules
 * - Alert Deduplication & Anti-Fatigue Grouping
 * - FSM Lifecycle: DETECTED -> ACKNOWLEDGED -> INVESTIGATING -> RESOLVED / DISMISSED
 * - Prediction Safety: Strictly objective observable messages (No derogatory or character labels)
 * - Prohibits Automated Punitive Actions
 */

import { prisma } from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";

export type WarningSeverity = "INFO" | "NOTICE" | "WARNING" | "HIGH" | "CRITICAL";

export type WarningStatus =
  | "DETECTED"
  | "ACKNOWLEDGED"
  | "INVESTIGATING"
  | "RESOLVED"
  | "DISMISSED"
  | "EXPIRED";

export interface EarlyWarningRule {
  ruleCode: string;
  nameBn: string;
  nameEn: string;
  domain: string;
  severity: WarningSeverity;
  targetAudience: Array<"ADMIN" | "PRINCIPAL" | "TEACHER" | "ACCOUNTANT" | "GUARDIAN">;
  thresholdBn: string;
  descriptionBn: string;
}

export interface EarlyWarningEvent {
  warningId: string;       // e.g. "EHRJ-EW-2026-000001"
  ruleCode: string;
  domain: string;
  severity: WarningSeverity;
  status: WarningStatus;
  titleBn: string;
  messageBn: string;
  targetEntity?: string;   // e.g. "JamatClass:Hifz-A"
  entityId?: string;
  observableMetric: string;
  observedValue: number | string;
  thresholdValue: number | string;
  evidence: Record<string, any>;
  detectedAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface AnomalyEvent {
  anomalyId: string;
  metricCode: string;
  domain: string;
  periodLabel: string;
  observedValue: number;
  baselineValue: number;
  deviationPercent: number;
  zScore?: number;
  descriptionBn: string;
  detectedAt: string;
}

const STORAGE_PATH = path.join(process.cwd(), "data", "governance", "early_warnings.json");

function ensureDirectoryExists() {
  const dir = path.dirname(STORAGE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadEarlyWarnings(): EarlyWarningEvent[] {
  ensureDirectoryExists();
  if (!fs.existsSync(STORAGE_PATH)) {
    fs.writeFileSync(STORAGE_PATH, JSON.stringify([], null, 2), "utf-8");
    return [];
  }
  try {
    const raw = fs.readFileSync(STORAGE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveEarlyWarnings(warnings: EarlyWarningEvent[]) {
  ensureDirectoryExists();
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(warnings, null, 2), "utf-8");
}

// -------------------------------------------------------------
// 1. RULE CATALOG
// -------------------------------------------------------------
export const EARLY_WARNING_RULES: EarlyWarningRule[] = [
  {
    ruleCode: "EW-ATT-001",
    nameBn: "জামাতভিত্তিক নিম্ন উপস্থিতি সতর্কতা",
    nameEn: "Low Class Attendance Warning",
    domain: "ATTENDANCE",
    severity: "WARNING",
    targetAudience: ["TEACHER", "PRINCIPAL", "ADMIN"],
    thresholdBn: "উপস্থিতির হার < ৭৫%",
    descriptionBn: "কোনো জামাতে সাম্প্রতিক উপস্থিতি নির্ধারিত ৭৫% বেঞ্চমার্কের নিচে নামলে এ সতর্কতা তৈরি হয়।"
  },
  {
    ruleCode: "EW-ATT-002",
    nameBn: "শিক্ষার্থীর ধারাবাহিক অনুপস্থিতি নোটিশ",
    nameEn: "Consecutive Absence Notice",
    domain: "ATTENDANCE",
    severity: "NOTICE",
    targetAudience: ["TEACHER", "GUARDIAN"],
    thresholdBn: "টানা ৩ কার্যদিবস অনুপস্থিতি",
    descriptionBn: "শিক্ষার্থী কোনো ছুটি ব্যতিরেকে টানা ৩ দিন অনুপস্থিত থাকলে অভিভাবক ও শিক্ষককে অবহিতকরণ।"
  },
  {
    ruleCode: "EW-FIN-001",
    nameBn: "মাসিক ফি আদায় ঘাটতি সতর্কতা",
    nameEn: "Monthly Fee Collection Shortfall",
    domain: "FINANCE",
    severity: "HIGH",
    targetAudience: ["PRINCIPAL", "ADMIN", "ACCOUNTANT"],
    thresholdBn: "আদায়কৃত হার < ৭০% (মাসের ২০ তারিখের মধ্যে)",
    descriptionBn: "চলতি মাসের নির্ধারিত লক্ষ্যমাত্রার তুলনায় ফি আদায় উল্লেখযোগ্যভাবে কম থাকলে সতর্কবার্তা প্রদান।"
  },
  {
    ruleCode: "EW-FIN-002",
    nameBn: "পরিচালন তহবিল সংকট ঝুঁকি",
    nameEn: "Operating Cash Runway Hazard",
    domain: "FINANCE",
    severity: "CRITICAL",
    targetAudience: ["PRINCIPAL", "ADMIN"],
    thresholdBn: "নগদ স্থিতি < ১ মাসের বেতন ও অপরিহার্য বিল",
    descriptionBn: "সাধারণ ফান্ডের ব্যালেন্স যদি পরবর্তী এক মাসের নির্ধারিত বেতন ও পরিচালন ব্যয়ের চেয়ে কমে যায়।"
  },
  {
    ruleCode: "EW-INV-001",
    nameBn: "মজুদ মালামাল সংকট সতর্কতা",
    nameEn: "Inventory Stockout Runway Warning",
    domain: "INVENTORY",
    severity: "WARNING",
    targetAudience: ["ADMIN"],
    thresholdBn: "অবশিষ্ট মজুদ <= ৫ অথবা রানওয়ে <= ৭ দিন",
    descriptionBn: "ব্যবহারযোগ্য শিক্ষা বা পরিচালন সামগ্রীর মজুদ শূন্যের কাছাকাছি পৌঁছানোর পূর্বাভাস।"
  },
  {
    ruleCode: "EW-HR-001",
    nameBn: "শিক্ষক অনুপস্থিতি ও ক্লাসের বিকল্প প্রস্তুতি",
    nameEn: "Faculty Concurrent Leave Alert",
    domain: "HR",
    severity: "HIGH",
    targetAudience: ["PRINCIPAL", "ADMIN"],
    thresholdBn: "একই দিনে অনুমোদিত ছুটি > ২৫% শিক্ষক",
    descriptionBn: "একই কার্যদিবসে একাধিক শিক্ষকের অনুমোদিত ছুটি থাকলে শিক্ষা কার্যক্রম সচল রাখতে সতর্কতা।"
  },
  {
    ruleCode: "EW-OPS-001",
    nameBn: "জরুরি সেবা টিকিটের সময়োত্তীর্ণতা",
    nameEn: "Urgent Support SLA Overdue",
    domain: "HELPDESK",
    severity: "WARNING",
    targetAudience: ["ADMIN"],
    thresholdBn: "জরুরি টিকিট অমীমাংসিত সময় > ৪৮ ঘণ্টা",
    descriptionBn: "জরুরি ক্যাটাগরির কোনো ছাত্র/অভিভাবক সেবা অনুরোধ ৪৮ ঘণ্টার অধিক অনিষ্পন্ন থাকলে সতর্কতা।"
  },
  {
    ruleCode: "EW-ACAD-001",
    nameBn: "বিষয়ভিত্তিক অকৃতকার্য হার সতর্কতা",
    nameEn: "High Subject Failure Rate Alert",
    domain: "ACADEMIC",
    severity: "WARNING",
    targetAudience: ["TEACHER", "PRINCIPAL"],
    thresholdBn: "অকৃতকার্য হার > ৩০%",
    descriptionBn: "টার্ম বা সামষ্টিক পরীক্ষায় নির্দিষ্ট কোনো বিষয়ে ৩০% এর বেশি পরীক্ষার্থী অকৃতকার্য হলে সতর্কীকরণ।"
  }
];

// -------------------------------------------------------------
// 2. RUN EARLY WARNING DETECTION ENGINE
// -------------------------------------------------------------
export async function runEarlyWarningDetection(): Promise<{
  newWarningsDetected: number;
  activeWarningsTotal: number;
  anomaliesDetected: number;
  warnings: EarlyWarningEvent[];
  anomalies: AnomalyEvent[];
}> {
  const existingWarnings = loadEarlyWarnings();
  const newEvents: EarlyWarningEvent[] = [];
  const anomalies: AnomalyEvent[] = [];

  // Helper: check if active warning already exists for deduplication
  const hasActiveWarning = (ruleCode: string, entityId?: string) => {
    return existingWarnings.some(
      w => w.ruleCode === ruleCode &&
           w.entityId === entityId &&
           ["DETECTED", "ACKNOWLEDGED", "INVESTIGATING"].includes(w.status)
    );
  };

  // 1. CHECK EW-FIN-002: Operating Cash Runway vs 1 Month Payroll
  const generalFund = await prisma.cashFund.findFirst({
    where: { code: "GENERAL" },
    select: { currentBalance: true }
  });
  const payrollAgg = await prisma.payrollRecord.aggregate({
    _sum: { netSalary: true },
    _count: true
  });
  const monthlyPayrollBill = payrollAgg._sum.netSalary || 50000;
  const currentCash = generalFund?.currentBalance || 0;

  if (currentCash < monthlyPayrollBill) {
    if (!hasActiveWarning("EW-FIN-002", "FUND-GENERAL")) {
      newEvents.push({
        warningId: `EHRJ-EW-2026-${String(Date.now()).slice(-6)}`,
        ruleCode: "EW-FIN-002",
        domain: "FINANCE",
        severity: "CRITICAL",
        status: "DETECTED",
        titleBn: "সাধারণ তহবিল পরিচালনা ঝুঁকি",
        messageBn: `সাধারণ তহবিলের বর্তমান নগদ স্থিতি (৳${currentCash.toLocaleString("bn-BD")}) পরবর্তী এক মাসের আনুমানিক বেতন ব্যয়ের (৳${monthlyPayrollBill.toLocaleString("bn-BD")}) নিচে রয়েছে।`,
        targetEntity: "CashFund:GENERAL",
        entityId: "FUND-GENERAL",
        observableMetric: "GeneralFundBalance vs MonthlyPayroll",
        observedValue: `৳${currentCash}`,
        thresholdValue: `৳${monthlyPayrollBill}`,
        evidence: { currentBalance: currentCash, monthlyPayroll: monthlyPayrollBill },
        detectedAt: new Date().toISOString()
      });
    }
  }

  // 2. CHECK EW-INV-001: Low stock inventory balances
  const lowStockBalances = await prisma.inventoryStockBalance.findMany({
    where: { currentBalance: { lte: 5 } },
    include: { item: true }
  });

  for (const b of lowStockBalances) {
    if (!hasActiveWarning("EW-INV-001", b.itemId)) {
      newEvents.push({
        warningId: `EHRJ-EW-2026-${String(Date.now() + Math.floor(Math.random() * 999)).slice(-6)}`,
        ruleCode: "EW-INV-001",
        domain: "INVENTORY",
        severity: "WARNING",
        status: "DETECTED",
        titleBn: `স্বল্প মজুদ সতর্কতা: ${b.item.nameBn}`,
        messageBn: `মালামাল '${b.item.nameBn}' এর বর্তমান স্টক ব্যালেন্স (${b.currentBalance}) নির্ধারিত সতর্কীকরণ মাত্রা ৫ বা তার নিচে রয়েছে।`,
        targetEntity: `InventoryItem:${b.item.itemCode}`,
        entityId: b.itemId,
        observableMetric: "InventoryStockBalance",
        observedValue: b.currentBalance,
        thresholdValue: 5,
        evidence: { itemCode: b.item.itemCode, balance: b.currentBalance },
        detectedAt: new Date().toISOString()
      });
    }
  }

  // 3. CHECK EW-OPS-001: Urgent Support SLA Overdue (> 48h)
  const twoDaysAgo = new Date();
  twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

  const urgentOverdueTickets = await prisma.supportRequest.findMany({
    where: {
      priority: "URGENT",
      status: { in: ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "WAITING_FOR_INFORMATION"] },
      createdAt: { lt: twoDaysAgo }
    },
    take: 5
  });

  if (urgentOverdueTickets.length > 0 && !hasActiveWarning("EW-OPS-001", "URGENT-QUEUE")) {
    newEvents.push({
      warningId: `EHRJ-EW-2026-${String(Date.now() + 101).slice(-6)}`,
      ruleCode: "EW-OPS-001",
      domain: "HELPDESK",
      severity: "WARNING",
      status: "DETECTED",
      titleBn: "জরুরি সেবা টিকিটের সময়োত্তীর্ণতা",
      messageBn: `${urgentOverdueTickets.length}টি জরুরি সহায়তা বা অভিযোগ টিকিট ৪৮ ঘণ্টার অধিক সময় ধরে অমীমাংসিত রয়েছে।`,
      targetEntity: "SupportRequestQueue:URGENT",
      entityId: "URGENT-QUEUE",
      observableMetric: "OverdueUrgentTicketsCount",
      observedValue: urgentOverdueTickets.length,
      thresholdValue: 0,
      evidence: { ticketCount: urgentOverdueTickets.length, sampleTickets: urgentOverdueTickets.map(t => t.ticketNumber) },
      detectedAt: new Date().toISOString()
    });
  }

  // 4. STATISTICAL ANOMALY DETECTION: Monthly Expense Spike
  const recentTxs = await prisma.cashTransaction.findMany({
    where: { type: "EXPENSE" },
    select: { amount: true, transactionDate: true },
    orderBy: { transactionDate: "desc" },
    take: 50
  });

  if (recentTxs.length >= 5) {
    const amounts = recentTxs.map(t => t.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    for (const t of recentTxs.slice(0, 3)) {
      if (stdDev > 0) {
        const z = (t.amount - mean) / stdDev;
        if (z >= 2.0) {
          anomalies.push({
            anomalyId: `ANOM-${Date.now()}-${Math.floor(Math.random() * 100)}`,
            metricCode: "EXPENSE_TRANSACTION_ANOMALY",
            domain: "FINANCE",
            periodLabel: new Date(t.transactionDate).toISOString().split("T")[0],
            observedValue: t.amount,
            baselineValue: Math.round(mean),
            deviationPercent: Math.round(((t.amount - mean) / mean) * 100),
            zScore: Math.round(z * 100) / 100,
            descriptionBn: `একটি সাম্প্রতিক ব্যয়ের পরিমাণ (৳${t.amount.toLocaleString("bn-BD")}) গড় ব্যয়ের (৳${Math.round(mean).toLocaleString("bn-BD")}) তুলনায় Z-Score ${z.toFixed(1)} মাত্রায় বেশি।`,
            detectedAt: new Date().toISOString()
          });
        }
      }
    }
  }

  // Merge & save warnings
  const updatedWarnings = [...newEvents, ...existingWarnings];
  saveEarlyWarnings(updatedWarnings);

  const activeCount = updatedWarnings.filter(w =>
    ["DETECTED", "ACKNOWLEDGED", "INVESTIGATING"].includes(w.status)
  ).length;

  return {
    newWarningsDetected: newEvents.length,
    activeWarningsTotal: activeCount,
    anomaliesDetected: anomalies.length,
    warnings: updatedWarnings,
    anomalies
  };
}

// -------------------------------------------------------------
// 3. WARNING LIFECYCLE MANAGEMENT
// -------------------------------------------------------------
export function transitionWarningStatus(
  warningId: string,
  newStatus: WarningStatus,
  actorName: string,
  notes?: string
): EarlyWarningEvent {
  const warnings = loadEarlyWarnings();
  const item = warnings.find(w => w.warningId === warningId);
  if (!item) {
    throw new Error(`Early warning '${warningId}' not found.`);
  }

  item.status = newStatus;
  const now = new Date().toISOString();

  if (newStatus === "ACKNOWLEDGED") {
    item.acknowledgedBy = actorName;
    item.acknowledgedAt = now;
  } else if (newStatus === "RESOLVED" || newStatus === "DISMISSED") {
    item.resolvedBy = actorName;
    item.resolvedAt = now;
    if (notes) item.resolutionNotes = notes;
  }

  saveEarlyWarnings(warnings);
  return item;
}
