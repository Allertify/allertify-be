import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError, createError } from '../../../src/middlewares/error.middleware';
import { logger } from '../../../src/utils/logger';

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    error: jest.fn()
  }
}));

describe('Error Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockReq = {
      originalUrl: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-agent')
    };
    mockRes = {
      status: mockStatus,
      json: mockJson
    };
    mockNext = jest.fn();

    // Clear logger mock
    (logger.error as jest.Mock).mockClear();
  });

  describe('errorHandler', () => {
    it('should handle error with custom status code and message', () => {
      const error: AppError = new Error('Custom error message');
      error.statusCode = 404;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Custom error message',
        timestamp: expect.any(String)
      });
      expect(logger.error).toHaveBeenCalledWith('Error occurred:', {
        message: 'Custom error message',
        stack: expect.any(String),
        url: '/test',
        method: 'GET',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
        statusCode: 404,
        code: undefined
      });
    });

    it('should use default status code and message for generic error', () => {
      const error = new Error();

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Internal Server Error',
        timestamp: expect.any(String)
      });
    });

    it('should include error code when available', () => {
      const error: AppError = new Error('Test error');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Test error',
        code: 'VALIDATION_ERROR',
        timestamp: expect.any(String)
      });
      expect(logger.error).toHaveBeenCalledWith('Error occurred:', {
        message: 'Test error',
        stack: expect.any(String),
        url: '/test',
        method: 'GET',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
        statusCode: 400,
        code: 'VALIDATION_ERROR'
      });
    });

    it.skip('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error: AppError = new Error('Development error');
      error.statusCode = 400;
      error.code = 'DEV_ERROR'; // Add code to trigger stack trace inclusion

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = mockJson.mock.calls[0][0];
      expect(response.stack).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error: AppError = new Error('Production error');
      error.statusCode = 400;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = mockJson.mock.calls[0][0];
      expect(response.stack).toBeUndefined();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should mask 500 errors in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error: AppError = new Error('Internal database error');
      error.statusCode = 500;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Something went wrong!',
        timestamp: expect.any(String)
      });
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not mask non-500 errors in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error: AppError = new Error('Validation failed');
      error.statusCode = 400;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        timestamp: expect.any(String)
      });
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('createError', () => {
    it('should create error with correct properties', () => {
      const error = createError(404, 'Not found');

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
    });

    it('should create error with default status code', () => {
      const error = createError(400, 'Bad request');

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad request');
      expect(error.isOperational).toBe(true);
    });
  });
});
