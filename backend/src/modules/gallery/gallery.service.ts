// backend/src/modules/gallery/gallery.service.ts

import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { CreateGalleryInput } from './gallery.schema';
import { cacheService } from '../../services/cache.service';

export class GalleryService {
  async createGalleryItem(input: CreateGalleryInput, userId: string) {
    if (!input.imageUrl) {
      throw new AppError('ছবি আপলোড করা আবশ্যক', 400);
    }

    const item = await prisma.gallery.create({
      data: {
        title: input.title,
        category: input.category,
        imageUrl: input.imageUrl,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_GALLERY_ITEM',
        resource: 'Gallery',
        details: `গ্যালারিতে ছবি যোগ: ID=${item.id}, শিরোনাম=${item.title}`,
      },
    });

    await cacheService.invalidatePattern('cache:public:gallery:*');
    return item;
  }

  async deleteGalleryItem(id: string, userId: string) {
    const existing = await prisma.gallery.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) throw new AppError('ছবি পাওয়া যায়নি', 404);

    const deleted = await prisma.gallery.update({
      where: { id },
      data: { isDeleted: true },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_GALLERY_ITEM',
        resource: 'Gallery',
        details: `গ্যালারি থেকে ছবি অপসারণ: ID=${id}`,
      },
    });

    await cacheService.invalidatePattern('cache:public:gallery:*');
    return deleted;
  }

  async getAdminGallery(limit: any = 50, page: any = 1) {
    const limitNum = Number(limit) || 50;
    const pageNum = Number(page) || 1;
    const skip = (pageNum - 1) * limitNum;
    const [items, total] = await Promise.all([
      prisma.gallery.findMany({
        where: { isDeleted: false },
        skip,
        take: limitNum,
        orderBy: { uploadedAt: 'desc' },
      }),
      prisma.gallery.count({ where: { isDeleted: false } }),
    ]);

    return {
      items,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };
  }

  async getPublicGallery(category?: string, limit: any = 30, page: any = 1) {
    const limitNum = Number(limit) || 30;
    const pageNum = Number(page) || 1;
    const cacheKey = `cache:public:gallery:category_${category || 'all'}:limit_${limitNum}:page_${pageNum}`;
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const skip = (pageNum - 1) * limitNum;
    const whereCondition = {
      isDeleted: false,
      ...(category ? { category } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.gallery.findMany({
        where: whereCondition,
        skip,
        take: limitNum,
        orderBy: { uploadedAt: 'desc' },
      }),
      prisma.gallery.count({ where: whereCondition }),
    ]);

    const result = {
      items,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };

    await cacheService.set(cacheKey, result, 1800); // 30 minutes TTL
    return result;
  }
}

export const galleryService = new GalleryService();
