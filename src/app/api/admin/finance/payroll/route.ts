import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { generateNextPayrollVoucherNumber } from "@/lib/feeCalculationService";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/finance/payroll
 * List monthly payroll records
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

    const payrolls = await prisma.payrollRecord.findMany({
      where: { month },
      include: {
        user: { select: { id: true, name: true, role: true, phone: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER", status: "ACTIVE" },
      select: { id: true, name: true, phone: true, email: true },
    });

    return NextResponse.json({ success: true, month, payrolls, teachers });
  } catch (error: any) {
    console.error("Payroll GET error:", error);
    return NextResponse.json({ error: "বেতন তালিকা লোড করা যায়নি।" }, { status: 500 });
  }
}

/**
 * POST /api/admin/finance/payroll
 * Generate, approve, or disburse monthly salary with atomic transaction, fund balance update, and audit
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন বেতন পরিচালনা করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      userId,
      month,
      baseSalary,
      allowances = 0,
      deductions = 0,
      advanceDeduction = 0,
      paymentMethod = "CASH",
      fundCode = "GENERAL",
      action = "DRAFT", // DRAFT, APPROVE, PAY
      notes,
    } = body;

    if (!userId || !month || baseSalary === undefined || Number(baseSalary) <= 0) {
      return NextResponse.json({ error: "শিক্ষক/কর্মী, মাস এবং মূল বেতনের পরিমাণ আবশ্যক।" }, { status: 400 });
    }

    const parsedBase = Number(baseSalary);
    const parsedAllow = Number(allowances);
    const parsedDeduct = Number(deductions);
    const parsedAdvance = Number(advanceDeduction);
    const netSalary = Math.max(0, parsedBase + parsedAllow - parsedDeduct - parsedAdvance);

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "ব্যবহারকারী পাওয়া যায়নি।" }, { status: 404 });
    }

    // Check if payroll already exists for this user and month
    const existing = await prisma.payrollRecord.findUnique({
      where: {
        userId_month: { userId, month },
      },
    });

    if (existing && existing.status === "PAID" && action === "PAY") {
      return NextResponse.json({ error: "এই মাসের বেতন ইতিপূর্বেই পরিশোধ করা হয়েছে।" }, { status: 400 });
    }

    // If paying salary, check fund balance
    let fund: any = null;
    if (action === "PAY") {
      fund = await prisma.cashFund.findFirst({
        where: { code: fundCode.toUpperCase() },
      });
      if (fund && fund.currentBalance < netSalary) {
        return NextResponse.json(
          { error: `তহবিলে পর্যাপ্ত ব্যালেন্স নেই। বর্তমান ব্যালেন্স: ৳ ${fund.currentBalance}` },
          { status: 400 }
        );
      }
    }

    const voucherNumber = existing?.voucherNumber || (await generateNextPayrollVoucherNumber());

    const result = await prisma.$transaction(async (tx) => {
      const payroll = await tx.payrollRecord.upsert({
        where: {
          userId_month: { userId, month },
        },
        update: {
          baseSalary: parsedBase,
          allowances: parsedAllow,
          deductions: parsedDeduct,
          advanceDeduction: parsedAdvance,
          netSalary,
          status: action === "PAY" ? "PAID" : action === "APPROVE" ? "APPROVED" : "DRAFT",
          paymentMethod,
          paymentDate: action === "PAY" ? new Date() : null,
          fundCode,
          notes,
          approvedByUserId: user.userId,
        },
        create: {
          voucherNumber,
          userId,
          month,
          baseSalary: parsedBase,
          allowances: parsedAllow,
          deductions: parsedDeduct,
          advanceDeduction: parsedAdvance,
          netSalary,
          status: action === "PAY" ? "PAID" : action === "APPROVE" ? "APPROVED" : "DRAFT",
          paymentMethod,
          paymentDate: action === "PAY" ? new Date() : null,
          fundCode,
          notes,
          approvedByUserId: user.userId,
        },
      });

      // If PAID, reduce fund balance and create CashTransaction
      if (action === "PAY" && fund) {
        await tx.cashFund.update({
          where: { id: fund.id },
          data: {
            currentBalance: fund.currentBalance - netSalary,
          },
        });

        await tx.cashTransaction.create({
          data: {
            fundId: fund.id,
            type: "EXPENSE",
            category: `শিক্ষক/কর্মী বেতন (${month})`,
            amount: netSalary,
            payeeOrPayer: targetUser.name,
            paymentMethod,
            receiptOrVoucherNo: voucherNumber,
            approvedByUserId: user.userId,
            transactionDate: new Date(),
            notes: `মাস: ${month}, প্রাপক: ${targetUser.name}`,
          },
        });
      }

      return payroll;
    });

    await recordAuditLog({
      userId: user.userId,
      action: action === "PAY" ? "PAY_STAFF_SALARY" : "SAVE_STAFF_PAYROLL",
      entityType: "PayrollRecord",
      entityId: result.id,
      details: {
        voucherNumber,
        staffName: targetUser.name,
        month,
        netSalary,
        status: result.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: `বেতন স্লিপ সফলভাবে ${action === "PAY" ? "পরিশোধিত" : "সংরক্ষিত"} হয়েছে। ভাউচার নং: ${voucherNumber}`,
      payroll: result,
    });
  } catch (error: any) {
    console.error("Payroll POST error:", error);
    return NextResponse.json({ error: error.message || "বেতন প্রক্রিয়াকরণ ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
