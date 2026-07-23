// backend/src/modules/notification/notification.controller.ts

import { Request, Response } from 'express';
import { notificationService } from './notification.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

export class NotificationController {
  async getLogs(req: Request, res: Response): Promise<void> {
    const { limit = '50', page = '1' } = req.query as { limit?: string; page?: string };
    const result = await notificationService.getLogs(parseInt(limit, 10), parseInt(page, 10));
    sendSuccess(res, result, 'নোটিফিকেশন লগ তালিকা');
  }

  async sendBulkSms(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const result = await notificationService.sendBulkNotice(req.body, authReq.user.id);
    sendCreated(res, result, 'বাল্ক এসএমএস পাঠানো হচ্ছে');
  }

  async retryNotification(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const result = await notificationService.retryFailedNotification(id, authReq.user.id);
    sendSuccess(res, result, 'এসএমএস পুনরায় পাঠানো হয়েছে');
  }
}

export const notificationController = new NotificationController();
