import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "ACCOUNTANT" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const funds = await prisma.cashFund.findMany({
      include: {
        transactions: {
          orderBy: { transactionDate: "desc" },
          take: 5,
        },
      },
    });

    const recentTransactions = await prisma.cashTransaction.findMany({
      include: {
        fund: true,
      },
      orderBy: { transactionDate: "desc" },
      take: 20,
    });

    return NextResponse.json({ success: true, funds, recentTransactions });
  } catch (error: any) {
    console.error("Finance GET Error:", error);
    return NextResponse.json({ error: "ফান্ড হিসাব লোড করা সম্ভব হয়নি।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { fundId, type, category, amount, payeeOrPayer, paymentMethod, notes } = await req.json();

    if (!fundId || !type || !amount || Number(amount) <= 0 || !payeeOrPayer) {
      return NextResponse.json(
        { error: "তহবিল, ধরন (আয়/ব্যয়), সঠিক পরিমাণ এবং দাতা/গ্রহীতার নাম প্রদান করুন।" },
        { status: 400 }
      );
    }

    const fund = await prisma.cashFund.findUnique({
      where: { id: fundId },
    });

    if (!fund) {
      return NextResponse.json({ error: "তহবিলটি পাওয়া যায়নি।" }, { status: 404 });
    }

    const parsedAmount = Number(amount);

    if (type === "EXPENSE" && fund.currentBalance < parsedAmount) {
      return NextResponse.json(
        { error: `তহবিলে পর্যাপ্ত ব্যালেন্স নেই। বর্তমান ব্যালেন্স: ৳ ${fund.currentBalance}` },
        { status: 400 }
      );
    }

    const count = await prisma.cashTransaction.count();
    const receiptOrVoucherNo = `${type === "INCOME" ? "MR" : "VR"}-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

    const newBalance = type === "INCOME" ? fund.currentBalance + parsedAmount : fund.currentBalance - parsedAmount;

    // Use transaction to ensure fund balance consistency
    const [transaction] = await prisma.$transaction([
      prisma.cashTransaction.create({
        data: {
          fundId,
          type,
          category: category || (type === "INCOME" ? "সাধারণ দান" : "দাপ্তরিক ব্যয়"),
          amount: parsedAmount,
          payeeOrPayer,
          paymentMethod: paymentMethod || "CASH",
          receiptOrVoucherNo,
          approvedByUserId: user.userId,
          notes,
        },
      }),
      prisma.cashFund.update({
        where: { id: fundId },
        data: { currentBalance: newBalance },
      }),
    ]);

    await recordAuditLog({
      userId: user.userId,
      action: type === "INCOME" ? "RECORD_INCOME" : "RECORD_EXPENSE",
      entityType: "CashFund",
      entityId: fundId,
      details: {
        receiptOrVoucherNo,
        amount: parsedAmount,
        fundName: fund.nameBn,
        newBalance,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${type === "INCOME" ? "আয় রসিদ" : "ব্যয় ভাউচার"} সফলভাবে অন্তর্ভুক্ত হয়েছে। ভাউচার নং: ${receiptOrVoucherNo}`,
      transaction,
      newBalance,
    });
  } catch (error: any) {
    console.error("Finance POST Error:", error);
    return NextResponse.json({ error: "লেনদেন সংরক্ষণে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
