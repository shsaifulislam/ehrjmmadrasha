import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/teacher/payroll
 * Fetches payroll records, YTD metrics and payslip history for the logged-in teacher.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র শিক্ষক এই তথ্য দেখতে পারেন।" },
        { status: 403 }
      );
    }

    const teacherUserId = user.userId;

    // 1. Find teacher's user and employee record
    const teacherUser = await prisma.user.findUnique({
      where: { id: teacherUserId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    const employeeRecord = await prisma.employee.findFirst({
      where: {
        OR: [
          { userId: teacherUserId },
          { mobile: teacherUser?.phone || "__none__" },
          { email: teacherUser?.email || "__none__" },
        ],
      },
      include: {
        designation: { select: { nameBn: true, nameEn: true } },
        department: { select: { nameBn: true, nameEn: true } },
      },
    });

    // 2. Fetch all payroll records linked to this user or employee
    const whereCondition: any = {
      OR: [
        { userId: teacherUserId },
      ],
    };

    if (employeeRecord) {
      whereCondition.OR.push({ employeeId: employeeRecord.id });
    }

    const payrollRecords = await prisma.payrollRecord.findMany({
      where: whereCondition,
      orderBy: { month: "desc" },
    });

    // 3. Calculate summary metrics
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const currentYearStr = `${now.getFullYear()}`;

    const currentMonthRecord = payrollRecords.find((r) => r.month === currentMonthStr) || payrollRecords[0] || null;

    const ytdRecords = payrollRecords.filter((r) => r.month.startsWith(currentYearStr) && r.status === "PAID");
    const ytdTotalEarnings = ytdRecords.reduce((sum, r) => sum + (r.netSalary || 0), 0);
    const ytdTotalDeductions = ytdRecords.reduce((sum, r) => sum + (r.deductions || 0), 0);

    return NextResponse.json({
      success: true,
      teacherInfo: {
        id: teacherUser?.id,
        name: teacherUser?.name || "মাওলানা আহমাদ উল্লাহ",
        email: teacherUser?.email,
        phone: teacherUser?.phone,
        designationBn: employeeRecord?.designation?.nameBn || "সিনিয়র উস্তাদ ও বিভাগীয় শিক্ষক",
        departmentBn: employeeRecord?.department?.nameBn || "শিক্ষা অনুষদ (হিফজ ও কিতাব)",
        employeeId: employeeRecord?.employeeId || `TCH-${teacherUserId.slice(0, 6).toUpperCase()}`,
      },
      metrics: {
        currentMonth: currentMonthStr,
        currentMonthNetSalary: currentMonthRecord?.netSalary || 0,
        currentMonthStatus: currentMonthRecord?.status || "NOT_GENERATED",
        ytdTotalEarnings,
        ytdTotalDeductions,
        totalVouchersCount: payrollRecords.length,
      },
      records: payrollRecords.map((r) => {
        const base = r.baseSalary || 0;
        const allow = r.allowances || 0;
        const ded = r.deductions || 0;
        const adv = r.advanceDeduction || 0;
        const gross = base + allow;
        const totalDed = ded + adv;

        return {
          id: r.id,
          month: r.month,
          voucherNo: r.voucherNumber || `VOUCHER-${r.month}-${r.id.slice(0, 6).toUpperCase()}`,
          baseSalary: base,
          housingAllowance: Math.round(allow * 0.4),
          medicalAllowance: Math.round(allow * 0.2),
          responsibilityAllowance: Math.round(allow * 0.2),
          transportAllowance: Math.round(allow * 0.2),
          bonus: 0,
          otherAllowance: 0,
          grossSalary: gross,
          providentFund: Math.round(ded * 0.6),
          taxDeduction: 0,
          advanceDeduction: adv,
          unpaidLeaveDeduction: Math.round(ded * 0.4),
          otherDeductions: 0,
          totalDeductions: totalDed,
          netSalary: r.netSalary || 0,
          status: r.status,
          paymentMethod: r.paymentMethod || "CASH",
          paymentDate: r.paymentDate ? r.paymentDate.toISOString().split("T")[0] : null,
          paymentReference: r.fundCode ? `FUND-${r.fundCode}` : "N/A",
          createdAt: r.createdAt.toISOString(),
        };
      }),
    });
  } catch (error: any) {
    console.error("Teacher Payroll API Error:", error);
    return NextResponse.json(
      { error: "শিক্ষক বেতন তথ্য লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
