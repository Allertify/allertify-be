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
   * Ambil detail produk + statistik scan dan recent scans
   */
  async getProductDetailWithStats(productId: number) {
    const product = await this.findProductById(productId);

    const scanStats = await prisma.product_scan.aggregate({
      where: { product_id: productId },
      _count: { id: true }
    });

    const riskDistribution = await prisma.product_scan.groupBy({
      by: ['risk_level'],
      where: { product_id: productId },
      _count: { id: true }
    });

    const recentScans = await prisma.product_scan.findMany({
      where: { product_id: productId },
      include: {
        user: {
          select: { id: true, full_name: true }
        }
      },
      orderBy: { scan_date: 'desc' },
      take: 10
    });

    return {
      product,
      statistics: {
        total_scans: scanStats._count?.id || 0,
        risk_distribution: riskDistribution.map((item: any) => ({
          risk_level: item.risk_level,
          count: item._count.id
        }))
      },
      recent_scans: recentScans.map((scan: any) => ({
        id: scan.id,
        scan_date: scan.scan_date,
        risk_level: scan.risk_level,
        risk_explanation: scan.risk_explanation,
        user: { id: scan.user.id, name: scan.user.full_name }
      }))
    };
  }

  /**
   * Cari produk dan kembalikan list + pagination
   */
  async searchProducts(query: string | undefined, limit: number, offset: number) {
    let products: any[] = [];
    let total = 0;

    if (query) {
      const whereClause = {
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } },
          { barcode: { contains: query, mode: 'insensitive' as const } }
        ]
      };

      products = await prisma.product.findMany({
        where: whereClause,
        include: { _count: { select: { product_scans: true } } },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset
      });

      total = await prisma.product.count({ where: whereClause });
    } else {
      products = await prisma.product.findMany({
        include: { _count: { select: { product_scans: true } } },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset
      });

      total = await prisma.product.count();
    }

    return {
      products: products.map(p => ({
        id: p.id,
        barcode: p.barcode,
        name: p.name,
        image_url: p.image_url,
        nutritional_score: p.nutritional_score,
        scan_count: p._count.product_scans,
        updated_at: p.updatedAt
      })),
      pagination: { limit, offset, total }
    };
  }

  /**
   * Buat report produk oleh user, mencegah duplikasi
   */
  async reportProduct(userId: number, productId: number, reportDetails: string) {
    await this.findProductById(productId);

    const existing = await prisma.product_report.findFirst({
      where: { user_id: userId, product_id: productId, status: 'PENDING' }
    });
    if (existing) {
      throw new Error('You have already reported this product');
    }

    const report = await prisma.product_report.create({
      data: {
        user_id: userId,
        product_id: productId,
        report_details: reportDetails,
        status: 'PENDING'
      },
      include: {
        product: { select: { id: true, name: true, barcode: true } }
      }
    });

    return {
      report_id: report.id,
      product: report.product,
      report_details: report.report_details,
      status: report.status,
      created_at: report.createdAt
    };
  }

  /**
   * Ambil report milik user + pagination
   */
  async getUserReports(userId: number, limit: number, offset: number) {
    const reports = await prisma.product_report.findMany({
      where: { user_id: userId },
      include: {
        product: { select: { id: true, name: true, barcode: true, image_url: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.product_report.count({ where: { user_id: userId } });

    return {
      reports: reports.map(r => ({
        id: r.id,
        product: r.product,
        report_details: r.report_details,
        status: r.status,
        created_at: r.createdAt
      })),
      pagination: { limit, offset, total }
    };
  }

  /**
   * Ambil produk populer berdasar jumlah scan
   */
  async getPopularProducts(limit: number) {
    const popular = await prisma.product.findMany({
      include: { _count: { select: { product_scans: true } } },
      orderBy: { product_scans: { _count: 'desc' } },
      take: limit
    });

    return {
      products: popular.map(p => ({
        id: p.id,
        barcode: p.barcode,
        name: p.name,
        image_url: p.image_url,
        nutritional_score: p.nutritional_score,
        scan_count: p._count.product_scans
      }))
    };
  }
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
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
        {
          timeout: 10000, 
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
      console.log(
        productData
      )

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

  /**
   * Buat produk minimal untuk image scan
   */
  async createMinimalProduct(imageUrl: string) {
    try {
      const product = await prisma.product.create({
        data: {
          barcode: `IMG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
          name: 'Product from Image Scan',
          image_url: imageUrl,
          nutritional_score: 'N/A',
          ingredients: 'Extracted from image', 
        }
      });

      return product;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while creating minimal product');
    }
  }

  /**
   * Mencari atau buat produk berdasarkan nama
   */
  async findOrCreateProductByName(
    name: string, 
    options?: {
      ingredients?: string;
      barcode?: string;
      imageUrl?: string;
    }
  ) {
    try {
      // Coba cari produk dengan nama yang sama
      const existingProduct = await prisma.product.findFirst({
        where: { 
          name: {
            contains: name,
            mode: 'insensitive'
          }
        }
      });

      if (existingProduct) {
        // Update existing product jika ada data baru
        if (options?.ingredients && existingProduct.ingredients === 'Product created from name') {
          await this.updateProduct(existingProduct.id, { ingredients: options.ingredients });
          existingProduct.ingredients = options.ingredients;
        }
        if (options?.imageUrl && !existingProduct.image_url) {
          await this.updateProductImage(existingProduct.id, options.imageUrl);
          existingProduct.image_url = options.imageUrl;
        }
        return existingProduct;
      }

      // Jika tidak ada, buat produk baru dengan data yang lebih baik
      const product = await prisma.product.create({
        data: {
          barcode: options?.barcode || `NAME_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: name,
          image_url: options?.imageUrl || '',
          nutritional_score: 'N/A',
          ingredients: options?.ingredients || 'Product created from name',
        }
      });

      return product;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while finding or creating product by name');
    }
  }

  /**
   * Update image URL produk
   */
  async updateProductImage(id: number, imageUrl: string) {
    try {
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: { image_url: imageUrl }
      });

      return updatedProduct;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while updating product image');
    }
  }
}

export default new ProductService();
