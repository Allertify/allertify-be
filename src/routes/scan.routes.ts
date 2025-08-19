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
 * GET /scans/limit
 * Mendapatkan informasi daily scan limit pengguna
 */
router.get('/limit', asyncHandler(scanController.getUserScanLimit));

/**
 * POST /scans/barcode/:barcode
 * Scan produk berdasarkan barcode
 */
router.post('/barcode/:barcode', asyncHandler(scanController.scanBarcode));

/**
 * POST /scans/image
 * Scan produk berdasarkan gambar (OCR fallback)
 * Body: { imageUrl: string, productId?: number }
 */
router.post('/image', asyncHandler(scanController.scanImage));

/**
 * POST /scans/upload
 * Upload dan scan gambar produk untuk analisis alergi
 * Body: multipart/form-data dengan field 'image' dan optional 'productName'
 */
router.post('/upload', upload.single('image'), asyncHandler(scanController.uploadAndScanImage));

/**
 * POST /scans/upload-simple
 * Test route tanpa multer untuk debugging
 */
router.post('/upload-simple', asyncHandler(scanController.uploadAndScanImage));

/**
 * GET /scans/upload-test
 * Test route untuk memastikan /upload terdaftar
 */
router.get('/upload-test', (req, res) => {
  res.json({ message: 'Upload route is working!', timestamp: new Date().toISOString() });
});

/**
 * PUT /scans/:scanId/save
 * Toggle save status untuk hasil scan
 */
router.put('/save/:scanId', asyncHandler(scanController.toggleSaveScan));

/**
 * GET /scans/history
 * Mendapatkan riwayat scan pengguna
 * Query params: limit?, offset?, savedOnly?, uniqueByProduct?, listType? (RED|GREEN)
 */
router.get('/history', asyncHandler(scanController.getScanHistory));

/**
 * GET /scans/saved
 * Shortcut untuk mendapatkan scan yang disimpan
 */
router.get('/saved', asyncHandler(scanController.getSavedScans));

/**
 * POST /scans/list
 * Set or remove product list classification (RED/GREEN)
 * Body: { productId: number, listType?: 'RED'|'GREEN' }
 */
router.post('/list', asyncHandler(scanController.setProductList));

export default router;


