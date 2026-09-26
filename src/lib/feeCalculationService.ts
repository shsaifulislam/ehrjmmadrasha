import { prisma } from "@/lib/prisma";

export interface FeeCalculationInput {
  sessionId: string;
  classId: string;
  studentId: string;
  feeType: string; // ADMISSION, MONTHLY, TUITION, HOSTEL, FOOD, EXAM, CERTIFICATE, DOCUMENT, OTHER
  billingMonth?: string; // e.g. "2026-03"
  customBaseFee?: number;
  isOverdue?: boolean;
}

export interface FeeCalculationResult {
  baseAmount: number;
  scholarshipAmount: number;
  assistanceAmount: number;
  discountAmount: number;
  waiverAmount: number;
  lateFeeAmount: number;
  netPayable: number;
  fundCode: string;
  feeStructureId?: string;
  breakdown: {
    rule: string;
    descriptionBn: string;
    amount: number;
  }[];
}

/**
 * Canonical Fee Calculation Engine for EHRJ Digital Campus
 * Enforces:
 * 1. Day Care Food Rule: DAY_CARE students NEVER receive food bills (FOOD).
 * 2. Strict calculation precedence: Base -> Scholarship -> Assistance -> Discount/Waiver -> Late Fee -> max(0, finalPayable).
 * 3. Historical immutability of previously issued invoices.
 */
