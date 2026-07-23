// backend/src/modules/gallery/gallery.service.ts

import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { CreateGalleryInput } from './gallery.schema';

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

    return deleted;
  }

  async getAdminGallery(limit = 50, page = 1) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.gallery.findMany({
        where: { isDeleted: false },
        skip,
        take: limit,
        orderBy: { uploadedAt: 'desc' },
      }),
      prisma.gallery.count({ where: { isDeleted: false } }),
    ]);

    return {
      items,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPublicGallery(category?: string, limit = 30, page = 1) {
    const skip = (page - 1) * limit;
    const whereCondition = {
      isDeleted: false,
      ...(category ? { category } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.gallery.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { uploadedAt: 'desc' },
      }),
      prisma.gallery.count({ where: whereCondition }),
    ]);

    return {
      items,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}

export const galleryService = new GalleryService();
