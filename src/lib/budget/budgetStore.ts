/**
 * EHRJ MADRASHA ERP — PHASE 41
 * Institutional Budget Atomic Persistence Store
 * 
 * Non-Negotiable Rules:
 * 1. Plan and control the money without duplicating Phase 6 accounting ledgers.
 * 2. Real data persistence with atomic safe writes.
 * 3. Seed data models realistic Madrasha funds (General, Lillah, Zakat, Construction, Orphan).
 */

import fs from "fs";
import path from "path";
import {
  BudgetPeriod,
  Budget,
  BudgetLine,
  BudgetRevision,
  BudgetProject,
  BudgetFundCode,
  BudgetControlAlert,
  BudgetAuditEntry,
  BudgetDashboardStats,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "budgets");
const PERIODS_FILE = path.join(DATA_DIR, "periods.json");
const BUDGETS_FILE = path.join(DATA_DIR, "budgets.json");
const REVISIONS_FILE = path.join(DATA_DIR, "revisions.json");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
const ALERTS_FILE = path.join(DATA_DIR, "alerts.json");
const AUDIT_FILE = path.join(DATA_DIR, "audit_log.json");

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function safeAtomicWrite(filePath: string, data: any) {
  ensureDirectoryExists();
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tempPath, filePath);
}

// -------------------------------------------------------------
// SEED DATA GENERATOR
// -------------------------------------------------------------

function generateSeedPeriods(): BudgetPeriod[] {
  return [
    {
      id: "EHRJ-BPR-2026-FY",
      periodCode: "FY-2026-2027",
      titleBn: "অর্থবছর ২০২৬-২০২৭ বার্ষিক বাজেট মেয়াদ",
      titleEn: "Fiscal Year 2026-2027 Institutional Period",
      periodType: "FINANCIAL_YEAR",
      startDate: "2026-07-01",
      endDate: "2027-06-30",
      status: "ACTIVE",
      isLocked: false,
      notes: "মাদরাসার প্রধান পরিচালন ও উন্নয়ন বাজেট মেয়াদ",
      createdBy: "মুহতামিম সাহেব ও অর্থ কমিটি",
      createdAt: "2026-06-15T10:00:00.000Z",
      approvedBy: "সভাপতি ও গভর্নিং বডি",
    },
    {
      id: "EHRJ-BPR-2025-FY",
      periodCode: "FY-2025-2026",
      titleBn: "অর্থবছর ২০২৫-২০২৬ (সমাপ্ত)",
      titleEn: "Fiscal Year 2025-2026 (Closed)",
      periodType: "FINANCIAL_YEAR",
      startDate: "2025-07-01",
      endDate: "2026-06-30",
      status: "CLOSED",
      isLocked: true,
      notes: "অডিটকৃত ও সমাপ্ত অর্থবছর",
      createdBy: "মুহতামিম সাহেব",
      createdAt: "2025-06-20T10:00:00.000Z",
      approvedBy: "গভর্নিং বডি",
      lockedAt: "2026-07-05T12:00:00.000Z",
    },
  ];
}

