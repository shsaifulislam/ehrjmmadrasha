// backend/src/modules/accounting/accounting.schema.ts
// Zod validation schemas for accounting module

import { z } from 'zod';

export const createAccountSchema = z.object({
  name: z
    .string({ error: 'অ্যাকাউন্টের নাম প্রয়োজন' })
    .min(1, 'অ্যাকাউন্টের নাম প্রদান করুন')
    .max(200),
  code: z
    .string({ error: 'অ্যাকাউন্ট কোড প্রয়োজন' })
    .min(1, 'অ্যাকাউন্ট কোড প্রদান করুন')
    .max(20),
  type: z.enum(['ASSET', 'LIABILITY', 'INCOME', 'EXPENSE', 'EQUITY'], {
    error: 'অ্যাকাউন্ট টাইপ ASSET, LIABILITY, INCOME, EXPENSE বা EQUITY হতে হবে',
  }),
  parentId: z.string().uuid().optional().nullable(),
  description: z.string().max(500).optional(),
});

export const createJournalEntrySchema = z.object({
  date: z
    .string({ error: 'তারিখ প্রয়োজন' })
    .min(1, 'তারিখ প্রদান করুন'),
  description: z
    .string({ error: 'বিবরণ প্রয়োজন' })
    .min(1, 'বিবরণ প্রদান করুন')
    .max(500),
  lines: z.array(
    z.object({
      accountId: z.string().uuid('বৈধ অ্যাকাউন্ট আইডি প্রদান করুন'),
      debit: z.number().min(0).default(0),
      credit: z.number().min(0).default(0),
    })
  ).min(2, 'জার্নাল এন্ট্রিতে কমপক্ষে ২টি লাইন থাকতে হবে'),
  referenceType: z.string().max(50).optional(),
  referenceId: z.string().uuid().optional(),
});

export const closeCashbookSchema = z.object({
  date: z
    .string({ error: 'তারিখ প্রয়োজন' })
    .min(1, 'তারিখ প্রদান করুন'),
  note: z.string().max(500).optional(),
});
