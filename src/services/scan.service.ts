import { PrismaClient } from '@prisma/client';
import productService from './product.service';
import aiService, { AIEvaluation } from './ai.service';
import scanLimitService from './scan-limit.service';
import cloudinaryService from './cloudinary.service';
import { formatDateInTimeZone, getDefaultTimeZone } from '../utils/time.util';

const prisma = new PrismaClient();

export interface ScanResult {
  id: number;
  userId: number;
  productId: number;
  scanDate: Date;
  scanDateLocal?: string;
  riskLevel: string;
  riskExplanation: string | null;
  matchedAllergens: string | null;
  isSaved: boolean;
  listType?: 'RED' | 'GREEN' | null;
  product: {
    id: number;
    barcode: string;
    name: string;
    imageUrl: string;
    ingredients: string;
  };
  scanLimit?: {
    remainingScans: number;
    dailyLimit: number;
  };
}

export class ScanService {
  /**
   * Memproses scan barcode produk
   */
  async processBarcodeScan(barcode: string, userId: number): Promise<ScanResult> {
    try {
      // 1. Check daily scan limit
      const canScan = await scanLimitService.canUserScanToday(userId);
      if (!canScan.canScan) {
        throw new Error(`Daily scan limit exceeded. You have used ${canScan.dailyLimit} scans today. Upgrade your plan for more scans.`);
      }

      // 2. Cari atau buat produk berdasarkan barcode
      const product = await productService.findOrCreateProductByBarcode(barcode);

      // 3. Ambil daftar alergi pengguna dari database
      const userAllergies = await this.getUserAllergies(userId);

      // 4. Analisis bahan menggunakan AI
      const aiAnalysis = await aiService.analyzeIngredientsWithContext(
        product.ingredients,
        userAllergies,
        {
          productName: product.name,
          brand: '', 
        }
      );

      // 5. Simpan hasil scan ke database
      const scanResult = await prisma.product_scan.create({
        data: {
          user_id: userId,
          product_id: product.id,
          scan_date: new Date(),
          risk_level: aiAnalysis.riskLevel,
          risk_explanation: aiAnalysis.reasoning,
          matched_allergens: aiAnalysis.matchedAllergens.length > 0 
            ? aiAnalysis.matchedAllergens.join(', ') 
            : null,
          is_saved: false, 
        },
        include: {
          product: true,
        }
      });

      // 6. Increment daily scan usage
      await scanLimitService.incrementDailyScanUsage(userId);

      // 7. Get updated scan limit info
      const updatedLimitInfo = await scanLimitService.getUserDailyScanLimit(userId);

      // 8. Transform dan return hasil
      const result = this.transformScanResult(scanResult);
      result.scanLimit = {
        remainingScans: updatedLimitInfo.remainingScans,
        dailyLimit: updatedLimitInfo.dailyLimit
      };

      return result;

    } catch (error) {
      console.error('Error in processBarcodeScan:', error);
      
      if (error instanceof Error) {
        throw new Error(`Barcode scan failed: ${error.message}`);
      }
      
      throw new Error('Unknown error occurred during barcode scan');
    }
  }

  /**
   * Memproses scan gambar produk (OCR fallback)
   */
  async processImageScan(
    imageUrl: string, 
    userId: number, 
    productId?: number
  ): Promise<ScanResult> {
    try {
      // 1. Check daily scan limit
      const canScan = await scanLimitService.canUserScanToday(userId);
      if (!canScan.canScan) {
        throw new Error(`Daily scan limit exceeded. You have used ${canScan.dailyLimit} scans today. Upgrade your plan for more scans.`);
      }

      // 2. Ambil daftar alergi pengguna
      const userAllergies = await this.getUserAllergies(userId);

      // 3. Analisis gambar menggunakan AI
      const aiAnalysis = await aiService.analyzeProductImage(imageUrl, userAllergies);

      // 4. Tentukan produk yang akan digunakan
      let product;
      if (productId) {
        // Jika productId disediakan, gunakan produk yang sudah ada
        product = await productService.findProductById(productId);
      } else {
        // Jika tidak ada productId, buat produk baru dengan data minimal
        product = await productService.createMinimalProduct(imageUrl);
      }

      // 5. Simpan hasil scan ke database
      const scanResult = await prisma.product_scan.create({
        data: {
          user_id: userId,
          product_id: product.id,
          scan_date: new Date(),
          risk_level: aiAnalysis.riskLevel,
          risk_explanation: aiAnalysis.reasoning,
          matched_allergens: aiAnalysis.matchedAllergens.length > 0 
            ? aiAnalysis.matchedAllergens.join(', ') 
            : null,
          is_saved: false,
        },
        include: {
          product: true,
        }
      });

      // 6. Increment daily scan usage
      await scanLimitService.incrementDailyScanUsage(userId);

      // 7. Get updated scan limit info
      const updatedLimitInfo = await scanLimitService.getUserDailyScanLimit(userId);

      // 8. Transform dan return hasil
      const result = this.transformScanResult(scanResult);
      result.scanLimit = {
        remainingScans: updatedLimitInfo.remainingScans,
        dailyLimit: updatedLimitInfo.dailyLimit
      };

      return result;

    } catch (error) {
      console.error('Error in processImageScan:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while processing image scan');
    }
  }

