// backend/src/modules/bazar/bazar.schema.ts
// Zod validation schemas for bazar module

import { z } from 'zod';

export const createVendorSchema = z.object({
  name: z
    .string({ error: 'ভেন্ডরের নাম প্রয়োজন' })
    .min(1, 'ভেন্ডরের নাম প্রদান করুন')
    .max(200, 'ভেন্ডরের নাম ২০০ অক্ষরের বেশি হতে পারবে না'),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
});

export const recordPurchaseSchema = z.object({
  vendorId: z
    .string({ error: 'ভেন্ডর আইডি প্রয়োজন' })
    .uuid('বৈধ ভেন্ডর আইডি প্রদান করুন'),
  date: z
    .string({ error: 'তারিখ প্রয়োজন' })
    .min(1, 'তারিখ প্রদান করুন'),
  items: z.array(
    z.object({
      name: z.string().min(1, 'আইটেমের নাম প্রদান করুন'),
      quantity: z.number().positive('পরিমাণ ধনাত্মক হতে হবে'),
      unit: z.string().min(1, 'একক প্রদান করুন'),
      unitPrice: z.number().min(0, 'দাম ০ বা তার বেশি হতে হবে'),
    })
  ).min(1, 'কমপক্ষে একটি আইটেম প্রয়োজন'),
  note: z.string().max(500).optional(),
});

export const payVendorSchema = z.object({
  vendorId: z
    .string({ error: 'ভেন্ডর আইডি প্রয়োজন' })
    .uuid('বৈধ ভেন্ডর আইডি প্রদান করুন'),
  amount: z
    .number({ error: 'টাকার পরিমাণ সংখ্যায় প্রদান করুন' })
    .positive('টাকার পরিমাণ ধনাত্মক হতে হবে'),
  method: z
    .enum(['CASH', 'BKASH', 'NAGAD', 'BANK', 'OTHER'])
    .optional()
    .default('CASH'),
  note: z.string().max(500).optional(),
});

export const recordMealSchema = z.object({
  date: z
    .string({ error: 'তারিখ প্রয়োজন' })
    .min(1, 'তারিখ প্রদান করুন'),
  classId: z.string().uuid().optional(),
  records: z.array(
    z.object({
      studentId: z.string().uuid('বৈধ ছাত্র আইডি প্রদান করুন'),
      breakfast: z.boolean().optional().default(false),
      lunch: z.boolean().optional().default(false),
      dinner: z.boolean().optional().default(false),
    })
  ).min(1, 'কমপক্ষে একটি রেকর্ড প্রয়োজন'),
});
