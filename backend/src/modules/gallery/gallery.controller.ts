// backend/src/modules/gallery/gallery.controller.ts

import { Request, Response } from 'express';
import { galleryService } from './gallery.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

export class GalleryController {
  async getAdminGallery(req: Request, res: Response): Promise<void> {
    const { limit = '50', page = '1' } = req.query as { limit?: string; page?: string };
    const result = await galleryService.getAdminGallery(parseInt(limit, 10), parseInt(page, 10));
    sendSuccess(res, result, 'এডমিন গ্যালারি তালিকা');
  }

  async getPublicGallery(req: Request, res: Response): Promise<void> {
    const { category, limit = '30', page = '1' } = req.query as { category?: string; limit?: string; page?: string };
    const result = await galleryService.getPublicGallery(category, parseInt(limit, 10), parseInt(page, 10));
    sendSuccess(res, result, 'পাবলীক ফটো গ্যালারি');
  }

  async createGalleryItem(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    let imageUrl = req.body.imageUrl;

    if (req.file) {
      imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const result = await galleryService.createGalleryItem({ ...req.body, imageUrl }, authReq.user.id);
    sendCreated(res, result, 'ছবি গ্যালারিতে যোগ করা হয়েছে');
  }

  async deleteGalleryItem(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const result = await galleryService.deleteGalleryItem(id, authReq.user.id);
    sendSuccess(res, result, 'ছবি মুছে ফেলা হয়েছে');
  }
}

export const galleryController = new GalleryController();
