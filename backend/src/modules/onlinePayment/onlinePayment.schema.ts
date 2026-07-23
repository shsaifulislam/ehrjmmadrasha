// backend/src/modules/onlinePayment/onlinePayment.schema.ts

import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  invoiceId: z.string().uuid({ error: 'সঠিক ইনভয়েস আইডেন্টিফায়ার নির্বাচন করুন' }),
  gateway: z.enum(['BKASH', 'NAGAD', 'MOCK'] as const),
  amount: z.number().positive({ message: 'টাকার পরিমাণ শূন্যের চেয়ে বেশি হতে হবে' }),
});

export const verifyCallbackSchema = z.object({
  paymentReference: z.string().min(1, { message: 'পেমেন্ট রেফারেন্স আইডি আবশ্যক' }),
  gatewayPaymentID: z.string().optional(),
  trxID: z.string().optional(),
  status: z.string().optional(),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type VerifyCallbackInput = z.infer<typeof verifyCallbackSchema>;
