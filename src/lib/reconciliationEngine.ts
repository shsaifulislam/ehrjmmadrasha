import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export interface ReconciliationItem {
  id: string;
  domain: "FINANCE" | "LIBRARY" | "INVENTORY" | "PAYROLL";
  subsystemA: string;
  subsystemB: string;
  recordIdentifier: string;
  titleBn: string;
  status: "MATCHED" | "MISMATCH" | "MISSING_LEFT" | "MISSING_RIGHT" | "REVIEW_REQUIRED";
  difference?: number;
  detailsA: Record<string, any>;
  detailsB: Record<string, any>;
  notesBn: string;
}

export interface ReconciliationReport {
  id: string; // REC-YYYYMMDD-XXXX
  timestamp: string;
  totalChecks: number;
  matchedCount: number;
  mismatchCount: number;
  reviewRequiredCount: number;
  domainSummaries: {
    finance: { total: number; matched: number; mismatches: number };
    library: { total: number; matched: number; mismatches: number };
    inventory: { total: number; matched: number; mismatches: number };
    payroll: { total: number; matched: number; mismatches: number };
  };
  items: ReconciliationItem[];
}

const RECONCILIATION_FILE = path.join(process.cwd(), "data", "governance", "reconciliation_runs.json");

function ensureFile() {
  const dir = path.join(process.cwd(), "data", "governance");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(RECONCILIATION_FILE)) fs.writeFileSync(RECONCILIATION_FILE, JSON.stringify([], null, 2), "utf-8");
}

export function getLatestReconciliationReport(): ReconciliationReport | null {
  ensureFile();
  try {
    const runs: ReconciliationReport[] = JSON.parse(fs.readFileSync(RECONCILIATION_FILE, "utf-8"));
    return runs.length > 0 ? runs[0] : null;
  } catch {
    return null;
  }
}