function generateSeedBudgets(): Budget[] {
  const monthsBn = [
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন"
  ];

  function makeMonthly(annualPlanned: number, annualActual: number, annualCommitted: number) {
    const monthlyPlanned = Math.round(annualPlanned / 12);
    const monthlyActual = Math.round(annualActual / 12);
    const monthlyCommitted = Math.round(annualCommitted / 12);
    return monthsBn.map((m, idx) => ({
      monthIndex: idx + 1,
      monthNameBn: m,
      plannedAmount: monthlyPlanned,
      actualAmount: idx < 3 ? monthlyActual : 0, // 3 months elapsed (Q1 of FY)
      committedAmount: idx < 3 ? monthlyCommitted : 0,
      forecastAmount: monthlyPlanned,
      remainingAmount: monthlyPlanned - (idx < 3 ? monthlyActual + monthlyCommitted : 0),
      variance: monthlyPlanned - (idx < 3 ? monthlyActual + monthlyCommitted : 0),
    }));
  }

  // Lines for Budget 2026-2027
  const lines: BudgetLine[] = [
    // 1. INCOME: Student Tuition & Admission (General Fund)
    {
      id: "BLN-2026-INC-001",
      budgetId: "EHRJ-BUD-2026-0001",
      fundCode: "GENERAL",
      fundNameBn: "সাধারণ ফান্ড",
      categoryType: "INCOME",
      categoryCode: "STUDENT_FEES",
      categoryNameBn: "শিক্ষার্থী ভর্তি ও মাসিক বেতন ফি",
      departmentNameBn: "হিসাব দপ্তর",
      plannedAmount: 3600000,
      revisedAmount: 3600000,
      actualAmount: 950000, // Q1 actual collections
      committedAmount: 0,
      remainingAmount: 2650000,
      forecastAmount: 3700000,
      variance: 950000 - 900000, // actual - planned for Q1
      utilizationRate: 26.4,
      monthlyAllocations: makeMonthly(3600000, 950000, 0),
      notes: "হিফজ, কিতাব ও নূরানী বিভাগের ছাত্রদের মাসিক ফি",
    },
    // 2. INCOME: Lillah Donations & Public Gifts
    {
      id: "BLN-2026-INC-002",
      budgetId: "EHRJ-BUD-2026-0001",
      fundCode: "LILLAH",
      fundNameBn: "লিল্লাহ বোর্ডিং ফান্ড",
      categoryType: "INCOME",
      categoryCode: "LILLAH_DONATIONS",
      categoryNameBn: "লিল্লাহ বোর্ডিং সাধারণ দান ও খাদ্য সাহায্য",
      departmentNameBn: "লিল্লাহ পাকঘর দপ্তর",
      plannedAmount: 2400000,
      revisedAmount: 2400000,
      actualAmount: 620000,
      committedAmount: 0,
      remainingAmount: 1780000,
      forecastAmount: 2450000,
      variance: 20000,
      utilizationRate: 25.8,
      monthlyAllocations: makeMonthly(2400000, 620000, 0),
      notes: "জুমার দান ও স্থানীয় দানশীল ব্যক্তিদের খাদ্য অনুদান",
    },
    // 3. INCOME: Zakat Fund Collections
    {
      id: "BLN-2026-INC-003",
      budgetId: "EHRJ-BUD-2026-0001",
      fundCode: "ZAKAT",
      fundNameBn: "যাকাত ফান্ড",
      categoryType: "INCOME",
      categoryCode: "ZAKAT_COLLECTIONS",
      categoryNameBn: "যাকাত ও ফিতরা তহবিল",
      departmentNameBn: "যাকাত তদারকি কমিটি",
      plannedAmount: 1800000,
      revisedAmount: 1800000,
      actualAmount: 450000,
      committedAmount: 0,
      remainingAmount: 1350000,
      forecastAmount: 1800000,
      variance: 0,
      utilizationRate: 25.0,
      monthlyAllocations: makeMonthly(1800000, 450000, 0),
      zakatEligibleOnly: true,
      notes: "শরীয়াহ মোতাবেক দরিদ্র ছাত্রদের ভরণপোষণে ব্যয়যোগ্য",
    },
    // 4. EXPENSE: Teachers Salary (General Fund)
    {
      id: "BLN-2026-EXP-001",
      budgetId: "EHRJ-BUD-2026-0001",
      fundCode: "GENERAL",
      fundNameBn: "সাধারণ ফান্ড",
      categoryType: "EXPENSE",
      categoryCode: "TEACHER_SALARY",
      categoryNameBn: "উস্তাদ ও শিক্ষকবৃন্দের মাসিক বেতন ও ভাতা",
      departmentNameBn: "একাডেমিক দপ্তর",
      plannedAmount: 3000000,
      revisedAmount: 3000000,
      actualAmount: 750000, // 3 months paid
      committedAmount: 250000, // Current month payroll pending
      remainingAmount: 2000000,
      forecastAmount: 3050000,
      variance: 3000000 - (750000 + 250000),
      utilizationRate: 33.3,
      monthlyAllocations: makeMonthly(3000000, 750000, 250000),
      costCenterCode: "CC-ACADEMIC-01",
      notes: "Phase 13 HR অথরিটেটিভ পে-রোল রেজিস্টারের সাথে সিঙ্কড",
    },
    // 5. EXPENSE: Lillah Boarding Meals & Groceries (Lillah Fund)
    {
      id: "BLN-2026-EXP-002",
      budgetId: "EHRJ-BUD-2026-0001",
      fundCode: "LILLAH",
      fundNameBn: "লিল্লাহ বোর্ডিং ফান্ড",
      categoryType: "EXPENSE",
      categoryCode: "BOARDING_FOOD",
      categoryNameBn: "লিল্লাহ বোর্ডিং ছাত্রদের দৈনিক খাবার ও চাল-ডাল",
      departmentNameBn: "হোস্টেল ও পাকঘর",
      plannedAmount: 1800000,
      revisedAmount: 1800000,
      actualAmount: 480000,
      committedAmount: 90000, // Open PO for Rice & Oil
      remainingAmount: 1230000,
      forecastAmount: 1850000,
      variance: 1800000 - (480000 + 90000),
      utilizationRate: 31.7,
      monthlyAllocations: makeMonthly(1800000, 480000, 90000),
      costCenterCode: "CC-LILLAH-02",
      notes: "Phase 12 পারচেজ অর্ডার ও গুডস রিসিটের ভিত্তিতে ট্র্যাকিং",
    },
    // 6. EXPENSE: Utilities - Gas, Electricity, Water (General Fund)
    {
      id: "BLN-2026-EXP-003",
      budgetId: "EHRJ-BUD-2026-0001",
      fundCode: "GENERAL",
      fundNameBn: "সাধারণ ফান্ড",
      categoryType: "EXPENSE",
      categoryCode: "UTILITIES",
      categoryNameBn: "বিদ্যুৎ বিল, গ্যাস ও পানির পাম্প সার্ভিস",
      departmentNameBn: "প্রশাসনিক দপ্তর",
      plannedAmount: 480000,
      revisedAmount: 480000,
      actualAmount: 135000,
      committedAmount: 38000,
      remainingAmount: 307000,
      forecastAmount: 490000,
      variance: 307000,
      utilizationRate: 36.0,
      monthlyAllocations: makeMonthly(480000, 135000, 38000),
      notes: "গ্রীষ্মকালীন অতিরিক্ত বিদ্যুৎ ব্যয় সমন্বিত",
    },
    // 7. EXPENSE: Campus Roof Waterproofing & Renovation (Construction Fund)
    {
      id: "BLN-2026-EXP-004",
      budgetId: "EHRJ-BUD-2026-0001",
      fundCode: "CONSTRUCTION",
      fundNameBn: "নির্মাণ ও উন্নয়ন ফান্ড",
      categoryType: "EXPENSE",
      categoryCode: "BUILDING_REPAIR",
      categoryNameBn: "প্রধান একাডেমিক ভবনের ছাদ ওয়াটারপ্রুফিং ও সংস্কার",
      departmentNameBn: "রক্ষণাবেক্ষণ দপ্তর",
      plannedAmount: 600000,
      revisedAmount: 600000,
      actualAmount: 450000,
      committedAmount: 100000, // Work in progress contract
      remainingAmount: 50000,
      forecastAmount: 620000,
      variance: 50000,
      utilizationRate: 91.7, // Critical threshold triggered (>90%)
      monthlyAllocations: makeMonthly(600000, 450000, 100000),
      projectReferenceId: "EHRJ-BPRJ-2026-001",
      notes: "ঠিকাদার চুক্তি নং CNT-2026-004 অনুসারে চলমান",
    },
    // 8. EXPENSE: Zakat Welfare Kits (Zakat Fund)
    {
      id: "BLN-2026-EXP-005",
      budgetId: "EHRJ-BUD-2026-0001",
      fundCode: "ZAKAT",
      fundNameBn: "যাকাত ফান্ড",
      categoryType: "EXPENSE",
      categoryCode: "ZAKAT_WELFARE",
      categoryNameBn: "দরিদ্র ও এতিম ছাত্রদের কিতাব, পোশাক ও চিকিৎসা অনুদান",
      departmentNameBn: "ছাত্রকল্যাণ দপ্তর",
      plannedAmount: 1200000,
      revisedAmount: 1200000,
      actualAmount: 320000,
      committedAmount: 50000,
      remainingAmount: 830000,
      forecastAmount: 1200000,
      variance: 830000,
      utilizationRate: 30.8,
      monthlyAllocations: makeMonthly(1200000, 320000, 50000),
      zakatEligibleOnly: true,
      notes: "শুধুমাত্র যাকাতগ্রহণে উপযুক্ত শিক্ষার্থীদের জন্য সংরক্ষিত",
    },
  ];

  const totalIncomePlanned = 3600000 + 2400000 + 1800000;
  const totalIncomeActual = 950000 + 620000 + 450000;
  const totalExpensePlanned = 3000000 + 1800000 + 480000 + 600000 + 1200000;
  const totalExpenseActual = 750000 + 480000 + 135000 + 450000 + 320000;
  const totalExpenseCommitted = 250000 + 90000 + 38000 + 100000 + 50000;
  const totalExpenseRemaining = totalExpensePlanned - (totalExpenseActual + totalExpenseCommitted);

  const budget1: Budget = {
    id: "EHRJ-BUD-2026-0001",
    budgetCode: "EHRJ-BUD-2026-0001",
    titleBn: "ইলিয়টগঞ্জ মাদরাসা বার্ষিক প্রাতিষ্ঠানিক বাজেট ২০২৬-২০২৭",
    titleEn: "EHRJ Madrasha Annual Institutional Budget 2026-2027",
    periodId: "EHRJ-BPR-2026-FY",
    periodNameBn: "অর্থবছর ২০২৬-২০২৭ বার্ষিক বাজেট মেয়াদ",
    fiscalYear: "2026-2027",
    startDate: "2026-07-01",
    endDate: "2027-06-30",
    currency: "BDT",
    status: "ACTIVE",
    currentVersion: 1,
    totalIncomePlanned,
    totalIncomeActual,
    totalExpensePlanned,
    totalExpenseActual,
    totalExpenseCommitted,
    totalExpenseRemaining,
    netProjectedSurplus: totalIncomePlanned - totalExpensePlanned,
    overallUtilizationRate: Math.round(((totalExpenseActual + totalExpenseCommitted) / totalExpensePlanned) * 1000) / 10,
    lines,
    versions: [
      {
        versionNumber: 1,
        effectiveDate: "2026-07-01",
        approvedBy: "সভাপতি ও গভর্নিং বডি",
        approvalReference: "GB-RES-2026-44",
        totalPlannedIncome: totalIncomePlanned,
        totalPlannedExpense: totalExpensePlanned,
        totalPlannedSurplusDeficit: totalIncomePlanned - totalExpensePlanned,
        linesSnapshot: lines,
        revisionReason: "মূল অনুমোদিত বার্ষিক বাজেট",
        createdAt: "2026-06-25T11:30:00.000Z",
      },
    ],
    warningThresholdRate: 80,
    criticalThresholdRate: 90,
    hardEnforcementEnabled: false,
    createdBy: "মুহতামিম সাহেব",
    createdAt: "2026-06-20T10:00:00.000Z",
    approvedBy: "সভাপতি ও গভর্নিং বডি",
    approvedAt: "2026-06-25T11:30:00.000Z",
    updatedBy: "অ্যাডমিন",
    updatedAt: "2026-09-29T12:00:00.000Z",
    notes: "মাদরাসার সকল বিভাগ ও ফান্ডের সম্মিলিত বার্ষিক আর্থিক পরিকল্পনা।",
  };

  return [budget1];
}

