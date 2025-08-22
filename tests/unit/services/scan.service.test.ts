import { ScanService } from '../../../src/services/scan.service';
import scanLimitService from '../../../src/services/scan-limit.service';
import productService from '../../../src/services/product.service';
import aiService from '../../../src/services/ai.service';

// Mock dependencies
jest.mock('../../../src/services/scan-limit.service');
jest.mock('../../../src/services/product.service');
jest.mock('../../../src/services/ai.service');

// Mock PrismaClient constructor
const mockPrismaClient = {
  product_scan: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  user_allergen: {
    findMany: jest.fn(),
  },
  user_product_preference: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient)
}));

describe('ScanService', () => {
  let scanService: ScanService;
  let mockScanLimitService: jest.Mocked<typeof scanLimitService>;
  let mockProductService: jest.Mocked<typeof productService>;
  let mockAiService: jest.Mocked<typeof aiService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock services
    mockScanLimitService = scanLimitService as jest.Mocked<typeof scanLimitService>;
    mockProductService = productService as jest.Mocked<typeof productService>;
    mockAiService = aiService as jest.Mocked<typeof aiService>;

    // Create service instance
    scanService = new ScanService();
  });

  describe('processBarcodeScan', () => {
    const mockUserId = 1;
    const mockBarcode = '1234567890123';
    const mockProduct = {
      id: 1,
      name: 'Test Product',
      barcode: mockBarcode,
      ingredients: 'wheat, milk, eggs',
      image_url: 'https://example.com/image.jpg',
      nutritional_score: 'B',
      updatedAt: new Date()
    };
    const mockUserAllergies = ['milk', 'eggs'];
    const mockAiAnalysis = {
      riskLevel: 'RISKY' as const,
      reasoning: 'Contains milk and eggs which are user allergens',
      matchedAllergens: ['milk', 'eggs']
    };
    const mockScanLimit = {
      userId: mockUserId,
      currentUsage: 5,
      dailyLimit: 10,
      remainingScans: 5,
      isLimitExceeded: false
    };
    beforeEach(() => {
      // Setup default mocks for successful scan
      (mockScanLimitService.canUserScanToday as jest.Mock).mockResolvedValue({
        canScan: true,
        remainingScans: 5,
        dailyLimit: 10
      });
      (mockProductService.findOrCreateProductByBarcode as jest.Mock).mockResolvedValue(mockProduct);
      (mockAiService.analyzeIngredientsWithContext as jest.Mock).mockResolvedValue(mockAiAnalysis);
      (mockScanLimitService.getUserDailyScanLimit as jest.Mock).mockResolvedValue(mockScanLimit);
      (mockScanLimitService.incrementDailyScanUsage as jest.Mock).mockResolvedValue(mockScanLimit);

      // Mock getUserAllergies method
      jest.spyOn(scanService, 'getUserAllergies' as any).mockResolvedValue(mockUserAllergies);
    });

    it('should successfully process barcode scan', async () => {
      // Arrange
      const mockScanResult = {
        id: 1,
        user_id: mockUserId,
        product_id: mockProduct.id,
        scan_date: new Date(),
        risk_level: mockAiAnalysis.riskLevel,
        risk_explanation: mockAiAnalysis.reasoning,
        matched_allergens: mockAiAnalysis.matchedAllergens.join(', '),
        is_saved: false,
        product: mockProduct
      };
      mockPrismaClient.product_scan.create.mockResolvedValue(mockScanResult);

      // Mock transformScanResult method
      const expectedResult = {
        id: 1,
        userId: mockUserId,
        productId: mockProduct.id,
        scanDate: mockScanResult.scan_date,
        riskLevel: mockAiAnalysis.riskLevel,
        riskExplanation: mockAiAnalysis.reasoning,
        matchedAllergens: mockAiAnalysis.matchedAllergens.join(', '),
        isSaved: false,
        product: {
          id: mockProduct.id,
          barcode: mockProduct.barcode,
          name: mockProduct.name,
          imageUrl: mockProduct.image_url,
          ingredients: mockProduct.ingredients,
        },
        scanLimit: {
          remainingScans: 5,
          dailyLimit: 10
        }
      };
      jest.spyOn(scanService, 'transformScanResult' as any).mockReturnValue(expectedResult);

      // Act
      const result = await scanService.processBarcodeScan(mockBarcode, mockUserId);

      // Assert
      expect(mockScanLimitService.canUserScanToday).toHaveBeenCalledWith(mockUserId);
      expect(mockProductService.findOrCreateProductByBarcode).toHaveBeenCalledWith(mockBarcode);
      expect(mockAiService.analyzeIngredientsWithContext).toHaveBeenCalledWith(
        mockProduct.ingredients,
        mockUserAllergies,
        {
          productName: mockProduct.name,
          brand: ''
        }
      );
      expect(mockPrismaClient.product_scan.create).toHaveBeenCalledWith({
        data: {
          user_id: mockUserId,
          product_id: mockProduct.id,
          scan_date: expect.any(Date),
          risk_level: mockAiAnalysis.riskLevel,
          risk_explanation: mockAiAnalysis.reasoning,
          matched_allergens: mockAiAnalysis.matchedAllergens.join(', '),
          is_saved: false
        },
        include: {
          product: true
        }
      });
      expect(mockScanLimitService.incrementDailyScanUsage).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(expectedResult);
    });

    it('should throw error when daily scan limit is exceeded', async () => {
      // Arrange
      (mockScanLimitService.canUserScanToday as jest.Mock).mockResolvedValue({
        canScan: false,
        remainingScans: 0,
        dailyLimit: 10
      });

      // Act & Assert
      await expect(scanService.processBarcodeScan(mockBarcode, mockUserId))
        .rejects.toThrow('Daily scan limit exceeded. You have used 10 scans today. Upgrade your plan for more scans.');
    });

    it('should handle product service errors', async () => {
      // Arrange
      const productError = new Error('Product not found');
      (mockProductService.findOrCreateProductByBarcode as jest.Mock).mockRejectedValue(productError);

      // Act & Assert - service wraps error with "Barcode scan failed: "
      await expect(scanService.processBarcodeScan(mockBarcode, mockUserId))
        .rejects.toThrow('Barcode scan failed: Product not found');
    });

    it('should handle AI service errors', async () => {
      // Arrange
      const aiError = new Error('AI analysis failed');
      (mockAiService.analyzeIngredientsWithContext as jest.Mock).mockRejectedValue(aiError);

      // Act & Assert - service wraps error with "Barcode scan failed: "
      await expect(scanService.processBarcodeScan(mockBarcode, mockUserId))
        .rejects.toThrow('Barcode scan failed: AI analysis failed');
    });

    it('should handle null matched allergens', async () => {
      // Arrange
      const aiAnalysisWithNoAllergens = {
        riskLevel: 'SAFE' as const,
        reasoning: 'No allergens detected',
        matchedAllergens: []
      };
      (mockAiService.analyzeIngredientsWithContext as jest.Mock).mockResolvedValue(aiAnalysisWithNoAllergens);

      const mockScanResult = {
        id: 1,
        user_id: mockUserId,
        product_id: mockProduct.id,
        scan_date: new Date(),
        risk_level: 'SAFE',
        risk_explanation: 'No allergens detected',
        matched_allergens: null, // Should be null when no allergens
        is_saved: false,
        product: mockProduct
      };
      mockPrismaClient.product_scan.create.mockResolvedValue(mockScanResult);

      const expectedResult = { 
        id: 1, 
        userId: mockUserId,
        productId: mockProduct.id,
        scanDate: mockScanResult.scan_date,
        riskLevel: 'SAFE',
        riskExplanation: 'No allergens detected',
        matchedAllergens: null,
        isSaved: false,
        product: {
          id: mockProduct.id,
          barcode: mockProduct.barcode,
          name: mockProduct.name,
          imageUrl: mockProduct.image_url,
          ingredients: mockProduct.ingredients,
        }
      };
      jest.spyOn(scanService, 'transformScanResult' as any).mockReturnValue(expectedResult);

      // Act
      const result = await scanService.processBarcodeScan(mockBarcode, mockUserId);

      // Assert
      expect(mockPrismaClient.product_scan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          matched_allergens: null
        }),
        include: { product: true }
      });
      expect(result.matchedAllergens).toBeNull();
    });
  });

  describe('toggleSaveScan', () => {
    const mockUserId = 1;
    const mockScanId = 1;

    it('should toggle save status from false to true', async () => {
      // Arrange
      const existingScan = {
        id: mockScanId,
        user_id: mockUserId,
        is_saved: false,
        product_id: 1
      };
      const updatedScan = {
        ...existingScan,
        is_saved: true,
        product: {
          id: 1,
          name: 'Test Product',
          barcode: '123456',
          image_url: 'test.jpg',
          ingredients: 'test ingredients',
          nutritional_score: 'N/A',
          updatedAt: new Date()
        }
      };

      mockPrismaClient.product_scan.findFirst.mockResolvedValue(existingScan);
      mockPrismaClient.product_scan.update.mockResolvedValue(updatedScan);
      jest.spyOn(scanService, 'transformScanResult' as any).mockReturnValue({ 
        id: 1, 
        userId: mockUserId,
        productId: 1,
        scanDate: new Date(),
        riskLevel: 'SAFE',
        riskExplanation: 'test',
        matchedAllergens: null,
        isSaved: true,
        product: {
          id: 1,
          barcode: '123456',
          name: 'Test Product',
          imageUrl: 'test.jpg',
          ingredients: 'test ingredients'
        }
      });

      // Act
      const result = await scanService.toggleSaveScan(mockScanId, mockUserId);

      // Assert
      expect(mockPrismaClient.product_scan.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockScanId,
          user_id: mockUserId
        }
      });
      expect(mockPrismaClient.product_scan.update).toHaveBeenCalledWith({
        where: { id: mockScanId },
        data: { is_saved: true },
        include: { product: true }
      });
      expect(result.isSaved).toBe(true);
    });

    it('should throw error when scan not found or access denied', async () => {
      // Arrange
      mockPrismaClient.product_scan.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(scanService.toggleSaveScan(mockScanId, mockUserId))
        .rejects.toThrow('Scan not found or access denied');
    });
  });

  describe('getUserAllergies', () => {
    it('should return user allergies', async () => {
      // Arrange
      const mockUserId = 1;
      const mockUserAllergens = [
        { allergen: { name: 'milk' } },
        { allergen: { name: 'eggs' } }
      ];
      mockPrismaClient.user_allergen.findMany.mockResolvedValue(mockUserAllergens);

      // Act
      const result = await (scanService as any).getUserAllergies(mockUserId);

      // Assert
      expect(mockPrismaClient.user_allergen.findMany).toHaveBeenCalledWith({
        where: { user_id: mockUserId },
        include: { allergen: true }
      });
      expect(result).toEqual(['milk', 'eggs']);
    });

    it('should return empty array when no allergies found', async () => {
      // Arrange
      const mockUserId = 1;
      mockPrismaClient.user_allergen.findMany.mockResolvedValue([]);

      // Act
      const result = await (scanService as any).getUserAllergies(mockUserId);

      // Assert
      expect(result).toEqual([]);
    });
  });
});