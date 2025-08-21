import { Router } from 'express';
import { 
  getProductDetail,
  searchProducts,
  reportProduct,
  getUserReports,
  getPopularProducts
} from '../controllers/product.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/products/search:
 *   get:
 *     tags: [Products]
 *     summary: Search products by name or barcode
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query (name or barcode)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of products to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of products to skip
 *     responses:
 *       200:
 *         description: Products retrieved successfully
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
 *                   example: "Products retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/search', searchProducts);

/**
 * @swagger
 * /api/v1/products/popular:
 *   get:
 *     tags: [Products]
 *     summary: Get popular products based on scan count
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of popular products to return
 *     responses:
 *       200:
 *         description: Popular products retrieved successfully
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
 *                   example: "Popular products retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 */
router.get('/popular', getPopularProducts);

/**
 * @swagger
 * /api/v1/products/reports/my:
 *   get:
 *     tags: [Products]
 *     summary: Get user's product reports
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
 *     responses:
 *       200:
 *         description: User reports retrieved successfully
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
 *                   example: "User reports retrieved successfully"
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
 */
router.get('/reports/my', authenticateToken, getUserReports);

/**
 * @swagger
 * /api/v1/products/{productId}:
 *   get:
 *     tags: [Products]
 *     summary: Get product detail by ID
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product detail retrieved successfully
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
 *                   example: "Product detail retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       $ref: '#/components/schemas/Product'
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         total_scans:
 *                           type: integer
 *                           example: 25
 *                         risk_distribution:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               risk_level:
 *                                 type: string
 *                                 example: "SAFE"
 *                               count:
 *                                 type: integer
 *                                 example: 20
 *                     recent_scans:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           scan_date:
 *                             type: string
 *                             format: date-time
 *                           risk_level:
 *                             type: string
 *                           risk_explanation:
 *                             type: string
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *       404:
 *         description: Product not found
 */
router.get('/:productId', getProductDetail);

/**
 * @swagger
 * /api/v1/products/{productId}/report:
 *   post:
 *     tags: [Products]
 *     summary: Report a problematic product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID to report
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               report_details:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 255
 *                 example: "Incorrect ingredient information listed on this product"
 *             required:
 *               - report_details
 *     responses:
 *       201:
 *         description: Product report submitted successfully
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
 *                   example: "Product report submitted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     report_id:
 *                       type: integer
 *                       example: 1
 *                     product:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         barcode:
 *                           type: string
 *                     report_details:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: "PENDING"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error or invalid product ID
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Product not found
 *       409:
 *         description: User has already reported this product
 */
router.post('/:productId/report', authenticateToken, reportProduct);

export default router;