function generateSeedProjects(): BudgetProject[] {
  return [
    {
      id: "EHRJ-BPRJ-2026-001",
      projectCode: "PRJ-ROOF-2026",
      nameBn: "প্রধান একাডেমিক ভবনের ছাদ ওয়াটারপ্রুফিং ও সংস্কার প্রকল্প",
      nameEn: "Main Academic Building Roof Waterproofing & Renovation",
      descriptionBn: "বৃষ্টির পানি রোধ এবং হিফজখানা ও কিতাব বিভাগের কক্ষ সুরক্ষা নিশ্চিতকরণ।",
      fundCode: "CONSTRUCTION",
      fundNameBn: "নির্মাণ ও উন্নয়ন ফান্ড",
      startDate: "2026-08-01",
      endDate: "2026-11-30",
      status: "ACTIVE",
      approvedBudget: 600000,
      revisedBudget: 600000,
      actualExpense: 450000,
      committedAmount: 100000,
      remainingBudget: 50000,
      utilizationRate: 91.7,
      projectManagerName: "ইঞ্জিনিয়ার রফিকুল ইসলাম (উপদেষ্টা)",
      contractorVendorName: "মেসার্স আল-আমিন কনস্ট্রাকশন",
      createdAt: "2026-07-20T10:00:00.000Z",
      updatedAt: "2026-09-29T10:00:00.000Z",
    },
    {
      id: "EHRJ-BPRJ-2026-002",
      projectCode: "PRJ-ITLAB-2026",
      nameBn: "ডিজিটাল ক্যাম্পাস কম্পিউটার ও কিরাত ল্যাব স্থাপন প্রকল্প",
      nameEn: "Digital Campus IT & Qirat Audio Lab Project",
      descriptionBn: "ছাত্রদের জন্য ১০টি কম্পিউটার ও সহীহ কিরাত অনুশীলনের সাউন্ড ল্যাব প্রতিষ্ঠা।",
      fundCode: "GENERAL",
      fundNameBn: "সাধারণ ফান্ড",
      startDate: "2026-10-01",
      endDate: "2027-01-31",
      status: "APPROVED",
      approvedBudget: 450000,
      revisedBudget: 450000,
      actualExpense: 0,
      committedAmount: 80000, // Quotation received
      remainingBudget: 370000,
      utilizationRate: 17.8,
      projectManagerName: "মাওলানা ক্বারী হাবিবুল্লাহ",
      contractorVendorName: "স্মার্ট সল্যুশন্স কুমিল্লা",
      createdAt: "2026-08-15T10:00:00.000Z",
      updatedAt: "2026-09-29T10:00:00.000Z",
    },
  ];
}

