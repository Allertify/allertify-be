import { Request, Response } from 'express';
import asyncHandler from '../middlewares/asyncHandler';
import adminService from '../services/admin.service';
import subscriptionService from '../services/subscription.service';
import Joi from 'joi';

// Validation schemas
const getUsersSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  search: Joi.string().min(1).max(100).optional(),
  role: Joi.number().integer().valid(0, 1).optional(),
  is_verified: Joi.boolean().optional(),
});

const updateUserSchema = Joi.object({
  role: Joi.number().integer().valid(0, 1).optional(),
  is_verified: Joi.boolean().optional(),
}).min(1);

const updateReportStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'REVIEWED', 'RESOLVED', 'REJECTED').required(),
});

// Allergen validation schemas
const listAllergensSchema = Joi.object({
  search: Joi.string().min(1).max(100).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
});

const createAllergenSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().allow('', null).max(255).optional(),
  is_custom: Joi.boolean().optional(),
});

const updateAllergenSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().allow('', null).max(255).optional(),
  is_custom: Joi.boolean().optional(),
}).min(1);

/**
 * GET /api/v1/admin/dashboard
 * Mendapatkan statistik dashboard admin
 */
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const stats = await adminService.getDashboardStats();

  res.status(200).json({
    success: true,
    message: 'Dashboard statistics retrieved successfully',
    data: stats
  });
});

/**
 * GET /api/v1/admin/analytics
 * Mendapatkan analytics sistem
 */
export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const analytics = await adminService.getSystemAnalytics();

  res.status(200).json({
    success: true,
    message: 'System analytics retrieved successfully',
    data: analytics
  });
});

/**
 * GET /api/v1/admin/users
 * Mendapatkan daftar semua users dengan filter
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = getUsersSchema.validate(req.query);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }

  const { users, total } = await adminService.getAllUsers(value);

  res.status(200).json({
    success: true,
    message: 'Users retrieved successfully',
    data: {
      users: users.map(user => ({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        is_verified: user.is_verified,
        role: user.role,
        profile_picture_url: user.profile_picture_url,
        created_at: user.createdAt,
        last_login: user.last_login,
        statistics: {
          total_scans: user._count.product_scans,
          total_subscriptions: user._count.subscriptions,
          total_reports: user._count.product_reports
        }
      })),
      pagination: {
        limit: value.limit,
        offset: value.offset,
        total
      }
    }
  });
});

/**
 * GET /api/v1/admin/users/:userId
 * Mendapatkan detail user berdasarkan ID
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId || '0');
  
  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID'
    });
  }

  const user = await adminService.getUserById(userId);

  res.status(200).json({
    success: true,
    message: 'User details retrieved successfully',
    data: {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        is_verified: user.is_verified,
        role: user.role,
        profile_picture_url: user.profile_picture_url,
        created_at: user.createdAt,
        last_login: user.last_login,
        allergies: user.user_allegens.map(ua => ({
          id: ua.id,
          allergen: ua.allergen,
          security_level: ua.security_level
        })),
        emergency_contacts: user.emergency_contacts,
        recent_subscriptions: user.subscriptions.map(sub => ({
          id: sub.id,
          tier_plan: sub.tier_plan,
          start_date: sub.start_date,
          end_date: sub.end_date,
          status: sub.status
        })),
        statistics: {
          total_scans: user._count.product_scans,
          total_reports: user._count.product_reports,
          total_daily_usages: user._count.daily_scan_usages
        }
      }
    }
  });
});

/**
 * PUT /api/v1/admin/users/:userId
 * Update user role atau verification status
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId || '0');
  
  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID'
    });
  }

  const { error, value } = updateUserSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }

  const updatedUser = await adminService.updateUser(userId, value);

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: {
      user: updatedUser
    }
  });
});

/**
 * DELETE /api/v1/admin/users/:userId
 * Delete (deactivate) user
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId || '0');
  
  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID'
    });
  }

  const deletedUser = await adminService.deleteUser(userId);

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
    data: {
      user: deletedUser
    }
  });
});

/**
 * GET /api/v1/admin/reports
 * Mendapatkan semua product reports
 */
export const getAllReports = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 20, offset = 0, status } = req.query;
  
  const parsedLimit = parseInt(limit as string);
  const parsedOffset = parseInt(offset as string);

  const { reports, total } = await adminService.getAllProductReports({
    limit: parsedLimit,
    offset: parsedOffset,
    status: status as string
  });

  res.status(200).json({
    success: true,
    message: 'Product reports retrieved successfully',
    data: {
      reports: reports.map(report => ({
        id: report.id,
        user: report.user,
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
 * PUT /api/v1/admin/reports/:reportId
 * Update status product report
 */
export const updateReportStatus = asyncHandler(async (req: Request, res: Response) => {
  const reportId = parseInt(req.params.reportId || '0');
  
  if (isNaN(reportId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid report ID'
    });
  }

  const { error, value } = updateReportStatusSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }

  const updatedReport = await adminService.updateProductReportStatus(reportId, value.status);

  res.status(200).json({
    success: true,
    message: 'Report status updated successfully',
    data: {
      report: {
        id: updatedReport.id,
        user: updatedReport.user,
        product: updatedReport.product,
        report_details: updatedReport.report_details,
        status: updatedReport.status
      }
    }
  });
});

/**
 * GET /api/v1/admin/subscriptions/stats
 * Mendapatkan statistik subscription
 */
export const getSubscriptionStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await subscriptionService.getSubscriptionStats();

  res.status(200).json({
    success: true,
    message: 'Subscription statistics retrieved successfully',
    data: stats
  });
});

/**
 * GET /api/v1/admin/allergens
 */
export const listAllergens = asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = listAllergensSchema.validate(req.query);
  if (error) {
    return res.status(400).json({ success: false, message: 'Validation error', details: error.details.map(d => d.message) });
  }
  const { items, total } = await adminService.listAllergens(value);
  res.status(200).json({ success: true, message: 'Allergens retrieved successfully', data: { items, pagination: { limit: value.limit, offset: value.offset, total } } });
});

/**
 * POST /api/v1/admin/allergens
 */
export const createAllergen = asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = createAllergenSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: 'Validation error', details: error.details.map(d => d.message) });
  }
  const created = await adminService.createAllergen(value);
  res.status(201).json({ success: true, message: 'Allergen created successfully', data: created });
});

/**
 * PUT /api/v1/admin/allergens/:id
 */
export const updateAllergen = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id || '0');
  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid allergen ID' });
  }
  const { error, value } = updateAllergenSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: 'Validation error', details: error.details.map(d => d.message) });
  }
  const updated = await adminService.updateAllergen(id, value);
  res.status(200).json({ success: true, message: 'Allergen updated successfully', data: updated });
});

/**
 * DELETE /api/v1/admin/allergens/:id
 */
export const deleteAllergen = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id || '0');
  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid allergen ID' });
  }
  const result = await adminService.deleteAllergen(id);
  res.status(200).json({ success: true, message: 'Allergen deleted successfully', data: result });
});
