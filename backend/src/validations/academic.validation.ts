import { z } from 'zod';

export const createSessionSchema = z.object({
  body: z.object({
    year: z.string().regex(/^\d{4}$/, 'সঠিক বছর দিন (उदा: 2026)'),
    isActive: z.boolean().optional().default(false),
  })
});

export const createClassSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'শ্রেণীর নাম আবশ্যক'),
    numericValue: z.number().int().positive('ক্রমিক মান অবশ্যই ধনাত্মক হতে হবে'),
  })
});

export const createStudentSchema = z.object({
  body: z.object({
    studentId: z.string().min(4, 'স্টুডেন্ট আইডি কমপক্ষে ৪ অক্ষরের হতে হবে'),
    roll: z.number().int().positive('রোল নম্বর অবশ্যই ধনাত্মক হতে হবে'),
    nameBn: z.string().min(1, 'বাংলা নাম আবশ্যক'),
    nameEn: z.string().optional(),
    classId: z.string().uuid('সঠিক শ্রেণী আইডি দিন'),
    sessionId: z.string().uuid('সঠিক সেশন আইডি দিন'),
    guardianId: z.string().uuid().optional(),
    userId: z.string().uuid('সঠিক ইউজার আইডি দিন').optional()
  })
});

export const updateStudentSchema = z.object({
  body: z.object({
    roll: z.number().int().positive().optional(),
    nameBn: z.string().min(1).optional(),
    nameEn: z.string().optional(),
    classId: z.string().uuid().optional(),
    sessionId: z.string().uuid().optional(),
    guardianId: z.string().uuid().optional(),
  })
});