function generateSeedAlerts(): BudgetControlAlert[] {
  return [
    {
      id: "EHRJ-BALT-2026-001",
      budgetId: "EHRJ-BUD-2026-0001",
      budgetLineId: "BLN-2026-EXP-004",
      projectId: "EHRJ-BPRJ-2026-001",
      categoryNameBn: "প্রধান একাডেমিক ভবনের ছাদ ওয়াটারপ্রুফিং ও সংস্কার",
      fundCode: "CONSTRUCTION",
      alertLevel: "CRITICAL",
      utilizationRate: 91.7,
      thresholdRate: 90,
      currentExpenseAmount: 550000, // Actual 450k + Committed 100k
      plannedAmount: 600000,
      overrunAmount: 0,
      messageBn: "সতর্কবার্তা: ছাদ সংস্কার খাতের বাজেট ব্যয় ৯১.৭% অতিক্রম করেছে (সীমা ৯০%)। দ্রুত বাজেট রিভিশন বিবেচনা করুন।",
      isAcknowledged: false,
      createdAt: "2026-09-25T14:30:00.000Z",
    },
  ];
}

// -------------------------------------------------------------
// PUBLIC ACCESSORS AND ATOMIC MUTATORS
// -------------------------------------------------------------

export function getAllPeriods(): BudgetPeriod[] {
  ensureDirectoryExists();
  if (!fs.existsSync(PERIODS_FILE)) {
    const seed = generateSeedPeriods();
    safeAtomicWrite(PERIODS_FILE, seed);
    return seed;
  }
  try {
    return JSON.parse(fs.readFileSync(PERIODS_FILE, "utf8"));
  } catch (err) {
    return [];
  }
}

