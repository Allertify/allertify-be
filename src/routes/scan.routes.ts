import { Router } from 'express';
import scanController from '../controllers/scan.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import asyncHandler from '../middlewares/asyncHandler';
import multer from 'multer';

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.use(authenticateToken);  

/**
 * @swagger
 * /scans/limit:
 *   get:
 *     tags:
 *       - Scan
 *     summary: Cek scan limit user
 *     description: Mendapatkan informasi scan limit harian user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informasi scan limit berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/definitions/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/definitions/ScanLimit'
 *       401:
 *         description: Unauthorized - token tidak valid
 */
router.get('/limit', asyncHandler(scanController.getUserScanLimit));

/**
 * @swagger
 * /scans/barcode/{barcode}:
 *   post:
 *     tags:
 *       - Scan
 *     summary: Scan produk dengan barcode
 *     description: Scan produk menggunakan barcode untuk deteksi alergen
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: barcode
 *         required: true
 *         schema:
 *           type: string
 *         description: Barcode produk (13-14 digit)
 *         example: "8991002122017"
 *     responses:
 *       200:
 *         description: Scan berhasil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/definitions/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/definitions/ScanResult'
 *       400:
 *         description: Barcode tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/ErrorResponse'
 *       401:
 *         description: Unauthorized - token tidak valid
 *       429:
 *         description: Daily scan limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/ErrorResponse'
 */
router.post('/barcode/:barcode', asyncHandler(scanController.scanBarcode));

/**
 * @swagger
 * /scans/image:
 *   post:
 *     tags:
 *       - Scan
 *     summary: Scan produk dengan image URL
 *     description: Scan produk menggunakan URL gambar untuk deteksi alergen
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageUrl
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL gambar produk
 *                 example: "https://example.com/product-image.jpg"
 *               productId:
 *                 type: integer
 *                 description: ID produk (optional, untuk update existing product)
 *     responses:
 *       200:
 *         description: Scan berhasil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/definitions/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/definitions/ScanResult'
 *       400:
 *         description: URL tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/ErrorResponse'
 *       401:
 *         description: Unauthorized - token tidak valid
 *       429:
 *         description: Daily scan limit exceeded
 */
router.post('/image', asyncHandler(scanController.scanImage));

/**
 * @swagger
 * /scans/upload:
 *   post:
 *     tags:
 *       - Scan
 *     summary: Scan produk dengan upload gambar
 *     description: Upload dan scan gambar produk untuk deteksi alergen
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: File gambar produk (JPG, PNG, max 10MB)
 *               productName:
 *                 type: string
 *                 description: Nama produk (optional, untuk produk baru)
 *     responses:
 *       200:
 *         description: Scan berhasil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/definitions/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/definitions/ScanResult'
 *       400:
 *         description: File tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/ErrorResponse'
 *       401:
 *         description: Unauthorized - token tidak valid
 *       429:
 *         description: Daily scan limit exceeded
 */
router.post('/upload', upload.single('image'), asyncHandler(scanController.uploadAndScanImage));

/**
 * @swagger
 * /scans/save/{scanId}:
 *   put:
 *     tags:
 *       - Scan
 *     summary: Toggle save status scan
 *     description: Mengubah status save/unsave untuk scan tertentu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scanId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID scan yang akan di-toggle
 *     responses:
 *       200:
 *         description: Status save berhasil diubah
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/SuccessResponse'
 *       400:
 *         description: Scan ID tidak valid
 *       401:
 *         description: Unauthorized - token tidak valid
 *       404:
 *         description: Scan tidak ditemukan
 */
router.put('/save/:scanId', asyncHandler(scanController.toggleSaveScan));

/**
 * @swagger
 * /scans/history:
 *   get:
 *     tags:
 *       - Scan
 *     summary: Ambil riwayat scan user
 *     description: Mendapatkan riwayat scan user dengan pagination dan filter
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Jumlah item per halaman
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Offset untuk pagination
 *       - in: query
 *         name: savedOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Filter hanya scan yang disimpan
 *     responses:
 *       200:
 *         description: Riwayat scan berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/definitions/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         scans:
 *                           type: array
 *                           items:
 *                             $ref: '#/definitions/ScanResult'
 *                         pagination:
 *                           $ref: '#/definitions/Pagination'
 *       401:
 *         description: Unauthorized - token tidak valid
 */
router.get('/history', asyncHandler(scanController.getScanHistory));

/**
 * @swagger
 * /scans/saved:
 *   get:
 *     tags:
 *       - Scan
 *     summary: Ambil scan yang disimpan
 *     description: Mendapatkan semua scan yang disimpan user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scan yang disimpan berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/definitions/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/definitions/ScanResult'
 *       401:
 *         description: Unauthorized - token tidak valid
 */
router.get('/saved', asyncHandler(scanController.getSavedScans));

/**
 * @swagger
 * /scans/list:
 *   post:
 *     tags:
 *       - Scan
 *     summary: Set product preference (Red/Green list)
 *     description: Menambahkan/mengubah produk ke Red List atau Green List
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - listType
 *             properties:
 *               productId:
 *                 type: integer
 *                 description: ID produk yang akan di-set preference
 *               listType:
 *                 type: string
 *                 enum: [RED, GREEN]
 *                 description: Tipe list (RED untuk tidak suka, GREEN untuk suka)
 *               action:
 *                 type: string
 *                 enum: [ADD, REMOVE]
 *                 default: ADD
 *                 description: Action untuk menambah atau menghapus dari list
 *     responses:
 *       200:
 *         description: Product preference berhasil di-set
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/SuccessResponse'
 *       400:
 *         description: Data tidak valid
 *       401:
 *         description: Unauthorized - token tidak valid
 *       404:
 *         description: Produk tidak ditemukan
 */
router.post('/list', asyncHandler(scanController.setProductList));

export default router;