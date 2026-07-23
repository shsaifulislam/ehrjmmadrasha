// backend/src/shared/utils/asyncHandler.ts
// Wraps async route handlers to catch errors automatically

import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

/**
 * Wraps an async Express handler so that any thrown/rejected
 * errors are forwarded to the global error handler via next().
 *
 * Usage:
 *   router.get('/items', asyncHandler(async (req, res) => { ... }));
 */
export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
