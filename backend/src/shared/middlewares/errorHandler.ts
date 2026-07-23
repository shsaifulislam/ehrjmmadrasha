// backend/src/shared/middlewares/errorHandler.ts
// Global error handler middleware

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';
import { ApiResponse } from '../types';

/**
 * Format Zod validation errors into a clean structure
 */
function formatZodError(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!errors[path]) errors[path] = [];
    errors[path].push(issue.message);
  }
  return errors;
}

/**
 * Global error handler — must be registered LAST in Express middleware chain
 */
export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // --- Zod Validation Error ---
  if (err instanceof ZodError) {
    const response: ApiResponse = {
      success: false,
      message: 'ভ্যালিডেশন ত্রুটি',
      errors: formatZodError(err),
    };
    res.status(400).json(response);
    return;
  }

  // --- Operational AppError (expected errors) ---
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      message: err.message,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // --- Prisma known errors ---
  if ((err as any).code === 'P2002') {
    const target = (err as any).meta?.target;
    const field = Array.isArray(target) ? target.join(', ') : target || 'field';
    const response: ApiResponse = {
      success: false,
      message: `এই ${field} ইতিমধ্যে ব্যবহৃত হয়েছে`,
    };
    res.status(409).json(response);
    return;
  }

  if ((err as any).code === 'P2025') {
    const response: ApiResponse = {
      success: false,
      message: 'রেকর্ডটি পাওয়া যায়নি',
    };
    res.status(404).json(response);
    return;
  }

  // --- Unknown errors ---
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });

  const response: ApiResponse = {
    success: false,
    message:
      env.NODE_ENV === 'production'
        ? 'সার্ভারে সমস্যা হয়েছে'
        : err.message || 'Internal Server Error',
  };
  res.status(500).json(response);
}
