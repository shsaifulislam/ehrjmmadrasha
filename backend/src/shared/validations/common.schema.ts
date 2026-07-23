// backend/src/shared/validations/common.schema.ts
// Common Zod schemas reused across modules

import { z } from 'zod';

/**
 * UUID parameter validation
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid('অবৈধ আইডি ফরম্যাট'),
});

/**
 * Pagination query validation — used by all list endpoints
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional().default(''),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;

/**
 * Month/Year filter (for finance reports)
 */
export const monthYearSchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

/**
 * Date range filter
 */
export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
