// backend/src/modules/feeType/feeType.schema.ts

import { z } from 'zod';

export const createFeeTypeSchema = z.object({
  name: z.string({ error: 'ফি টাইপের নাম প্রয়োজন' }).min(2, 'নাম কমপক্ষে ২ অক্ষর'),
  defaultAmount: z.coerce.number({ error: 'ডিফল্ট পরিমাণ প্রয়োজন' }).min(0, 'পরিমাণ ০ বা তার বেশি হতে হবে'),
});

export const updateFeeTypeSchema = z.object({
  name: z.string().min(2).optional(),
  defaultAmount: z.coerce.number().min(0).optional(),
});

export type CreateFeeTypeInput = z.infer<typeof createFeeTypeSchema>;
export type UpdateFeeTypeInput = z.infer<typeof updateFeeTypeSchema>;

