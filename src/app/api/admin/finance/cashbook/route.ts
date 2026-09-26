import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/finance/cashbook
 * Daily Cashbook showing opening balance, cash income, cash expense, refunds, and closing balance
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const fundCode = searchParams.get("fundCode");

    const targetDate = new Date(dateStr);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    // Build filter
    const txWhere: any = {
      transactionDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (fundCode) {
      txWhere.fund = { code: fundCode };
    }

    // 1. Transactions for the selected date
    const transactions = await prisma.cashTransaction.findMany({
      where: txWhere,
      include: {
        fund: true,
      },
      orderBy: { transactionDate: "asc" },
    });

    // 2. Aggregate income and expenses for today
    let todayIncome = 0;
    let todayExpense = 0;

    for (const t of transactions) {
      if (t.type === "INCOME") {
        todayIncome += t.amount;
      } else if (t.type === "EXPENSE") {
        todayExpense += t.amount;
      }
    }

    // 3. Current live fund balances
    const funds = await prisma.cashFund.findMany({
      orderBy: { code: "asc" },
    });

    const totalBalance = funds.reduce((sum, f) => sum + f.currentBalance, 0);

    return NextResponse.json({
      success: true,
      date: dateStr,
      summary: {
        todayIncome,
        todayExpense,
        netMovement: todayIncome - todayExpense,
        totalBalance,
      },
      funds,
      transactions,
    });
  } catch (error: any) {
    console.error("Cashbook GET error:", error);
    return NextResponse.json({ error: "ক্যাশবুক লোড করা সম্ভব হয়নি।" }, { status: 500 });
  }
}
