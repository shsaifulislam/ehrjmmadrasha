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

    if (user.role !== "ADMIN" && user.role !== "PRINCIPAL") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। কেবলমাত্র অ্যাডমিন ও প্রিন্সিপালের জন্য অনুমোদিত।" },
        { status: 403 }
      );
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const firstDayOfMonth = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    const [
      totalStudents,
      activeStudents,
      residentialStudents,
      dayCareStudents,
      orphanStudents,
      totalTeachers,
      newAdmissions,
      pendingApplications,
      totalNotices,
      funds,
      feeStats,
      recentApplications,
      recentAuditLogs,
      recentPayments,
      pendingDocumentRequests,
      pendingComplaints,
      recentNotices,
      openIncidents,
      todayPresent,
      todayAbsent,
      todayLate,
      todayLeave,
      totalAttendanceCount,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { status: "ACTIVE" } }),
      prisma.student.count({ where: { residentialStatus: "RESIDENTIAL" } }),
      prisma.student.count({ where: { residentialStatus: "DAY_CARE" } }),
      prisma.student.count({ where: { isOrphan: true } }),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.student.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
      prisma.application.count({ where: { status: "PENDING" } }),
      prisma.notice.count({ where: { isPublished: true } }),
      prisma.cashFund.findMany({ select: { id: true, nameBn: true, code: true, currentBalance: true } }),
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
        select: {
          id: true,
          applicationNumber: true,
          studentNameBn: true,
          guardianPhone: true,
          status: true,
          createdAt: true,
          desiredClassId: true,
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          user: { select: { name: true, role: true } },
        },
      }),
      prisma.paymentReceipt.findMany({
        orderBy: { receiptDate: "desc" },
        take: 6,
        select: {
          id: true,
          receiptNumber: true,
          amount: true,
          paymentMethod: true,
          transactionId: true,
          paymentStatus: true,
          receiptDate: true,
          student: {
            select: {
              fullNameBn: true,
              studentIdNumber: true,
            },
          },
        },
      }),
      prisma.documentRequest.count({
        where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      }),
      prisma.supportRequest.count({
        where: { status: { in: ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS"] } },
      }),
      prisma.notice.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: "desc" },
        take: 5,
        select: {
          id: true,
          titleBn: true,
          category: true,
          isUrgent: true,
          publishedAt: true,
        },
      }),
      prisma.systemIncident.count({
        where: { status: { in: ["OPEN", "INVESTIGATING", "IDENTIFIED"] } },
      }),
      prisma.attendance.count({
        where: { date: { gte: todayStart, lte: todayEnd }, status: "PRESENT" },
      }),
      prisma.attendance.count({
        where: { date: { gte: todayStart, lte: todayEnd }, status: "ABSENT" },
      }),
      prisma.attendance.count({
        where: { date: { gte: todayStart, lte: todayEnd }, status: "LATE" },
      }),
      prisma.attendance.count({
        where: { date: { gte: todayStart, lte: todayEnd }, status: "LEAVE" },
      }),
      prisma.attendance.count(),
    ]);

    const totalFundBalance = funds.reduce((acc, f) => acc + f.currentBalance, 0);
    const todayMarked = todayPresent + todayAbsent + todayLate + todayLeave;
    const todayRate = todayMarked > 0 ? Math.round(((todayPresent + todayLate) / todayMarked) * 100) : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents,
        activeStudents,
        residentialStudents,
        dayCareStudents,
        orphanStudents,
        totalTeachers,
        newAdmissions,
        pendingApplications,
        totalNotices,
        totalFundBalance,
        funds,
        financials: {
          totalBilled: feeStats._sum.totalAmount || 0,
          totalCollected: feeStats._sum.paidAmount || 0,
          totalDue: feeStats._sum.dueAmount || 0,
        },
        attendance: {
          todayMarked,
          todayPresent,
          todayAbsent,
          todayLate,
          todayLeave,
          attendanceRate: todayRate,
          totalHistoricalRecords: totalAttendanceCount,
        },
        pendingDocumentRequests,
        pendingComplaints,
        recentPayments,
        recentNotices,
        alerts: {
          systemAlertsCount: openIncidents,
          academicAlertsCount: pendingApplications > 0 ? pendingApplications : 0,
        },
        recentApplications,
        recentAuditLogs,
        currentUser: {
          id: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
