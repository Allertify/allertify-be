import { Request, Response, NextFunction } from 'express';
import { ScanController } from '../../../src/controllers/scan.controller';
import scanService from '../../../src/services/scan.service';
import scanLimitService from '../../../src/services/scan-limit.service';
import { sendSuccess, sendError } from '../../../src/utils/response';

// Prevent server bootstrap triggered by modules that import src/index
jest.mock('../../../src/index', () => ({ prisma: {} }));

// Mock dependencies
jest.mock('../../../src/services/scan.service');
jest.mock('../../../src/services/scan-limit.service');
jest.mock('../../../src/utils/response');

describe('ScanController', () => {
  let scanController: ScanController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockScanService: jest.Mocked<typeof scanService>;
  let mockScanLimitService: jest.Mocked<typeof scanLimitService>;
  let mockSendSuccess: jest.MockedFunction<typeof sendSuccess>;
  let mockSendError: jest.MockedFunction<typeof sendError>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock services
    mockScanService = scanService as jest.Mocked<typeof scanService>;
    mockScanLimitService = scanLimitService as jest.Mocked<typeof scanLimitService>;
    mockSendSuccess = sendSuccess as jest.MockedFunction<typeof sendSuccess>;
    mockSendError = sendError as jest.MockedFunction<typeof sendError>;

    // Create controller instance
    scanController = new ScanController();

    // Setup default mock request/response
    mockReq = {
      params: {},
      body: {},
      query: {},
      method: 'GET',
      url: '/test',
      path: '/test',
      headers: {
        'user-agent': 'jest-agent',
        'content-type': 'application/json',
        authorization: 'Bearer token'
      },
      user: { userId: '1', email: 'test@example.com', role: 'user' } as any
    } as any;
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;
    mockNext = jest.fn();
  });

  describe('scanBarcode', () => {
    it('should successfully scan barcode', async () => {
      // Arrange
      const mockBarcode = '1234567890123';
      const mockScanResult = {
        id: 1,
        userId: 1,
        productId: 1,
        scanDate: new Date(),
        riskLevel: 'SAFE',
        riskExplanation: 'No allergens detected',
        matchedAllergens: null,
        isSaved: false,
        product: {
          id: 1,
          barcode: mockBarcode,
          name: 'Test Product',
          imageUrl: 'test.jpg',
          ingredients: 'test ingredients'
        }
      } as any;

      mockReq.params = { barcode: mockBarcode } as any;
      (mockScanService.processBarcodeScan as jest.Mock).mockResolvedValue(mockScanResult);

      // Act
      await scanController.scanBarcode(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockScanService.processBarcodeScan).toHaveBeenCalledWith(mockBarcode, 1);
      expect(mockSendSuccess).toHaveBeenCalledWith(mockRes, mockScanResult, 'Barcode scan completed successfully');
    });

    it('should handle scan service errors', async () => {
      // Arrange
      const mockBarcode = '1234567890123';
      const mockError = new Error('Daily scan limit exceeded');

      mockReq.params = { barcode: mockBarcode } as any;
      (mockScanService.processBarcodeScan as jest.Mock).mockRejectedValue(mockError);

      // Act
      await scanController.scanBarcode(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('uploadAndScanImage', () => {
    it('should successfully scan uploaded image', async () => {
      // Arrange
      const mockImageUrl = 'https://example.com/image.jpg';
      const mockScanResult = {
        id: 1,
        userId: 1,
        productId: 1,
        scanDate: new Date(),
        riskLevel: 'CAUTION',
        riskExplanation: 'Image analysis completed',
        matchedAllergens: null,
        isSaved: false,
        product: {
          id: 1,
          barcode: 'IMG_123',
          name: 'Product from Image',
          imageUrl: mockImageUrl,
          ingredients: 'Extracted from image'
        }
      } as any;

      mockReq.method = 'POST';
      mockReq.url = '/upload';
      //mockreq.path = '/upload';
      mockReq.body = { imageUrl: mockImageUrl } as any;
      (mockScanService.processImageScan as jest.Mock).mockResolvedValue(mockScanResult);

      // Act
      await scanController.uploadAndScanImage(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockScanService.processImageScan).toHaveBeenCalledWith(mockImageUrl, 1, undefined);
      expect(mockSendSuccess).toHaveBeenCalledWith(mockRes, mockScanResult, 'Image uploaded and analyzed successfully');
    });

    it('should handle image scan with product ID', async () => {
      // Arrange
      const mockImageUrl = 'https://example.com/image.jpg';
      const mockProductId = 123;

      mockReq.method = 'POST';
      mockReq.url = '/upload';
      //mockreq.path = '/upload';
      mockReq.body = { imageUrl: mockImageUrl, productId: mockProductId } as any;
      (mockScanService.processImageScan as jest.Mock).mockResolvedValue({} as any);

      // Act
      await scanController.uploadAndScanImage(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockScanService.processImageScan).toHaveBeenCalledWith(mockImageUrl, 1, mockProductId);
    });
  });

  describe('toggleSaveScan', () => {
    it('should successfully toggle scan save status', async () => {
      // Arrange
      const mockScanId = 1;
      const mockScanResult = {
        id: mockScanId,
        userId: 1,
        isSaved: true
      } as any;

      mockReq.method = 'PUT';
      mockReq.url = `/scans/${mockScanId}/save`;
      //mockreq.path = `/scans/${mockScanId}/save`;
      mockReq.params = { scanId: mockScanId.toString() } as any;
      (mockScanService.toggleSaveScan as jest.Mock).mockResolvedValue(mockScanResult);

      // Act
      await scanController.toggleSaveScan(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockScanService.toggleSaveScan).toHaveBeenCalledWith(mockScanId, 1);
      expect(mockSendSuccess).toHaveBeenCalledWith(mockRes, mockScanResult, 'Scan saved successfully');
    });

    it('should handle toggle save errors', async () => {
      // Arrange
      const mockScanId = 1;
      const mockError = new Error('Scan not found');

      mockReq.method = 'PUT';
      mockReq.url = `/scans/${mockScanId}/save`;
      //mockreq.path = `/scans/${mockScanId}/save`;
      mockReq.params = { scanId: mockScanId.toString() } as any;
      (mockScanService.toggleSaveScan as jest.Mock).mockRejectedValue(mockError);

      // Act
      await scanController.toggleSaveScan(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getScanHistory', () => {
    it('should return user scan history', async () => {
      // Arrange
      const mockScanHistory = {
        scans: [
          {
            id: 1,
            userId: 1,
            productId: 1,
            scanDate: new Date(),
            riskLevel: 'SAFE',
            riskExplanation: 'No allergens',
            matchedAllergens: null,
            isSaved: false,
            product: {
              id: 1,
              barcode: '123',
              name: 'Test Product',
              imageUrl: 'test.jpg',
              ingredients: 'test'
            }
          }
        ],
        total: 1
      } as any;

      mockReq.method = 'GET';
      mockReq.url = '/scans/history';
      //mockreq.path = '/scans/history';
      mockReq.query = {} as any;
      (mockScanService.getUserScanHistory as jest.Mock).mockResolvedValue(mockScanHistory);

      // Act
      await scanController.getScanHistory(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockScanService.getUserScanHistory).toHaveBeenCalledWith(1, {
        limit: 20,
        offset: 0,
        savedOnly: false,
        uniqueByProduct: false,
        listType: undefined
      });
      expect(mockSendSuccess).toHaveBeenCalledWith(mockRes, {
        scans: mockScanHistory.scans,
        pagination: {
          limit: 20,
          offset: 0,
          total: mockScanHistory.total
        }
      }, 'Scan history retrieved successfully');
    });

    it('should handle scan history with query parameters', async () => {
      // Arrange
      mockReq.method = 'GET';
      mockReq.url = '/scans/history';
      //mockreq.path = '/scans/history';
      mockReq.query = {
        limit: '10',
        offset: '5',
        savedOnly: 'true',
        uniqueByProduct: 'true',
        listType: 'RED'
      } as any;
      (mockScanService.getUserScanHistory as jest.Mock).mockResolvedValue({ scans: [], total: 0 });

      // Act
      await scanController.getScanHistory(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockScanService.getUserScanHistory).toHaveBeenCalledWith(1, {
        limit: 10,
        offset: 5,
        savedOnly: true,
        uniqueByProduct: true,
        listType: 'RED'
      });
    });
  });

  describe('getSavedScans', () => {
    it('should return user saved scans', async () => {
      // Arrange
      const mockSavedScans = {
        scans: [],
        total: 0
      } as any;

      mockReq.method = 'GET';
      mockReq.url = '/scans/saved';
      //mockreq.path = '/scans/saved';
      mockReq.query = {} as any;
      (mockScanService.getUserScanHistory as jest.Mock).mockResolvedValue(mockSavedScans);

      // Act
      await scanController.getSavedScans(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockScanService.getUserScanHistory).toHaveBeenCalledWith(1, {
        limit: 20,
        offset: 0,
        savedOnly: true,
        uniqueByProduct: true,
      });
      expect(mockSendSuccess).toHaveBeenCalledWith(mockRes, {
        scans: mockSavedScans.scans,
        pagination: {
          limit: 20,
          offset: 0,
          total: mockSavedScans.total
        }
      }, 'Saved scans retrieved successfully');
    });
  });

  describe('getUserScanLimit', () => {
    it('should return user scan limit information', async () => {
      // Arrange
      const mockScanLimit = {
        userId: 1,
        currentUsage: 3,
        dailyLimit: 5,
        remainingScans: 2,
        isLimitExceeded: false
      } as any;

      mockReq.method = 'GET';
      mockReq.url = '/scans/limit';
      //mockreq.path = '/scans/limit';
      (mockScanLimitService.getUserDailyScanLimit as jest.Mock).mockResolvedValue(mockScanLimit);

      // Act
      await scanController.getUserScanLimit(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockScanLimitService.getUserDailyScanLimit).toHaveBeenCalledWith(1);
      expect(mockSendSuccess).toHaveBeenCalledWith(mockRes, {
        userId: mockScanLimit.userId,
        currentUsage: mockScanLimit.currentUsage,
        dailyLimit: mockScanLimit.dailyLimit,
        remainingScans: mockScanLimit.remainingScans,
        isLimitExceeded: mockScanLimit.isLimitExceeded,
        canScan: true
      }, 'Scan limit information retrieved successfully');
    });

    it('should handle scan limit service errors', async () => {
      // Arrange
      const mockError = new Error('Failed to get scan limit');

      mockReq.method = 'GET';
      mockReq.url = '/scans/limit';
      //mockreq.path = '/scans/limit';
      (mockScanLimitService.getUserDailyScanLimit as jest.Mock).mockRejectedValue(mockError);

      // Act
      await scanController.getUserScanLimit(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
});