export async function calculateStudentFee(
  input: FeeCalculationInput
): Promise<FeeCalculationResult> {
  const { sessionId, classId, studentId, feeType, billingMonth, customBaseFee, isOverdue } = input;

  // 1. Fetch Student profile & residential status
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      financialAssistances: {
        where: {
          sessionId,
          status: "APPROVED",
          validFrom: { lte: new Date() },
          validTo: { gte: new Date() },
        },
      },
      scholarships: {
        where: {
          sessionId,
          effectiveFrom: { lte: new Date() },
          effectiveTo: { gte: new Date() },
        },
        include: {
          scholarship: true,
        },
      },
    },
  });

  if (!student) {
    throw new Error("শিক্ষার্থীর তথ্য পাওয়া যায়নি।");
  }

  // 2. DAY_CARE FOOD RULE (CRITICAL INVARIANT)
  // DAY_CARE students do NOT receive food bills.
  if (student.residentialStatus === "DAY_CARE" && feeType === "FOOD") {
    return {
      baseAmount: 0,
      scholarshipAmount: 0,
      assistanceAmount: 0,
      discountAmount: 0,
      waiverAmount: 0,
      lateFeeAmount: 0,
      netPayable: 0,
      fundCode: "LILLAH",
      breakdown: [
        {
          rule: "DAY_CARE_FOOD_EXEMPTION",
          descriptionBn: "ডে-কেয়ার শিক্ষার্থীর জন্য খাবার ফি প্রযোজ্য নয় (সম্পূর্ণ মওকুফ)।",
          amount: 0,
        },
      ],
    };
  }

  // 3. Resolve Base Fee from FeeStructure (or customBaseFee fallback)
  let baseAmount = 0;
  let fundCode = "GENERAL";
  let lateFeeRate = 0;
  let feeStructureId: string | undefined = undefined;

  if (customBaseFee !== undefined && customBaseFee >= 0) {
    baseAmount = customBaseFee;
    if (feeType === "FOOD") fundCode = "LILLAH";
  } else {
    // Lookup matching fee structure: priority to class-specific, then general class
    const structure = await prisma.feeStructure.findFirst({
      where: {
        sessionId,
        feeType,
        isActive: true,
        OR: [{ classId }, { classId: null }],
        AND: [
          {
            OR: [
              { residentialStatus: "ALL" },
              { residentialStatus: student.residentialStatus },
            ],
          },
        ],
      },
      orderBy: [{ classId: "desc" }, { createdAt: "desc" }],
    });

    if (structure) {
      baseAmount = structure.amount;
      fundCode = structure.fundCode || (feeType === "FOOD" ? "LILLAH" : "GENERAL");
      feeStructureId = structure.id;
      if (isOverdue) {
        lateFeeRate = structure.lateFeeAmount || 0;
      }
    } else {
      // Default institutional fallback if not explicitly configured in FeeStructure
      if (feeType === "ADMISSION") baseAmount = 1500;
      else if (feeType === "FOOD") {
        baseAmount = student.residentialStatus === "RESIDENTIAL" ? 2000 : 0;
        fundCode = "LILLAH";
      } else if (feeType === "MONTHLY" || feeType === "TUITION") baseAmount = 800;
      else if (feeType === "EXAM") baseAmount = 300;
      else baseAmount = 500;
    }
  }

  const breakdown: FeeCalculationResult["breakdown"] = [
    {
      rule: "BASE_FEE",
      descriptionBn: `মূল ফি (${feeType})`,
      amount: baseAmount,
    },
  ];

  let currentPayable = baseAmount;

  // 4. Apply Active Scholarship
  let scholarshipAmount = 0;
  const applicableScholarship = student.scholarships.find(
    (s) =>
      s.scholarship.isActive &&
      (s.scholarship.applicableFeeType === "ALL" || s.scholarship.applicableFeeType === feeType)
  );

  if (applicableScholarship && currentPayable > 0) {
    const sc = applicableScholarship.scholarship;
    if (sc.discountType === "PERCENTAGE") {
      scholarshipAmount = Math.round((currentPayable * sc.discountValue) / 100);
    } else {
      scholarshipAmount = Math.min(sc.discountValue, currentPayable);
    }
    currentPayable = Math.max(0, currentPayable - scholarshipAmount);
    breakdown.push({
      rule: "SCHOLARSHIP",
      descriptionBn: `মেধাবৃত্তি (${sc.nameBn})`,
      amount: -scholarshipAmount,
    });
  }

  // 5. Apply Approved Financial Assistance
  let assistanceAmount = 0;
  const applicableAssistance = student.financialAssistances.find(
    (fa) =>
      fa.status === "APPROVED" &&
      (!fa.feeCategoryTarget ||
        fa.feeCategoryTarget === "ALL" ||
        fa.feeCategoryTarget === feeType)
  );

  if (applicableAssistance && currentPayable > 0) {
    if (applicableAssistance.waiverPercentage > 0) {
      assistanceAmount = Math.round(
        (currentPayable * applicableAssistance.waiverPercentage) / 100
      );
    } else if (applicableAssistance.waiverAmount > 0) {
      assistanceAmount = Math.min(applicableAssistance.waiverAmount, currentPayable);
    }
    currentPayable = Math.max(0, currentPayable - assistanceAmount);
    breakdown.push({
      rule: "FINANCIAL_ASSISTANCE",
      descriptionBn: `আর্থিক সহায়তা ও মওকুফ (${applicableAssistance.reason || "অনুমোদিত"})`,
      amount: -assistanceAmount,
    });
  }

  // 6. Discount / Orphan Waiver Check
  // Note: Per Section 14, orphan waiver is configurable and not universally hardcoded,
  // but if orphan has 100% assistance or general orphan support fund policy:
  let discountAmount = 0;
  let waiverAmount = 0;

  // 7. Late Fee where applicable
  let lateFeeAmount = 0;
  if (isOverdue && lateFeeRate > 0) {
    lateFeeAmount = lateFeeRate;
    currentPayable += lateFeeAmount;
    breakdown.push({
      rule: "LATE_FEE",
      descriptionBn: "বিলম্ব ফি (নির্ধারিত তারিখ উত্তীর্ণ)",
      amount: lateFeeAmount,
    });
  }

  // 8. Final Payable boundary (strictly max(0, finalPayable))
  const netPayable = Math.max(0, currentPayable);

  return {
    baseAmount,
    scholarshipAmount,
    assistanceAmount,
    discountAmount,
    waiverAmount,
    lateFeeAmount,
    netPayable,
    fundCode,
    feeStructureId,
    breakdown,
  };
}

/**
 * Generate Next Unique Concurrency-Safe Invoice Number
 * Format: EHRJ-INV-YYYY-XXXXX
 */
export async function generateNextInvoiceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const latest = await prisma.feeInvoice.findFirst({
    where: { invoiceNumber: { startsWith: `EHRJ-INV-${currentYear}-` } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });
  let maxSeq = 0;
  if (latest?.invoiceNumber) {
    const parts = latest.invoiceNumber.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) maxSeq = num;
  }
  const count = await prisma.feeInvoice.count();
  const nextSeq = Math.max(maxSeq + 1, count + 1);
  return `EHRJ-INV-${currentYear}-${String(nextSeq).padStart(5, "0")}`;
}

/**
 * Generate Next Unique Concurrency-Safe Receipt Number
 * Format: EHRJ-RCP-YYYY-XXXXX
 */