export function getPeriodById(id: string): BudgetPeriod | null {
  const periods = getAllPeriods();
  return periods.find((p) => p.id === id || p.periodCode === id) || null;
}

export function savePeriod(period: BudgetPeriod): void {
  const periods = getAllPeriods();
  const idx = periods.findIndex((p) => p.id === period.id);
  if (idx >= 0) {
    periods[idx] = period;
  } else {
    periods.unshift(period);
  }
  safeAtomicWrite(PERIODS_FILE, periods);
}

export function createPeriod(
  data: {
    fiscalYear: string;
    nameBn: string;
    nameEn: string;
    startDate: string;
    endDate: string;
    notes?: string;
  },
  actor: { actorId: string; actorName: string; actorRole: string }
): BudgetPeriod {
  const periodCode = `FY-${data.fiscalYear}`;
  const id = `EHRJ-BPR-${data.fiscalYear}`;
  const period: BudgetPeriod = {
    id,
    periodCode,
    titleBn: data.nameBn,
    titleEn: data.nameEn,
    periodType: "FINANCIAL_YEAR",
    startDate: data.startDate,
    endDate: data.endDate,
    status: "PLANNED",
    isLocked: false,
    notes: data.notes,
    createdBy: actor.actorName,
    createdAt: new Date().toISOString(),
  };
  savePeriod(period);
  recordBudgetAudit({
    budgetId: "GLOBAL",
    action: "CREATE_BUDGET",
    actorId: actor.actorId,
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    notes: `নতুন বাজেট অর্থবছর তৈরি: ${period.titleBn} (${period.periodCode})`,
    details: { periodId: period.id, fiscalYear: data.fiscalYear },
  });
  return period;
}

