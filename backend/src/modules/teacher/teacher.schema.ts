// backend/src/modules/teacher/teacher.schema.ts
// Zod validation schemas for teacher module

import { z } from 'zod';

export const createTeacherSchema = z.object({
  teacherId: z
    .string({ error: 'শিক্ষক আইডি প্রয়োজন' })
    .min(2, 'শিক্ষক আইডি কমপক্ষে ২ অক্ষর'),
  nameBn: z
    .string({ error: 'বাংলা নাম প্রয়োজন' })
    .min(2, 'নাম কমপক্ষে ২ অক্ষর'),
  phone: z
    .string({ error: 'ফোন নম্বর প্রয়োজন' })
    .min(11, 'সঠিক ফোন নম্বর দিন'),
  designation: z.string().optional().nullable(),
  joinDate: z.string().optional().nullable(),
  username: z
    .string({ error: 'ইউজারনেম প্রয়োজন' })
    .min(3, 'ইউজারনেম কমপক্ষে ৩ অক্ষর'),
  password: z
    .string({ error: 'পাসওয়ার্ড প্রয়োজন' })
    .min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর'),
});

export const updateTeacherSchema = z.object({
  nameBn: z.string().min(2, 'নাম কমপক্ষে ২ অক্ষর').optional(),
  phone: z.string().min(11, 'সঠিক ফোন নম্বর দিন').optional(),
  designation: z.string().optional().nullable(),
  joinDate: z.string().optional().nullable(),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;

