// backend/src/modules/attendance/attendance.schema.ts

import { z } from 'zod';

export const attendanceStatusSchema = z.enum(['PRESENT', 'ABSENT', 'LEAVE'] as const);

export const attendanceQuerySchema = z.object({
  classId: z.string().uuid({ error: 'সঠিক ক্লাস আইডেন্টিফায়ার প্রদান করুন' }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'তারিখ YYYY-MM-DD ফরম্যাটে হতে হবে' }),
  sessionId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
});

export const attendanceItemSchema = z.object({
  studentId: z.string().uuid({ error: 'সঠিক ছাত্র আইডেন্টিফায়ার প্রদান করুন' }),
  status: attendanceStatusSchema,
});

export const bulkAttendanceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'তারিখ YYYY-MM-DD ফরম্যাটে হতে হবে' }),
  classId: z.string().uuid({ error: 'সঠিক ক্লাস আইডেন্টিফায়ার প্রদান করুন' }),
  attendances: z.array(attendanceItemSchema).min(1, { message: 'কমপক্ষে একজন ছাত্রের উপস্থিতি প্রদান করতে হবে' }),
});

export const dailyReportQuerySchema = z.object({
  classId: z.string().uuid({ error: 'সঠিক ক্লাস আইডেন্টিফায়ার প্রদান করুন' }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'তারিখ YYYY-MM-DD ফরম্যাটে হতে হবে' }),
});

export const monthlyReportQuerySchema = z.object({
  classId: z.string().uuid({ error: 'সঠিক ক্লাস আইডেন্টিফায়ার প্রদান করুন' }),
  year: z.string().regex(/^\d{4}$/, { message: 'সঠিক বছর দিন' }),
  month: z.string().regex(/^(0?[1-9]|1[0-2])$/, { message: 'সঠিক মাস দিন (১-১২)' }),
});

export type AttendanceQuery = z.infer<typeof attendanceQuerySchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;
export type DailyReportQuery = z.infer<typeof dailyReportQuerySchema>;
export type MonthlyReportQuery = z.infer<typeof monthlyReportQuerySchema>;
