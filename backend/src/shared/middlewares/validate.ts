// backend/src/shared/middlewares/validate.ts
// Zod validation middleware for request body, query, and params

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Validates request body against a Zod schema.
 * On failure, throws the ZodError which the globalErrorHandler catches.
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(result.error);
    }
    req.body = result.data; // Use parsed/cleaned data
    next();
  };
};

/**
 * Validates request query against a Zod schema.
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(result.error);
    }
    req.query = result.data as any;
    next();
  };
};

/**
 * Validates request params against a Zod schema.
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return next(result.error);
    }
    next();
  };
};
