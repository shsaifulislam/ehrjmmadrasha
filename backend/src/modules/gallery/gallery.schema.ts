// backend/src/modules/gallery/gallery.schema.ts

import { z } from 'zod';

export const createGallerySchema = z.object({
  title: z.string().min(2, { message: 'ছবির শিরোনাম কমপক্ষে ২ অক্ষরের হতে হবে' }),
  category: z.enum(['CAMPUS', 'EVENT', 'AWARD', 'CLASSROOM', 'OTHER'] as const).default('CAMPUS'),
  imageUrl: z.string().optional(),
});

export type CreateGalleryInput = z.infer<typeof createGallerySchema>;
