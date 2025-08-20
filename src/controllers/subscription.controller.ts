import { Request, Response } from 'express';
import asyncHandler from '../middlewares/asyncHandler';
import subscriptionService from '../services/subscription.service';
import Joi from 'joi';

// Validation schemas
const upgradeSubscriptionSchema = Joi.object({
  tier_plan_id: Joi.number().integer().positive().required(),
  duration_months: Joi.number().integer().min(1).max(12).default(1),
});

/**
 * GET /api/v1/subscriptions/plans
 * Mendapatkan semua tier plan yang tersedia
 */
export const getTierPlans = asyncHandler(async (req: Request, res: Response) => {
  const plans = await subscriptionService.getAllTierPlans();

  res.status(200).json({
    success: true,
    message: 'Tier plans retrieved successfully',
    data: {
      plans: plans.map(plan => ({
        id: plan.id,
        plan_type: plan.plan_type,
        scan_count_limit: plan.scan_count_limit,
        saved_product_limit: plan.saved_product_limit
      }))
    }
  });
});

/**
 * GET /api/v1/subscriptions/me
 * Mendapatkan subscription aktif user
 */
export const getUserSubscription = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.user!.userId);

  const subscription = await subscriptionService.getUserSubscription(userId);

  if (!subscription) {
    return res.status(200).json({
      success: true,
      message: 'No active subscription found',
      data: {
        subscription: null,
        is_free_tier: true
      }
    });
  }

  res.status(200).json({
    success: true,
    message: 'User subscription retrieved successfully',
    data: {
      subscription: {
        id: subscription.id,
        tier_plan: {
          id: subscription.tier_plan.id,
          plan_type: subscription.tier_plan.plan_type,
          scan_count_limit: subscription.tier_plan.scan_count_limit,
          saved_product_limit: subscription.tier_plan.saved_product_limit
        },
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        status: subscription.status
      },
      is_free_tier: false
    }
  });
});

/**
 * GET /api/v1/subscriptions/me/history
 * Mendapatkan riwayat subscription user
 */
export const getUserSubscriptionHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.user!.userId);
  const { limit = 10, offset = 0 } = req.query;
  
  const parsedLimit = parseInt(limit as string);
  const parsedOffset = parseInt(offset as string);

  const { subscriptions, total } = await subscriptionService.getUserSubscriptionHistory(
    userId, 
    parsedLimit, 
    parsedOffset
  );

  res.status(200).json({
    success: true,
    message: 'Subscription history retrieved successfully',
    data: {
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        tier_plan: {
          id: sub.tier_plan.id,
          plan_type: sub.tier_plan.plan_type,
          scan_count_limit: sub.tier_plan.scan_count_limit,
          saved_product_limit: sub.tier_plan.saved_product_limit
        },
        start_date: sub.start_date,
        end_date: sub.end_date,
        status: sub.status
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
 * POST /api/v1/subscriptions/upgrade
 * Upgrade atau buat subscription baru
 */
export const upgradeSubscription = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.user!.userId);

  const { error, value } = upgradeSubscriptionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }

  const { tier_plan_id, duration_months } = value;

  const newSubscription = await subscriptionService.createOrUpgradeSubscription(
    userId, 
    tier_plan_id, 
    duration_months
  );

  res.status(201).json({
    success: true,
    message: 'Subscription upgraded successfully',
    data: {
      subscription: {
        id: newSubscription.id,
        tier_plan: {
          id: newSubscription.tier_plan.id,
          plan_type: newSubscription.tier_plan.plan_type,
          scan_count_limit: newSubscription.tier_plan.scan_count_limit,
          saved_product_limit: newSubscription.tier_plan.saved_product_limit
        },
        start_date: newSubscription.start_date,
        end_date: newSubscription.end_date,
        status: newSubscription.status
      }
    }
  });
});

/**
 * DELETE /api/v1/subscriptions/me
 * Cancel subscription aktif
 */
export const cancelSubscription = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.user!.userId);

  const cancelledSubscription = await subscriptionService.cancelSubscription(userId);

  res.status(200).json({
    success: true,
    message: 'Subscription cancelled successfully',
    data: {
      subscription: {
        id: cancelledSubscription.id,
        tier_plan: {
          id: cancelledSubscription.tier_plan.id,
          plan_type: cancelledSubscription.tier_plan.plan_type
        },
        start_date: cancelledSubscription.start_date,
        end_date: cancelledSubscription.end_date,
        status: cancelledSubscription.status
      }
    }
  });
});

/**
 * GET /api/v1/subscriptions/me/limits
 * Mendapatkan informasi limit subscription user
 */
export const getSubscriptionLimits = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.user!.userId);

  const limitsInfo = await subscriptionService.checkSubscriptionLimits(userId);

  res.status(200).json({
    success: true,
    message: 'Subscription limits retrieved successfully',
    data: limitsInfo
  });
});
