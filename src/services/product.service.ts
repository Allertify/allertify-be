import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface OpenFoodFactsResponse {
  status: number;
  status_verbose: string;
  product?: {
    product_name?: string;
    brands?: string;
    image_url?: string;
    ingredients_text?: string;
    nutriments?: {
      'nutrition-score-fr'?: number;
    };
  };
}

export class ProductService {
  /**
   * Mencari produk berdasarkan barcode di database lokal,
   * jika tidak ada maka fetch dari Open Food Facts API
   */
  async findOrCreateProductByBarcode(barcode: string) {
    try {
      // 1. Coba cari produk di database lokal
      const existingProduct = await prisma.product.findUnique({
        where: { barcode }
      });

      if (existingProduct) {
        return existingProduct;
      }

      // 2. Jika tidak ditemukan, panggil Open Food Facts API
      const response = await axios.get<OpenFoodFactsResponse>(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        {
          timeout: 10000, // 10 second timeout
          headers: {
            'User-Agent': 'Allertify/1.0.0 (https://allertify.com)'
          }
        }
      );

      // 3. Validasi respons API
      if (response.data.status !== 1 || !response.data.product) {
        throw new Error(`Product with barcode ${barcode} not found in Open Food Facts`);
      }

      const productData = response.data.product;

      // 4. Ekstrak data yang relevan
      const productName = productData.product_name || 'Unknown Product';
      const brand = productData.brands || '';
      const imageUrl = productData.image_url || '';
      const ingredients = productData.ingredients_text || '';
      const nutritionalScore = productData.nutriments?.['nutrition-score-fr']?.toString() || 'N/A';

      // 5. Buat entri baru di database
      const newProduct = await prisma.product.create({
        data: {
          barcode,
          name: productName,
          image_url: imageUrl,
          nutritional_score: nutritionalScore,
          ingredients: ingredients
        }
      });

      return newProduct;

    } catch (error: unknown) {
      // Enhanced error handling
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Product with barcode ${barcode} not found in Open Food Facts database`);
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request to Open Food Facts API timed out');
        }
        throw new Error(`Open Food Facts API error: ${error.message}`);
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Unknown error occurred while fetching product data');
    }
  }

  /**
   * Mencari produk berdasarkan ID
   */
  async findProductById(id: number) {
    try {
      const product = await prisma.product.findUnique({
        where: { id }
      });

      if (!product) {
        throw new Error(`Product with ID ${id} not found`);
      }

      return product;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while fetching product');
    }
  }

  /**
   * Update produk (untuk refresh data dari Open Food Facts)
   */
  async updateProduct(id: number, data: Partial<{
    name: string;
    image_url: string;
    nutritional_score: string;
    ingredients: string;
  }>) {
    try {
      const updatedProduct = await prisma.product.update({
        where: { id },
        data
      });

      return updatedProduct;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while updating product');
    }
  }
}

export default new ProductService();
