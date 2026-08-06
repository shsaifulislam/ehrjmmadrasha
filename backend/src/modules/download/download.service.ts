// backend/src/modules/download/download.service.ts

import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { CreateDownloadInput } from './download.schema';
import { cacheService } from '../../services/cache.service';

export class DownloadService {
  async createDownloadItem(input: CreateDownloadInput, userId: string) {
    if (!input.fileUrl) {
      throw new AppError('ডকুমেন্ট ফাইল আপলোড করা আবশ্যক', 400);
    }

    const item = await prisma.download.create({
      data: {
        title: input.title,
        category: input.category,
        fileUrl: input.fileUrl,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_DOWNLOAD_ITEM',
        resource: 'Download',
        details: `ডাউনলোড সেন্টারে ফাইল যোগ: ID=${item.id}, শিরোনাম=${item.title}`,
      },
    });

    await cacheService.invalidatePattern('cache:public:downloads:*');
    return item;
  }

  async deleteDownloadItem(id: string, userId: string) {
    const existing = await prisma.download.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) throw new AppError('ফাইল পাওয়া যায়নি', 404);

    const deleted = await prisma.download.update({
      where: { id },
      data: { isDeleted: true },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_DOWNLOAD_ITEM',
        resource: 'Download',
        details: `ডাউনলোড সেন্টার থেকে ফাইল অপসারণ: ID=${id}`,
      },
    });

    await cacheService.invalidatePattern('cache:public:downloads:*');
    return deleted;
  }

  async getAdminDownloads(limit: any = 50, page: any = 1) {
    const limitNum = Number(limit) || 50;
    const pageNum = Number(page) || 1;
    const skip = (pageNum - 1) * limitNum;
    const [items, total] = await Promise.all([
      prisma.download.findMany({
        where: { isDeleted: false },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.download.count({ where: { isDeleted: false } }),
    ]);

    return {
      items,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };
  }

  async getPublicDownloads(category?: string, limit: any = 30, page: any = 1) {
    const limitNum = Number(limit) || 30;
    const pageNum = Number(page) || 1;
    const cacheKey = `cache:public:downloads:category_${category || 'all'}:limit_${limitNum}:page_${pageNum}`;
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const skip = (pageNum - 1) * limitNum;
    const whereCondition = {
      isDeleted: false,
      ...(category ? { category } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.download.findMany({
        where: whereCondition,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.download.count({ where: whereCondition }),
    ]);

    const result = {
      items,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };

    await cacheService.set(cacheKey, result, 1800); // 30 minutes TTL
    return result;
  }
}

export const downloadService = new DownloadService();
