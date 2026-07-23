// backend/src/modules/download/download.service.ts

import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { CreateDownloadInput } from './download.schema';

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

    return deleted;
  }

  async getAdminDownloads(limit = 50, page = 1) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.download.findMany({
        where: { isDeleted: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.download.count({ where: { isDeleted: false } }),
    ]);

    return {
      items,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPublicDownloads(category?: string, limit = 30, page = 1) {
    const skip = (page - 1) * limit;
    const whereCondition = {
      isDeleted: false,
      ...(category ? { category } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.download.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.download.count({ where: whereCondition }),
    ]);

    return {
      items,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}

export const downloadService = new DownloadService();
