// backend/src/modules/library/library.schema.ts
// Zod validation schemas for library module

import { z } from 'zod';

export const createLibraryCategorySchema = z.object({
  name: z
    .string({ error: 'ক্যাটাগরির নাম প্রয়োজন' })
    .min(1, 'ক্যাটাগরির নাম প্রদান করুন')
    .max(100, 'ক্যাটাগরির নাম ১০০ অক্ষরের বেশি হতে পারবে না'),
  description: z.string().max(500).optional(),
});

export const createBookSchema = z.object({
  title: z
    .string({ error: 'বইয়ের শিরোনাম প্রয়োজন' })
    .min(1, 'বইয়ের শিরোনাম প্রদান করুন')
    .max(300, 'শিরোনাম ৩০০ অক্ষরের বেশি হতে পারবে না'),
  author: z.string().max(200).optional(),
  isbn: z.string().max(20).optional(),
  categoryId: z
    .string({ error: 'ক্যাটাগরি আইডি প্রয়োজন' })
    .uuid('বৈধ ক্যাটাগরি আইডি প্রদান করুন'),
  totalCopies: z
    .number({ error: 'মোট কপি সংখ্যায় প্রদান করুন' })
    .int('পূর্ণসংখ্যা হতে হবে')
    .min(1, 'কমপক্ষে ১ কপি থাকতে হবে')
    .default(1),
  publishedYear: z.number().int().min(1400).max(2100).optional(),
});

export const issueBookSchema = z.object({
  bookId: z
    .string({ error: 'বই আইডি প্রয়োজন' })
    .uuid('বৈধ বই আইডি প্রদান করুন'),
  studentId: z
    .string({ error: 'ছাত্র আইডি প্রয়োজন' })
    .uuid('বৈধ ছাত্র আইডি প্রদান করুন'),
  dueDate: z.string().optional(),
});

export const returnBookSchema = z.object({
  issueId: z
    .string({ error: 'ইস্যু আইডি প্রয়োজন' })
    .uuid('বৈধ ইস্যু আইডি প্রদান করুন'),
  condition: z.string().max(100).optional(),
});
