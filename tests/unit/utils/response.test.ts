import { Response } from 'express';
import { sendSuccess, sendError, FieldError } from '../../../src/utils/response';

describe('Response Utils', () => {
  let mockRes: Partial<Response>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockRes = {
      status: mockStatus,
      json: mockJson
    };
  });

  describe('sendSuccess', () => {
    it('should send success response with default values', () => {
      const testData = { id: 1, name: 'test' };
      
      sendSuccess(mockRes as Response, testData);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Operation completed successfully',
        data: testData,
        timestamp: expect.any(String)
      });
    });

    it('should send success response with custom message and status', () => {
      const testData = { id: 1, name: 'test' };
      const customMessage = 'Custom success message';
      const customStatus = 201;
      
      sendSuccess(mockRes as Response, testData, customMessage, customStatus);

      expect(mockStatus).toHaveBeenCalledWith(customStatus);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: customMessage,
        data: testData,
        timestamp: expect.any(String)
      });
    });

    it('should send success response with null data', () => {
      sendSuccess(mockRes as Response, null, 'Success with null data');

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Success with null data',
        data: null,
        timestamp: expect.any(String)
      });
    });
  });

  describe('sendError', () => {
    it('should send error response with default values', () => {
      const errorMessage = 'Something went wrong';
      
      sendError(mockRes as Response, errorMessage);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: errorMessage,
        timestamp: expect.any(String)
      });
    });

    it('should send error response with custom status', () => {
      const errorMessage = 'Not found';
      const customStatus = 404;
      
      sendError(mockRes as Response, errorMessage, customStatus);

      expect(mockStatus).toHaveBeenCalledWith(customStatus);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: errorMessage,
        timestamp: expect.any(String)
      });
    });

    it('should send error response with error code', () => {
      const errorMessage = 'Validation failed';
      const options = { code: 'VALIDATION_ERROR' };
      
      sendError(mockRes as Response, errorMessage, 400, options);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: errorMessage,
        code: 'VALIDATION_ERROR',
        timestamp: expect.any(String)
      });
    });

    it('should send error response with field errors', () => {
      const errorMessage = 'Validation failed';
      const fieldErrors: FieldError[] = [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password must be at least 8 characters' }
      ];
      const options = { errors: fieldErrors };
      
      sendError(mockRes as Response, errorMessage, 400, options);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: errorMessage,
        errors: fieldErrors,
        timestamp: expect.any(String)
      });
    });

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const errorMessage = 'Test error';
      const options = { code: 'TEST_ERROR' };
      
      sendError(mockRes as Response, errorMessage, 500, options);

      const response = mockJson.mock.calls[0][0];
      expect(response.stack).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});
