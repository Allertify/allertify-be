
// tests/unit/controllers/product.controller.test.ts

// HANYA mock service dan utilitas yang dipanggil oleh controller
jest.mock('../../../src/services/product.service');
jest.mock('../../../src/utils/response');
jest.mock('../../../src/index', () => ({})); // Mencegah server bootstrap

import { NextFunction, Request, Response } from 'express';
import * as productController from '../../../src/controllers/product.controller';
import productService from '../../../src/services/product.service';
import { sendSuccess, sendError } from '../../../src/utils/response';

describe('ProductController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  const mockProductService = productService as jest.Mocked<typeof productService>;
  const mockSendSuccess = sendSuccess as jest.MockedFunction<typeof sendSuccess>;
  const mockSendError = sendError as jest.MockedFunction<typeof sendError>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;
    
    mockReq = {
      user: { userId: '1', email: 'test@example.com', role: 'user' } as any,
      params: {},
      body: {},
      query: {},
    } as any;

    mockNext = jest.fn();
  });

  describe('getProductDetail', () => {
    it('should return product detail with statistics', async () => {
      // Arrange
      const productId = 1;
      const mockProductDetail = {
        product: { id: productId, name: 'Test Product' },
        statistics: { total_scans: 10, risk_distribution: [] },
        recent_scans: [],
      } as any;
      
      mockReq.params = { productId: String(productId) } as any;

      (mockProductService.getProductDetailWithStats as jest.Mock).mockResolvedValue(mockProductDetail);
      
      // Act
      await productController.getProductDetail(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      // Assert
      expect(mockProductService.getProductDetailWithStats).toHaveBeenCalledWith(productId);
      expect(mockSendSuccess).toHaveBeenCalledWith(
        mockRes as Response,
        mockProductDetail,
        'Product detail retrieved successfully'
      );
    });

    it('should return 400 when missing product ID', async () => {
      mockReq.params = {} as any;

      await productController.getProductDetail(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockSendError).toHaveBeenCalledWith(mockRes as Response, 'Product ID is required', 400);
    });

    it('should return 400 when invalid product ID', async () => {
      mockReq.params = { productId: 'invalid' } as any;

      await productController.getProductDetail(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockSendError).toHaveBeenCalledWith(mockRes as Response, 'Invalid product ID', 400);
    });

    it('should call next when service throws error (duplicate report)', async () => {
      // Arrange
      mockReq.params = { productId: '1' };
      mockReq.body = { report_details: 'Dup report' };
    
      const error = new Error('You have already reported this product');
      (mockProductService.reportProduct as jest.Mock).mockRejectedValue(error);
      
      // Act
      await productController.reportProduct(mockReq as Request, mockRes as Response, mockNext as NextFunction);
    
      // Assert
      // Cek hal yang sama di sini.
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('searchProducts', () => {
    it('should search products and return paginated results', async () => {
      mockReq.query = { query: 'test', limit: '10', offset: '0' } as any;
      const mockSearchResult = {
        products: [{ id: 1, name: 'Test Product' }],
        pagination: { limit: 10, offset: 0, total: 1 }
      } as any;
      
      (mockProductService.searchProducts as jest.Mock).mockResolvedValue(mockSearchResult);

      await productController.searchProducts(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockProductService.searchProducts).toHaveBeenCalledWith('test', 10, 0);
      expect(mockSendSuccess).toHaveBeenCalledWith(
        mockRes as Response,
        mockSearchResult,
        'Products retrieved successfully'
      );
    });

    it('should send validation error with details', async () => {
      mockReq.query = { limit: '0', offset: '-1' } as any;

      await productController.searchProducts(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockSendError).toHaveBeenCalled();
      const [resArg, message, status, options] = (mockSendError as jest.Mock).mock.calls[0];
      expect(resArg).toBe(mockRes);
      expect(message).toBe('Validation error');
      expect(status).toBe(400);
      expect(options.errors).toBeDefined();
    });
  });

  describe('reportProduct', () => {
    it('should create product report successfully', async () => {
      mockReq.params = { productId: '1' } as any;
      mockReq.body = { report_details: 'This product has incorrect allergen information' } as any;

      const mockReportResult = {
        report_id: 1,
        product: { id: 1, name: 'Test Product', barcode: '123' },
        report_details: 'This product has incorrect allergen information',
        status: 'PENDING',
        created_at: new Date()
      } as any;

      (mockProductService.reportProduct as jest.Mock).mockResolvedValue(mockReportResult);

      await productController.reportProduct(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockProductService.reportProduct).toHaveBeenCalledWith(1, 1, 'This product has incorrect allergen information');
      expect(mockSendSuccess).toHaveBeenCalledWith(
        mockRes as Response,
        mockReportResult,
        'Product report submitted successfully',
        201
      );
    });

    it('should return validation error for short report details', async () => {
      mockReq.params = { productId: '1' } as any;
      mockReq.body = { report_details: 'short' } as any;

      await productController.reportProduct(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockSendError).toHaveBeenCalled();
      const [, message, status] = (mockSendError as jest.Mock).mock.calls[0];
      expect(message).toBe('Validation error');
      expect(status).toBe(400);
    });

    it('should return error for missing product ID', async () => {
      mockReq.params = {} as any;

      await productController.reportProduct(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockSendError).toHaveBeenCalledWith(mockRes as Response, 'Product ID is required', 400);
    });

    it('should return error for invalid product ID', async () => {
      mockReq.params = { productId: 'invalid' } as any;

      await productController.reportProduct(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockSendError).toHaveBeenCalledWith(mockRes as Response, 'Invalid product ID', 400);
    });

    it('should call next with an error if service fails', async () => {
      // Arrange
      const error = new Error('Product not found');
      mockReq.params = { productId: '1' };
      (mockProductService.getProductDetailWithStats as jest.Mock).mockRejectedValue(error);
    
      // Act
      await productController.getProductDetail(mockReq as Request, mockRes as Response, mockNext as NextFunction);
    
      // Assert
      // Sekarang kita cek apakah `next` dipanggil dengan error yang kita harapkan.
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getUserReports', () => {
    it('should return user reports with default pagination', async () => {
      const mockResult = {
        reports: [
          {
            id: 1,
            report_details: 'Test report',
            status: 'PENDING',
            created_at: new Date(),
            product: { id: 1, name: 'Test Product', barcode: '123', image_url: 'url' }
          }
        ],
        pagination: { limit: 20, offset: 0, total: 1 }
      } as any;

      (mockProductService.getUserReports as jest.Mock).mockResolvedValue(mockResult);

      await productController.getUserReports(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockProductService.getUserReports).toHaveBeenCalledWith(1, 20, 0);
      expect(mockSendSuccess).toHaveBeenCalledWith(
        mockRes as Response,
        mockResult,
        'User reports retrieved successfully'
      );
    });

    it('should use custom pagination parameters', async () => {
      mockReq.query = { limit: '10', offset: '5' } as any;
      (mockProductService.getUserReports as jest.Mock).mockResolvedValue({ reports: [], pagination: { limit: 10, offset: 5, total: 0 } } as any);

      await productController.getUserReports(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockProductService.getUserReports).toHaveBeenCalledWith(1, 10, 5);
    });
  });

  describe('getPopularProducts', () => {
    it('should return popular products ordered by scan count', async () => {
      mockReq.query = { limit: '10' } as any;
      const mockPopular = {
        products: [
          { id: 1, name: 'Popular Product 1', barcode: '123', image_url: 'image1', nutritional_score: 'A', scan_count: 100 },
          { id: 2, name: 'Popular Product 2', barcode: '234', image_url: 'image2', nutritional_score: 'B', scan_count: 80 }
        ]
      } as any;

      (mockProductService.getPopularProducts as jest.Mock).mockResolvedValue(mockPopular);

      await productController.getPopularProducts(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockProductService.getPopularProducts).toHaveBeenCalledWith(10);
      expect(mockSendSuccess).toHaveBeenCalledWith(
        mockRes as Response,
        mockPopular,
        'Popular products retrieved successfully'
      );
    });

    it('should use custom limit parameter', async () => {
      mockReq.query = { limit: '5' } as any;
      (mockProductService.getPopularProducts as jest.Mock).mockResolvedValue({ products: [] } as any);

      await productController.getPopularProducts(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockProductService.getPopularProducts).toHaveBeenCalledWith(5);
    });
  });
});

