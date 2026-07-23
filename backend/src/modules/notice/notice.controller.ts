// backend/src/modules/notice/notice.controller.ts

import { Request, Response } from 'express';
import { noticeService } from './notice.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

export class NoticeController {
  async getAdminNotices(req: Request, res: Response): Promise<void> {
    const { limit = '50', page = '1' } = req.query as { limit?: string; page?: string };
    const result = await noticeService.getAdminNotices(parseInt(limit, 10), parseInt(page, 10));
    sendSuccess(res, result, 'এডমিন নোটিশ তালিকা');
  }

  async getPublicNotices(req: Request, res: Response): Promise<void> {
    const { limit = '20', page = '1', type } = req.query as { limit?: string; page?: string; type?: string };
    const result = await noticeService.getPublicNotices(parseInt(limit, 10), parseInt(page, 10), type);
    sendSuccess(res, result, 'পাবলীক নোটিশ বোর্ড');
  }

  async createNotice(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    let attachmentUrl = req.body.attachmentUrl;

    if (req.file) {
      attachmentUrl = `/uploads/notices/${req.file.filename}`;
    }

    const result = await noticeService.createNotice({ ...req.body, attachmentUrl }, authReq.user.id);
    sendCreated(res, result, 'নোটিশ সফলভাবে তৈরি হয়েছে');
  }

  async updateNotice(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    let attachmentUrl = req.body.attachmentUrl;

    if (req.file) {
      attachmentUrl = `/uploads/notices/${req.file.filename}`;
    }

    const result = await noticeService.updateNotice(id, { ...req.body, attachmentUrl }, authReq.user.id);
    sendSuccess(res, result, 'নোটিশ আপডেট করা হয়েছে');
  }

  async deleteNotice(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const result = await noticeService.deleteNotice(id, authReq.user.id);
    sendSuccess(res, result, 'নোটিশ মুছে ফেলা হয়েছে');
  }
}

export const noticeController = new NoticeController();
