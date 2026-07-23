// backend/src/shared/utils/response.ts
// Standardized API response helpers

import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types';

/**
 * Send a success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'সফল হয়েছে',
  statusCode = 200
): void {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  res.status(statusCode).json(response);
}

/**
 * Send a paginated success response
 */
export function sendPaginated<T>(
  res: Response,
  data: T,
  meta: PaginationMeta,
  message = 'সফল হয়েছে'
): void {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta,
  };
  res.status(200).json(response);
}

/**
 * Send a created response (201)
 */
export function sendCreated<T>(
  res: Response,
  data: T,
  message = 'সফলভাবে তৈরি হয়েছে'
): void {
  sendSuccess(res, data, message, 201);
}

/**
 * Send a no-content response (204)
 */
export function sendNoContent(res: Response): void {
  res.status(204).send();
}

/**
 * Build pagination meta from total count and query params
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
