import { prisma } from "@/lib/prisma";

export interface MetricLineageNode {
  metricKey: string;
  nameBn: string;
  nameEn: string;
  category: "FINANCE" | "ACADEMIC" | "OPERATIONS" | "INVENTORY";
  authoritativeEntity: string;
  sourceFields: string[];
  filterConditionBn: string;
  formulaBn: string;
  lineagePath: string[]; // e.g. ["FeeInvoice", "PaymentReceipt", "CashTransaction", "Admin Dashboard"]
  freshness: "REALTIME" | "NEAR_REALTIME" | "DAILY_SNAPSHOT";
  traceQuerySample: string;
}

export const METRIC_LINEAGE_REGISTRY: MetricLineageNode[] = [
  {
    metricKey: "TOTAL_FEES_COLLECTED",
    nameBn: "মোট আদায়কৃত ফি (সর্বমোট সংগৃহীত অর্থ)",
    nameEn: "Total Fees Collected",
    category: "FINANCE",
    authoritativeEntity: "PaymentReceipt",
    sourceFields: ["PaymentReceipt.amount", "PaymentReceipt.paymentStatus", "Refund.amount"],
    filterConditionBn: "শুধুমাত্র paymentStatus = 'SUCCESSFUL' রসিদসমূহ এবং তাদের সাথে সম্পর্কিত Refund বিয়োগ",
    formulaBn: "SUM(PaymentReceipt.amount WHERE status='SUCCESSFUL') - SUM(Refund.amount)",
    lineagePath: ["FeeInvoice", "PaymentReceipt", "Refund", "CashTransaction", "Finance Overview Dashboard"],
    freshness: "REALTIME",
    traceQuerySample: "prisma.paymentReceipt.aggregate({ where: { paymentStatus: 'SUCCESSFUL' }, _sum: { amount: true } })"
  },
  {
    metricKey: "OUTSTANDING_STUDENT_DUES",
    nameBn: "বকেয়া ফি (মোট অনাদায়ী পাওনা)",
    nameEn: "Outstanding Student Dues",
    category: "FINANCE",
    authoritativeEntity: "FeeInvoice",
    sourceFields: ["FeeInvoice.dueAmount", "FeeInvoice.status"],
    filterConditionBn: "ইনভয়েসের স্ট্যাটাস UNPAID, PARTIALLY_PAID অথবা OVERDUE",
    formulaBn: "SUM(FeeInvoice.dueAmount WHERE status IN ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'])",
    lineagePath: ["FeeStructure", "FeeInvoice", "Billing Month Scope", "Admin Finance Dashboard"],
    freshness: "REALTIME",
    traceQuerySample: "prisma.feeInvoice.aggregate({ where: { status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] } }, _sum: { dueAmount: true } })"
  },
  {
    metricKey: "ACTIVE_ENROLLED_STUDENTS",
    nameBn: "মোট সক্রিয় শিক্ষার্থী সংখ্যা",
    nameEn: "Active Enrolled Students",
    category: "ACADEMIC",
    authoritativeEntity: "Enrollment",
    sourceFields: ["Enrollment.status", "Enrollment.sessionId", "Student.status"],
    filterConditionBn: "Student.status = 'ACTIVE' AND Enrollment.status = 'ACTIVE' AND sessionId = CURRENT_SESSION",
    formulaBn: "COUNT(DISTINCT Enrollment.studentId WHERE Enrollment.status='ACTIVE' AND Student.status='ACTIVE')",
    lineagePath: ["Student Master", "AcademicSession", "Enrollment", "Institutional Header / Analytics"],
    freshness: "REALTIME",
    traceQuerySample: "prisma.enrollment.count({ where: { status: 'ACTIVE', session: { isCurrent: true }, student: { status: 'ACTIVE' } } })"
  },
  {
    metricKey: "INSTITUTIONAL_PASS_RATE",
    nameBn: "মাদরাসার সামগ্রিক পাসের হার",
    nameEn: "Institutional Examination Pass Rate",
    category: "ACADEMIC",
    authoritativeEntity: "Result",
    sourceFields: ["Result.isPassed", "Result.status", "Exam.status"],
    filterConditionBn: "শুধুমাত্র Exam.status = 'PUBLISHED' এবং Result.status = 'PUBLISHED'",
    formulaBn: "(COUNT(Result WHERE isPassed=true) / COUNT(Result WHERE isPassed IS NOT NULL)) * 100",
    lineagePath: ["ExamMark", "Exam", "Result Snapshot (Locked)", "Academic Performance Dashboard"],
    freshness: "NEAR_REALTIME",
    traceQuerySample: "prisma.result.groupBy({ by: ['isPassed'], where: { status: 'PUBLISHED' }, _count: true })"
  },
  {
    metricKey: "TOTAL_PHYSICAL_ASSET_VALUE",
    nameBn: "মোট ইনভেন্টরি ও সম্পদ মূল্য",
    nameEn: "Total Inventory Asset Valuation",
    category: "INVENTORY",
    authoritativeEntity: "InventoryAsset, InventoryStockBalance",
    sourceFields: ["InventoryAsset.purchaseCost", "InventoryStockBalance.currentBalance", "InventoryItem.defaultUnitCost"],
    filterConditionBn: "স্থাবর সম্পদ (InventoryAsset.status != 'DISPOSED') + গুদাম মালামাল (currentBalance * defaultUnitCost)",
    formulaBn: "SUM(InventoryAsset.purchaseCost) + SUM(InventoryStockBalance.currentBalance * InventoryItem.defaultUnitCost)",
    lineagePath: ["PurchaseOrder", "GoodsReceipt", "InventoryStockBalance", "Asset Register", "Inventory Dashboard"],
    freshness: "DAILY_SNAPSHOT",
    traceQuerySample: "prisma.inventoryAsset.aggregate({ where: { status: { not: 'DISPOSED' } }, _sum: { purchasePrice: true } })"
  }
];

