// backend/src/modules/payroll/payroll.schema.ts
// Zod validation schemas for payroll module

import { z } from 'zod';

export const setSalaryStructureSchema = z.object({
  staffId: z
    .string({ error: 'স্টাফ আইডি প্রয়োজন' })
    .uuid('বৈধ স্টাফ আইডি প্রদান করুন'),
  basicSalary: z
    .number({ error: 'মূল বেতন সংখ্যায় প্রদান করুন' })
    .min(0, 'মূল বেতন ০ বা তার বেশি হতে হবে'),
  houseAllowance: z.number().min(0).optional().default(0),
  medicalAllowance: z.number().min(0).optional().default(0),
  transportAllowance: z.number().min(0).optional().default(0),
  otherAllowance: z.number().min(0).optional().default(0),
});

export const createAdvanceSchema = z.object({
  staffId: z
    .string({ error: 'স্টাফ আইডি প্রয়োজন' })
    .uuid('বৈধ স্টাফ আইডি প্রদান করুন'),
  amount: z
    .number({ error: 'টাকার পরিমাণ সংখ্যায় প্রদান করুন' })
    .positive('টাকার পরিমাণ ধনাত্মক হতে হবে'),
  reason: z.string().max(500).optional(),
});

export const generatePayrollSchema = z.object({
  year: z
    .number({ error: 'বছর প্রয়োজন' })
    .int()
    .min(2020)
    .max(2100),
  month: z
    .number({ error: 'মাস প্রয়োজন' })
    .int()
    .min(1)
    .max(12),
});

export const approvePayrollSchema = z.object({
  payrollMonthId: z
    .string({ error: 'পে-রোল মাস আইডি প্রয়োজন' })
    .uuid('বৈধ পে-রোল মাস আইডি প্রদান করুন'),
});

export const processPaymentSchema = z.object({
  payrollRecordId: z
    .string({ error: 'পে-রোল রেকর্ড আইডি প্রয়োজন' })
    .uuid('বৈধ পে-রোল রেকর্ড আইডি প্রদান করুন'),
  method: z
    .enum(['CASH', 'BKASH', 'NAGAD', 'BANK', 'OTHER'])
    .optional()
    .default('CASH'),
});