  /**
   * Menyimpan hasil scan (toggle save status)
   */
  async toggleSaveScan(scanId: number, userId: number): Promise<ScanResult> {
    try {
      // Verify ownership
      const existingScan = await prisma.product_scan.findFirst({
        where: {
          id: scanId,
          user_id: userId,
        }
      });

      if (!existingScan) {
        throw new Error('Scan not found or access denied');
      }

      // Toggle save status
      const updatedScan = await prisma.product_scan.update({
        where: { id: scanId },
        data: { is_saved: !existingScan.is_saved },
        include: {
          product: true,
        }
      });

      return this.transformScanResult(updatedScan);

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while toggling scan save status');
    }
  }

  /**
   * Mendapatkan riwayat scan pengguna
   */
  async getUserScanHistory(
    userId: number, 
    options: {
      limit?: number;
      offset?: number;
      savedOnly?: boolean;
      uniqueByProduct?: boolean;
      listType?: 'RED' | 'GREEN';
    } = {}
  ): Promise<ScanResult[]> {
    try {
      const { limit = 20, offset = 0, savedOnly = false, uniqueByProduct = false, listType } = options;

      if (uniqueByProduct) {
        const recentScans = await prisma.product_scan.findMany({
          where: {
            user_id: userId,
            ...(savedOnly && { is_saved: true }),
          },
          include: { product: true },
          orderBy: { scan_date: 'desc' },
          take: 500,
        });

        const seen = new Set<number>();
        const latestPerProduct: typeof recentScans = [] as any;
        for (const s of recentScans) {
          if (!seen.has(s.product_id)) {
            seen.add(s.product_id);
            latestPerProduct.push(s);
          }
          if (latestPerProduct.length >= limit + offset) break;
        }

        const paged = latestPerProduct.slice(offset, offset + limit);
        const enriched = await this.attachListTypes(userId, paged);
        const mapped = enriched
          .filter(s => this.filterByListType(s, listType))
          .map(scan => this.transformScanResult(scan));
        return mapped;
      }

      const scans = await prisma.product_scan.findMany({
        where: {
          user_id: userId,
          ...(savedOnly && { is_saved: true }),
        },
        include: {
          product: true,
        },
        orderBy: {
          scan_date: 'desc',
        },
        take: limit,
        skip: offset,
      });

      const enriched = await this.attachListTypes(userId, scans);
      const mapped = enriched
        .filter(s => this.filterByListType(s, listType))
        .map(scan => this.transformScanResult(scan));
      return mapped;

    } catch (error) {
      console.error('Error in getUserScanHistory:', error);
      
      if (error instanceof Error) {
        throw new Error(`Failed to get scan history: ${error.message}`);
      }
      
      throw new Error('Unknown error occurred while fetching scan history');
    }
  }

  /**
   * Helper: Mendapatkan daftar alergi pengguna
   */
  private async getUserAllergies(userId: number): Promise<string[]> {
    try {
      // Jika bypass auth aktif, return hardcoded allergens
      if (process.env.BYPASS_AUTH === 'true') {
        const hardcodedAllergens = process.env.HARDCODED_ALLERGENS 
          ? process.env.HARDCODED_ALLERGENS.split(',').map(a => a.trim())
          : ['gluten', 'lactose', 'nuts', 'shellfish', 'eggs'];
        
        console.log('🔓 Using hardcoded allergens:', hardcodedAllergens);
        return hardcodedAllergens;
      }

      // Normal flow: query database
      const userAllergies = await prisma.user_allergen.findMany({
        where: { user_id: userId },
        include: {
          allergen: true,
        }
      });

      return userAllergies.map(ua => ua.allergen.name);

    } catch (error) {
      console.error('Error fetching user allergies:', error);
      // Return empty array if error, so scan can continue
      return [];
    }
  }

