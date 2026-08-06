// backend/src/modules/certificate/certificate.schema.ts
// Zod validation schemas for certificate module

import { z } from 'zod';

export const issueCertificateSchema = z.object({
  studentId: z
    .string({ error: 'ছাত্র আইডি প্রয়োজন' })
    .uuid('বৈধ ছাত্র আইডি প্রদান করুন'),
  type: z
    .string({ error: 'সার্টিফিকেটের ধরন প্রয়োজন' })
    .min(1, 'সার্টিফিকেটের ধরন প্রদান করুন')
    .max(100),
  note: z.string().max(500).optional(),
});
