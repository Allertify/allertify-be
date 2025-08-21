import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ErrorResponse } from '../utils/response';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Log error
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    statusCode,
    code: error.code
  });

  const responseMessage = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Something went wrong!'
    : message;

  const response: ErrorResponse = {
    success: false,
    message: responseMessage,
    timestamp: new Date().toISOString()
  };

  // Add error code if available
  if (error.code) {
    response.code = error.code;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack ?? '';
  }

  res.status(statusCode).json(response);
};

export const createError = (statusCode: number, message: string): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};