// backend/src/modules/download/download.schema.ts

import { z } from 'zod';

export const createDownloadSchema = z.object({
  title: z.string().min(2, { message: 'ফাইলের শিরোনাম কমপক্ষে ২ অক্ষরের হতে হবে' }),
  category: z.enum(['ROUTINE', 'SYLLABUS', 'ADMISSION', 'FORM', 'OTHER'] as const).default('ROUTINE'),
  fileUrl: z.string().optional(),
});

export type CreateDownloadInput = z.infer<typeof createDownloadSchema>;