export function lockPeriod(
  periodId: string,
  actor: { actorId: string; actorName: string; actorRole: string },
  notes?: string
): BudgetPeriod | null {
  const period = getPeriodById(periodId);
  if (!period) return null;
  period.isLocked = true;
  period.status = "CLOSED";
  period.lockedAt = new Date().toISOString();
  if (notes) period.notes = `${period.notes ? period.notes + "; " : ""}${notes}`;
  savePeriod(period);
  recordBudgetAudit({
    budgetId: "GLOBAL",
    action: "UPDATE_BUDGET",
    actorId: actor.actorId,
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    notes: `বাজেট অর্থবছর লক করা হয়েছে: ${period.titleBn}. কারণ: ${notes || "অডিট লক"}`,
    details: { periodId: period.id },
  });
  return period;
}


export function getAllBudgets(): Budget[] {
  ensureDirectoryExists();
  if (!fs.existsSync(BUDGETS_FILE)) {
    const seed = generateSeedBudgets();
    safeAtomicWrite(BUDGETS_FILE, seed);
    return seed;
  }
  try {
    return JSON.parse(fs.readFileSync(BUDGETS_FILE, "utf8"));
  } catch (err) {
    return [];
  }
}

export function getBudgetById(id: string): Budget | null {
  const budgets = getAllBudgets();
  return budgets.find((b) => b.id === id || b.budgetCode === id) || null;
}

export function saveBudget(budget: Budget): void {
  const budgets = getAllBudgets();
  const idx = budgets.findIndex((b) => b.id === budget.id);
  if (idx >= 0) {
    budgets[idx] = budget;
  } else {
    budgets.unshift(budget);
  }
  safeAtomicWrite(BUDGETS_FILE, budgets);
}

export function getAllRevisions(): BudgetRevision[] {
  ensureDirectoryExists();
  if (!fs.existsSync(REVISIONS_FILE)) {
    safeAtomicWrite(REVISIONS_FILE, []);
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(REVISIONS_FILE, "utf8"));
  } catch (err) {
    return [];
  }
}

