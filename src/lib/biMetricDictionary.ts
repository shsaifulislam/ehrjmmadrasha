/**
 * EHRJ MADRASHA ERP — PHASE 26
 * Governed Metric Dictionary & Metadata Catalog
 *
 * Implements strict KPI definitions, formulas, authoritative owners,
 * time grains, privacy levels, and metric versioning (v1 -> v2).
 */

export type MetricDomain =
  | "STUDENT"
  | "ADMISSION"
  | "ATTENDANCE"
  | "ACADEMIC"
  | "FINANCE"
  | "FUND"
  | "LIBRARY"
  | "INVENTORY"
  | "HR"
  | "HELPDESK"
  | "OPERATIONS";

export type PrivacyLevel = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "STRICTLY_CONFIDENTIAL";

export interface MetricVersion {
  version: string; // e.g. "1.0", "1.1"
  effectiveDate: string; // ISO date
  formulaBn: string;
  formulaEn: string;
  changeReason?: string;
  changedBy?: string;
}

export interface MetricDefinition {
  metricId: string;
  code: string;
  nameBn: string;
  nameEn: string;
  domain: MetricDomain;
  descriptionBn: string;
  descriptionEn: string;
  currentVersion: string;
  versions: MetricVersion[];
  authoritativeEntity: string;
  sourceFields: string[];
  dimensions: string[];
  timeGrains: Array<"DAILY" | "WEEKLY" | "MONTHLY" | "TERM" | "SESSION">;
  unitBn: string;
  unitEn: string;
  ownerRole: "ADMIN" | "PRINCIPAL" | "ACCOUNTANT" | "TEACHER";
  privacyLevel: PrivacyLevel;
  shariahContextBn?: string;
}