  /**
   * Memproses upload gambar produk untuk analisis alergi
   */
  async processImageUpload(
    imageBuffer: Buffer,
    userId: number,
    productName?: string
  ): Promise<ScanResult> {
    try {
      // 1. Check daily scan limit
      const canScan = await scanLimitService.canUserScanToday(userId);
      if (!canScan.canScan) {
        throw new Error(`Daily scan limit exceeded. You have used ${canScan.dailyLimit} scans today. Upgrade your plan for more scans.`);
      }

      // 2. Upload image to Cloudinary
      if (!cloudinaryService.isConfigured()) {
        throw new Error('Cloudinary service is not configured. Please check environment variables.');
      }

      const uploadResult = await cloudinaryService.uploadImage(imageBuffer, {
        folder: 'allertify/products',
        tags: ['product-scan', 'allergen-analysis']
      });

      // 3. Ambil daftar alergi pengguna dari database
      const userAllergies = await this.getUserAllergies(userId);

      // 4. Analisis gambar menggunakan AI Vision
      const aiAnalysis = await aiService.analyzeUploadedImage(
        uploadResult.secureUrl,
        userAllergies
      );

      // 5. Buat atau update produk berdasarkan analisis gambar
      let product;
      
      // Extract product info dari AI analysis jika tersedia
      const productInfo = this.extractProductInfoFromAI(aiAnalysis);
      
      if (productName) {
        // Jika ada nama produk, cari atau buat produk dengan data AI
        const options: any = { imageUrl: uploadResult.secureUrl };
        if (productInfo.ingredients) options.ingredients = productInfo.ingredients;
        if (productInfo.barcode) options.barcode = productInfo.barcode;
        
        product = await productService.findOrCreateProductByName(productName, options);
      } else {
        // Jika tidak ada nama, gunakan nama dari AI atau default
        const productNameFromAI = productInfo.name || 'Product from Image Scan';
        const options: any = { imageUrl: uploadResult.secureUrl };
        if (productInfo.ingredients) options.ingredients = productInfo.ingredients;
        if (productInfo.barcode) options.barcode = productInfo.barcode;
        
        product = await productService.findOrCreateProductByName(productNameFromAI, options);
      }

      // 6. Simpan hasil scan ke database
      const scanResult = await prisma.product_scan.create({
        data: {
          user_id: userId,
          product_id: product.id,
          scan_date: new Date(),
          risk_level: aiAnalysis.riskLevel,
          risk_explanation: aiAnalysis.reasoning,
          matched_allergens: aiAnalysis.matchedAllergens.length > 0 
            ? aiAnalysis.matchedAllergens.join(', ') 
            : null,
          is_saved: false,
        },
        include: {
          product: true,
        }
      });

      // 7. Increment daily scan usage
      await scanLimitService.incrementDailyScanUsage(userId);

      // 8. Get updated scan limit info
      const updatedLimitInfo = await scanLimitService.getUserDailyScanLimit(userId);

      // 9. Transform dan return hasil
      const result = this.transformScanResult(scanResult);
      result.scanLimit = {
        remainingScans: updatedLimitInfo.remainingScans,
        dailyLimit: updatedLimitInfo.dailyLimit
      };

      return result;

    } catch (error) {
      console.error('Error in processImageUpload:', error);
      
      if (error instanceof Error) {
        throw new Error(`Image upload scan failed: ${error.message}`);
      }
      
      throw new Error('Unknown error occurred during image upload scan');
    }
  }

  /**
   * Helper: Extract product info dari AI analysis
   */
  private extractProductInfoFromAI(aiAnalysis: any) {
    // TODO: Implement AI response parsing untuk extract product info
 
    return {
      name: undefined,
      ingredients: undefined,
      barcode: undefined
    };
  }

  /**
   * Helper: Transform database result ke format yang konsisten
   */
  private transformScanResult(scanData: any): ScanResult {
    const timeZone = getDefaultTimeZone();
    const scanDateLocal = formatDateInTimeZone(new Date(scanData.scan_date), timeZone);

    return {
      id: scanData.id,
      userId: scanData.user_id,
      productId: scanData.product_id,
      scanDate: scanData.scan_date,
      riskLevel: scanData.risk_level,
      riskExplanation: scanData.risk_explanation,
      matchedAllergens: scanData.matched_allergens,
      isSaved: scanData.is_saved,
      listType: (scanData as any).listType ?? null,
      product: {
        id: scanData.product.id,
        barcode: scanData.product.barcode,
        name: scanData.product.name,
        imageUrl: scanData.product.image_url,
        ingredients: scanData.product.ingredients,
      },
      // expose local time computed on server for clients that want it
      ...(scanDateLocal ? { scanDateLocal } : {}),
    };
  }

  // Attach user-specific list types (batch) to an array of product_scan rows
  private async attachListTypes(userId: number, scans: any[]): Promise<any[]> {
    if (scans.length === 0) return scans;
    const productIds = Array.from(new Set(scans.map(s => s.product_id)));
    const prefs = await prisma.user_product_preference.findMany({
      where: { user_id: userId, product_id: { in: productIds } },
      select: { product_id: true, list_type: true },
    });
    const map = new Map<number, 'RED' | 'GREEN'>();
    for (const p of prefs) map.set(p.product_id, p.list_type as 'RED' | 'GREEN');
    return scans.map(s => ({ ...s, listType: map.get(s.product_id) ?? null }));
  }

  private filterByListType(row: any, listType?: 'RED' | 'GREEN'): boolean {
    if (!listType) return true;
    return (row.listType ?? null) === listType;
  }
}

export default new ScanService();


