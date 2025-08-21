import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import asyncHandler from '../middlewares/asyncHandler';
import productService from '../services/product.service';
import Joi from 'joi';
import { sendSuccess, sendError } from '../utils/response';
import { validateRequest } from '../utils/validation';

const prisma = new PrismaClient();

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
    return res.status(400).json({
      success: false,
      message: 'Product ID is required'
    });
  }
  
  const productId = parseInt(productIdParam);
  
  if (isNaN(productId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }

  const product = await productService.findProductById(productId);

  // Get scan statistics for this product
  const scanStats = await prisma.product_scan.aggregate({
    where: { product_id: productId },
    _count: { id: true }
  });

  // Get risk level distribution
  const riskDistribution = await prisma.product_scan.groupBy({
    by: ['risk_level'],
    where: { product_id: productId },
    _count: { id: true }
  });

  // Get recent scans (last 10)
  const recentScans = await prisma.product_scan.findMany({
    where: { product_id: productId },
    include: {
      user: {
        select: {
          id: true,
          full_name: true
        }
      }
    },
    orderBy: { scan_date: 'desc' },
    take: 10
  });

  res.status(200).json({
    success: true,
    message: 'Product detail retrieved successfully',
    data: {
      product,
      statistics: {
        total_scans: scanStats._count?.id || 0,
        risk_distribution: riskDistribution.map(item => ({
          risk_level: item.risk_level,
          count: item._count.id
        }))
      },
      recent_scans: recentScans.map(scan => ({
        id: scan.id,
        scan_date: scan.scan_date,
        risk_level: scan.risk_level,
        risk_explanation: scan.risk_explanation,
        user: {
          id: scan.user.id,
          name: scan.user.full_name
        }
      }))
    }
  });
});

/**
 * GET /api/v1/products/search
 * Mencari produk berdasarkan nama atau barcode
 */
export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = productSearchSchema.validate(req.query);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }

  const { query, limit, offset } = value;

  let products;
  let total;

  if (query) {
    // Search by name or barcode
    const whereClause = {
      OR: [
        {
          name: {
            contains: query,
            mode: 'insensitive' as const
          }
        },
        {
          barcode: {
            contains: query,
            mode: 'insensitive' as const
          }
        }
      ]
    };

    products = await prisma.product.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            product_scans: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset
    });

    total = await prisma.product.count({
      where: whereClause
    });
  } else {
    // Get all products
    products = await prisma.product.findMany({
      include: {
        _count: {
          select: {
            product_scans: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset
    });

    total = await prisma.product.count();
  }

  res.status(200).json({
    success: true,
    message: 'Products retrieved successfully',
    data: {
      products: products.map(product => ({
        id: product.id,
        barcode: product.barcode,
        name: product.name,
        image_url: product.image_url,
        nutritional_score: product.nutritional_score,
        scan_count: product._count.product_scans,
        updated_at: product.updatedAt
      })),
      pagination: {
        limit,
        offset,
        total
      }
    }
  });
});

/**
 * POST /api/v1/products/:productId/report
 * Melaporkan produk bermasalah
 */
export const reportProduct = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.user!.userId);
  const productIdParam = req.params.productId;
  
  if (!productIdParam) {
    return res.status(400).json({
      success: false,
      message: 'Product ID is required'
    });
  }
  
  const productId = parseInt(productIdParam);
  
  if (isNaN(productId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }

  const { error, value } = reportProductSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }

  // Check if product exists
  const product = await productService.findProductById(productId);

  // Check if user already reported this product
  const existingReport = await prisma.product_report.findFirst({
    where: {
      user_id: userId,
      product_id: productId,
      status: 'PENDING'
    }
  });

  if (existingReport) {
    return res.status(409).json({
      success: false,
      message: 'You have already reported this product'
    });
  }

  const report = await prisma.product_report.create({
    data: {
      user_id: userId,
      product_id: productId,
      report_details: value.report_details,
      status: 'PENDING'
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          barcode: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Product report submitted successfully',
    data: {
      report_id: report.id,
      product: report.product,
      report_details: report.report_details,
      status: report.status,
      created_at: report.createdAt
    }
  });
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

  const reports = await prisma.product_report.findMany({
    where: { user_id: userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          barcode: true,
          image_url: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: parsedLimit,
    skip: parsedOffset
  });

  const total = await prisma.product_report.count({
    where: { user_id: userId }
  });

  res.status(200).json({
    success: true,
    message: 'User reports retrieved successfully',
    data: {
      reports: reports.map(report => ({
        id: report.id,
        product: report.product,
        report_details: report.report_details,
        status: report.status,
        created_at: report.createdAt
      })),
      pagination: {
        limit: parsedLimit,
        offset: parsedOffset,
        total
      }
    }
  });
});

/**
 * GET /api/v1/products/popular
 * Mendapatkan produk populer berdasarkan jumlah scan
 */
export const getPopularProducts = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 10 } = req.query;
  const parsedLimit = parseInt(limit as string);

  const popularProducts = await prisma.product.findMany({
    include: {
      _count: {
        select: {
          product_scans: true
        }
      }
    },
    orderBy: {
      product_scans: {
        _count: 'desc'
      }
    },
    take: parsedLimit
  });

  res.status(200).json({
    success: true,
    message: 'Popular products retrieved successfully',
    data: {
      products: popularProducts.map(product => ({
        id: product.id,
        barcode: product.barcode,
        name: product.name,
        image_url: product.image_url,
        nutritional_score: product.nutritional_score,
        scan_count: product._count.product_scans
      }))
    }
  });
});
