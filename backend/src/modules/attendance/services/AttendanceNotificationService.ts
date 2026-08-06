import prisma from "../../../config/prisma";
import { NotificationEventType, NotificationStatus } from "@prisma/client";

export class AttendanceNotificationService {
  static async triggerAbsenceNotifications(absentStudentIds: string[], dateStr: string) {
    if (!absentStudentIds || absentStudentIds.length === 0) return;

    const students = await prisma.student.findMany({
      where: { id: { in: absentStudentIds }, isDeleted: false },
      include: {
        guardian: true,
        class: true,
      },
    });

    const notificationEntries = students
      .filter((std) => std.guardian?.phone)
      .map((std) => ({
        eventType: NotificationEventType.STUDENT_ABSENCE,
        recipientPhone: std.guardian!.phone,
        message: `সম্মানিত অভিভাবক, আপনার সন্তান ${std.nameBn} (${std.class?.name || "মাদ্রাসা"}) আজ ${dateStr} তারিখে ক্লাসে অনুপস্থিত রয়েছে।`,
        status: NotificationStatus.PENDING,
      }));

    if (notificationEntries.length > 0) {
      await prisma.notificationLog.createMany({
        data: notificationEntries,
      });
    }

    return notificationEntries.length;
  }
}
