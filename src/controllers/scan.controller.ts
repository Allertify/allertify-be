import { Request, Response, NextFunction } from 'express';
import scanService from '../services/scan.service';
import scanLimitService from '../services/scan-limit.service';
import Joi from 'joi';

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
});

export class ScanController {
  /**
   * POST /scans/barcode/:barcode
   * Scan produk berdasarkan barcode
   */
  scanBarcode = async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    console.log(`🔍 [${requestId}] [SCAN_BARCODE] Request started:`, {
      method: req.method,
      url: req.url,
      path: req.path,
      params: req.params,
      query: req.query,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? 'Bearer ***' : 'None'
      },
      timestamp: new Date().toISOString()
    });

    try {
      // Bypass auth untuk development/testing
      if (process.env.BYPASS_AUTH === 'true') {
        console.log(`🔓 [${requestId}] [SCAN_BARCODE] Bypass auth enabled, using hardcoded user`);
        // Set hardcoded user data
        req.user = {
          userId: process.env.HARDCODED_USER_ID || '1',
          email: process.env.HARDCODED_USER_EMAIL || 'test@example.com',
          role: process.env.HARDCODED_USER_ROLE || 'user'
        };
      }

      // Validasi parameter
      const { error: paramError, value: paramValue } = barcodeParamSchema.validate(req.params);
      if (paramError) {
        console.log(`❌ [${requestId}] [SCAN_BARCODE] Validation error:`, paramError.details);
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: paramError.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }

      // Pastikan user sudah login
      if (!req.user?.userId) {
        console.log(`❌ [${requestId}] [SCAN_BARCODE] Authentication failed: No user data`);
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { barcode } = paramValue;
      const userId = parseInt(req.user.userId);

      console.log(`✅ [${requestId}] [SCAN_BARCODE] Validation passed:`, {
        barcode,
        userId,
        userEmail: req.user.email,
        userRole: req.user.role
      });

      // Proses scan barcode
      console.log(`🔄 [${requestId}] [SCAN_BARCODE] Calling scanService.processBarcodeScan...`);
      const scanResult = await scanService.processBarcodeScan(barcode, userId);
      
      console.log(`✅ [${requestId}] [SCAN_BARCODE] Service call successful:`, {
        resultType: typeof scanResult,
        hasData: !!scanResult,
        timestamp: new Date().toISOString()
      });

      const responseTime = Date.now() - startTime;
      console.log(`🎯 [${requestId}] [SCAN_BARCODE] Request completed successfully in ${responseTime}ms`);

      res.status(200).json({
        success: true,
        message: 'Barcode scan completed successfully',
        data: scanResult
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`💥 [${requestId}] [SCAN_BARCODE] Error occurred after ${responseTime}ms:`, {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        requestInfo: {
          method: req.method,
          url: req.url,
          params: req.params,
          userId: req.user?.userId,
          timestamp: new Date().toISOString()
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
    
    console.log(`🖼️ [${requestId}] [SCAN_IMAGE] Request started:`, {
      method: req.method,
      url: req.url,
      path: req.path,
      body: req.body,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? 'Bearer ***' : 'None'
      },
      timestamp: new Date().toISOString()
    });

    try {
      // Bypass auth untuk development/testing
      if (process.env.BYPASS_AUTH === 'true') {
        console.log(`🔓 [${requestId}] [SCAN_IMAGE] Bypass auth enabled, using hardcoded user`);
        // Set hardcoded user data
        req.user = {
          userId: process.env.HARDCODED_USER_ID || '1',
          email: process.env.HARDCODED_USER_EMAIL || 'test@example.com',
          role: process.env.HARDCODED_USER_ROLE || 'user'
        };
      }

      // Validasi body request
      const { error: bodyError, value: bodyValue } = imageScanSchema.validate(req.body);
      if (bodyError) {
        console.log(`❌ [${requestId}] [SCAN_IMAGE] Validation error:`, bodyError.details);
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: bodyError.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }

      // Pastikan user sudah login
      if (!req.user?.userId) {
        console.log(`❌ [${requestId}] [SCAN_IMAGE] Authentication failed: No user data`);
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { imageUrl, productId } = bodyValue;
      const userId = parseInt(req.user.userId);

      console.log(`✅ [${requestId}] [SCAN_IMAGE] Validation passed:`, {
        imageUrl,
        productId,
        userId,
        userEmail: req.user.email,
        userRole: req.user.role
      });

      // Proses scan gambar
      console.log(`🔄 [${requestId}] [SCAN_IMAGE] Calling scanService.processImageScan...`);
      const scanResult = await scanService.processImageScan(imageUrl, userId, productId);
      
      console.log(`✅ [${requestId}] [SCAN_IMAGE] Service call successful:`, {
        resultType: typeof scanResult,
        hasData: !!scanResult,
        timestamp: new Date().toISOString()
      });

      const responseTime = Date.now() - startTime;
      console.log(`🎯 [${requestId}] [SCAN_IMAGE] Request completed successfully in ${responseTime}ms`);

      res.status(200).json({
        success: true,
        message: 'Image scan completed successfully',
        data: scanResult
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`💥 [${requestId}] [SCAN_IMAGE] Error occurred after ${responseTime}ms:`, {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        requestInfo: {
          method: req.method,
          url: req.url,
          body: req.body,
          userId: req.user?.userId,
          timestamp: new Date().toISOString()
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
      // Bypass auth untuk development/testing
      if (process.env.BYPASS_AUTH === 'true') {
        console.log(`🔓 [TOGGLE_SAVE] Bypass auth enabled, using hardcoded user`);
        // Set hardcoded user data
        req.user = {
          userId: process.env.HARDCODED_USER_ID || '1',
          email: process.env.HARDCODED_USER_EMAIL || 'test@example.com',
          role: process.env.HARDCODED_USER_ROLE || 'user'
        };
      }

      const scanIdParam = req.params.scanId;
      
      if (!scanIdParam) {
        return res.status(400).json({
          success: false,
          message: 'Scan ID is required'
        });
      }
      
      const scanId = parseInt(scanIdParam);
      
      if (isNaN(scanId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid scan ID'
        });
      }

      // Pastikan user sudah login
      if (!req.user?.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userId = parseInt(req.user.userId);

      // Toggle save status
      const updatedScan = await scanService.toggleSaveScan(scanId, userId);

      res.status(200).json({
        success: true,
        message: `Scan ${updatedScan.isSaved ? 'saved' : 'unsaved'} successfully`,
        data: updatedScan
      });

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
    
    console.log(`📚 [${requestId}] [SCAN_HISTORY] Request started:`, {
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? 'Bearer ***' : 'None'
      },
      timestamp: new Date().toISOString()
    });

    try {
      // Bypass auth untuk development/testing
      if (process.env.BYPASS_AUTH === 'true') {
        console.log(`🔓 [${requestId}] [SCAN_HISTORY] Bypass auth enabled, using hardcoded user`);
        // Set hardcoded user data
        req.user = {
          userId: process.env.HARDCODED_USER_ID || '1',
          email: process.env.HARDCODED_USER_EMAIL || 'test@example.com',
          role: process.env.HARDCODED_USER_ROLE || 'user'
        };
      }

      // Validasi query parameters
      const { error: queryError, value: queryValue } = scanHistoryQuerySchema.validate(req.query);
      if (queryError) {
        console.log(`❌ [${requestId}] [SCAN_HISTORY] Validation error:`, queryError.details);
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: queryError.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }

      // Pastikan user sudah login
      if (!req.user?.userId) {
        console.log(`❌ [${requestId}] [SCAN_HISTORY] Authentication failed: No user data`);
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userId = parseInt(req.user.userId);
      const { limit, offset, savedOnly, uniqueByProduct } = queryValue;

      console.log(`✅ [${requestId}] [SCAN_HISTORY] Validation passed:`, {
        userId,
        limit,
        offset,
        savedOnly,
        userEmail: req.user.email,
        userRole: req.user.role
      });

      // Ambil riwayat scan
      console.log(`🔄 [${requestId}] [SCAN_HISTORY] Calling scanService.getUserScanHistory...`);
      const scanHistory = await scanService.getUserScanHistory(userId, {
        limit,
        offset,
        savedOnly,
        uniqueByProduct,
      });
      
      console.log(`✅ [${requestId}] [SCAN_HISTORY] Service call successful:`, {
        resultCount: scanHistory.length,
        timestamp: new Date().toISOString()
      });

      const responseTime = Date.now() - startTime;
      console.log(`🎯 [${requestId}] [SCAN_HISTORY] Request completed successfully in ${responseTime}ms`);

      res.status(200).json({
        success: true,
        message: 'Scan history retrieved successfully',
        data: {
          scans: scanHistory,
          pagination: {
            limit,
            offset,
            total: scanHistory.length
          }
        }
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`💥 [${requestId}] [SCAN_HISTORY] Error occurred after ${responseTime}ms:`, {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        requestInfo: {
          method: req.method,
          url: req.url,
          query: req.query,
          userId: req.user?.userId,
          timestamp: new Date().toISOString()
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
      // Set savedOnly = true dan forward ke getScanHistory
      req.query.savedOnly = 'true';
      return await this.getScanHistory(req, res, next);
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
    
    console.log(`📸 [${requestId}] [UPLOAD_SCAN] Request started:`, {
      method: req.method,
      url: req.url,
      path: req.path,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? 'Bearer ***' : 'None'
      },
      timestamp: new Date().toISOString()
    });

    try {
      // Bypass auth untuk development/testing
      if (process.env.BYPASS_AUTH === 'true') {
        console.log(`🔓 [${requestId}] [UPLOAD_SCAN] Bypass auth enabled, using hardcoded user`);
        // Set hardcoded user data
        req.user = {
          userId: process.env.HARDCODED_USER_ID || '1',
          email: process.env.HARDCODED_USER_EMAIL || 'test@example.com',
          role: process.env.HARDCODED_USER_ROLE || 'user'
        };
      }

      // Pastikan user sudah login
      if (!req.user?.userId) {
        console.log(`❌ [${requestId}] [UPLOAD_SCAN] Authentication failed: No user data`);
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Validasi file upload
      if (!req.file) {
        console.log(`❌ [${requestId}] [UPLOAD_SCAN] No image file uploaded`);
        return res.status(400).json({
          success: false,
          message: 'Image file is required'
        });
      }

      // Validasi file type
      if (!req.file.mimetype.startsWith('image/')) {
        console.log(`❌ [${requestId}] [UPLOAD_SCAN] Invalid file type: ${req.file.mimetype}`);
        return res.status(400).json({
          success: false,
          message: 'Only image files are allowed'
        });
      }

      const userId = parseInt(req.user.userId);
      const productName = req.body.productName || undefined;

      console.log(`✅ [${requestId}] [UPLOAD_SCAN] Validation passed:`, {
        userId,
        userEmail: req.user.email,
        userRole: req.user.role,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        productName
      });

      // Proses upload dan scan
      console.log(`🔄 [${requestId}] [UPLOAD_SCAN] Calling scanService.processImageUpload...`);
      const scanResult = await scanService.processImageUpload(
        req.file.buffer,
        userId,
        productName
      );
      
      console.log(`✅ [${requestId}] [UPLOAD_SCAN] Service call successful:`, {
        scanResult: {
          id: scanResult.id,
          productId: scanResult.productId,
          riskLevel: scanResult.riskLevel,
          matchedAllergens: scanResult.matchedAllergens
        },
        timestamp: new Date().toISOString()
      });

      const responseTime = Date.now() - startTime;
      console.log(`🎯 [${requestId}] [UPLOAD_SCAN] Request completed successfully in ${responseTime}ms`);

      res.status(200).json({
        success: true,
        message: 'Image uploaded and analyzed successfully',
        data: scanResult
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`💥 [${requestId}] [UPLOAD_SCAN] Error occurred after ${responseTime}ms:`, {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        requestInfo: {
          method: req.method,
          url: req.url,
          userId: req.user?.userId,
          fileName: req.file?.originalname,
          timestamp: new Date().toISOString()
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
    
    console.log(`📊 [${requestId}] [SCAN_LIMIT] Request started:`, {
      method: req.method,
      url: req.url,
      path: req.path,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? 'Bearer ***' : 'None'
      },
      timestamp: new Date().toISOString()
    });

    try {
      // Bypass auth untuk development/testing
      if (process.env.BYPASS_AUTH === 'true') {
        console.log(`🔓 [${requestId}] [SCAN_LIMIT] Bypass auth enabled, using hardcoded user`);
        // Set hardcoded user data
        req.user = {
          userId: process.env.HARDCODED_USER_ID || '1',
          email: process.env.HARDCODED_USER_EMAIL || 'test@example.com',
          role: process.env.HARDCODED_USER_ROLE || 'user'
        };
      }

      // Pastikan user sudah login
      if (!req.user?.userId) {
        console.log(`❌ [${requestId}] [SCAN_LIMIT] Authentication failed: No user data`);
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userId = parseInt(req.user.userId);

      console.log(`✅ [${requestId}] [SCAN_LIMIT] Validation passed:`, {
        userId,
        userEmail: req.user.email,
        userRole: req.user.role
      });

      // Ambil informasi scan limit
      console.log(`🔄 [${requestId}] [SCAN_LIMIT] Calling scanLimitService.getUserDailyScanLimit...`);
      const limitInfo = await scanLimitService.getUserDailyScanLimit(userId);
      
      console.log(`✅ [${requestId}] [SCAN_LIMIT] Service call successful:`, {
        limitInfo: {
          userId: limitInfo.userId,
          currentUsage: limitInfo.currentUsage,
          dailyLimit: limitInfo.dailyLimit,
          remainingScans: limitInfo.remainingScans
        },
        timestamp: new Date().toISOString()
      });

      const responseTime = Date.now() - startTime;
      console.log(`🎯 [${requestId}] [SCAN_LIMIT] Request completed successfully in ${responseTime}ms`);

      res.status(200).json({
        success: true,
        message: 'Scan limit information retrieved successfully',
        data: {
          userId: limitInfo.userId,
          currentUsage: limitInfo.currentUsage,
          dailyLimit: limitInfo.dailyLimit,
          remainingScans: limitInfo.remainingScans,
          isLimitExceeded: limitInfo.isLimitExceeded,
          canScan: !limitInfo.isLimitExceeded
        }
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`💥 [${requestId}] [SCAN_LIMIT] Error occurred after ${responseTime}ms:`, {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        requestInfo: {
          method: req.method,
          url: req.url,
          userId: req.user?.userId,
          timestamp: new Date().toISOString()
        }
      });
      next(error);
    }
  };
}

export default new ScanController();
