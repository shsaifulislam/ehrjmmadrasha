import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 401 });
    }

    const [
      totalStudents,
      activeStudents,
      residentialStudents,
      dayCareStudents,
      orphanStudents,
      totalTeachers,
      pendingApplications,
      totalNotices,
      funds,
      feeStats,
      recentApplications,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { status: "ACTIVE" } }),
      prisma.student.count({ where: { residentialStatus: "RESIDENTIAL" } }),
      prisma.student.count({ where: { residentialStatus: "DAY_CARE" } }),
      prisma.student.count({ where: { isOrphan: true } }),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.application.count({ where: { status: "PENDING" } }),
      prisma.notice.count({ where: { isPublished: true } }),
      prisma.cashFund.findMany({ select: { nameBn: true, code: true, currentBalance: true } }),
      prisma.feeInvoice.aggregate({
        _sum: {
          totalAmount: true,
          paidAmount: true,
          dueAmount: true,
        },
      }),
      prisma.application.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          user: { select: { name: true, role: true } },
        },
      }),
    ]);

    const totalFundBalance = funds.reduce((acc, f) => acc + f.currentBalance, 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents,
        activeStudents,
        residentialStudents,
        dayCareStudents,
        orphanStudents,
        totalTeachers,
        pendingApplications,
        totalNotices,
        totalFundBalance,
        funds,
        financials: {
          totalBilled: feeStats._sum.totalAmount || 0,
          totalCollected: feeStats._sum.paidAmount || 0,
          totalDue: feeStats._sum.dueAmount || 0,
        },
        recentApplications,
        recentAuditLogs,
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
