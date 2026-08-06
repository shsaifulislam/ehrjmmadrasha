// backend/src/modules/staff/staff.schema.ts
// Zod validation schemas for staff module

import { z } from 'zod';

export const createStaffSchema = z.object({
  nameBn: z
    .string({ error: 'বাংলা নাম প্রয়োজন' })
    .min(1, 'বাংলা নাম প্রদান করুন')
    .max(200),
  nameEn: z.string().max(200).optional(),
  designation: z
    .string({ error: 'পদবী প্রয়োজন' })
    .min(1, 'পদবী প্রদান করুন')
    .max(100),
  phone: z.string().max(20).optional(),
  nid: z.string().max(20).optional(),
  joiningDate: z.string().optional(),
  department: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  username: z
    .string({ error: 'ইউজারনেম প্রয়োজন' })
    .min(3, 'ইউজারনেম কমপক্ষে ৩ অক্ষর হতে হবে')
    .max(50),
  password: z
    .string({ error: 'পাসওয়ার্ড প্রয়োজন' })
    .min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে'),
});
