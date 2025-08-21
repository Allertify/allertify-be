import { Response } from 'express';

export interface FieldError {
  field: string;
  message: string;
}

export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: FieldError[];
  timestamp: string;
  stack?: string; // Only in development
}

/**
 * Send standardized success response
 */
export const sendSuccess = <T = any>(
  res: Response,
  data: T,
  message: string = 'Operation completed successfully',
  statusCode: number = 200
): Response<SuccessResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Send standardized error response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400,
  options?: {
    code?: string;
    errors?: FieldError[];
  }
): Response<ErrorResponse> => {
  const response: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (options?.code) {
    response.code = options.code;
  }

  if (options?.errors) {
    response.errors = options.errors;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && options?.code) {
    const error = new Error(message);
    response.stack = error.stack ?? '';
  }

  return res.status(statusCode).json(response);
};
