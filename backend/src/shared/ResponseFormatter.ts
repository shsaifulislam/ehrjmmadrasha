import { Response } from "express";

export interface StandardApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: any;
  errors?: any[];
  timestamp: string;
  requestId?: string;
}

export class ResponseFormatter {
  static success<T>(
    res: Response,
    data: T,
    message = "Request executed successfully",
    statusCode = 200,
    meta?: any
  ): Response {
    const payload: StandardApiResponse<T> = {
      success: true,
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
      requestId: (res.req as any)?.id || undefined,
    };
    return res.status(statusCode).json(payload);
  }

  static error(
    res: Response,
    message = "An error occurred",
    statusCode = 400,
    errors: any[] = [],
    errorCode?: string
  ): Response {
    const payload: StandardApiResponse<null> = {
      success: false,
      message,
      errors: errors.length > 0 ? errors : errorCode ? [{ code: errorCode, message }] : [],
      timestamp: new Date().toISOString(),
      requestId: (res.req as any)?.id || undefined,
    };
    return res.status(statusCode).json(payload);
  }
}

export default ResponseFormatter;
