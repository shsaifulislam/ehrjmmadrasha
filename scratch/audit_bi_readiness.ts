import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== PHASE 26 BI & FORECASTING AUDIT DATA EXTRACTION ===");
  
  // 1. Sessions
  const sessions = await prisma.academicSession.findMany({
    orderBy: { startDate: "asc" },
    select: { id: true, name: true, isCurrent: true, status: true, startDate: true, endDate: true }
  });
  console.log("Academic Sessions:", sessions);

  // 2. Enrollment distribution
  const enrollments = await prisma.enrollment.groupBy({
    by: ["sessionId"],
    _count: { id: true }
  });
  console.log("Enrollment by Session:", enrollments);

  // 3. Financial Invoices by Month/Year
  const invoices = await prisma.feeInvoice.findMany({
    select: { id: true, totalAmount: true, paidAmount: true, dueAmount: true, status: true, createdAt: true }
  });
  console.log("Total Invoices:", invoices.length);

  // 4. Receipts by Month
  const receipts = await prisma.paymentReceipt.findMany({
    select: { id: true, amount: true, receiptDate: true, paymentStatus: true, paymentMethod: true }
  });
  console.log("Total Receipts:", receipts.length);

  // 5. Cash Transactions (Expenses & Incomes)
  const txs = await prisma.cashTransaction.findMany({
    select: { id: true, type: true, amount: true, transactionDate: true, fundId: true }
  });
  console.log("Cash Transactions:", txs.length);

  // 6. Attendance records
  const attCount = await prisma.attendance.count();
  const attByStatus = await prisma.attendance.groupBy({
    by: ["status"],
    _count: { id: true }
  });
  console.log("Attendance Statuses:", attByStatus, "Total:", attCount);

  // 7. Results
  const results = await prisma.result.findMany({
    select: { id: true, isPassed: true, percentage: true, totalObtained: true, status: true, createdAt: true }
  });
  console.log("Total Results:", results.length);

  // 8. Admissions
  const applications = await prisma.application.findMany({
    select: { id: true, status: true, createdAt: true }
  });
  console.log("Total Admissions Applications:", applications.length);

  // 9. Inventory Stock Balances
  const lowStock = await prisma.inventoryStockBalance.count({
    where: { currentBalance: { lte: 5 } }
  });
  console.log("Low stock count (<=5):", lowStock);

  // 10. Helpdesk Tickets
  const tickets = await prisma.supportRequest.groupBy({
    by: ["status", "priority"],
    _count: { id: true }
  });
  console.log("Support Requests:", tickets);

  // Monthly breakdown
  const receiptsByMonth: Record<string, { count: number; sum: number }> = {};
  for (const r of receipts) {
    const d = new Date(r.receiptDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!receiptsByMonth[key]) receiptsByMonth[key] = { count: 0, sum: 0 };
    receiptsByMonth[key].count++;
    receiptsByMonth[key].sum += r.amount;
  }
  console.log("Receipts by Month:", receiptsByMonth);

  const txByMonth: Record<string, { expense: number; income: number }> = {};
  for (const t of txs) {
    const d = new Date(t.transactionDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!txByMonth[key]) txByMonth[key] = { expense: 0, income: 0 };
    if (t.type === "EXPENSE") txByMonth[key].expense += t.amount;
    else txByMonth[key].income += t.amount;
  }
  console.log("Transactions by Month:", txByMonth);

  console.log("=== EXTRACTION COMPLETE ===");
}

main().finally(() => prisma.$disconnect());
