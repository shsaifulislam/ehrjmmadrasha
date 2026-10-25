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

  async getAdminNotices(limit = 50, page = 1) {
    const skip = (page - 1) * limit;
    const [notices, total] = await Promise.all([
      prisma.notice.findMany({
        where: { isDeleted: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notice.count({ where: { isDeleted: false } }),
    ]);

    return {
      notices,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPublicNotices(limit = 20, page = 1, type?: string) {
    const cacheKey = `cache:public:notices:limit_${limit}:page_${page}:type_${type || 'all'}`;
    const cachedData = await cacheService.get<any>(cacheKey);
    if (cachedData) return cachedData;

    const skip = (page - 1) * limit;
    const whereCondition = {
      isDeleted: false,
      isPublished: true,
      ...(type ? { type } : {}),
    };

    const [notices, total] = await Promise.all([
      prisma.notice.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notice.count({ where: whereCondition }),
    ]);

    const result = {
      notices,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };

    await cacheService.set(cacheKey, result, 900); // 15 minutes TTL
    return result;
  }
}

export const noticeService = new NoticeService();
