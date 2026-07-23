import { z } from 'zod';

export const createFeeTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'নাম আবশ্যক'),
    defaultAmount: z.number().positive('পরিমাণ অবশ্যই ধনাত্মক হতে হবে'),
  })
});

export const updateFeeTypeSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    defaultAmount: z.number().positive().optional(),
  })
});

export const createInvoiceSchema = z.object({
  body: z.object({
    studentId: z.string().uuid('সঠিক স্টুডেন্ট আইডি দিন'),
    type: z.enum(['MONTHLY', 'ADMISSION', 'EXAM', 'OTHER'] as const, {
      message: 'সঠিক ইনভয়েস টাইপ নির্বাচন করুন'
    }),
    year: z.number().int().min(2020, 'সঠিক বছর দিন').max(2100, 'সঠিক বছর দিন'),
    month: z.number().int().min(1).max(12).nullable().optional(),
    items: z.array(
      z.object({
        feeTypeId: z.string().uuid('সঠিক ফি টাইপ আইডি দিন'),
        amount: z.number().positive('পরিমাণ অবশ্যই ০ থেকে বড় হতে হবে')
      })
    ).min(1, 'কমপক্ষে একটি ফি আইটেম থাকতে হবে')
  }).refine((data) => {
    if (data.type === 'MONTHLY' && (data.month === null || data.month === undefined)) {
      return false;
    }
    return true;
  }, {
    message: 'মাসিক ফির জন্য মাস নির্বাচন করা আবশ্যক',
    path: ['month']
  })
});

export const collectPaymentSchema = z.object({
  body: z.object({
    invoiceId: z.string().uuid('সঠিক ইনভয়েস আইডি দিন'),
    amountPaid: z.number().positive('পরিশোধের পরিমাণ অবশ্যই ০ থেকে বড় হতে হবে'),
    method: z.enum(['CASH', 'BKASH', 'NAGAD', 'BANK', 'OTHER'] as const, {
      message: 'সঠিক পেমেন্ট মেথড দিন'
    })
  })
});

export const invoiceQuerySchema = z.object({
  query: z.object({
    studentId: z.string().uuid().optional(),
    status: z.enum(['UNPAID', 'PARTIAL', 'PAID'] as const).optional(),
    month: z.string().regex(/^\d+$/).transform(Number).optional(),
    year: z.string().regex(/^\d+$/).transform(Number).optional(),
    type: z.string().optional(),
    page: z.string().regex(/^\d+$/).default('1').transform(Number),
    limit: z.string().regex(/^\d+$/).default('10').transform(Number)
  })
});
