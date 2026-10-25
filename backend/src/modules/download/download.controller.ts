// backend/src/modules/download/download.controller.ts

import { Request, Response } from 'express';
import { downloadService } from './download.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

export class DownloadController {
  async getAdminDownloads(req: Request, res: Response): Promise<void> {
    const { limit = '50', page = '1' } = req.query as { limit?: string; page?: string };
    const result = await downloadService.getAdminDownloads(parseInt(limit, 10), parseInt(page, 10));
    sendSuccess(res, result, 'এডমিন ডাউনলোড কেন্দ্র তালিকা');
  }

  async getPublicDownloads(req: Request, res: Response): Promise<void> {
    const { category, limit = '30', page = '1' } = req.query as { category?: string; limit?: string; page?: string };
    const result = await downloadService.getPublicDownloads(category, parseInt(limit, 10), parseInt(page, 10));
    sendSuccess(res, result, 'পাবলীক ডাউনলোড সেন্টার');
  }

  async createDownloadItem(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    let fileUrl = req.body.fileUrl;

    if (req.file) {
      fileUrl = `/uploads/downloads/${req.file.filename}`;
    }

    const result = await downloadService.createDownloadItem({ ...req.body, fileUrl }, authReq.user.id);
    sendCreated(res, result, 'ডকুমেন্ট ডাউনলোড সেন্টারে যোগ করা হয়েছে');
  }

  async deleteDownloadItem(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const result = await downloadService.deleteDownloadItem(id, authReq.user.id);
    sendSuccess(res, result, 'ডকুমেন্ট ফাইল মুছে ফেলা হয়েছে');
  }
}

export const downloadController = new DownloadController();
