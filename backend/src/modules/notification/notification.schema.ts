// backend/src/modules/notification/notification.schema.ts

import { z } from 'zod';

export const sendBulkSmsSchema = z.object({
  recipientType: z.enum(['ALL_STUDENTS', 'CLASS', 'ALL_TEACHERS', 'CUSTOM'] as const),
  classId: z.string().uuid({ error: 'সঠিক শ্রেণী নির্বাচন করুন' }).optional(),
  customNumbers: z.array(z.string()).optional(),
  message: z.string().min(3, { message: 'এসএমএস বার্তা কমপক্ষে ৩ অক্ষরের হতে হবে' }),
  campaignId: z.string().optional(),
});

export const retryNotificationSchema = z.object({
  notificationId: z.string().uuid({ error: 'সঠিক নোটিফিকেশন আইডেন্টিফায়ার প্রদান করুন' }),
});

export type SendBulkSmsInput = z.infer<typeof sendBulkSmsSchema>;
export type RetryNotificationInput = z.infer<typeof retryNotificationSchema>;
