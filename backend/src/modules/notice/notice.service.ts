// backend/src/modules/notice/notice.service.ts

import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { CreateNoticeInput, UpdateNoticeInput } from './notice.schema';
import { cacheService } from '../../services/cache.service';

export class NoticeService {
  async createNotice(input: CreateNoticeInput, userId: string) {
    const notice = await prisma.notice.create({
      data: {
        title: input.title,
        content: input.content,
        type: input.type,
        attachmentUrl: input.attachmentUrl || null,
        isPublished: input.isPublished ?? true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_NOTICE',
        resource: 'Notice',
        details: `নোটিশ তৈরি: ID=${notice.id}, শিরোনাম=${notice.title}`,
      },
    });

    await cacheService.invalidatePattern('cache:public:notices:*');
    return notice;
  }

  async updateNotice(id: string, input: UpdateNoticeInput, userId: string) {
    const existing = await prisma.notice.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) throw new AppError('নোটিশ পাওয়া যায়নি', 404);

    const updated = await prisma.notice.update({
      where: { id },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.content && { content: input.content }),
        ...(input.type && { type: input.type }),
        ...(input.attachmentUrl !== undefined && { attachmentUrl: input.attachmentUrl }),
        ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_NOTICE',
        resource: 'Notice',
        details: `নোটিশ আপডেট: ID=${updated.id}`,
      },
    });

    await cacheService.invalidatePattern('cache:public:notices:*');
    return updated;
  }

  async deleteNotice(id: string, userId: string) {
    const existing = await prisma.notice.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) throw new AppError('নোটিশ পাওয়া যায়নি', 404);

    const deleted = await prisma.notice.update({
      where: { id },
      data: { isDeleted: true },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_NOTICE',
        resource: 'Notice',
        details: `নোটিশ সফট ডিলিট: ID=${id}`,
      },
    });

    await cacheService.invalidatePattern('cache:public:notices:*');
    return deleted;
  }

  async getAdminNotices(limit: any = 50, page: any = 1) {
    const limitNum = Number(limit) || 50;
    const pageNum = Number(page) || 1;
    const skip = (pageNum - 1) * limitNum;
    const [notices, total] = await Promise.all([
      prisma.notice.findMany({
        where: { isDeleted: false },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notice.count({ where: { isDeleted: false } }),
    ]);

    return {
      notices,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };
  }

  async getPublicNotices(limit: any = 20, page: any = 1, type?: string) {
    const limitNum = Number(limit) || 20;
    const pageNum = Number(page) || 1;
    const cacheKey = `cache:public:notices:limit_${limitNum}:page_${pageNum}:type_${type || 'all'}`;
    const cachedData = await cacheService.get<any>(cacheKey);
    if (cachedData) return cachedData;

    const skip = (pageNum - 1) * limitNum;
    const whereCondition = {
      isDeleted: false,
      isPublished: true,
      ...(type ? { type } : {}),
    };

    const [notices, total] = await Promise.all([
      prisma.notice.findMany({
        where: whereCondition,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notice.count({ where: whereCondition }),
    ]);

    const result = {
      notices,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };

    await cacheService.set(cacheKey, result, 900); // 15 minutes TTL
    return result;
  }
}

export const noticeService = new NoticeService();
