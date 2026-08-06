// backend/src/modules/inventory/inventory.schema.ts
// Zod validation schemas for inventory module

import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z
    .string({ error: 'ক্যাটাগরির নাম প্রয়োজন' })
    .min(1, 'ক্যাটাগরির নাম প্রদান করুন')
    .max(100, 'ক্যাটাগরির নাম ১০০ অক্ষরের বেশি হতে পারবে না'),
  description: z.string().max(500).optional(),
});

export const createItemSchema = z.object({
  name: z
    .string({ error: 'আইটেমের নাম প্রয়োজন' })
    .min(1, 'আইটেমের নাম প্রদান করুন')
    .max(200, 'আইটেমের নাম ২০০ অক্ষরের বেশি হতে পারবে না'),
  categoryId: z
    .string({ error: 'ক্যাটাগরি আইডি প্রয়োজন' })
    .uuid('বৈধ ক্যাটাগরি আইডি প্রদান করুন'),
  unit: z.string().min(1, 'একক প্রদান করুন').max(50),
  quantity: z.number().int().min(0).optional().default(0),
  minStockLevel: z.number().int().min(0).optional().default(0),
});

export const recordStockMovementSchema = z.object({
  itemId: z
    .string({ error: 'আইটেম আইডি প্রয়োজন' })
    .uuid('বৈধ আইটেম আইডি প্রদান করুন'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT'], {
    error: 'মুভমেন্ট টাইপ IN, OUT বা ADJUSTMENT হতে হবে',
  }),
  quantity: z
    .number({ error: 'পরিমাণ সংখ্যায় প্রদান করুন' })
    .int('পরিমাণ পূর্ণসংখ্যা হতে হবে')
    .positive('পরিমাণ ধনাত্মক হতে হবে'),
  reason: z.string().max(500).optional(),
});

export const createFixedAssetSchema = z.object({
  name: z
    .string({ error: 'সম্পদের নাম প্রয়োজন' })
    .min(1, 'সম্পদের নাম প্রদান করুন')
    .max(200),
  categoryId: z.string().uuid().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().min(0).optional(),
  location: z.string().max(200).optional(),
  condition: z.string().max(100).optional(),
  note: z.string().max(500).optional(),
});

export const recordMaintenanceSchema = z.object({
  assetId: z
    .string({ error: 'সম্পদ আইডি প্রয়োজন' })
    .uuid('বৈধ সম্পদ আইডি প্রদান করুন'),
  date: z.string().min(1, 'তারিখ প্রদান করুন'),
  description: z.string().min(1, 'বিবরণ প্রদান করুন').max(500),
  cost: z.number().min(0).optional().default(0),
});
