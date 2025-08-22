import { Request, Response } from 'express';
import asyncHandler from '../middlewares/asyncHandler';
import productService from '../services/product.service';
import { sendSuccess, sendError } from '../utils/response';
import Joi from 'joi';

// Validation schemas
const reportProductSchema = Joi.object({
  report_details: Joi.string().min(10).max(255).required(),
});

const productSearchSchema = Joi.object({
  query: Joi.string().min(1).max(100).optional(),
  limit: Joi.number().integer().min(1).max(50).default(20),
  offset: Joi.number().integer().min(0).default(0),
});

/**
 * GET /api/v1/products/:productId
 * Mendapatkan detail produk berdasarkan ID
 */
export const getProductDetail = asyncHandler(async (req: Request, res: Response) => {
  const productIdParam = req.params.productId;
  
  if (!productIdParam) {
    return sendError(res, 'Product ID is required', 400);
  }
  
  const productId = parseInt(productIdParam);
  
  if (isNaN(productId)) {
    return sendError(res, 'Invalid product ID', 400);
  }

  const detail = await productService.getProductDetailWithStats(productId);
  return sendSuccess(res, detail, 'Product detail retrieved successfully');
});

/**
 * GET /api/v1/products/search
 * Mencari produk berdasarkan nama atau barcode
 */
export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = productSearchSchema.validate(req.query);
  if (error) {
    return sendError(res, 'Validation error', 400, {
      errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
    });
  }

  const { query, limit, offset } = value;
  const result = await productService.searchProducts(query, limit, offset);
  return sendSuccess(res, result, 'Products retrieved successfully');
});

/**
 * POST /api/v1/products/:productId/report
 * Melaporkan produk bermasalah
 */
export const reportProduct = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.user!.userId);
  const productIdParam = req.params.productId;
  
  if (!productIdParam) {
    return sendError(res, 'Product ID is required', 400);
  }
  
  const productId = parseInt(productIdParam);
  
  if (isNaN(productId)) {
    return sendError(res, 'Invalid product ID', 400);
  }

  const { error, value } = reportProductSchema.validate(req.body);
  if (error) {
    return sendError(res, 'Validation error', 400, {
      errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
    });
  }
  const report = await productService.reportProduct(userId, productId, value.report_details);
  return sendSuccess(res, report, 'Product report submitted successfully', 201);
});

/**
 * GET /api/v1/products/reports/my
 * Mendapatkan laporan produk yang dibuat oleh user
 */
export const getUserReports = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.user!.userId);
  
  const { limit = 20, offset = 0 } = req.query;
  const parsedLimit = parseInt(limit as string);
  const parsedOffset = parseInt(offset as string);
  const result = await productService.getUserReports(userId, parsedLimit, parsedOffset);
  return sendSuccess(res, result, 'User reports retrieved successfully');
});

/**
 * GET /api/v1/products/popular
 * Mendapatkan produk populer berdasarkan jumlah scan
 */
export const getPopularProducts = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 10 } = req.query;
  const parsedLimit = parseInt(limit as string);
  const data = await productService.getPopularProducts(parsedLimit);
  return sendSuccess(res, data, 'Popular products retrieved successfully');
});
