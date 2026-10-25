// backend/src/modules/auth/auth.schema.ts
// Zod validation schemas for auth module

import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string({ error: 'ইউজারনেম প্রয়োজন' })
    .min(3, 'ইউজারনেম কমপক্ষে ৩ অক্ষর হতে হবে'),
  password: z
    .string({ error: 'পাসওয়ার্ড প্রয়োজন' })
    .min(4, 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষর হতে হবে'),
});

export const changePasswordSchema = z.object({
  oldPassword: z
    .string({ error: 'বর্তমান পাসওয়ার্ড প্রয়োজন' })
    .min(1, 'বর্তমান পাসওয়ার্ড প্রদান করুন'),
  newPassword: z
    .string({ error: 'নতুন পাসওয়ার্ড প্রয়োজন' })
    .min(6, 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে'),
  confirmPassword: z
    .string({ error: 'পাসওয়ার্ড নিশ্চিতকরণ প্রয়োজন' }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'পাসওয়ার্ড দুটি মিলছে না',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