export const GOVERNED_METRIC_DICTIONARY: MetricDefinition[] = [
  // 1. STUDENT DOMAIN
  {
    metricId: "METRIC-STU-001",
    code: "ACTIVE_STUDENTS_COUNT",
    nameBn: "মোট সক্রিয় শিক্ষার্থী সংখ্যা",
    nameEn: "Active Enrolled Students Count",
    domain: "STUDENT",
    descriptionBn: "বর্তমান সক্রিয় শিক্ষাবর্ষে নিবন্ধিত এবং অধ্যয়নরত নিয়মিত শিক্ষার্থীদের সর্বমোট সংখ্যা।",
    descriptionEn: "Total number of currently enrolled and active students in the current academic session.",
    currentVersion: "1.0",
    versions: [
      {
        version: "1.0",
        effectiveDate: "2026-01-01",
        formulaBn: "COUNT(Student WHERE status = 'ACTIVE' AND Enrollment.status = 'ACTIVE' AND sessionId = CURRENT_SESSION)",
        formulaEn: "COUNT(Student WHERE status = 'ACTIVE' AND Enrollment.status = 'ACTIVE' AND sessionId = CURRENT_SESSION)"
      }
    ],
    authoritativeEntity: "Student, Enrollment",
    sourceFields: ["Student.status", "Enrollment.status", "Enrollment.sessionId"],
    dimensions: ["Class/Jamat", "Section", "Gender", "ResidentialStatus"],
    timeGrains: ["DAILY", "MONTHLY", "SESSION"],
    unitBn: "জন",
    unitEn: "Students",
    ownerRole: "ADMIN",
    privacyLevel: "INTERNAL"
  },
  {
    metricId: "METRIC-STU-002",
    code: "RESIDENTIAL_STUDENT_RATIO",
    nameBn: "আবাসিক শিক্ষার্থীর অনুপাত",
    nameEn: "Residential Student Ratio",
    domain: "STUDENT",
    descriptionBn: "মোট সক্রিয় শিক্ষার্থীদের মধ্যে আবাসিক (বোর্ডিং) শিক্ষার্থীদের শতকরা হার।",
    descriptionEn: "Percentage of active students enrolled in residential boarding facilities.",
    currentVersion: "1.0",
    versions: [
      {
        version: "1.0",
        effectiveDate: "2026-01-01",
        formulaBn: "(COUNT(residentialStatus = 'RESIDENTIAL') / COUNT(ACTIVE_STUDENTS)) * 100",
        formulaEn: "(COUNT(residentialStatus = 'RESIDENTIAL') / COUNT(ACTIVE_STUDENTS)) * 100"
      }
    ],
    authoritativeEntity: "Student",
    sourceFields: ["Student.residentialStatus", "Student.status"],
    dimensions: ["Class/Jamat", "Gender"],
    timeGrains: ["MONTHLY", "SESSION"],
    unitBn: "%",
    unitEn: "%",
    ownerRole: "ADMIN",
    privacyLevel: "INTERNAL"
  },

  // 2. ADMISSION DOMAIN
  {
    metricId: "METRIC-ADM-001",
    code: "ADMISSION_CONVERSION_RATE",
    nameBn: "ভর্তি রূপান্তর হার (Conversion Rate)",
    nameEn: "Admission Conversion Rate",
    domain: "ADMISSION",
    descriptionBn: "মোট দাখিলকৃত ভর্তি আবেদনের বিপরীতে অনুমোদিত ও সফল ভর্তির শতকরা হার।",
    descriptionEn: "Percentage of submitted admission applications that resulted in confirmed enrollments.",
    currentVersion: "1.0",
    versions: [
      {
        version: "1.0",
        effectiveDate: "2026-01-01",
        formulaBn: "(COUNT(Application WHERE status = 'APPROVED') / COUNT(Application WHERE status IN ALL_SUBMITTED)) * 100",
        formulaEn: "(COUNT(Application WHERE status = 'APPROVED') / COUNT(Application WHERE status IN ALL_SUBMITTED)) * 100"
      }
    ],
    authoritativeEntity: "Application",
    sourceFields: ["Application.status", "Application.createdAt"],
    dimensions: ["AppliedClass", "CampaignSession"],
    timeGrains: ["WEEKLY", "MONTHLY", "SESSION"],
    unitBn: "%",
    unitEn: "%",
    ownerRole: "ADMIN",
    privacyLevel: "INTERNAL"
  },

  // 3. ATTENDANCE DOMAIN
  {
    metricId: "METRIC-ATT-001",
    code: "DAILY_ATTENDANCE_RATE",
    nameBn: "দৈনিক গড় উপস্থিতি হার",
    nameEn: "Daily Attendance Rate",
    domain: "ATTENDANCE",
    descriptionBn: "নির্দিষ্ট দিনে মোট রোলকৃত শিক্ষার্থীর বিপরীতে উপস্থিত এবং বিলম্বে উপস্থিতদের শতকরা হার।",
    descriptionEn: "Percentage of enrolled students marked present or late on a given calendar day.",
    currentVersion: "1.0",
    versions: [
      {
        version: "1.0",
        effectiveDate: "2026-01-01",
        formulaBn: "((COUNT(PRESENT) + COUNT(LATE)) / (COUNT(PRESENT) + COUNT(LATE) + COUNT(ABSENT) + COUNT(LEAVE))) * 100",
        formulaEn: "((COUNT(PRESENT) + COUNT(LATE)) / TOTAL_MARKED) * 100"
      }
    ],
    authoritativeEntity: "Attendance",
    sourceFields: ["Attendance.status", "Attendance.date", "Attendance.studentId"],
    dimensions: ["Class/Jamat", "Section", "Gender", "ResidentialStatus"],
    timeGrains: ["DAILY", "WEEKLY", "MONTHLY"],
    unitBn: "%",
    unitEn: "%",
    ownerRole: "PRINCIPAL",
    privacyLevel: "INTERNAL"
  },
  {
    metricId: "METRIC-ATT-002",
    code: "CHRONIC_ABSENTEEISM_COUNT",
    nameBn: "ধারাবাহিক বা দীর্ঘমেয়াদী অনুপস্থিত শিক্ষার্থী সংখ্যা",
    nameEn: "Chronic Absenteeism Count",
    domain: "ATTENDANCE",
    descriptionBn: "যেসকল শিক্ষার্থী চলতি মাসে বা টানা ৩ কার্যদিবসের বেশি অনুপস্থিত রয়েছে।",
    descriptionEn: "Number of students absent for 3 or more consecutive school days or below 75% monthly threshold.",
    currentVersion: "1.0",
    versions: [
      {
        version: "1.0",
        effectiveDate: "2026-01-01",
        formulaBn: "COUNT(DISTINCT studentId WHERE ConsecutiveAbsences >= 3 OR MonthlyAttendanceRate < 75%)",
        formulaEn: "COUNT(DISTINCT studentId WHERE ConsecutiveAbsences >= 3 OR MonthlyAttendanceRate < 75%)"
      }
    ],
    authoritativeEntity: "Attendance",
    sourceFields: ["Attendance.status", "Attendance.date", "Attendance.studentId"],
    dimensions: ["Class/Jamat", "Section"],
    timeGrains: ["WEEKLY", "MONTHLY"],
    unitBn: "জন",
    unitEn: "Students",
    ownerRole: "TEACHER",
    privacyLevel: "INTERNAL"
  },

  // 4. ACADEMIC DOMAIN
  {
    metricId: "METRIC-ACAD-001",
    code: "INSTITUTIONAL_PASS_RATE",
    nameBn: "মাদরাসার সামগ্রিক পাসের হার",
    nameEn: "Institutional Examination Pass Rate",
    domain: "ACADEMIC",
    descriptionBn: "প্রকাশিত টার্ম বা বার্ষিক পরীক্ষায় কৃতকার্য (পাসকৃত) পরীক্ষার্থীদের শতকরা হার।",
    descriptionEn: "Percentage of examinees who achieved passing marks across published examinations.",
    currentVersion: "1.0",
    versions: [
      {
        version: "1.0",
        effectiveDate: "2026-01-01",
        formulaBn: "(COUNT(Result WHERE isPassed = true AND status = 'PUBLISHED') / COUNT(Result WHERE status = 'PUBLISHED')) * 100",
        formulaEn: "(COUNT(Result WHERE isPassed = true AND status = 'PUBLISHED') / COUNT(Result WHERE status = 'PUBLISHED')) * 100"
      }
    ],
    authoritativeEntity: "Result",
    sourceFields: ["Result.isPassed", "Result.status", "Result.examId"],
    dimensions: ["Exam", "Class/Jamat", "Subject"],
    timeGrains: ["TERM", "SESSION"],
    unitBn: "%",
    unitEn: "%",
    ownerRole: "PRINCIPAL",
    privacyLevel: "INTERNAL"
  },
  {
    metricId: "METRIC-ACAD-002",
    code: "HONORS_MUMTAZ_RATE",
    nameBn: "মুমতাজ (সর্বোচ্চ গ্রেড) প্রাপ্তির হার",
    nameEn: "Mumtaz Honors Achievement Rate",
    domain: "ACADEMIC",
    descriptionBn: "প্রকাশিত ফলাফলে মুমতাজ গ্রেড (৮০% বা তদূর্ধ্ব নম্বর) অর্জনকারী শিক্ষার্থীদের শতকরা হার।",
    descriptionEn: "Percentage of students achieving Mumtaz grade designation (80%+ aggregate marks).",
    currentVersion: "1.0",
    versions: [
      {
        version: "1.0",
        effectiveDate: "2026-01-01",
        formulaBn: "(COUNT(Result WHERE finalGradeBn LIKE '%মুমতাজ%' AND status = 'PUBLISHED') / COUNT(Result WHERE status = 'PUBLISHED')) * 100",
        formulaEn: "(COUNT(Result WHERE finalGradeEn = 'MUMTAZ') / COUNT(Result)) * 100"
      }
    ],
    authoritativeEntity: "Result",
    sourceFields: ["Result.finalGradeBn", "Result.percentage", "Result.status"],
    dimensions: ["Exam", "Class/Jamat"],
    timeGrains: ["TERM", "SESSION"],
    unitBn: "%",
    unitEn: "%",
    ownerRole: "PRINCIPAL",
    privacyLevel: "INTERNAL"
  },

  // 5. FINANCE DOMAIN
  {
    metricId: "METRIC-FIN-001",
    code: "TOTAL_FEES_COLLECTED",
    nameBn: "মোট সংগৃহীত ফি ও রাজস্ব",
    nameEn: "Total Fees Collected",
    domain: "FINANCE",
    descriptionBn: "নির্দিষ্ট সময়কালে শিক্ষার্থীদের কাছ থেকে সংগৃহীত ও অনুমোদিত ফির মোট আর্থিক পরিমাণ (রিফান্ড সমন্বিত)।",
    descriptionEn: "Net aggregate fee collections recorded via successful payment receipts minus approved refunds.",
    currentVersion: "1.0",
    versions: [
      {
        version: "1.0",
        effectiveDate: "2026-01-01",
        formulaBn: "SUM(PaymentReceipt.amount WHERE paymentStatus = 'SUCCESSFUL') - SUM(Refund.amount)",
        formulaEn: "SUM(PaymentReceipt.amount WHERE paymentStatus = 'SUCCESSFUL') - SUM(Refund.amount)"
      }
    ],
    authoritativeEntity: "PaymentReceipt, Refund",
    sourceFields: ["PaymentReceipt.amount", "PaymentReceipt.paymentStatus", "Refund.amount"],
    dimensions: ["PaymentMethod", "FeeCategory", "Month", "Session"],
    timeGrains: ["DAILY", "WEEKLY", "MONTHLY", "SESSION"],
    unitBn: "৳ (টাকা)",
    unitEn: "BDT",
    ownerRole: "ACCOUNTANT",
    privacyLevel: "INTERNAL"
  },
  {
    metricId: "METRIC-FIN-002",
    code: "OUTSTANDING_DUES_TOTAL",
    nameBn: "মোট বকেয়া ফির পরিমাণ",
    nameEn: "Total Outstanding Student Dues",
    domain: "FINANCE",
    descriptionBn: "বর্তমান সময় পর্যন্ত শিক্ষার্থীদের অনাদায়ী বা বকেয়া ফির সর্বমোট পরিমাণ।",
    descriptionEn: "Total unpaid fee balance across all active fee invoices in UNPAID, PARTIAL, or OVERDUE states.",
    currentVersion: "1.0",
    versions: [
      {
        version: "1.0",
        effectiveDate: "2026-01-01",
        formulaBn: "SUM(FeeInvoice.dueAmount WHERE status IN ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'])",
        formulaEn: "SUM(FeeInvoice.dueAmount WHERE status IN ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'])"
      }
    ],
    authoritativeEntity: "FeeInvoice",
    sourceFields: ["FeeInvoice.dueAmount", "FeeInvoice.status"],
    dimensions: ["Class/Jamat", "Month", "Session"],
    timeGrains: ["DAILY", "MONTHLY"],
    unitBn: "৳ (টাকা)",
    unitEn: "BDT",
    ownerRole: "ACCOUNTANT",
    privacyLevel: "INTERNAL"
  },
  {
    metricId: "METRIC-FIN-003",
    code: "TOTAL_OPERATING_EXPENSES",
    nameBn: "মোট পরিচালন ব্যয় (OPEX)",
    nameEn: "Total Operating Expenses",
    domain: "FINANCE",
    descriptionBn: "মাদরাসার নিয়মিত পরিচালন, বেতন, রক্ষণাবেক্ষণ ও অন্যান্য অনুমোদিত ব্যয়ের সর্বমোট যোগফল।",
    descriptionEn: "Total recorded operational and administrative expenses from the cash transaction ledger.",
    currentVersion: "1.0",
    versions: [
      {
        version: "1.0",
        effectiveDate: "2026-01-01",
        formulaBn: "SUM(CashTransaction.amount WHERE type = 'EXPENSE')",
        formulaEn: "SUM(CashTransaction.amount WHERE type = 'EXPENSE')"
      }
    ],
    authoritativeEntity: "CashTransaction",
    sourceFields: ["CashTransaction.amount", "CashTransaction.type", "CashTransaction.transactionDate"],
    dimensions: ["ExpenseCategory", "Fund", "Month", "Session"],
    timeGrains: ["MONTHLY", "SESSION"],
    unitBn: "৳ (টাকা)",
    unitEn: "BDT",
    ownerRole: "ACCOUNTANT",
    privacyLevel: "INTERNAL"
  },
  {
    metricId: "METRIC-FIN-004",
    code: "NET_OPERATING_CASH_FLOW",
    nameBn: "নিট পরিচালন নগদ প্রবাহ (Cash Flow)",
    nameEn: "Net Operating Cash Flow",
    domain: "FINANCE",
    descriptionBn: "নির্দিষ্ট সময়কালে মোট আয় ও মোট ব্যয়ের ব্যবধান (আয় - ব্যয়)।",
    descriptionEn: "Difference between total cash inflows and total cash outflows over the reporting period.",
    currentVersion: "1.0",
    versions: [
      {
        version: "1.0",
        effectiveDate: "2026-01-01",
        formulaBn: "TOTAL_COLLECTIONS_AND_DONATIONS - TOTAL_OPERATING_EXPENSES",
        formulaEn: "TOTAL_COLLECTIONS_AND_DONATIONS - TOTAL_OPERATING_EXPENSES"
      }
    ],
    authoritativeEntity: "PaymentReceipt, CashTransaction",
    sourceFields: ["PaymentReceipt.amount", "CashTransaction.amount"],
    dimensions: ["Month", "Session"],
    timeGrains: ["MONTHLY", "SESSION"],
    unitBn: "৳ (টাকা)",
    unitEn: "BDT",
    ownerRole: "ACCOUNTANT",
    privacyLevel: "INTERNAL"
  },

  // 6. FUND DOMAIN (SHARIAH-COMPLIANT SEPARATION)
  {
    metricId: "METRIC-FND-001",
    code: "FUND_BALANCE_BY_CATEGORY",
    nameBn: "তহবিলভিত্তিক নগদ স্থিতি",
    nameEn: "Cash Fund Balance by Category",
    domain: "FUND",
    descriptionBn: "শরিয়াহ নীতি অনুযায়ী পৃথক ৫টি তহবিলের (সাধারণ, লিল্লাহ, যাকাত, নির্মাণ, এতিম সহায়তা) বর্তমান ব্যালেন্স।",
    descriptionEn: "Current ledger balances across the five distinct institutional funds adhering to strict Shariah ring-fencing.",
    currentVersion: "1.0",
    versions: [
      {
        version: "1.0",
        effectiveDate: "2026-01-01",
        formulaBn: "CashFund.currentBalance GROUP BY code IN ['GENERAL', 'LILLAH', 'ZAKAT', 'CONSTRUCTION', 'ORPHAN_SUPPORT']",
        formulaEn: "CashFund.currentBalance GROUP BY code IN ['GENERAL', 'LILLAH', 'ZAKAT', 'CONSTRUCTION', 'ORPHAN_SUPPORT']"
      }
    ],
    authoritativeEntity: "CashFund",
    sourceFields: ["CashFund.code", "CashFund.currentBalance"],
    dimensions: ["FundCode"],
    timeGrains: ["DAILY", "MONTHLY"],
    unitBn: "৳ (টাকা)",
    unitEn: "BDT",
    ownerRole: "ACCOUNTANT",
    privacyLevel: "CONFIDENTIAL",
    shariahContextBn: "যাকাত ও লিল্লাহ ফান্ড সাধারণ ব্যয়ের সাথে মিশ্রিত করা সম্পূর্ণ নিষিদ্ধ। এই তহবিল শুধুমাত্র শরিয়াহ নির্দেশিত খাতে ব্যয়যোগ্য।"
  },

  // 7. INVENTORY DOMAIN
  {
    metricId: "METRIC-INV-001",
    code: "LOW_STOCK_ALERT_COUNT",
    nameBn: "রি-অর্ডার সীমার নিচে মজুদ আইটেম",
    nameEn: "Low Stock Inventory Items Count",
    domain: "INVENTORY",
    descriptionBn: "মজুদ খতিয়ানে যেসব আইটেমের বর্তমান পরিমাণ নির্ধারিত সর্বনিম্ন সীমার (<=5) নিচে নেমেছে।",
    descriptionEn: "Number of inventory items where current stock balance has fallen below safety threshold.",
    currentVersion: "1.0",
    versions: [
      {
        version: "1.0",
        effectiveDate: "2026-01-01",
        formulaBn: "COUNT(InventoryStockBalance WHERE currentBalance <= 5)",
        formulaEn: "COUNT(InventoryStockBalance WHERE currentBalance <= 5)"
      }
    ],
    authoritativeEntity: "InventoryStockBalance",
    sourceFields: ["InventoryStockBalance.currentBalance"],
    dimensions: ["InventoryCategory", "Location"],
    timeGrains: ["DAILY"],
    unitBn: "টি",
    unitEn: "Items",
    ownerRole: "ADMIN",
    privacyLevel: "INTERNAL"
  },

  // 8. HR DOMAIN
  {
    metricId: "METRIC-HR-001",
    code: "ACTIVE_EMPLOYEES_COUNT",
    nameBn: "সক্রিয় শিক্ষক ও কর্মচারী সংখ্যা",
    nameEn: "Active Faculty and Staff Count",
    domain: "HR",
    descriptionBn: "মাদরাসায় বর্তমানে নিয়মিত কর্মরত সক্রিয় শিক্ষক, কর্মকর্তা ও স্টাফদের মোট সংখ্যা।",
    descriptionEn: "Total number of currently employed teachers and administrative staff.",
    currentVersion: "1.0",
    versions: [
      {
        version: "1.0",
        effectiveDate: "2026-01-01",
        formulaBn: "COUNT(Employee WHERE status = 'ACTIVE')",
        formulaEn: "COUNT(Employee WHERE status = 'ACTIVE')"
      }
    ],
    authoritativeEntity: "Employee",
    sourceFields: ["Employee.status", "Employee.departmentId"],
    dimensions: ["Department", "Designation", "EmploymentType"],
    timeGrains: ["MONTHLY", "SESSION"],
    unitBn: "জন",
    unitEn: "Employees",
    ownerRole: "ADMIN",
    privacyLevel: "INTERNAL"
  },

  // 9. HELPDESK DOMAIN
  {
    metricId: "METRIC-OPS-001",
    code: "OPEN_SUPPORT_TICKETS_COUNT",
    nameBn: "অনিষ্পন্ন সহায়তা ও অভিযোগ টিকিট",
    nameEn: "Unresolved Support Tickets Count",
    domain: "HELPDESK",
    descriptionBn: "হেল্পডেস্কে জমা পড়া বর্তমানে প্রক্রিয়াধীন বা পর্যালোচনার অপেক্ষায় থাকা টিকিটের সংখ্যা।",
    descriptionEn: "Count of helpdesk support tickets in submitted, under review, or in-progress status.",
    currentVersion: "1.0",
    versions: [
      {
        version: "1.0",
        effectiveDate: "2026-01-01",
        formulaBn: "COUNT(SupportRequest WHERE status IN ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'WAITING_FOR_INFORMATION'])",
        formulaEn: "COUNT(SupportRequest WHERE status IN ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'WAITING_FOR_INFORMATION'])"
      }
    ],
    authoritativeEntity: "SupportRequest",
    sourceFields: ["SupportRequest.status", "SupportRequest.priority"],
    dimensions: ["Category", "Priority"],
    timeGrains: ["DAILY", "WEEKLY"],
    unitBn: "টি",
    unitEn: "Tickets",
    ownerRole: "ADMIN",
    privacyLevel: "INTERNAL"
  }
];

export function getMetricById(metricId: string): MetricDefinition | undefined {
  return GOVERNED_METRIC_DICTIONARY.find(m => m.metricId === metricId || m.code === metricId);
}

export function getMetricsByDomain(domain: MetricDomain): MetricDefinition[] {
  return GOVERNED_METRIC_DICTIONARY.filter(m => m.domain === domain);
}
