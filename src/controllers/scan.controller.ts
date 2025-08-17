import { Request, Response, NextFunction } from 'express';
import scanService from '../services/scan.service';
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
  savedOnly: Joi.boolean().default(false)
});

export class ScanController {
  /**
   * POST /scans/barcode/:barcode
   * Scan produk berdasarkan barcode
   */
  scanBarcode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validasi parameter
      const { error: paramError, value: paramValue } = barcodeParamSchema.validate(req.params);
      if (paramError) {
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
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { barcode } = paramValue;
      const userId = parseInt(req.user.userId);

      // Proses scan barcode
      const scanResult = await scanService.processBarcodeScan(barcode, userId);

      res.status(200).json({
        success: true,
        message: 'Barcode scan completed successfully',
        data: scanResult
      });

    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /scans/image
   * Scan produk berdasarkan gambar (OCR fallback)
   */
  scanImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validasi body request
      const { error: bodyError, value: bodyValue } = imageScanSchema.validate(req.body);
      if (bodyError) {
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
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { imageUrl, productId } = bodyValue;
      const userId = parseInt(req.user.userId);

      // Proses scan gambar
      const scanResult = await scanService.processImageScan(imageUrl, userId, productId);

      res.status(200).json({
        success: true,
        message: 'Image scan completed successfully',
        data: scanResult
      });

    } catch (error) {
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
    try {
      // Validasi query parameters
      const { error: queryError, value: queryValue } = scanHistoryQuerySchema.validate(req.query);
      if (queryError) {
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
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userId = parseInt(req.user.userId);
      const { limit, offset, savedOnly } = queryValue;

      // Ambil riwayat scan
      const scanHistory = await scanService.getUserScanHistory(userId, {
        limit,
        offset,
        savedOnly
      });

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
}

export default new ScanController();
