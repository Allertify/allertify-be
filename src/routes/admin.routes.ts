import { Router } from 'express';
import {
  getDashboard,
  getAnalytics,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllReports,
  updateReportStatus,
  getSubscriptionStats,
  listAllergens,
  createAllergen,
  updateAllergen,
  deleteAllergen,
} from '../controllers/admin.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';
import asyncHandler from '../middlewares/asyncHandler';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin dashboard statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
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
 *                   example: "Dashboard statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 1250
 *                         verified:
 *                           type: integer
 *                           example: 1100
 *                         unverified:
 *                           type: integer
 *                           example: 150
 *                     products:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 5000
 *                     scans:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 25000
 *                         trends:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                                 format: date-time
 *                               count:
 *                                 type: integer
 *                     subscriptions:
 *                       type: object
 *                       properties:
 *                         active:
 *                           type: integer
 *                           example: 250
 *                     reports:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: integer
 *                           example: 15
 *                     popular_products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           barcode:
 *                             type: string
 *                           scan_count:
 *                             type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/dashboard', asyncHandler(getDashboard));

/**
 * @swagger
 * /api/v1/admin/analytics:
 *   get:
 *     tags: [Admin]
 *     summary: Get system analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System analytics retrieved successfully
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
 *                   example: "System analytics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_registrations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date-time
 *                           count:
 *                             type: integer
 *                     risk_distribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           risk_level:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     subscription_distribution:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/analytics', asyncHandler(getAnalytics));

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users with filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of users to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of users to skip
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: Filter by user role (0=user, 1=admin)
 *       - in: query
 *         name: is_verified
 *         schema:
 *           type: boolean
 *         description: Filter by verification status
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                   example: "Users retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AdminUserDetail'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/users', asyncHandler(getAllUsers));

/**
 * @swagger
 * /api/v1/admin/users/{userId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get user details by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
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
 *                   example: "User details retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/AdminUserDetail'
 *       400:
 *         description: Invalid user ID
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: User not found
 *   put:
 *     tags: [Admin]
 *     summary: Update user role or verification status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: integer
 *                 enum: [0, 1]
 *                 example: 1
 *               is_verified:
 *                 type: boolean
 *                 example: true
 *             minProperties: 1
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                   example: "User updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or invalid user ID
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: User not found
 *   delete:
 *     tags: [Admin]
 *     summary: Delete (deactivate) user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                   example: "User deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         full_name:
 *                           type: string
 *                         email:
 *                           type: string
 *       400:
 *         description: Invalid user ID
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: User not found
 */
router.get('/users/:userId', asyncHandler(getUserById));
router.put('/users/:userId', asyncHandler(updateUser));
router.delete('/users/:userId', asyncHandler(deleteUser));

/**
 * @swagger
 * /api/v1/admin/reports:
 *   get:
 *     tags: [Admin]
 *     summary: Get all product reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of reports to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of reports to skip
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, REVIEWED, RESOLVED, REJECTED]
 *         description: Filter by report status
 *     responses:
 *       200:
 *         description: Product reports retrieved successfully
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
 *                   example: "Product reports retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reports:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProductReport'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/reports', asyncHandler(getAllReports));

/**
 * @swagger
 * /api/v1/admin/reports/{reportId}:
 *   put:
 *     tags: [Admin]
 *     summary: Update product report status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, REVIEWED, RESOLVED, REJECTED]
 *                 example: "REVIEWED"
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Report status updated successfully
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
 *                   example: "Report status updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     report:
 *                       $ref: '#/components/schemas/ProductReport'
 *       400:
 *         description: Validation error or invalid report ID
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Report not found
 */
router.put('/reports/:reportId', asyncHandler(updateReportStatus));

/**
 * @swagger
 * /api/v1/admin/subscriptions/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get subscription statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription statistics retrieved successfully
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
 *                   example: "Subscription statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_active:
 *                       type: integer
 *                       example: 250
 *                     by_tier:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tier_plan_id:
 *                             type: integer
 *                           _count:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                     monthly_new_subscriptions:
 *                       type: integer
 *                       example: 45
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/subscriptions/stats', asyncHandler(getSubscriptionStats));

/** Allergen management */
/**
 * @swagger
 * /api/v1/admin/allergens:
 *   get:
 *     tags: [Admin]
 *     summary: List allergens
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *   post:
 *     tags: [Admin]
 *     summary: Create allergen
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               is_custom: { type: boolean }
 */
router.get('/allergens', asyncHandler(listAllergens));
router.post('/allergens', asyncHandler(createAllergen));
/**
 * @swagger
 * /api/v1/admin/allergens/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update allergen
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               is_custom: { type: boolean }
 *   delete:
 *     tags: [Admin]
 *     summary: Delete allergen
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 */
router.put('/allergens/:id', asyncHandler(updateAllergen));
router.delete('/allergens/:id', asyncHandler(deleteAllergen));

export default router;
