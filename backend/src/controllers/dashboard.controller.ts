import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSessions,
      totalFeeTypes,
      todayPayments,
      todayExpenses,
      monthlyPayments,
      monthlyDueInvoices,
      recentPaymentsRaw,
      recentActivities
    ] = await Promise.all([
      prisma.student.count({ where: { isDeleted: false } }),
      prisma.teacher.count({ where: { isDeleted: false } }),
      prisma.class.count({ where: { isDeleted: false } }),
      prisma.session.count(),
      prisma.feeType.count({ where: { isDeleted: false } }),
      prisma.payment.aggregate({
        _sum: { amountPaid: true },
        where: {
          paymentDate: { gte: today, lt: tomorrow }
        }
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: {
          date: { gte: today, lt: tomorrow }
        }
      }),
      prisma.payment.aggregate({
        _sum: { amountPaid: true },
        where: {
          paymentDate: { gte: monthStart, lt: monthEnd }
        }
      }),
      prisma.invoice.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: { in: ['UNPAID', 'PARTIAL'] }
        }
      }),
      prisma.payment.findMany({
        take: 5,
        orderBy: { paymentDate: 'desc' },
        include: {
          invoice: {
            include: {
              student: {
                select: {
                  nameBn: true,
                  studentId: true,
                  class: { select: { name: true } }
                }
              }
            }
          },
          receivedBy: { select: { username: true } }
        }
      }),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { username: true } }
        }
      })
    ]);

    const recentPayments = recentPaymentsRaw.map(p => ({
      id: p.id,
      studentName: p.invoice?.student?.nameBn || 'অজানা',
      className: p.invoice?.student?.class?.name || '',
      amount: Number(p.amountPaid),
      method: p.method,
      date: p.paymentDate,
      receivedBy: p.receivedBy?.username || ''
    }));

    const activities = recentActivities.map(a => ({
      id: a.id,
      action: a.action,
      resource: a.resource,
      details: a.details,
      user: a.user?.username || 'System',
      date: a.createdAt
    }));

    res.status(200).json({
      status: 'success',
      data: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSessions,
        totalFeeTypes,
        todayIncome: Number(todayPayments._sum.amountPaid || 0),
        todayExpense: Number(todayExpenses._sum.amount || 0),
        monthlyIncome: Number(monthlyPayments._sum.amountPaid || 0),
        monthlyDue: Number(monthlyDueInvoices._sum.totalAmount || 0),
        pendingAdmissions: 0,
        recentPayments,
        recentActivities: activities
      }
    });
  } catch (error) {
    next(error);
  }
};