export function getRevisionById(id: string): BudgetRevision | null {
  const revs = getAllRevisions();
  return revs.find((r) => r.id === id || r.revisionCode === id) || null;
}

export function saveRevision(rev: BudgetRevision): void {
  const revs = getAllRevisions();
  const idx = revs.findIndex((r) => r.id === rev.id);
  if (idx >= 0) {
    revs[idx] = rev;
  } else {
    revs.unshift(rev);
  }
  safeAtomicWrite(REVISIONS_FILE, revs);
}

export function getAllProjects(): BudgetProject[] {
  ensureDirectoryExists();
  if (!fs.existsSync(PROJECTS_FILE)) {
    const seed = generateSeedProjects();
    safeAtomicWrite(PROJECTS_FILE, seed);
    return seed;
  }
  try {
    return JSON.parse(fs.readFileSync(PROJECTS_FILE, "utf8"));
  } catch (err) {
    return [];
  }
}

export function getProjectById(id: string): BudgetProject | null {
  const projs = getAllProjects();
  return projs.find((p) => p.id === id || p.projectCode === id) || null;
}

export function saveProject(project: BudgetProject): void {
  const projs = getAllProjects();
  const idx = projs.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    projs[idx] = project;
  } else {
    projs.unshift(project);
  }
  safeAtomicWrite(PROJECTS_FILE, projs);
}

