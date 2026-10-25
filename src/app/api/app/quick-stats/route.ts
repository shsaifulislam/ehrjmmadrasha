import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      studentCount,
      employeeCount,
      jamatCount,
      invoiceCount,
      receiptCount,
      noticeCount,
      activeSession,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.employee.count(),
      prisma.jamatClass.count(),
      prisma.feeInvoice.count(),
      prisma.paymentReceipt.count(),
      prisma.notice.count(),
      prisma.academicSession.findFirst({ where: { isCurrent: true } }),
    ]);

    // Financial summary
    const [invoiceSum, receiptSum] = await Promise.all([
      prisma.feeInvoice.aggregate({ _sum: { netAmount: true, paidAmount: true, dueAmount: true } }),
      prisma.paymentReceipt.aggregate({ _sum: { amount: true } }),
    ]);

    // Recent 5 notices
    const recentNotices = await prisma.notice.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        titleBn: true,
        category: true,
        priority: true,
        createdAt: true,
      },
    });

    // Recent classes
    const classes = await prisma.jamatClass.findMany({
      orderBy: { sortOrder: "asc" },
      take: 8,
      select: {
        id: true,
        nameBn: true,
        code: true,
        _count: { select: { enrollments: true } },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        students: studentCount,
        employees: employeeCount,
        classes: jamatCount,
        invoices: invoiceCount,
        receipts: receiptCount,
        notices: noticeCount,
        currentYear: activeSession?.startDate ? new Date(activeSession.startDate).getFullYear() : 2026,
        sessionName: activeSession?.name || "২০২৬ শিক্ষাবর্ষ",
        netBilled: invoiceSum._sum.netAmount || 0,
        paidCredited: invoiceSum._sum.paidAmount || 0,
        dueOutstanding: invoiceSum._sum.dueAmount || 0,
        totalReceiptVouchers: receiptSum._sum.amount || 0,
      },
      recentNotices,
      classes,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in /api/app/quick-stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch quick stats" },
      { status: 500 }
    );
  }
}
