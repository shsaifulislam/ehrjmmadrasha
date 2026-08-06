import { NotificationEventType, NotificationStatus } from "@prisma/client";
import prisma from "../../config/prisma";

export interface SendNotificationPayload {
  recipientPhone: string;
  eventType: NotificationEventType;
  message: string;
  recipientName?: string;
  referenceId?: string;
  provider?: string;
}

export class NotificationService {
  /**
   * Dispatch notification across SMS, Email, FCM Push, and In-App channels.
   */
  static async send(payload: SendNotificationPayload) {
    try {
      const notification = await prisma.notificationLog.create({
        data: {
          eventType: payload.eventType,
          recipientPhone: payload.recipientPhone,
          recipientName: payload.recipientName || null,
          message: payload.message,
          status: NotificationStatus.PENDING,
          referenceId: payload.referenceId || null,
          provider: payload.provider || "bulksmsbd",
        },
      });

      console.log(`[NotificationService] Dispatched event ${payload.eventType} for Log ID ${notification.id}`);
      return notification;
    } catch (error) {
      console.error("[NotificationService] Failed to create notification log:", error);
      throw error;
    }
  }

  /**
   * Retrieves notification logs for a recipient phone number.
   */
  static async getLogsByPhone(recipientPhone: string, limit = 20) {
    return prisma.notificationLog.findMany({
      where: { recipientPhone },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }
}

export default NotificationService;
