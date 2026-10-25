// backend/src/modules/academic/academic.schema.ts
// Zod validation schemas for academic module (session, class, student, department, subject)

import { z } from 'zod';

// ─── Session ────────────────────────────────────────
export const createSessionSchema = z.object({
  year: z.string({ error: 'সেশন বছর প্রয়োজন' }).min(4, 'সঠিক বছর দিন'),
  isActive: z.boolean().optional().default(false),
});

export const updateSessionSchema = z.object({
  year: z.string().min(4).optional(),
  isActive: z.boolean().optional(),
});

// ─── Class ──────────────────────────────────────────
export const createClassSchema = z.object({
  name: z.string({ error: 'শ্রেণীর নাম প্রয়োজন' }).min(1, 'শ্রেণীর নাম দিন'),
  numericValue: z.coerce.number({ error: 'সংখ্যামান প্রয়োজন' }).int().min(0),
});

export const updateClassSchema = z.object({
  name: z.string().min(1).optional(),
  numericValue: z.coerce.number().int().min(0).optional(),
});

// ─── Department ─────────────────────────────────────
export const createDepartmentSchema = z.object({
  name: z.string({ error: 'বিভাগের নাম প্রয়োজন' }).min(2, 'নাম কমপক্ষে ২ অক্ষর'),
  type: z.string({ error: 'বিভাগের ধরন প্রয়োজন' }).min(2, 'ধরন কমপক্ষে ২ অক্ষর'),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(2).optional(),
  type: z.string().min(2).optional(),
});

// ─── Subject ────────────────────────────────────────
export const createSubjectSchema = z.object({
  name: z.string({ error: 'বিষয়ের নাম প্রয়োজন' }).min(2, 'নাম কমপক্ষে ২ অক্ষর'),
  code: z.string().optional().nullable(),
  classId: z.string({ error: 'শ্রেণী নির্বাচন করুন' }).uuid('অবৈধ শ্রেণী আইডি'),
});

export const updateSubjectSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().optional().nullable(),
  classId: z.string().uuid().optional(),
});

// ─── Student ────────────────────────────────────────
export const createStudentSchema = z.object({
  studentId: z.string({ error: 'স্টুডেন্ট আইডি প্রয়োজন' }).min(2),
  roll: z.coerce.number({ error: 'রোল নম্বর প্রয়োজন' }).int().min(1),
  nameBn: z.string({ error: 'বাংলা নাম প্রয়োজন' }).min(2),
  nameEn: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  classId: z.string({ error: 'শ্রেণী নির্বাচন করুন' }).uuid(),
  sessionId: z.string({ error: 'সেশন নির্বাচন করুন' }).uuid(),
  departmentId: z.string().uuid().optional().nullable(),
  guardianId: z.string().uuid().optional().nullable(),
});

export const updateStudentSchema = z.object({
  roll: z.coerce.number().int().min(1).optional(),
  nameBn: z.string().min(2).optional(),
  nameEn: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  classId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional().nullable(),
  guardianId: z.string().uuid().optional().nullable(),
});

// Type exports
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

