import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/principal/reports
 * Authoritative Governance Reports Endpoint for Principal Desk.
 * Supported query types:
 * - type=CASHBOOK : 5-Fund Cashbook & Financial Audit Summary
 * - type=RESULTS  : Academic Exam Result Sheets & Merit Tabulation
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস: কেবলমাত্র অধ্যক্ষ ও অ্যাডমিন এই রিপোর্ট দেখতে পারেন।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const reportType = (searchParams.get("type") || "CASHBOOK").toUpperCase();

    // -------------------------------------------------------------
    // 1. CASHBOOK & FIVE-FUND AUDIT SUMMARY
    // -------------------------------------------------------------
    if (reportType === "CASHBOOK") {
      const fundCode = searchParams.get("fundCode");
      const fromDate = searchParams.get("fromDate");
      const toDate = searchParams.get("toDate");

      // Fetch all 5 official institutional funds
      const funds = await prisma.cashFund.findMany({
        orderBy: { code: "asc" },
      });

      // Filter criteria for transactions
      const txWhere: any = {};
      if (fundCode && fundCode !== "ALL") {
        txWhere.fund = { code: fundCode };
      }
      if (fromDate || toDate) {
        txWhere.transactionDate = {};
        if (fromDate) txWhere.transactionDate.gte = new Date(fromDate);
        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          txWhere.transactionDate.lte = end;
        }
      }

      const [transactions, totalTxCount, incomeAgg, expenseAgg] = await Promise.all([
        prisma.cashTransaction.findMany({
          where: txWhere,
          include: {
            fund: { select: { id: true, code: true, nameBn: true, nameEn: true } },
          },
          orderBy: { transactionDate: "desc" },
          take: 50,
        }),
        prisma.cashTransaction.count({ where: txWhere }),
        prisma.cashTransaction.aggregate({
          where: { ...txWhere, type: "INCOME" },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.cashTransaction.aggregate({
          where: { ...txWhere, type: "EXPENSE" },
          _sum: { amount: true },
          _count: true,
        }),
      ]);

      // Calculate fund-wise statistics
      const fundSummaries = await Promise.all(
        funds.map(async (fund) => {
          const [fIncome, fExpense] = await Promise.all([
            prisma.cashTransaction.aggregate({
              where: { fundId: fund.id, type: "INCOME" },
              _sum: { amount: true },
            }),
            prisma.cashTransaction.aggregate({
              where: { fundId: fund.id, type: "EXPENSE" },
              _sum: { amount: true },
            }),
          ]);

          const totalIncome = fIncome._sum.amount || 0;
          const totalExpense = fExpense._sum.amount || 0;

          return {
            id: fund.id,
            code: fund.code,
            nameBn: fund.nameBn,
            nameEn: fund.nameEn,
            currentBalance: fund.currentBalance,
            totalIncome,
            totalExpense,
          };
        })
      );

      const totalBalanceAllFunds = funds.reduce((sum, f) => sum + (f.currentBalance || 0), 0);

      return NextResponse.json({
        success: true,
        reportType: "CASHBOOK",
        generatedAt: new Date().toISOString(),
        auditedBy: user.name,
        totalBalanceAllFunds,
        fundSummaries,
        summary: {
          totalIncome: incomeAgg._sum.amount || 0,
          totalExpense: expenseAgg._sum.amount || 0,
          netFlow: (incomeAgg._sum.amount || 0) - (expenseAgg._sum.amount || 0),
          transactionCount: totalTxCount,
        },
        transactions,
      });
    }

    // -------------------------------------------------------------
    // 2. ACADEMIC EXAM RESULTS & MERIT TABULATION
    // -------------------------------------------------------------
    if (reportType === "RESULTS") {
      const examId = searchParams.get("examId") || undefined;
      const classId = searchParams.get("classId") || undefined;

      // Available Exams
      const exams = await prisma.exam.findMany({
        select: {
          id: true,
          nameBn: true,
          status: true,
          isPublished: true,
          session: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      // Available Classes
      const jamatClasses = await prisma.jamatClass.findMany({
        select: { id: true, nameBn: true, code: true },
        orderBy: { code: "asc" },
      });

      // Selected Exam (or first published exam, or first available)
      const selectedExam = examId
        ? exams.find((e) => e.id === examId)
        : exams.find((e) => e.isPublished) || exams[0];

      let results: any[] = [];
      let totalResults = 0;

      if (selectedExam) {
        const where: any = { examId: selectedExam.id };
        if (classId && classId !== "ALL") {
          where.classId = classId;
        }

        const [count, rawResults] = await Promise.all([
          prisma.result.count({ where }),
          prisma.result.findMany({
            where,
            include: {
              student: {
                select: {
                  id: true,
                  studentIdNumber: true,
                  fullNameBn: true,
                },
              },
            },
            orderBy: [{ rankInClass: "asc" }, { totalMarks: "desc" }],
            take: 100,
          }),
        ]);

        totalResults = count;
        results = rawResults;
      }

      return NextResponse.json({
        success: true,
        reportType: "RESULTS",
        generatedAt: new Date().toISOString(),
        exams,
        jamatClasses,
        selectedExam: selectedExam || null,
        totalResults,
        results,
      });
    }

    return NextResponse.json(
      { error: "অবৈধ রিপোর্ট টাইপ। শুধু CASHBOOK অথবা RESULTS গ্রহণযোগ্য।" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Principal Reports API Error:", error);
    return NextResponse.json(
      { error: error.message || "রিপোর্ট ডাটা প্রস্তুত করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
