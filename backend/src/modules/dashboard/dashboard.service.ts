// backend/src/modules/dashboard/dashboard.service.ts

import prisma from '../../config/prisma';

export class DashboardService {
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const [
      totalStudents, totalTeachers, totalClasses, totalSessions, totalFeeTypes,
      pendingAdmissions,
      todayPayments, todayExpenses, monthlyPayments, monthlyDue,
      recentPaymentsRaw, recentActivities,
    ] = await Promise.all([
      prisma.student.count({ where: { isDeleted: false } }),
      prisma.teacher.count({ where: { isDeleted: false } }),
      prisma.class.count({ where: { isDeleted: false } }),
      prisma.session.count(),
      prisma.feeType.count({ where: { isDeleted: false } }),
      prisma.admission.count({ where: { status: 'PENDING' } }),
      prisma.payment.aggregate({ _sum: { amountPaid: true }, where: { paymentDate: { gte: today, lt: tomorrow } } }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: today, lt: tomorrow } } }),
      prisma.payment.aggregate({ _sum: { amountPaid: true }, where: { paymentDate: { gte: monthStart, lt: monthEnd } } }),
      prisma.invoice.aggregate({ _sum: { totalAmount: true }, where: { status: { in: ['UNPAID', 'PARTIAL'] } } }),
      prisma.payment.findMany({
        take: 5, orderBy: { paymentDate: 'desc' },
        include: { invoice: { include: { student: { select: { nameBn: true, studentId: true, class: { select: { name: true } } } } } }, receivedBy: { select: { username: true } } },
      }),
      prisma.auditLog.findMany({
        take: 8, orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } },
      }),
    ]);

    return {
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSessions,
      totalFeeTypes,
      pendingAdmissions,
      todayIncome: Number(todayPayments._sum.amountPaid || 0),
      todayExpense: Number(todayExpenses._sum.amount || 0),
      monthlyIncome: Number(monthlyPayments._sum.amountPaid || 0),
      monthlyDue: Number(monthlyDue._sum.totalAmount || 0),
      recentPayments: recentPaymentsRaw.map(p => ({
        id: p.id,
        studentName: p.invoice?.student?.nameBn || 'অজানা',
        className: p.invoice?.student?.class?.name || '',
        amount: Number(p.amountPaid),
        method: p.method,
        date: p.paymentDate,
        receivedBy: p.receivedBy?.username || '',
      })),
      recentActivities: recentActivities.map(a => ({
        id: a.id,
        action: a.action,
        resource: a.resource,
        details: a.details,
        user: a.user?.username || 'System',
        date: a.createdAt,
      })),
    };
  }
}

export const dashboardService = new DashboardService();