export async function runMasterReconciliation(): Promise<ReconciliationReport> {
  ensureFile();
  const items: ReconciliationItem[] = [];

  // -------------------------------------------------------------
  // 1. FINANCE RECONCILIATION
  // -------------------------------------------------------------
  // A. Invoices vs Payment Receipts
  const invoices = await prisma.feeInvoice.findMany({
    include: { receipts: true, refunds: true, items: true }
  });

  for (const inv of invoices) {
    const receiptsSum = inv.receipts
      .filter(r => r.paymentStatus === "SUCCESSFUL")
      .reduce((sum, r) => sum + r.amount, 0);
    const refundsSum = inv.refunds.reduce((sum, ref) => sum + ref.amount, 0);
    const netPaidCalculated = receiptsSum - refundsSum;

    const diff = Math.abs(inv.paidAmount - netPaidCalculated);
    if (diff > 0.01) {
      items.push({
        id: `FIN-INV-${inv.invoiceNumber}`,
        domain: "FINANCE",
        subsystemA: "FeeInvoice.paidAmount",
        subsystemB: "PaymentReceipt.amount (Sum)",
        recordIdentifier: inv.invoiceNumber,
        titleBn: `ইনভয়েস পরিশোধিত অর্থ ও পেমেন্ট রসিদ গরমিল (${inv.invoiceNumber})`,
        status: "MISMATCH",
        difference: inv.paidAmount - netPaidCalculated,
        detailsA: { invoiceNumber: inv.invoiceNumber, paidAmount: inv.paidAmount },
        detailsB: { totalReceipts: receiptsSum, totalRefunds: refundsSum, netCalculated: netPaidCalculated },
        notesBn: `ইনভয়েসে ৳${inv.paidAmount} পরিশোধিত দেখানো হয়েছে, কিন্তু রসিদ বইয়ে ৳${netPaidCalculated} জমা রয়েছে।`
      });
    } else {
      items.push({
        id: `FIN-INV-${inv.invoiceNumber}`,
        domain: "FINANCE",
        subsystemA: "FeeInvoice.paidAmount",
        subsystemB: "PaymentReceipt.amount (Sum)",
        recordIdentifier: inv.invoiceNumber,
        titleBn: `ইনভয়েস ও রসিদ সামঞ্জস্যপূর্ণ (${inv.invoiceNumber})`,
        status: "MATCHED",
        detailsA: { invoiceNumber: inv.invoiceNumber, paidAmount: inv.paidAmount },
        detailsB: { netCalculated: netPaidCalculated },
        notesBn: "ইনভয়েস ও রসিদের অংক সম্পূর্ণ মিলে গেছে।"
      });
    }
  }

  // B. CashFund Balance vs Transactions
  const funds = await prisma.cashFund.findMany({
    include: { transactions: true }
  });

  for (const fund of funds) {
    let ledgerTotal = 0;
    for (const tx of fund.transactions) {
      if (tx.type === "INCOME") ledgerTotal += tx.amount;
      else if (tx.type === "EXPENSE") ledgerTotal -= tx.amount;
    }

    const diff = Math.abs(fund.currentBalance - ledgerTotal);
    if (diff > 0.01) {
      items.push({
        id: `FIN-FUND-${fund.code}`,
        domain: "FINANCE",
        subsystemA: "CashFund.currentBalance",
        subsystemB: "CashTransaction (Ledger Sum)",
        recordIdentifier: fund.code,
        titleBn: `ফান্ড ব্যালেন্স ও ক্যাশ লেনদেন ব্যবধান (${fund.nameBn})`,
        status: "MISMATCH",
        difference: fund.currentBalance - ledgerTotal,
        detailsA: { fundCode: fund.code, currentBalance: fund.currentBalance },
        detailsB: { ledgerSum: ledgerTotal },
        notesBn: `ফান্ড ব্যালেন্স ৳${fund.currentBalance}, তবে ক্যাশ লেনদেনের যোগফল ৳${ledgerTotal} (ব্যবধান: ৳${fund.currentBalance - ledgerTotal})। প্রারম্ভিক জের সমন্বয় প্রয়োজন।`
      });
    } else {
      items.push({
        id: `FIN-FUND-${fund.code}`,
        domain: "FINANCE",
        subsystemA: "CashFund.currentBalance",
        subsystemB: "CashTransaction (Ledger Sum)",
        recordIdentifier: fund.code,
        titleBn: `ফান্ড ব্যালেন্স খতিয়ান সমতা (${fund.nameBn})`,
        status: "MATCHED",
        detailsA: { fundCode: fund.code, currentBalance: fund.currentBalance },
        detailsB: { ledgerSum: ledgerTotal },
        notesBn: "ফান্ড ব্যালেন্স ও ক্যাশ ভাউচারের হিসাব সম্পূর্ণ নির্ভুল।"
      });
    }
  }

  // -------------------------------------------------------------
  // 2. LIBRARY RECONCILIATION (Copy Status vs Active Issue)
  // -------------------------------------------------------------
  const bookCopies = await prisma.libraryBookCopy.findMany({
    include: {
      issues: {
        where: { status: { in: ["ISSUED", "OVERDUE"] } }
      },
      book: true
    }
  });

  for (const copy of bookCopies) {
    const hasActiveIssue = copy.issues.length > 0;
    const isMarkedIssued = copy.status === "BORROWED" || copy.status === "ISSUED";

    if (hasActiveIssue && !isMarkedIssued) {
      items.push({
        id: `LIB-COPY-${copy.accessionNo}`,
        domain: "LIBRARY",
        subsystemA: "LibraryBookCopy.status",
        subsystemB: "LibraryIssue (Active Record)",
        recordIdentifier: copy.accessionNo,
        titleBn: `কিতাব কপি স্ট্যাটাস অসামঞ্জস্য (${copy.book.titleBn})`,
        status: "MISMATCH",
        detailsA: { copyId: copy.id, accessionNo: copy.accessionNo, status: copy.status },
        detailsB: { activeIssuesCount: copy.issues.length, issueId: copy.issues[0]?.id },
        notesBn: `কপিটির সক্রিয় ইস্যু রেকর্ড রয়েছে কিন্তু স্ট্যাটাস '${copy.status}' হিসেবে প্রদর্শিত হচ্ছে।`
      });
    } else if (!hasActiveIssue && isMarkedIssued) {
      items.push({
        id: `LIB-COPY-${copy.accessionNo}`,
        domain: "LIBRARY",
        subsystemA: "LibraryBookCopy.status",
        subsystemB: "LibraryIssue (Active Record)",
        recordIdentifier: copy.accessionNo,
        titleBn: `কিতাব কপি ইস্যু রেকর্ড অনুপস্থিত (${copy.book.titleBn})`,
        status: "REVIEW_REQUIRED",
        detailsA: { copyId: copy.id, accessionNo: copy.accessionNo, status: copy.status },
        detailsB: { activeIssuesCount: 0 },
        notesBn: `কপির স্ট্যাটাস '${copy.status}', কিন্তু কোনো সক্রিয় ইস্যু রেকর্ড পাওয়া যায়নি।`
      });
    } else {
      items.push({
        id: `LIB-COPY-${copy.accessionNo}`,
        domain: "LIBRARY",
        subsystemA: "LibraryBookCopy.status",
        subsystemB: "LibraryIssue (Active Record)",
        recordIdentifier: copy.accessionNo,
        titleBn: `কিতাব সার্কুলেশন সমতা (${copy.book.titleBn})`,
        status: "MATCHED",
        detailsA: { status: copy.status },
        detailsB: { activeIssues: copy.issues.length },
        notesBn: "কপি ও সার্কুলেশন খতিয়ান সম্পূর্ণ সামঞ্জস্যপূর্ণ।"
      });
    }
  }

  // -------------------------------------------------------------
  // 3. INVENTORY RECONCILIATION (Recorded Balance vs Transactions)
  // -------------------------------------------------------------
  const stockBalances = await prisma.inventoryStockBalance.findMany({
    include: {
      item: {
        include: {
          transactions: true
        }
      }
    }
  });

  for (const sb of stockBalances) {
    let calcBalance = sb.openingBalance || 0;
    for (const tx of sb.item.transactions) {
      if (tx.transactionType === "RECEIPT" || tx.transactionType === "TRANSFER_IN") {
        calcBalance += tx.quantity;
      } else if (tx.transactionType === "ISSUE" || tx.transactionType === "TRANSFER_OUT" || tx.transactionType === "DISPOSAL" || tx.transactionType === "DAMAGE") {
        calcBalance -= tx.quantity;
      }
    }

    const diff = Math.abs(sb.currentBalance - calcBalance);
    if (diff > 0.01) {
      items.push({
        id: `INV-STOCK-${sb.item.itemCode}`,
        domain: "INVENTORY",
        subsystemA: "InventoryStockBalance.currentBalance",
        subsystemB: "InventoryTransaction (Sum)",
        recordIdentifier: sb.item.itemCode,
        titleBn: `মালামাল স্টক ব্যালেন্স ব্যবধান (${sb.item.nameBn})`,
        status: "MISMATCH",
        difference: sb.currentBalance - calcBalance,
        detailsA: { itemCode: sb.item.itemCode, recordedBalance: sb.currentBalance },
        detailsB: { calculatedFromLedger: calcBalance },
        notesBn: `সংরক্ষিত স্টক ব্যালেন্স ${sb.currentBalance}, তবে ট্রানজেকশন বই অনুযায়ী ${calcBalance} (ব্যবধান: ${sb.currentBalance - calcBalance})।`
      });
    } else {
      items.push({
        id: `INV-STOCK-${sb.item.itemCode}`,
        domain: "INVENTORY",
        subsystemA: "InventoryStockBalance.currentBalance",
        subsystemB: "InventoryTransaction (Sum)",
        recordIdentifier: sb.item.itemCode,
        titleBn: `মালামাল স্টক লেজার সামঞ্জস্যপূর্ণ (${sb.item.nameBn})`,
        status: "MATCHED",
        detailsA: { recordedBalance: sb.currentBalance },
        detailsB: { calculatedFromLedger: calcBalance },
        notesBn: "স্টক ব্যালেন্স ও ট্রানজেকশন খতিয়ান শতভাগ মিলে গেছে।"
      });
    }
  }

  // -------------------------------------------------------------
  // 4. PAYROLL RECONCILIATION (Net Salary Math)
  // -------------------------------------------------------------
  const payrolls = await prisma.payrollRecord.findMany({
    include: { user: true }
  });

  for (const pr of payrolls) {
    const calculatedNet = pr.baseSalary + pr.allowances - pr.deductions - pr.advanceDeduction;
    const diff = Math.abs(pr.netSalary - calculatedNet);

    if (diff > 0.01) {
      items.push({
        id: `PAY-REC-${pr.voucherNumber}`,
        domain: "PAYROLL",
        subsystemA: "PayrollRecord.netSalary",
        subsystemB: "Base + Allowances - Deductions - Advance",
        recordIdentifier: pr.voucherNumber,
        titleBn: `বেতন ভাউচার নিট বেতন অসঙ্গতি (${pr.voucherNumber})`,
        status: "MISMATCH",
        difference: pr.netSalary - calculatedNet,
        detailsA: { voucherNumber: pr.voucherNumber, recordedNet: pr.netSalary },
        detailsB: { base: pr.baseSalary, allowances: pr.allowances, deductions: pr.deductions, advance: pr.advanceDeduction, calculatedNet },
        notesBn: `সংরক্ষিত নিট বেতন ৳${pr.netSalary}, কিন্তু সূত্র অনুযায়ী প্রাপ্য ৳${calculatedNet}।`
      });
    } else {
      items.push({
        id: `PAY-REC-${pr.voucherNumber}`,
        domain: "PAYROLL",
        subsystemA: "PayrollRecord.netSalary",
        subsystemB: "Calculated Formula",
        recordIdentifier: pr.voucherNumber,
        titleBn: `বেতন ভাউচার গাণিতিক নির্ভুলতা (${pr.voucherNumber})`,
        status: "MATCHED",
        detailsA: { recordedNet: pr.netSalary },
        detailsB: { calculatedNet },
        notesBn: "বেতন ভাউচারের নিট বেতন সম্পূর্ণ নির্ভুল।"
      });
    }
  }

  // Aggregate stats
  const matched = items.filter(i => i.status === "MATCHED").length;
  const mismatches = items.filter(i => i.status === "MISMATCH").length;
  const reviewRequired = items.filter(i => i.status === "REVIEW_REQUIRED").length;

  const now = new Date();
  const reportId = `REC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

  const report: ReconciliationReport = {
    id: reportId,
    timestamp: now.toISOString(),
    totalChecks: items.length,
    matchedCount: matched,
    mismatchCount: mismatches,
    reviewRequiredCount: reviewRequired,
    domainSummaries: {
      finance: {
        total: items.filter(i => i.domain === "FINANCE").length,
        matched: items.filter(i => i.domain === "FINANCE" && i.status === "MATCHED").length,
        mismatches: items.filter(i => i.domain === "FINANCE" && i.status === "MISMATCH").length
      },
      library: {
        total: items.filter(i => i.domain === "LIBRARY").length,
        matched: items.filter(i => i.domain === "LIBRARY" && i.status === "MATCHED").length,
        mismatches: items.filter(i => i.domain === "LIBRARY" && i.status === "MISMATCH").length
      },
      inventory: {
        total: items.filter(i => i.domain === "INVENTORY").length,
        matched: items.filter(i => i.domain === "INVENTORY" && i.status === "MATCHED").length,
        mismatches: items.filter(i => i.domain === "INVENTORY" && i.status === "MISMATCH").length
      },
      payroll: {
        total: items.filter(i => i.domain === "PAYROLL").length,
        matched: items.filter(i => i.domain === "PAYROLL" && i.status === "MATCHED").length,
        mismatches: items.filter(i => i.domain === "PAYROLL" && i.status === "MISMATCH").length
      }
    },
    items
  };

  // Save report into historical runs
  try {
    const runs: ReconciliationReport[] = JSON.parse(fs.readFileSync(RECONCILIATION_FILE, "utf-8"));
    runs.unshift(report);
    // Keep max 20 runs
    if (runs.length > 20) runs.length = 20;
    fs.writeFileSync(RECONCILIATION_FILE, JSON.stringify(runs, null, 2), "utf-8");
  } catch {}

  return report;
}
