// backend/src/modules/exam/exam.schema.ts

import { z } from 'zod';

export const createExamSchema = z.object({
  name: z.string().min(2, { message: 'পরীক্ষার নাম কমপক্ষে ২ অক্ষরের হতে হবে' }),
  sessionId: z.string().uuid({ error: 'সঠিক সেশন নির্বাচন করুন' }),
  isPublished: z.boolean().optional().default(false),
});

export const updateExamSchema = z.object({
  name: z.string().min(2).optional(),
  isPublished: z.boolean().optional(),
});

export const markItemSchema = z.object({
  studentId: z.string().uuid({ error: 'সঠিক ছাত্র নির্বাচন করুন' }),
  marks: z.number().min(0, { message: 'প্রাপ্ত নম্বর ঋণাত্মক হতে পারবে না' }),
});

export const bulkMarksEntrySchema = z.object({
  examId: z.string().uuid({ error: 'সঠিক পরীক্ষা নির্বাচন করুন' }),
  classId: z.string().uuid({ error: 'সঠিক শ্রেণী নির্বাচন করুন' }),
  subjectId: z.string().uuid({ error: 'সঠিক বিষয় নির্বাচন করুন' }),
  marks: z.array(markItemSchema).min(1, { message: 'কমপক্ষে একজন ছাত্রের নম্বর প্রদান করতে হবে' }),
});

export const publicResultSearchSchema = z.object({
  sessionId: z.string().uuid({ error: 'সঠিক সেশন নির্বাচন করুন' }),
  examId: z.string().uuid({ error: 'সঠিক পরীক্ষা নির্বাচন করুন' }),
  roll: z.number({ error: 'সঠিক রোল নম্বর প্রদান করুন' }),
  studentId: z.string().optional(),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type BulkMarksEntryInput = z.infer<typeof bulkMarksEntrySchema>;
export type PublicResultSearchQuery = z.infer<typeof publicResultSearchSchema>;