export async function traceMetricValue(metricKey: string): Promise<{
  metric: MetricLineageNode;
  calculatedValue: number | string;
  sourceRecordCount: number;
  sampleEvidence: any[];
}> {
  const metric = METRIC_LINEAGE_REGISTRY.find(m => m.metricKey === metricKey);
  if (!metric) {
    throw new Error(`Metric lineage node '${metricKey}' not found.`);
  }

  let calculatedValue: number | string = 0;
  let sourceRecordCount = 0;
  let sampleEvidence: any[] = [];

  if (metricKey === "TOTAL_FEES_COLLECTED") {
    const receipts = await prisma.paymentReceipt.findMany({
      where: { paymentStatus: "SUCCESSFUL" },
      take: 5,
      select: { receiptNumber: true, amount: true, receiptDate: true, paymentMethod: true }
    });
    const aggReceipts = await prisma.paymentReceipt.aggregate({
      where: { paymentStatus: "SUCCESSFUL" },
      _sum: { amount: true },
      _count: true
    });
    const aggRefunds = await prisma.refund.aggregate({
      _sum: { amount: true }
    });
    const totalRec = aggReceipts._sum.amount || 0;
    const totalRef = aggRefunds._sum.amount || 0;
    calculatedValue = totalRec - totalRef;
    sourceRecordCount = aggReceipts._count;
    sampleEvidence = receipts;
  } else if (metricKey === "OUTSTANDING_STUDENT_DUES") {
    const invoices = await prisma.feeInvoice.findMany({
      where: { status: { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] } },
      take: 5,
      select: { invoiceNumber: true, dueAmount: true, status: true, dueDate: true }
    });
    const agg = await prisma.feeInvoice.aggregate({
      where: { status: { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { dueAmount: true },
      _count: true
    });
    calculatedValue = agg._sum.dueAmount || 0;
    sourceRecordCount = agg._count;
    sampleEvidence = invoices;
  } else if (metricKey === "ACTIVE_ENROLLED_STUDENTS") {
    const enrollments = await prisma.enrollment.findMany({
      where: { status: "ACTIVE", student: { status: "ACTIVE" } },
      take: 5,
      include: { student: { select: { studentIdNumber: true, fullNameBn: true } } }
    });
    const count = await prisma.enrollment.count({
      where: { status: "ACTIVE", student: { status: "ACTIVE" } }
    });
    calculatedValue = count;
    sourceRecordCount = count;
    sampleEvidence = enrollments.map(e => ({ roll: e.rollNumber, studentId: e.student.studentIdNumber, name: e.student.fullNameBn }));
  } else if (metricKey === "INSTITUTIONAL_PASS_RATE") {
    const total = await prisma.result.count({ where: { status: "PUBLISHED" } });
    const passed = await prisma.result.count({ where: { status: "PUBLISHED", isPassed: true } });
    calculatedValue = total > 0 ? `${((passed / total) * 100).toFixed(1)}%` : "0%";
    sourceRecordCount = total;
    sampleEvidence = [{ totalPublishedResults: total, totalPassed: passed }];
  } else if (metricKey === "TOTAL_PHYSICAL_ASSET_VALUE") {
    const assetAgg = await prisma.inventoryAsset.aggregate({
      where: { status: { not: "DISPOSED" } },
      _sum: { purchaseCost: true },
      _count: true
    });
    calculatedValue = assetAgg._sum?.purchaseCost || 0;
    sourceRecordCount = typeof assetAgg._count === "number" ? assetAgg._count : ((assetAgg._count as any)?._all || 0);
    sampleEvidence = [{ totalActiveAssets: sourceRecordCount, totalValuation: calculatedValue }];
  }

  return {
    metric,
    calculatedValue,
    sourceRecordCount,
    sampleEvidence
  };
}
