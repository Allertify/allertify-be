import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { ProductService } from '../../../src/services/product.service';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('axios');

describe('ProductService', () => {
  let productService: ProductService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockAxios: jest.Mocked<typeof axios>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock prisma instance
    mockPrisma = {
      product: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
    } as any;

    // Mock axios
    mockAxios = axios as jest.Mocked<typeof axios>;

    // Create service instance
    productService = new ProductService();
    (productService as any).prisma = mockPrisma;
  });

  describe('findOrCreateProductByBarcode', () => {
    const mockBarcode = '1234567890123';

    it('should return existing product from database', async () => {
      // Arrange
      const existingProduct = {
        id: 1,
        barcode: mockBarcode,
        name: 'Existing Product',
        image_url: 'https://example.com/image.jpg',
        nutritional_score: 'A',
        ingredients: 'wheat, water, salt'
      };
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(existingProduct);

      // Act
      const result = await productService.findOrCreateProductByBarcode(mockBarcode);

      // Assert
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { barcode: mockBarcode }
      });
      expect(result).toEqual(existingProduct);
      expect(mockAxios.get).not.toHaveBeenCalled();
    });

    it('should create new product from Open Food Facts API when not found in database', async () => {
      // Arrange
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null);
      
      const mockApiResponse = {
        data: {
          status: 1,
          product: {
            product_name: 'New Product',
            brands: 'Test Brand',
            image_url: 'https://example.com/new-image.jpg',
            ingredients_text: 'flour, sugar, eggs',
            nutriments: {
              'nutrition-score-fr': 3
            }
          }
        }
      };
      mockAxios.get.mockResolvedValue(mockApiResponse);

      const newProduct = {
        id: 2,
        barcode: mockBarcode,
        name: 'New Product',
        image_url: 'https://example.com/new-image.jpg',
        nutritional_score: '3',
        ingredients: 'flour, sugar, eggs'
      };
      (mockPrisma.product.create as jest.Mock).mockResolvedValue(newProduct);

      // Act
      const result = await productService.findOrCreateProductByBarcode(mockBarcode);

      // Assert
      expect(mockAxios.get).toHaveBeenCalledWith(
        `https://world.openfoodfacts.org/api/v2/product/${mockBarcode}.json`,
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'Allertify/1.0.0 (https://allertify.com)'
          }
        }
      );
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: {
          barcode: mockBarcode,
          name: 'New Product',
          image_url: 'https://example.com/new-image.jpg',
          nutritional_score: '3',
          ingredients: 'flour, sugar, eggs'
        }
      });
      expect(result).toEqual(newProduct);
    });

    it('should handle missing product data from API', async () => {
      // Arrange
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null);
      
      const mockApiResponse = {
        data: {
          status: 1,
          product: {
            // Missing required fields
          }
        }
      };
      mockAxios.get.mockResolvedValue(mockApiResponse);

      const newProduct = {
        id: 2,
        barcode: mockBarcode,
        name: 'Unknown Product',
        image_url: '',
        nutritional_score: 'N/A',
        ingredients: ''
      };
      (mockPrisma.product.create as jest.Mock).mockResolvedValue(newProduct);

      // Act
      const result = await productService.findOrCreateProductByBarcode(mockBarcode);

      // Assert
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: {
          barcode: mockBarcode,
          name: 'Unknown Product',
          image_url: '',
          nutritional_score: 'N/A',
          ingredients: ''
        }
      });
      expect(result).toEqual(newProduct);
    });

    it('should throw error when product not found in Open Food Facts', async () => {
      // Arrange
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null);
      
      const mockApiResponse = {
        data: {
          status: 0, // Product not found
          status_verbose: 'product not found'
        }
      };
      mockAxios.get.mockResolvedValue(mockApiResponse);

      // Act & Assert
      await expect(productService.findOrCreateProductByBarcode(mockBarcode))
        .rejects.toThrow(`Product with barcode ${mockBarcode} not found in Open Food Facts`);
    });

    it('should handle 404 error from API', async () => {
      // Arrange
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null);
      
      const axiosError = {
        isAxiosError: true,
        response: { status: 404 },
        message: 'Request failed with status code 404'
      };
      mockAxios.get.mockRejectedValue(axiosError);
      mockAxios.isAxiosError.mockReturnValue(true);

      // Act & Assert
      await expect(productService.findOrCreateProductByBarcode(mockBarcode))
        .rejects.toThrow(`Product with barcode ${mockBarcode} not found in Open Food Facts database`);
    });

    it('should handle timeout error from API', async () => {
      // Arrange
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null);
      
      const axiosError = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded'
      };
      mockAxios.get.mockRejectedValue(axiosError);
      mockAxios.isAxiosError.mockReturnValue(true);

      // Act & Assert
      await expect(productService.findOrCreateProductByBarcode(mockBarcode))
        .rejects.toThrow('Request to Open Food Facts API timed out');
    });

    it('should handle general axios errors', async () => {
      // Arrange
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null);
      
      const axiosError = {
        isAxiosError: true,
        message: 'Network Error'
      };
      mockAxios.get.mockRejectedValue(axiosError);
      mockAxios.isAxiosError.mockReturnValue(true);

      // Act & Assert
      await expect(productService.findOrCreateProductByBarcode(mockBarcode))
        .rejects.toThrow('Open Food Facts API error: Network Error');
    });

    it('should handle unknown errors', async () => {
      // Arrange
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null);
      mockAxios.get.mockRejectedValue('Unknown error');

      // Act & Assert
      await expect(productService.findOrCreateProductByBarcode(mockBarcode))
        .rejects.toThrow('Unknown error occurred while fetching product data');
    });
  });

  describe('findProductById', () => {
    it('should return product when found', async () => {
      // Arrange
      const productId = 1;
      const mockProduct = {
        id: productId,
        barcode: '1234567890123',
        name: 'Test Product',
        image_url: 'https://example.com/image.jpg',
        nutritional_score: 'B',
        ingredients: 'wheat, milk'
      };
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      // Act
      const result = await productService.findProductById(productId);

      // Assert
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId }
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw error when product not found', async () => {
      // Arrange
      const productId = 999;
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(productService.findProductById(productId))
        .rejects.toThrow(`Product with ID ${productId} not found`);
    });

    it('should handle database errors', async () => {
      // Arrange
      const productId = 1;
      const dbError = new Error('Database connection failed');
      (mockPrisma.product.findUnique as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(productService.findProductById(productId))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle unknown errors', async () => {
      // Arrange
      const productId = 1;
      (mockPrisma.product.findUnique as jest.Mock).mockRejectedValue('Unknown error');

      // Act & Assert
      await expect(productService.findProductById(productId))
        .rejects.toThrow('Unknown error occurred while fetching product');
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      // Arrange
      const productId = 1;
      const updateData = {
        name: 'Updated Product Name',
        image_url: 'https://example.com/new-image.jpg',
        nutritional_score: 'A',
        ingredients: 'updated ingredients'
      };
      const updatedProduct = {
        id: productId,
        barcode: '1234567890123',
        ...updateData
      };
      (mockPrisma.product.update as jest.Mock).mockResolvedValue(updatedProduct);

      // Act
      const result = await productService.updateProduct(productId, updateData);

      // Assert
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: updateData
      });
      expect(result).toEqual(updatedProduct);
    });

    it('should handle partial updates', async () => {
      // Arrange
      const productId = 1;
      const updateData = { name: 'New Name' };
      const updatedProduct = {
        id: productId,
        barcode: '1234567890123',
        name: 'New Name',
        image_url: 'old-image.jpg',
        nutritional_score: 'B',
        ingredients: 'old ingredients'
      };
      (mockPrisma.product.update as jest.Mock).mockResolvedValue(updatedProduct);

      // Act
      const result = await productService.updateProduct(productId, updateData);

      // Assert
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: updateData
      });
      expect(result).toEqual(updatedProduct);
    });

    it('should handle database errors', async () => {
      // Arrange
      const productId = 1;
      const updateData = { name: 'New Name' };
      const dbError = new Error('Database error');
      (mockPrisma.product.update as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(productService.updateProduct(productId, updateData))
        .rejects.toThrow('Database error');
    });
  });

  describe('createMinimalProduct', () => {
    it('should create minimal product for image scan', async () => {
      // Arrange
      const imageUrl = 'https://example.com/uploaded-image.jpg';
      const mockProduct = {
        id: 1,
        barcode: expect.stringMatching(/^IMG_\d+_[a-z0-9]{9}$/),
        name: 'Product from Image Scan',
        image_url: imageUrl,
        nutritional_score: 'N/A',
        ingredients: 'Extracted from image'
      };
      (mockPrisma.product.create as jest.Mock).mockResolvedValue(mockProduct);

      // Act
      const result = await productService.createMinimalProduct(imageUrl);

      // Assert
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: {
          barcode: expect.stringMatching(/^IMG_\d+_[a-z0-9]{9}$/),
          name: 'Product from Image Scan',
          image_url: imageUrl,
          nutritional_score: 'N/A',
          ingredients: 'Extracted from image'
        }
      });
      expect(result).toEqual(mockProduct);
    });

    it('should handle database errors', async () => {
      // Arrange
      const imageUrl = 'https://example.com/image.jpg';
      const dbError = new Error('Database error');
      (mockPrisma.product.create as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(productService.createMinimalProduct(imageUrl))
        .rejects.toThrow('Database error');
    });
  });

  describe('findOrCreateProductByName', () => {
    const productName = 'Test Product';

    it('should return existing product when found by name', async () => {
      // Arrange
      const existingProduct = {
        id: 1,
        barcode: '1234567890123',
        name: productName,
        image_url: 'https://example.com/image.jpg',
        nutritional_score: 'B',
        ingredients: 'existing ingredients'
      };
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(existingProduct);

      // Act
      const result = await productService.findOrCreateProductByName(productName);

      // Assert
      expect(mockPrisma.product.findFirst).toHaveBeenCalledWith({
        where: {
          name: {
            contains: productName,
            mode: 'insensitive'
          }
        }
      });
      expect(result).toEqual(existingProduct);
    });

    it('should create new product when not found', async () => {
      // Arrange
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null);
      
      const newProduct = {
        id: 2,
        barcode: expect.stringMatching(/^NAME_\d+_[a-z0-9]{9}$/),
        name: productName,
        image_url: '',
        nutritional_score: 'N/A',
        ingredients: 'Product created from name'
      };
      (mockPrisma.product.create as jest.Mock).mockResolvedValue(newProduct);

      // Act
      const result = await productService.findOrCreateProductByName(productName);

      // Assert
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: {
          barcode: expect.stringMatching(/^NAME_\d+_[a-z0-9]{9}$/),
          name: productName,
          image_url: '',
          nutritional_score: 'N/A',
          ingredients: 'Product created from name'
        }
      });
      expect(result).toEqual(newProduct);
    });

    it('should create product with provided options', async () => {
      // Arrange
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null);
      
      const options = {
        ingredients: 'custom ingredients',
        barcode: 'custom-barcode',
        imageUrl: 'https://example.com/custom-image.jpg'
      };
      
      const newProduct = {
        id: 2,
        barcode: options.barcode,
        name: productName,
        image_url: options.imageUrl,
        nutritional_score: 'N/A',
        ingredients: options.ingredients
      };
      (mockPrisma.product.create as jest.Mock).mockResolvedValue(newProduct);

      // Act
      const result = await productService.findOrCreateProductByName(productName, options);

      // Assert
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: {
          barcode: options.barcode,
          name: productName,
          image_url: options.imageUrl,
          nutritional_score: 'N/A',
          ingredients: options.ingredients
        }
      });
      expect(result).toEqual(newProduct);
    });

    it('should update existing product with new ingredients', async () => {
      // Arrange
      const existingProduct = {
        id: 1,
        barcode: '1234567890123',
        name: productName,
        image_url: '',
        nutritional_score: 'B',
        ingredients: 'Product created from name' // Default placeholder
      };
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(existingProduct);

      const options = {
        ingredients: 'updated ingredients from analysis'
      };

      const updateProductSpy = jest.spyOn(productService, 'updateProduct' as any).mockResolvedValue({
        ...existingProduct,
        ingredients: options.ingredients
      });

      // Act
      const result = await productService.findOrCreateProductByName(productName, options);

      // Assert
      expect(updateProductSpy).toHaveBeenCalledWith(existingProduct.id, {
        ingredients: options.ingredients
      });
      expect(result.ingredients).toBe(options.ingredients);

      updateProductSpy.mockRestore();
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = new Error('Database error');
      (mockPrisma.product.findFirst as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(productService.findOrCreateProductByName(productName))
        .rejects.toThrow('Database error');
    });
  });

  describe('updateProductImage', () => {
    it('should update product image successfully', async () => {
      // Arrange
      const productId = 1;
      const newImageUrl = 'https://example.com/new-image.jpg';
      const updatedProduct = {
        id: productId,
        barcode: '1234567890123',
        name: 'Test Product',
        image_url: newImageUrl,
        nutritional_score: 'B',
        ingredients: 'test ingredients'
      };
      (mockPrisma.product.update as jest.Mock).mockResolvedValue(updatedProduct);

      // Act
      const result = await productService.updateProductImage(productId, newImageUrl);

      // Assert
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: { image_url: newImageUrl }
      });
      expect(result).toEqual(updatedProduct);
    });

    it('should handle database errors', async () => {
      // Arrange
      const productId = 1;
      const newImageUrl = 'https://example.com/new-image.jpg';
      const dbError = new Error('Database error');
      (mockPrisma.product.update as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(productService.updateProductImage(productId, newImageUrl))
        .rejects.toThrow('Database error');
    });
  });
});

