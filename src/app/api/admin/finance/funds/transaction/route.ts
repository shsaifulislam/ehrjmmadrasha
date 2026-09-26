import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { validateFundRestriction } from "@/lib/feeCalculationService";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/finance/funds/transaction
 * Record institutional income, expense, or donation with fund restriction enforcement
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      fundCode,
      type, // INCOME, EXPENSE
      category,
      amount,
      payeeOrPayer,
      paymentMethod = "CASH",
      referenceNo,
      notes,
    } = body;

    const parsedAmount = Number(amount);
    if (!fundCode || !type || !category || isNaN(parsedAmount) || parsedAmount <= 0 || !payeeOrPayer) {
      return NextResponse.json(
        { error: "তহবিল কোড, ধরন (আয়/ব্যয়), খাত, সঠিক পরিমাণ এবং নাম প্রদান করুন।" },
        { status: 400 }
      );
    }

    // 1. Enforce Fund Restriction Policy (Section 6, 7, 42)
    const fundCheck = validateFundRestriction(fundCode, type, category);
    if (!fundCheck.allowed) {
      return NextResponse.json(
        { error: fundCheck.reason || "এই তহবিলের অর্থ উক্ত খাতে ব্যয় শরিয়াহ বা প্রাতিষ্ঠানিক নীতি অনুসারে নিষিদ্ধ।" },
        { status: 400 }
      );
    }

    // 2. Fetch Fund
    const fund = await prisma.cashFund.findFirst({
      where: { code: fundCode.toUpperCase() },
    });

    if (!fund) {
      return NextResponse.json({ error: "অনুমোদিত তহবিল পাওয়া যায়নি।" }, { status: 404 });
    }

    // 3. Fund balance integrity: Expense cannot exceed available balance
    if (type === "EXPENSE" && fund.currentBalance < parsedAmount) {
      return NextResponse.json(
        { error: `তহবিলে পর্যাপ্ত ব্যালেন্স নেই। বর্তমান ব্যালেন্স: ৳ ${fund.currentBalance}` },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear();
    const count = await prisma.cashTransaction.count();
    const receiptOrVoucherNo = `${type === "INCOME" ? "MR" : "VR"}-${currentYear}-${String(count + 1).padStart(5, "0")}`;

    const newBalance = type === "INCOME" ? fund.currentBalance + parsedAmount : fund.currentBalance - parsedAmount;

    // 4. Atomic transaction
    const [txRecord, updatedFund] = await prisma.$transaction([
      prisma.cashTransaction.create({
        data: {
          fundId: fund.id,
          type,
          category,
          amount: parsedAmount,
          payeeOrPayer,
          paymentMethod,
          referenceNo: referenceNo || null,
          receiptOrVoucherNo,
          approvedByUserId: user.userId,
          transactionDate: new Date(),
          notes: notes || null,
        },
      }),
      prisma.cashFund.update({
        where: { id: fund.id },
        data: { currentBalance: newBalance },
      }),
    ]);

    await recordAuditLog({
      userId: user.userId,
      action: type === "INCOME" ? "RECORD_INSTITUTIONAL_INCOME" : "RECORD_INSTITUTIONAL_EXPENSE",
      entityType: "CashFund",
      entityId: fund.id,
      details: {
        receiptOrVoucherNo,
        fundCode: fund.code,
        fundName: fund.nameBn,
        category,
        amount: parsedAmount,
        newBalance,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${type === "INCOME" ? "আয়/দান রসিদ" : "ব্যয় ভাউচার"} সফলভাবে অন্তর্ভুক্ত হয়েছে। ভাউচার নং: ${receiptOrVoucherNo}`,
      transaction: txRecord,
      newBalance,
    });
  } catch (error: any) {
    console.error("Fund transaction error:", error);
    return NextResponse.json({ error: error.message || "লেনদেন সম্পন্ন হতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