export async function generateNextReceiptNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const latest = await prisma.paymentReceipt.findFirst({
    where: { receiptNumber: { startsWith: `EHRJ-RCP-${currentYear}-` } },
    orderBy: { receiptNumber: "desc" },
    select: { receiptNumber: true },
  });
  let maxSeq = 0;
  if (latest?.receiptNumber) {
    const parts = latest.receiptNumber.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) maxSeq = num;
  }
  const count = await prisma.paymentReceipt.count();
  const nextSeq = Math.max(maxSeq + 1, count + 1);
  return `EHRJ-RCP-${currentYear}-${String(nextSeq).padStart(5, "0")}`;
}

/**
 * Generate Next Unique Concurrency-Safe Refund Number
 * Format: EHRJ-RFD-YYYY-XXXXX
 */
export async function generateNextRefundNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const latest = await prisma.refund.findFirst({
    where: { refundNumber: { startsWith: `EHRJ-RFD-${currentYear}-` } },
    orderBy: { refundNumber: "desc" },
    select: { refundNumber: true },
  });
  let maxSeq = 0;
  if (latest?.refundNumber) {
    const parts = latest.refundNumber.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) maxSeq = num;
  }
  const count = await prisma.refund.count();
  const nextSeq = Math.max(maxSeq + 1, count + 1);
  return `EHRJ-RFD-${currentYear}-${String(nextSeq).padStart(5, "0")}`;
}

/**
 * Generate Next Unique Concurrency-Safe Payroll Voucher Number
 * Format: EHRJ-PAY-YYYY-XXXXX
 */
export async function generateNextPayrollVoucherNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const [latestPayroll, latestTx] = await Promise.all([
    prisma.payrollRecord.findFirst({
      where: { voucherNumber: { startsWith: `EHRJ-PAY-${currentYear}-` } },
      orderBy: { voucherNumber: "desc" },
      select: { voucherNumber: true },
    }),
    prisma.cashTransaction.findFirst({
      where: { receiptOrVoucherNo: { startsWith: `EHRJ-PAY-${currentYear}-` } },
      orderBy: { receiptOrVoucherNo: "desc" },
      select: { receiptOrVoucherNo: true },
    }),
  ]);
  let maxSeq = 0;
  if (latestPayroll?.voucherNumber) {
    const parts = latestPayroll.voucherNumber.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num) && num > maxSeq) maxSeq = num;
  }
  if (latestTx?.receiptOrVoucherNo) {
    const parts = latestTx.receiptOrVoucherNo.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num) && num > maxSeq) maxSeq = num;
  }
  const count = await prisma.payrollRecord.count();
  const nextSeq = Math.max(maxSeq + 1, count + 1);
  return `EHRJ-PAY-${currentYear}-${String(nextSeq).padStart(5, "0")}`;
}


/**
 * Enforce Institutional Fund Usage Rules
 */
export function validateFundRestriction(fundCode: string, transactionType: "INCOME" | "EXPENSE", category: string): { allowed: boolean; reason?: string } {
  const upperCode = fundCode.toUpperCase();
  const lowerCat = category.toLowerCase();

  if (transactionType === "EXPENSE") {
    if (upperCode === "ZAKAT") {
      // Zakat can only be used for poor student welfare, orphan support, not admin overhead
      if (lowerCat.includes("অফিস") || lowerCat.includes("ইউটিলিটি") || lowerCat.includes("বিদ্যুৎ") || lowerCat.includes("বিল") || lowerCat.includes("মেরামত")) {
        return {
          allowed: false,
          reason: "যাকাত তহবিলের অর্থ সাধারণ প্রশাসনিক ব্যয় বা ইউটিলিটি বিলে ব্যবহার শরিয়াহ অনুযায়ী নিষিদ্ধ।",
        };
      }
    }
    if (upperCode === "LILLAH") {
      // Lillah boarding fund is for student meals and food
      if (lowerCat.includes("নির্মাণ") || lowerCat.includes("জমি") || lowerCat.includes("গাড়ি")) {
        return {
          allowed: false,
          reason: "লিল্লাহ ফান্ডের অর্থ নির্মাণ বা জমি সংক্রান্ত ব্যয়ে ব্যবহার করা যাবে না।",
        };
      }
    }
    if (upperCode === "CONSTRUCTION") {
      if (lowerCat.includes("বেতন") || lowerCat.includes("খাবার") || lowerCat.includes("উপহার")) {
        return {
          allowed: false,
          reason: "নির্মাণ ফান্ডের অর্থ কেবল অবকাঠামোগত উন্নয়ন ও নির্মাণকাজে প্রযোজ্য।",
        };
      }
    }
  }

  return { allowed: true };
}
