import { Request, Response, NextFunction } from 'express';
import scanService from '../services/scan.service';
import scanLimitService from '../services/scan-limit.service';
import { prisma } from '../index';
import Joi from 'joi';
import { sendSuccess, sendError } from '../utils/response';
import { validateRequest } from '../utils/validation';
import { logger } from '../utils/logger';

// Extend Express Request interface untuk user data dari auth middleware
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

// Validation schemas
const barcodeParamSchema = Joi.object({
  barcode: Joi.string()
    .pattern(/^[0-9]{8,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Barcode must be 8-14 digits',
      'any.required': 'Barcode is required'
    })
});

const imageScanSchema = Joi.object({
  imageUrl: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'Must be a valid URL',
      'any.required': 'Image URL is required'
    }),
  productId: Joi.number()
    .integer()
    .positive()
    .optional()
});

const scanHistoryQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  savedOnly: Joi.boolean().default(false),
  uniqueByProduct: Joi.boolean().default(false),
  listType: Joi.string().valid('RED', 'GREEN').optional(),
});

export class ScanController {
  /**
   * POST /scans/barcode/:barcode
   * Scan produk berdasarkan barcode
   */
  scanBarcode = async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    logger.info(`[SCAN_BARCODE] Request started`, {
      requestId,
      method: req.method,
      url: req.url,
      path: req.path,
      params: req.params,
      query: req.query,
      userAgent: req.headers['user-agent'],
      contentType: req.headers['content-type'],
      hasAuth: !!req.headers.authorization
    });