export function createProject(
  data: Partial<BudgetProject> & {
    projectCode: string;
    titleBn?: string;
    nameBn?: string;
    fundCode: BudgetFundCode;
    budgetId?: string;
    plannedBudget?: number;
    approvedBudget?: number;
  },
  actor?: { actorId: string; actorName: string; actorRole: string }
): BudgetProject {
  const approvedBudget = data.approvedBudget ?? data.plannedBudget ?? 0;
  const project: BudgetProject = {
    id: `EHRJ-PRJ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    projectCode: data.projectCode,
    titleBn: data.titleBn || data.nameBn || data.projectCode,
    nameBn: data.nameBn || data.titleBn || data.projectCode,
    titleEn: data.titleEn || data.nameEn || data.projectCode,
    nameEn: data.nameEn || data.titleEn || data.projectCode,
    descriptionBn: data.descriptionBn || data.notes || "",
    notes: data.notes,
    fundCode: data.fundCode,
    fundNameBn: data.fundNameBn || (data.fundCode === "CONSTRUCTION" ? "নির্মাণ ও উন্নয়ন ফান্ড" : "সাধারণ ফান্ড"),
    budgetId: data.budgetId || "EHRJ-BUD-2026-0001",
    startDate: data.startDate || new Date().toISOString().split("T")[0],
    endDate: data.endDate || data.targetCompletionDate || new Date().toISOString().split("T")[0],
    targetCompletionDate: data.targetCompletionDate || data.endDate,
    status: data.status || "PLANNED",
    approvedBudget,
    revisedBudget: approvedBudget,
    plannedBudget: data.plannedBudget ?? approvedBudget,
    actualExpense: data.actualExpense || 0,
    committedAmount: data.committedAmount || 0,
    remainingBudget: approvedBudget - ((data.actualExpense || 0) + (data.committedAmount || 0)),
    utilizationRate: 0,
    projectManagerName: data.ownerName || data.projectManagerName || "প্রশাসনিক কর্মকর্তা",
    ownerName: data.ownerName || data.projectManagerName,
    contractorVendorId: data.contractorVendorId,
    contractorVendorName: data.contractorVendorName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveProject(project);

  if (actor) {
    recordBudgetAudit({
      budgetId: project.budgetId || "EHRJ-BUD-2026-0001",
      action: "CREATE_BUDGET",
      actorId: actor.actorId,
      actorName: actor.actorName,
      actorRole: actor.actorRole,
      notes: `ক্যাপিটাল প্রজেক্ট তৈরি: ${project.titleBn} (${project.projectCode})`,
      details: { projectId: project.id, projectCode: project.projectCode },
    });
  }

  return project;
}

export function getAllAlerts(): BudgetControlAlert[] {
  ensureDirectoryExists();
  if (!fs.existsSync(ALERTS_FILE)) {
    const seed = generateSeedAlerts();
    safeAtomicWrite(ALERTS_FILE, seed);
    return seed;
  }
  try {
    return JSON.parse(fs.readFileSync(ALERTS_FILE, "utf8"));
  } catch (err) {
    return [];
  }
}

export function getAlertById(id: string): BudgetControlAlert | null {
  const alerts = getAllAlerts();
  return alerts.find((a) => a.id === id) || null;
}

export function saveAlert(alert: BudgetControlAlert): void {
  const alerts = getAllAlerts();
  const idx = alerts.findIndex((a) => a.id === alert.id);
  if (idx >= 0) {
    alerts[idx] = alert;
  } else {
    alerts.unshift(alert);
  }
  safeAtomicWrite(ALERTS_FILE, alerts);
}

export function getAllAuditLogs(): BudgetAuditEntry[] {
  ensureDirectoryExists();
  if (!fs.existsSync(AUDIT_FILE)) {
    safeAtomicWrite(AUDIT_FILE, []);
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(AUDIT_FILE, "utf8"));
  } catch (err) {
    return [];
  }
}

export function recordBudgetAudit(entry: Omit<BudgetAuditEntry, "id" | "timestamp">): BudgetAuditEntry {
  const logs = getAllAuditLogs();
  const newEntry: BudgetAuditEntry = {
    ...entry,
    id: `EHRJ-BAUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(newEntry);
  safeAtomicWrite(AUDIT_FILE, logs);
  return newEntry;
}

// -------------------------------------------------------------
// DASHBOARD STATS AGGREGATOR
// -------------------------------------------------------------

export function getBudgetDashboardStats(): BudgetDashboardStats {
  const budgets = getAllBudgets();
  const activeBudgets = budgets.filter((b) => b.status === "ACTIVE" || b.status === "REVISED");
  const projects = getAllProjects();
  const revisions = getAllRevisions();
  const alerts = getAllAlerts();

  let totalPlannedIncome = 0;
  let totalActualIncome = 0;
  let totalPlannedExpense = 0;
  let totalActualExpense = 0;
  let totalCommittedExpense = 0;

  for (const b of activeBudgets) {
    totalPlannedIncome += b.totalIncomePlanned;
    totalActualIncome += b.totalIncomeActual;
    totalPlannedExpense += b.totalExpensePlanned;
    totalActualExpense += b.totalExpenseActual;
    totalCommittedExpense += b.totalExpenseCommitted;
  }

  const incomeCollectionRate =
    totalPlannedIncome > 0 ? Math.round((totalActualIncome / totalPlannedIncome) * 1000) / 10 : 0;
  const totalAvailableBudget = totalPlannedExpense - (totalActualExpense + totalCommittedExpense);
  const overallExpenseUtilizationRate =
    totalPlannedExpense > 0
      ? Math.round(((totalActualExpense + totalCommittedExpense) / totalPlannedExpense) * 1000) / 10
      : 0;

  return {
    totalActiveBudgets: activeBudgets.length,
    totalPlannedIncome,
    totalActualIncome,
    incomeCollectionRate,
    totalPlannedExpense,
    totalActualExpense,
    totalCommittedExpense,
    totalAvailableBudget,
    overallExpenseUtilizationRate,
    activeProjectsCount: projects.filter((p) => p.status === "ACTIVE").length,
    pendingRevisionsCount: revisions.filter((r) => r.status === "SUBMITTED" || r.status === "UNDER_REVIEW").length,
    overrunAlertsCount: alerts.filter((a) => a.alertLevel === "OVERRUN" && !a.isAcknowledged).length,
    warningAlertsCount: alerts.filter((a) => (a.alertLevel === "WARNING" || a.alertLevel === "CRITICAL") && !a.isAcknowledged).length,
  };
}
