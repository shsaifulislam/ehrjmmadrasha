// backend/src/modules/notification/notification.service.ts

import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { formatBangladeshiPhone } from './utils/phone.util';
import { SmsAdapterFactory } from './adapters/sms.factory';
import { NotificationEventType, NotificationStatus } from '@prisma/client';
import { SendBulkSmsInput } from './notification.schema';

export interface DispatchParams {
  eventType: NotificationEventType;
  recipientPhone?: string | null;
  recipientName?: string;
  message: string;
  referenceId?: string;
  campaignId?: string;
}

export class NotificationService {
  /**
   * Dispatches a single event-triggered or bulk notification asynchronously.
   * Never throws or blocks main execution thread.
   */
  async dispatchSingleNotification(params: DispatchParams): Promise<void> {
    try {
      const formattedPhone = formatBangladeshiPhone(params.recipientPhone);

      // Rule: Invalid or missing phone handling
      if (!formattedPhone) {
        logger.warn(`[SMS Failure] Invalid/missing phone for event ${params.eventType}. Raw: "${params.recipientPhone}"`);
        await prisma.notificationLog.create({
          data: {
            eventType: params.eventType,
            recipientPhone: params.recipientPhone || 'UNKNOWN',
            recipientName: params.recipientName || null,
            message: params.message,
            status: NotificationStatus.FAILED,
            failureReason: 'INVALID_OR_MISSING_PHONE',
            referenceId: params.referenceId || null,
            campaignId: params.campaignId || null,
          },
        });
        return;
      }

      // Rule: Idempotency & Duplicate Prevention for event-triggered notifications
      if (params.referenceId) {
        const existingSent = await prisma.notificationLog.findFirst({
          where: {
            eventType: params.eventType,
            referenceId: params.referenceId,
            status: NotificationStatus.SENT,
          },
        });
        if (existingSent) {
          logger.info(
            `[SMS Duplicate Prevented] Event ${params.eventType} with Ref ${params.referenceId} already SENT.`
          );
          return;
        }
      }

      // Create initial PENDING log (Catching concurrent duplicate P2002 error gracefully)
      const provider = SmsAdapterFactory.getProvider();
      let initialLog;
      try {
        initialLog = await prisma.notificationLog.create({
          data: {
            eventType: params.eventType,
            recipientPhone: formattedPhone,
            recipientName: params.recipientName || null,
            message: params.message,
            status: NotificationStatus.PENDING,
            provider: provider.name,
            referenceId: params.referenceId || null,
            campaignId: params.campaignId || null,
          },
        });
      } catch (err: any) {
        if (err?.code === 'P2002') {
          logger.info(`[SMS Concurrent Race Condition Prevented] Ref: ${params.referenceId}`);
          return;
        }
        throw err;
      }

      // Dispatch SMS using Provider Adapter
      const response = await provider.sendSms(formattedPhone, params.message);

      if (response.success) {
        await prisma.notificationLog.update({
          where: { id: initialLog.id },
          data: {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
            providerMsgId: response.providerMsgId || null,
          },
        });
        logger.info(`[SMS Sent] Event: ${params.eventType} | Phone: ${formattedPhone} | ProviderID: ${response.providerMsgId}`);
      } else {
        await prisma.notificationLog.update({
          where: { id: initialLog.id },
          data: {
            status: NotificationStatus.FAILED,
            failureReason: response.error || 'Provider send failed',
          },
        });
        logger.error(`[SMS Send Failed] Event: ${params.eventType} | Phone: ${formattedPhone} | Error: ${response.error}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`[SMS Unhandled Error] Event: ${params.eventType} | ${msg}`);
    }
  }

  /**
   * Retries a failed notification (max 3 retries, idempotent)
   */
  async retryFailedNotification(notificationId: string, senderUserId: string) {
    const log = await prisma.notificationLog.findUnique({
      where: { id: notificationId },
    });

    if (!log) throw new AppError('নোটিফিকেশন লগ পাওয়া যায়নি', 404);
    if (log.status === NotificationStatus.SENT) {
      throw new AppError('এই এসএমএসটি ইতিমধ্যে সফলভাবে পাঠানো হয়েছে', 400);
    }
    if (log.retryCount >= 3) {
      throw new AppError('সর্বোচ্চ ৩ বার চেষ্টা করা হয়েছে, পুনরায় পাঠানো সম্ভব নয়', 400);
    }

    const formattedPhone = formatBangladeshiPhone(log.recipientPhone);
    if (!formattedPhone) {
      throw new AppError('সঠিক প্রাপকের মোবাইল নম্বর নেই', 400);
    }

    const provider = SmsAdapterFactory.getProvider();
    const response = await provider.sendSms(formattedPhone, log.message);

    const updated = await prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        retryCount: log.retryCount + 1,
        status: response.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
        sentAt: response.success ? new Date() : log.sentAt,
        providerMsgId: response.providerMsgId || log.providerMsgId,
        failureReason: response.success ? null : response.error || 'Retry failed',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: senderUserId,
        action: 'RETRY_SMS_NOTIFICATION',
        resource: 'NotificationLog',
        details: `এসএমএস রিট্রাই: ID=${log.id}, ফোন=${formattedPhone}, ফল: ${response.success ? 'সফল' : 'ব্যর্থ'}`,
      },
    });

    return updated;
  }

  /**
   * Admin Triggered Bulk / Emergency SMS
   */
  async sendBulkNotice(input: SendBulkSmsInput, senderUserId: string) {
    const campaignId = input.campaignId || `CAMP-${Date.now()}`;
    const recipients: Array<{ phone: string; name?: string }> = [];

    if (input.recipientType === 'ALL_STUDENTS') {
      const guardians = await prisma.guardian.findMany({
        where: { isDeleted: false },
        select: { phone: true, name: true },
      });
      guardians.forEach((g) => recipients.push({ phone: g.phone, name: g.name }));
    } else if (input.recipientType === 'CLASS' && input.classId) {
      const students = await prisma.student.findMany({
        where: { classId: input.classId, isDeleted: false },
        include: { guardian: true },
      });
      students.forEach((s) => {
        if (s.guardian?.phone) {
          recipients.push({ phone: s.guardian.phone, name: s.guardian.name });
        }
      });
    } else if (input.recipientType === 'ALL_TEACHERS') {
      const teachers = await prisma.teacher.findMany({
        where: { isDeleted: false },
        select: { phone: true, nameBn: true },
      });
      teachers.forEach((t) => recipients.push({ phone: t.phone, name: t.nameBn }));
    } else if (input.recipientType === 'CUSTOM' && input.customNumbers) {
      input.customNumbers.forEach((p) => recipients.push({ phone: p }));
    }

    if (!recipients.length) {
      throw new AppError('প্রাপকের কোনো মোবাইল নম্বর পাওয়া যায়নি', 400);
    }

    // Trigger SMS dispatch in non-blocking background queue
    setImmediate(() => {
      recipients.forEach((r) => {
        this.dispatchSingleNotification({
          eventType: NotificationEventType.BULK_NOTICE,
          recipientPhone: r.phone,
          recipientName: r.name,
          message: input.message,
          campaignId,
        });
      });
    });

    await prisma.auditLog.create({
      data: {
        userId: senderUserId,
        action: 'SEND_BULK_SMS',
        resource: 'NotificationLog',
        details: `বাল্ক এসএমএস প্রেরিত: ক্যাম্পেইন=${campaignId}, টাইপ=${input.recipientType}, মোট প্রাপক=${recipients.length}`,
      },
    });

    return {
      campaignId,
      totalQueued: recipients.length,
      message: 'বাল্ক এসএমএস প্রসেসিং লাইনে যুক্ত করা হয়েছে',
    };
  }

  /**
   * Fetch notification logs for Admin UI
   */
  async getLogs(limit = 50, page = 1) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      prisma.notificationLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notificationLog.count(),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const notificationService = new NotificationService();
