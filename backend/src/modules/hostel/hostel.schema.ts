// backend/src/modules/hostel/hostel.schema.ts
// Zod validation schemas for hostel module

import { z } from 'zod';

export const createBuildingSchema = z.object({
  name: z
    .string({ error: 'বিল্ডিংয়ের নাম প্রয়োজন' })
    .min(1, 'বিল্ডিংয়ের নাম প্রদান করুন')
    .max(100, 'বিল্ডিংয়ের নাম ১০০ অক্ষরের বেশি হতে পারবে না'),
  description: z.string().max(500).optional(),
});

export const createRoomSchema = z.object({
  buildingId: z
    .string({ error: 'বিল্ডিং আইডি প্রয়োজন' })
    .uuid('বৈধ বিল্ডিং আইডি প্রদান করুন'),
  roomNumber: z
    .string({ error: 'রুম নম্বর প্রয়োজন' })
    .min(1, 'রুম নম্বর প্রদান করুন'),
  capacity: z
    .number({ error: 'ধারণক্ষমতা সংখ্যায় প্রদান করুন' })
    .int('ধারণক্ষমতা পূর্ণসংখ্যা হতে হবে')
    .min(1, 'ধারণক্ষমতা কমপক্ষে ১ হতে হবে')
    .max(50, 'ধারণক্ষমতা ৫০ এর বেশি হতে পারবে না'),
});

export const allocateBedSchema = z.object({
  studentId: z
    .string({ error: 'ছাত্র আইডি প্রয়োজন' })
    .uuid('বৈধ ছাত্র আইডি প্রদান করুন'),
  bedId: z
    .string({ error: 'বেড আইডি প্রয়োজন' })
    .uuid('বৈধ বেড আইডি প্রদান করুন'),
  startDate: z.string().optional(),
});

export const collectHostelFeeSchema = z.object({
  studentId: z
    .string({ error: 'ছাত্র আইডি প্রয়োজন' })
    .uuid('বৈধ ছাত্র আইডি প্রদান করুন'),
  amount: z
    .number({ error: 'টাকার পরিমাণ সংখ্যায় প্রদান করুন' })
    .positive('টাকার পরিমাণ ধনাত্মক হতে হবে'),
  month: z
    .string({ error: 'মাস নির্বাচন প্রয়োজন' })
    .min(1, 'মাস প্রদান করুন'),
  method: z
    .enum(['CASH', 'BKASH', 'NAGAD', 'BANK', 'OTHER'])
    .optional()
    .default('CASH'),
  note: z.string().max(500).optional(),
});
