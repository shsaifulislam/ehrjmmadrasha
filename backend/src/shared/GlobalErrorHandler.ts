import { Request, Response, NextFunction } from "express";
import { ResponseFormatter } from "./ResponseFormatter";

export interface CustomError extends Error {
  statusCode?: number;
  errors?: any[];
  errorCode?: string;
}

export const GlobalErrorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  console.error(`[GlobalErrorHandler] Error on ${req.method} ${req.url}:`, err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const errors = err.errors || [];
  const errorCode = err.errorCode || "SYS500";

  return ResponseFormatter.error(res, message, statusCode, errors, errorCode);
};

export default GlobalErrorHandler;