    try {
      // Validasi parameter
      const validation = validateRequest(barcodeParamSchema, req.params);
      if (!validation.isValid) {
        logger.warn(`[SCAN_BARCODE] Validation error`, { requestId, errors: validation.errors });
        return sendError(res, 'Validation error', 400, { errors: validation.errors ?? [] });
      }

      // Pastikan user sudah login
      if (!req.user?.userId) {
        logger.warn(`[SCAN_BARCODE] Authentication failed`, { requestId });
        return sendError(res, 'Authentication required', 401);
      }

      const { barcode } = validation.value!;
      const userId = parseInt(req.user.userId);

      logger.info(`[SCAN_BARCODE] Processing scan`, {
        requestId,
        barcode,
        userId,
        userEmail: req.user.email,
        userRole: req.user.role
      });

      // Proses scan barcode
      const scanResult = await scanService.processBarcodeScan(barcode, userId);
      
      const responseTime = Date.now() - startTime;
      logger.info(`[SCAN_BARCODE] Request completed successfully`, {
        requestId,
        responseTime,
        hasResult: !!scanResult
      });

      return sendSuccess(res, scanResult, 'Barcode scan completed successfully');

    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error(`[SCAN_BARCODE] Error occurred`, {
        requestId,
        responseTime,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        requestInfo: {
          method: req.method,
          url: req.url,
          params: req.params,
          userId: req.user?.userId
        }
      });
      next(error);
    }
  };

  /**
   * POST /scans/image
   * Scan produk berdasarkan gambar (OCR fallback)
   */
  scanImage = async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    logger.info(`[SCAN_IMAGE] Request started`, {
      requestId,
      method: req.method,
      url: req.url,
      body: req.body,
      userAgent: req.headers['user-agent'],
      contentType: req.headers['content-type'],
      hasAuth: !!req.headers.authorization
    });

    try {
      // Validasi body request
      const validation = validateRequest(imageScanSchema, req.body);
      if (!validation.isValid) {
        logger.warn(`[SCAN_IMAGE] Validation error`, { requestId, errors: validation.errors });
        return sendError(res, 'Validation error', 400, { errors: validation.errors ?? [] });
      }

      // Pastikan user sudah login
      if (!req.user?.userId) {
        logger.warn(`[SCAN_IMAGE] Authentication failed`, { requestId });
        return sendError(res, 'Authentication required', 401);
      }

      const { imageUrl, productId } = validation.value!;
      const userId = parseInt(req.user.userId);

      logger.info(`[SCAN_IMAGE] Processing scan`, {
        requestId,
        imageUrl,
        productId,
        userId,
        userEmail: req.user.email,
        userRole: req.user.role
      });

      // Proses scan gambar
      const scanResult = await scanService.processImageScan(imageUrl, userId, productId);
      
      const responseTime = Date.now() - startTime;
      logger.info(`[SCAN_IMAGE] Request completed successfully`, {
        requestId,
        responseTime,
        hasResult: !!scanResult
      });

      return sendSuccess(res, scanResult, 'Image scan completed successfully');

    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error(`[SCAN_IMAGE] Error occurred`, {
        requestId,
        responseTime,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        requestInfo: {
          method: req.method,
          url: req.url,
          body: req.body,
          userId: req.user?.userId
        }
      });
      next(error);
    }
  };

  /**
   * PUT /scans/:scanId/save
   * Toggle save status untuk hasil scan
   */
  toggleSaveScan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scanIdParam = req.params.scanId;
      
      if (!scanIdParam) {
        return sendError(res, 'Scan ID is required', 400);
      }
      
      const scanId = parseInt(scanIdParam);
      
      if (isNaN(scanId)) {
        return sendError(res, 'Invalid scan ID', 400);
      }

      // Pastikan user sudah login
      if (!req.user?.userId) {
        return sendError(res, 'Authentication required', 401);
      }

      const userId = parseInt(req.user.userId);

      // Toggle save status
      const updatedScan = await scanService.toggleSaveScan(scanId, userId);

      return sendSuccess(res, updatedScan, `Scan ${updatedScan.isSaved ? 'saved' : 'unsaved'} successfully`);

    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /scans/list
   * Set or remove product list classification (RED/GREEN)
   * Body: { productId: number, listType?: 'RED' | 'GREEN' } // if listType omitted/null -> remove
   */
  setProductList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.userId) {
        return sendError(res, 'Authentication required', 401);
      }
      const userId = parseInt(req.user.userId);

      const { productId, listType } = req.body as { productId?: number; listType?: 'RED' | 'GREEN' };
      if (!productId || typeof productId !== 'number') {
        return sendError(res, 'productId is required and must be a number', 400);
      }
      if (listType && !['RED', 'GREEN'].includes(listType)) {
        return sendError(res, 'listType must be RED or GREEN', 400);
      }

      if (!listType) {
        // remove preference
        await prisma.user_product_preference.deleteMany({ 
          where: { user_id: userId, product_id: productId } 
        });
        return sendSuccess(res, null, 'Preference removed');
      }

      if (!['RED', 'GREEN'].includes(listType)) {
        return sendError(res, 'listType must be RED or GREEN', 400);
      }

      // upsert preference
      await prisma.user_product_preference.upsert({
        where: { user_id_product_id: { user_id: userId, product_id: productId } },
        update: { list_type: listType },
        create: { user_id: userId, product_id: productId, list_type: listType },
      });

      return sendSuccess(res, { productId, listType }, 'Preference updated');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /scans/history
   * Mendapatkan riwayat scan pengguna
   */
  getScanHistory = async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    logger.info(`[SCAN_HISTORY] Request started`, {
      requestId,
      method: req.method,
      url: req.url,
      query: req.query,
      userAgent: req.headers['user-agent'],
      hasAuth: !!req.headers.authorization
    });

    try {
      // Validasi query parameters
      const validation = validateRequest(scanHistoryQuerySchema, req.query);
      if (!validation.isValid) {
        logger.warn(`[SCAN_HISTORY] Validation error`, { requestId, errors: validation.errors });
        return sendError(res, 'Validation error', 400, { errors: validation.errors ?? [] });
      }

      // Pastikan user sudah login
      if (!req.user?.userId) {
        logger.warn(`[SCAN_HISTORY] Authentication failed`, { requestId });
        return sendError(res, 'Authentication required', 401);
      }

      const userId = parseInt(req.user.userId);
      const { limit, offset, savedOnly, uniqueByProduct, listType } = validation.value!;

      logger.info(`[SCAN_HISTORY] Processing request`, {
        requestId,
        userId,
        limit,
        offset,
        savedOnly,
        userEmail: req.user.email,
        userRole: req.user.role
      });

      // Ambil riwayat scan
      const scanHistoryResult = await scanService.getUserScanHistory(userId, {
        limit,
        offset,
        savedOnly,
        uniqueByProduct,
        listType,
      });
      
      const responseTime = Date.now() - startTime;
      logger.info(`[SCAN_HISTORY] Request completed successfully`, {
        requestId,
        responseTime,
        resultCount: scanHistoryResult.scans.length,
        total: scanHistoryResult.total
      });

      return sendSuccess(res, {
        scans: scanHistoryResult.scans,
        pagination: {
          limit,
          offset,
          total: scanHistoryResult.total
        }
      }, 'Scan history retrieved successfully');

    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error(`[SCAN_HISTORY] Error occurred`, {
        requestId,
        responseTime,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        requestInfo: {
          method: req.method,
          url: req.url,
          query: req.query,
          userId: req.user?.userId
        }
      });
      next(error);
    }
  };

  /**
   * GET /scans/saved
   * Shortcut untuk mendapatkan scan yang disimpan
   */
  getSavedScans = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Pastikan user sudah login
      if (!req.user?.userId) {
        return sendError(res, 'Authentication required', 401);
      }

      const userId = parseInt(req.user.userId);
      const { limit = 20, offset = 0 } = req.query;

      // Langsung panggil service dengan parameter yang tepat
      const savedScansResult = await scanService.getUserScanHistory(userId, {
        limit: Number(limit),
        offset: Number(offset),
        savedOnly: true,
        uniqueByProduct: true,
      });

      return sendSuccess(res, {
        scans: savedScansResult.scans,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: savedScansResult.total
        }
      }, 'Saved scans retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /scans/upload
   * Upload dan scan gambar produk untuk analisis alergi
   */
  uploadAndScanImage = async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    logger.info(`[UPLOAD_SCAN] Request started`, {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      contentType: req.headers['content-type'],
      hasAuth: !!req.headers.authorization
    });

    try {
      // Pastikan user sudah login
      if (!req.user?.userId) {
        logger.warn(`[UPLOAD_SCAN] Authentication failed`, { requestId });
        return sendError(res, 'Authentication required', 401);
      }

      // Validasi file upload
      if (!req.file) {
        logger.warn(`[UPLOAD_SCAN] No image file uploaded`, { requestId });
        return sendError(res, 'Image file is required', 400);
      }

      // Validasi file type
      if (!req.file.mimetype.startsWith('image/')) {
        logger.warn(`[UPLOAD_SCAN] Invalid file type`, { requestId, mimetype: req.file.mimetype });
        return sendError(res, 'Only image files are allowed', 400);
      }

      const userId = parseInt(req.user.userId);
      const productName = req.body.productName || undefined;

      logger.info(`[UPLOAD_SCAN] Processing upload`, {
        requestId,
        userId,
        userEmail: req.user.email,
        userRole: req.user.role,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        productName
      });

      // Proses upload dan scan
      const scanResult = await scanService.processImageUpload(
        req.file.buffer,
        userId,
        productName
      );
      
      const responseTime = Date.now() - startTime;
      logger.info(`[UPLOAD_SCAN] Request completed successfully`, {
        requestId,
        responseTime,
        scanResult: {
          id: scanResult.id,
          productId: scanResult.productId,
          riskLevel: scanResult.riskLevel,
          matchedAllergens: scanResult.matchedAllergens
        }
      });

      return sendSuccess(res, scanResult, 'Image uploaded and analyzed successfully');

    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error(`[UPLOAD_SCAN] Error occurred`, {
        requestId,
        responseTime,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        requestInfo: {
          method: req.method,
          url: req.url,
          userId: req.user?.userId,
          fileName: req.file?.originalname
        }
      });
      next(error);
    }
  };

  /**
   * GET /scans/limit
   * Mendapatkan informasi daily scan limit pengguna
   */
  getUserScanLimit = async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    logger.info(`[SCAN_LIMIT] Request started`, {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      hasAuth: !!req.headers.authorization
    });

    try {
      // Pastikan user sudah login
      if (!req.user?.userId) {
        logger.warn(`[SCAN_LIMIT] Authentication failed`, { requestId });
        return sendError(res, 'Authentication required', 401);
      }

      const userId = parseInt(req.user.userId);

      logger.info(`[SCAN_LIMIT] Processing request`, {
        requestId,
        userId,
        userEmail: req.user.email,
        userRole: req.user.role
      });

      // Ambil informasi scan limit
      const limitInfo = await scanLimitService.getUserDailyScanLimit(userId);
      
      const responseTime = Date.now() - startTime;
      logger.info(`[SCAN_LIMIT] Request completed successfully`, {
        requestId,
        responseTime,
        limitInfo: {
          userId: limitInfo.userId,
          currentUsage: limitInfo.currentUsage,
          dailyLimit: limitInfo.dailyLimit,
          remainingScans: limitInfo.remainingScans
        }
      });

      return sendSuccess(res, {
        userId: limitInfo.userId,
        currentUsage: limitInfo.currentUsage,
        dailyLimit: limitInfo.dailyLimit,
        remainingScans: limitInfo.remainingScans,
        isLimitExceeded: limitInfo.isLimitExceeded,
        canScan: !limitInfo.isLimitExceeded
      }, 'Scan limit information retrieved successfully');

    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error(`[SCAN_LIMIT] Error occurred`, {
        requestId,
        responseTime,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        requestInfo: {
          method: req.method,
          url: req.url,
          userId: req.user?.userId
        }
      });
      next(error);
    }
  };
}

export default new ScanController();
