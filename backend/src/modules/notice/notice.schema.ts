// backend/src/modules/notice/notice.schema.ts

import { z } from 'zod';

export const createNoticeSchema = z.object({
  title: z.string().min(3, { message: 'নোটিশের শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে' }),
  content: z.string().min(5, { message: 'নোটিশের বিবরণ কমপক্ষে ৫ অক্ষরের হতে হবে' }),
  type: z.enum(['GENERAL', 'EXAM', 'ADMISSION', 'EVENT', 'URGENT'] as const).default('GENERAL'),
  isPublished: z.boolean().default(true),
  attachmentUrl: z.string().optional(),
});

export const updateNoticeSchema = createNoticeSchema.partial();

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;
export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>;
