import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { generateNextPayrollVoucherNumber } from "@/lib/feeCalculationService";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/finance/payroll
 * List monthly payroll records with staff, employee designations, cash funds and KPIs
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
        employee: {
          select: {
            id: true,
            employeeId: true,
            nameBn: true,
            nameEn: true,
            employeeType: true,
            mobile: true,
            department: { select: { nameBn: true, nameEn: true } },
            designation: { select: { nameBn: true, nameEn: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 1. Fetch active employees with designation and department
    const employees = await prisma.employee.findMany({
      where: { status: "ACTIVE" },
      include: {
        department: { select: { id: true, nameBn: true, nameEn: true } },
        designation: { select: { id: true, nameBn: true, nameEn: true } },
        user: { select: { id: true, name: true, phone: true, email: true, role: true } },
      },
      orderBy: { nameBn: "asc" },
    });

    // 2. Fetch active teachers and staff users
    const users = await prisma.user.findMany({
      where: {
        role: { in: ["TEACHER", "STAFF", "ACCOUNTANT", "ADMIN"] },
        status: "ACTIVE",
      },
      select: { id: true, name: true, phone: true, email: true, role: true },
      orderBy: { name: "asc" },
    });

    // Build unified staff list
    const linkedUserIds = new Set<string>();
    const staffList: any[] = [];

    employees.forEach((emp) => {
      if (emp.userId) linkedUserIds.add(emp.userId);
      staffList.push({
        id: emp.userId || emp.id,
        userId: emp.userId,
        employeeId: emp.id,
        code: emp.employeeId,
        name: emp.nameBn || emp.nameEn,
        nameEn: emp.nameEn,
        role: emp.employeeType,
        designation: emp.designation?.nameBn || emp.employeeType,
        department: emp.department?.nameBn || "সাধারণ",
        baseSalary: emp.baseSalary || 0,
        phone: emp.mobile || emp.user?.phone || "",
        email: emp.email || emp.user?.email || "",
      });
    });

    users.forEach((u) => {
      if (!linkedUserIds.has(u.id)) {
        staffList.push({
          id: u.id,
          userId: u.id,
          employeeId: null,
          code: `USR-${u.id.substring(0, 6)}`,
          name: u.name,
          nameEn: u.name,
          role: u.role,
          designation: u.role === "TEACHER" ? "সহকারী শিক্ষক" : u.role === "ACCOUNTANT" ? "হিসাবরক্ষক" : "স্টাফ",
          department: "একাডেমিক",
          baseSalary: 0,
          phone: u.phone || "",
          email: u.email || "",
        });
      }
    });

    // 3. Fetch funds
    const funds = await prisma.cashFund.findMany({
      select: { id: true, nameBn: true, nameEn: true, code: true, currentBalance: true },
    });

    // 4. Calculate monthly summary KPIs
    let totalNetSalary = 0;
    let totalPaid = 0;
    let totalPending = 0;

    payrolls.forEach((p) => {
      totalNetSalary += p.netSalary;
      if (p.status === "PAID") {
        totalPaid += p.netSalary;
      } else {
        totalPending += p.netSalary;
      }
    });

    return NextResponse.json({
      success: true,
      month,
      payrolls,
      staffList,
      teachers: staffList, // backward compatibility
      funds,
      summary: {
        totalNetSalary,
        totalPaid,
        totalPending,
        totalCount: payrolls.length,
      },
    });
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
    let {
      userId,
      employeeId,
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

    // If userId not explicitly provided, find via employeeId
    if (!userId && employeeId) {
      const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
      if (emp?.userId) {
        userId = emp.userId;
      }
    }

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

    // Attempt to locate employee record if not already given
    if (!employeeId) {
      const linkedEmp = await prisma.employee.findUnique({ where: { userId } });
      if (linkedEmp) employeeId = linkedEmp.id;
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
      if (!fund) {
        return NextResponse.json({ error: `তহবিল কোড (${fundCode}) পাওয়া যায়নি।` }, { status: 404 });
      }
      if (fund.currentBalance < netSalary) {
        return NextResponse.json(
          { error: `তহবিলে (${fund.nameBn || fund.code}) পর্যাপ্ত ব্যালেন্স নেই। বর্তমান ব্যালেন্স: ৳ ${fund.currentBalance}` },
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
          paymentDate: action === "PAY" ? new Date() : existing?.paymentDate || null,
          fundCode,
          notes,
          employeeId: employeeId || existing?.employeeId || null,
          approvedByUserId: user.userId,
        },
        create: {
          voucherNumber,
          userId,
          employeeId: employeeId || null,
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
        include: {
          user: { select: { id: true, name: true, role: true, phone: true } },
          employee: {
            select: {
              id: true,
              employeeId: true,
              nameBn: true,
              department: { select: { nameBn: true } },
              designation: { select: { nameBn: true } },
            },
          },
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
            notes: `মাস: ${month}, প্রাপক: ${targetUser.name}, ভাউচার: ${voucherNumber}`,
          },
        });
      }

      return payroll;
    });

    await recordAuditLog({
      userId: user.userId,
      action: action === "PAY" ? "PAY_STAFF_SALARY" : action === "APPROVE" ? "APPROVE_STAFF_PAYROLL" : "SAVE_STAFF_PAYROLL",
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
      message: `বেতন স্লিপ সফলভাবে ${
        action === "PAY" ? "পরিশোধিত" : action === "APPROVE" ? "অনুমোদিত" : "সংরক্ষিত"
      } হয়েছে। ভাউচার নং: ${voucherNumber}`,
      payroll: result,
    });
  } catch (error: any) {
    console.error("Payroll POST error:", error);
    return NextResponse.json({ error: error.message || "বেতন প্রক্রিয়াকরণ ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/finance/payroll
 * Delete draft or unapproved payroll voucher
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন ভাউচার মুছতে পারেন।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ভাউচার আইডি আবশ্যক।" }, { status: 400 });
    }

    const existing = await prisma.payrollRecord.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "ভাউচার পাওয়া যায়নি।" }, { status: 404 });
    }

    if (existing.status === "PAID") {
      return NextResponse.json(
        { error: "পরিশোধিত বেতন ভাউচার সরাসরি মুছে ফেলা সম্ভব নয়।" },
        { status: 400 }
      );
    }

    await prisma.payrollRecord.delete({ where: { id } });

    await recordAuditLog({
      userId: user.userId,
      action: "DELETE_STAFF_PAYROLL",
      entityType: "PayrollRecord",
      entityId: id,
      details: { voucherNumber: existing.voucherNumber, month: existing.month },
    });

    return NextResponse.json({ success: true, message: "বেতন ভাউচারটি সফলভাবে মুছে ফেলা হয়েছে।" });
  } catch (error: any) {
    console.error("Payroll DELETE error:", error);
    return NextResponse.json({ error: "ভাউচার মোছা সম্ভব হয়নি।" }, { status: 500 });
  }
}

