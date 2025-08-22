import { Router } from 'express';
import {
  getTierPlans,
  getUserSubscription,
  getUserSubscriptionHistory,
  upgradeSubscription,
  cancelSubscription,
  getSubscriptionLimits
} from '../controllers/subscription.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import asyncHandler from '../middlewares/asyncHandler';

const router = Router();

/**
 * @swagger
 * /api/v1/subscriptions/plans:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get all available tier plans
 *     responses:
 *       200:
 *         description: Tier plans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Tier plans retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     plans:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TierPlan'
 */
router.get('/plans', asyncHandler(getTierPlans));

/**
 * @swagger
 * /api/v1/subscriptions/me:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get user's current active subscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User subscription retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User subscription retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscription:
 *                       $ref: '#/components/schemas/Subscription'
 *                     is_free_tier:
 *                       type: boolean
 *                       example: false
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     tags: [Subscriptions]
 *     summary: Cancel user's active subscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Subscription cancelled successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscription:
 *                       $ref: '#/components/schemas/Subscription'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: No active subscription found
 */
router.get('/me', authenticateToken, asyncHandler(getUserSubscription));
router.delete('/me', authenticateToken, asyncHandler(cancelSubscription));

/**
 * @swagger
 * /api/v1/subscriptions/me/history:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get user's subscription history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of subscriptions to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of subscriptions to skip
 *     responses:
 *       200:
 *         description: Subscription history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Subscription history retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscriptions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Subscription'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me/history', authenticateToken, asyncHandler(getUserSubscriptionHistory));

/**
 * @swagger
 * /api/v1/subscriptions/me/limits:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get user's subscription limits and current usage
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription limits retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Subscription limits retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     limits:
 *                       type: object
 *                       properties:
 *                         scan_count_limit:
 *                           type: integer
 *                           example: 100
 *                         saved_product_limit:
 *                           type: integer
 *                           example: 50
 *                         plan_type:
 *                           type: string
 *                           example: "FREE"
 *                     current_usage:
 *                       type: object
 *                       properties:
 *                         daily_scans:
 *                           type: integer
 *                           example: 5
 *                         saved_products:
 *                           type: integer
 *                           example: 12
 *                     can_scan:
 *                       type: boolean
 *                       example: true
 *                     can_save_product:
 *                       type: boolean
 *                       example: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me/limits', authenticateToken, asyncHandler(getSubscriptionLimits));

/**
 * @swagger
 * /api/v1/subscriptions/upgrade:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Upgrade or create new subscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tier_plan_id:
 *                 type: integer
 *                 example: 2
 *               duration_months:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 default: 1
 *                 example: 3
 *             required:
 *               - tier_plan_id
 *     responses:
 *       201:
 *         description: Subscription upgraded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Subscription upgraded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscription:
 *                       $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Validation error
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Tier plan not found
 */
router.post('/upgrade', authenticateToken, asyncHandler(upgradeSubscription));

export default router;
