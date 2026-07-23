// backend/src/modules/finance/finance.schema.ts

import { z } from 'zod';

export const createInvoiceSchema = z.object({
  studentId: z.string({ error: 'ছাত্র নির্বাচন করুন' }).uuid(),
  type: z.string({ error: 'ইনভয়েসের ধরন প্রয়োজন' }).default('MONTHLY'),
  year: z.coerce.number({ error: 'বছর প্রয়োজন' }).int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12).optional().nullable(),
  items: z.array(z.object({
    feeTypeId: z.string().uuid('অবৈধ ফি টাইপ আইডি'),
    amount: z.coerce.number().min(0.01, 'পরিমাণ ০ এর বেশি হতে হবে'),
  })).min(1, 'কমপক্ষে একটি আইটেম প্রয়োজন'),
});

export const collectPaymentSchema = z.object({
  invoiceId: z.string({ error: 'ইনভয়েস নির্বাচন করুন' }).uuid(),
  amountPaid: z.coerce.number({ error: 'পরিমাণ প্রয়োজন' }).min(0.01, 'পরিমাণ ০ এর বেশি হতে হবে'),
  method: z.enum(['CASH', 'BKASH', 'NAGAD', 'BANK', 'OTHER'], {
    error: 'পেমেন্ট পদ্ধতি নির্বাচন করুন',
  }),
});

export const createExpenseSchema = z.object({
  category: z.string({ error: 'ক্যাটাগরি প্রয়োজন' }).min(2),
  amount: z.coerce.number({ error: 'পরিমাণ প্রয়োজন' }).min(0.01),
  description: z.string().optional().nullable(),
  date: z.string().optional(),
});

export const createDonationSchema = z.object({
  donorName: z.string({ error: 'দাতার নাম প্রয়োজন' }).min(2),
  amount: z.coerce.number({ error: 'পরিমাণ প্রয়োজন' }).min(0.01),
  purpose: z.string().optional().nullable(),
  date: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type CollectPaymentInput = z.infer<typeof collectPaymentSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateDonationInput = z.infer<typeof createDonationSchema>;

