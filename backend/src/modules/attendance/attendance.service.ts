// backend/src/modules/attendance/attendance.service.ts

import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { BulkAttendanceInput } from './attendance.schema';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceService {
  /**
   * Helper to convert YYYY-MM-DD string to normalized Date (midnight UTC)
   */
  private parseDate(dateStr: string): Date {
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      throw new AppError('অকার্যকর তারিখ ফরম্যাট', 400);
    }
    const [year, month, day] = parts;
    return new Date(Date.UTC(year, month - 1, day));
  }

  /**
   * Load students for a class with attendance status if recorded for the given date
   */
  async getAttendanceByClassAndDate(classId: string, dateStr: string) {
    const targetDate = this.parseDate(dateStr);

    const targetClass = await prisma.class.findFirst({
      where: { id: classId, isDeleted: false },
    });
    if (!targetClass) {
      throw new AppError('শ্রেণীটি পাওয়া যায়নি', 404);
    }

    const students = await prisma.student.findMany({
      where: { classId, isDeleted: false },
      orderBy: { roll: 'asc' },
      select: {
        id: true,
        studentId: true,
        roll: true,
        nameBn: true,
        nameEn: true,
        class: { select: { id: true, name: true } },
      },
    });

    const attendances = await prisma.attendance.findMany({
      where: { classId, date: targetDate },
    });

    const attendanceMap = new Map<string, AttendanceStatus>();
    attendances.forEach((att) => {
      attendanceMap.set(att.studentId, att.status);
    });

    const items = students.map((std) => ({
      id: std.id,
      studentId: std.studentId,
      roll: std.roll,
      nameBn: std.nameBn,
      nameEn: std.nameEn,
      className: std.class?.name || '',
      status: attendanceMap.get(std.id) || null,
    }));

    const totalStudents = students.length;
    const recordedCount = attendances.length;
    const presentCount = attendances.filter((a) => a.status === 'PRESENT').length;
    const absentCount = attendances.filter((a) => a.status === 'ABSENT').length;
    const leaveCount = attendances.filter((a) => a.status === 'LEAVE').length;

    return {
      date: dateStr,
      class: { id: targetClass.id, name: targetClass.name },
      summary: {
        totalStudents,
        recordedCount,
        presentCount,
        absentCount,
        leaveCount,
        percentage: totalStudents > 0 ? Number(((presentCount / totalStudents) * 100).toFixed(1)) : 0,
      },
      students: items,
    };
  }

  /**
   * Bulk save/update attendance using transaction
   */
  async bulkSaveAttendance(input: BulkAttendanceInput, recordedById: string) {
    const targetDate = this.parseDate(input.date);

    const targetClass = await prisma.class.findFirst({
      where: { id: input.classId, isDeleted: false },
    });
    if (!targetClass) {
      throw new AppError('শ্রেণীটি পাওয়া যায়নি', 404);
    }

    const studentIds = input.attendances.map((a) => a.studentId);
    const validStudents = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        classId: input.classId,
        isDeleted: false,
      },
      select: { id: true },
    });

    const validStudentSet = new Set(validStudents.map((s) => s.id));
    const invalidStudents = studentIds.filter((id) => !validStudentSet.has(id));

    if (invalidStudents.length > 0) {
      throw new AppError(`কিছু ছাত্র উক্ত শ্রেণীতে অন্তর্ভুক্ত নয় অথবা নিষ্ক্রিয়`, 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const saved: any[] = [];
      for (const item of input.attendances) {
        const att = await tx.attendance.upsert({
          where: {
            studentId_date: {
              studentId: item.studentId,
              date: targetDate,
            },
          },
          update: {
            status: item.status,
            recordedById,
            classId: input.classId,
          },
          create: {
            studentId: item.studentId,
            classId: input.classId,
            date: targetDate,
            status: item.status,
            recordedById,
          },
        });
        saved.push(att);
      }

      await tx.auditLog.create({
        data: {
          userId: recordedById,
          action: 'BULK_ATTENDANCE_SAVE',
          resource: 'Attendance',
          details: `শ্রেণী: ${targetClass.name}, তারিখ: ${input.date}, মোট রেকর্ড: ${saved.length}`,
        },
      });

      return saved;
    });

    // Trigger SMS Notification asynchronously for ABSENT students (Non-blocking)
    setImmediate(async () => {
      try {
        const absentItems = input.attendances.filter((a) => a.status === 'ABSENT');
        if (!absentItems.length) return;

        const absentStudentIds = absentItems.map((a) => a.studentId);
        const students = await prisma.student.findMany({
          where: { id: { in: absentStudentIds } },
          include: { guardian: true, class: true },
        });

        const { notificationService } = await import('../notification/notification.service');
        const { NotificationEventType } = await import('@prisma/client');

        for (const std of students) {
          const phone = std.guardian?.phone;
          const msg = `অভিভাবক মহোদয়, আজ ${input.date}-এ আপনার সন্তান ${std.nameBn} (শ্রেণী: ${std.class.name}) ক্লাসে অনুপস্থিত রয়েছে। ইলিয়টগঞ্জ মাদ্রাসা।`;
          await notificationService.dispatchSingleNotification({
            eventType: NotificationEventType.STUDENT_ABSENCE,
            recipientPhone: phone,
            recipientName: std.guardian?.name,
            message: msg,
            referenceId: `ABS-${std.id}-${input.date}`,
          });
        }
      } catch (e) {
        // Suppress error to ensure main transaction is never affected
      }
    });

    return {
      message: 'উপস্থিতি সফলভাবে সংরক্ষণ করা হয়েছে',
      savedCount: result.length,
    };
  }

  /**
   * Daily Attendance Report
   */
  async getDailyReport(classId: string, dateStr: string) {
    const targetDate = this.parseDate(dateStr);

    const targetClass = await prisma.class.findFirst({
      where: { id: classId, isDeleted: false },
    });
    if (!targetClass) {
      throw new AppError('শ্রেণীটি পাওয়া যায়নি', 404);
    }

    const students = await prisma.student.findMany({
      where: { classId, isDeleted: false },
      orderBy: { roll: 'asc' },
      select: { id: true, studentId: true, roll: true, nameBn: true },
    });

    const attendances = await prisma.attendance.findMany({
      where: { classId, date: targetDate },
      include: { student: { select: { id: true, studentId: true, roll: true, nameBn: true } } },
    });

    const attendanceMap = new Map<string, AttendanceStatus>();
    attendances.forEach((a) => attendanceMap.set(a.studentId, a.status));

    const totalStudents = students.length;
    const presentStudents = students.filter((s) => attendanceMap.get(s.id) === 'PRESENT');
    const absentStudents = students.filter((s) => attendanceMap.get(s.id) === 'ABSENT');
    const leaveStudents = students.filter((s) => attendanceMap.get(s.id) === 'LEAVE');
    const unrecordedStudents = students.filter((s) => !attendanceMap.has(s.id));

    const presentCount = presentStudents.length;
    const absentCount = absentStudents.length;
    const leaveCount = leaveStudents.length;

    return {
      date: dateStr,
      class: { id: targetClass.id, name: targetClass.name },
      summary: {
        totalStudents,
        presentCount,
        absentCount,
        leaveCount,
        unrecordedCount: unrecordedStudents.length,
        percentage: totalStudents > 0 ? Number(((presentCount / totalStudents) * 100).toFixed(1)) : 0,
      },
      absentStudents: absentStudents.map((s) => ({ id: s.id, studentId: s.studentId, roll: s.roll, nameBn: s.nameBn })),
      leaveStudents: leaveStudents.map((s) => ({ id: s.id, studentId: s.studentId, roll: s.roll, nameBn: s.nameBn })),
    };
  }

  /**
   * Monthly Attendance Report
   */
  async getMonthlyReport(classId: string, year: number, month: number) {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));

    const targetClass = await prisma.class.findFirst({
      where: { id: classId, isDeleted: false },
    });
    if (!targetClass) {
      throw new AppError('শ্রেণীটি পাওয়া যায়নি', 404);
    }

    const students = await prisma.student.findMany({
      where: { classId, isDeleted: false },
      orderBy: { roll: 'asc' },
      select: { id: true, studentId: true, roll: true, nameBn: true },
    });

    const attendances = await prisma.attendance.findMany({
      where: {
        classId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const distinctDates = new Set(attendances.map((a) => a.date.toISOString().split('T')[0]));
    const totalWorkingDays = distinctDates.size;

    const studentMap = new Map<string, { present: number; absent: number; leave: number }>();
    students.forEach((s) => studentMap.set(s.id, { present: 0, absent: 0, leave: 0 }));

    attendances.forEach((a) => {
      const stats = studentMap.get(a.studentId);
      if (stats) {
        if (a.status === 'PRESENT') stats.present++;
        else if (a.status === 'ABSENT') stats.absent++;
        else if (a.status === 'LEAVE') stats.leave++;
      }
    });

    const studentSummaries = students.map((s) => {
      const stats = studentMap.get(s.id) || { present: 0, absent: 0, leave: 0 };
      const percentage = totalWorkingDays > 0 ? Number(((stats.present / totalWorkingDays) * 100).toFixed(1)) : 0;
      return {
        id: s.id,
        studentId: s.studentId,
        roll: s.roll,
        nameBn: s.nameBn,
        presentCount: stats.present,
        absentCount: stats.absent,
        leaveCount: stats.leave,
        percentage,
      };
    });

    return {
      year,
      month,
      class: { id: targetClass.id, name: targetClass.name },
      totalWorkingDays,
      students: studentSummaries,
    };
  }
}

export const attendanceService = new AttendanceService();
