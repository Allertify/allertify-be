import { Router } from 'express';
import scanController from '../controllers/scan.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import asyncHandler from '../middlewares/asyncHandler';

const router = Router();

// Semua routes scan memerlukan autentikasi
router.use(authenticateToken);

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
 * PUT /scans/:scanId/save
 * Toggle save status untuk hasil scan
 */
router.put('/:scanId/save', asyncHandler(scanController.toggleSaveScan));

/**
 * GET /scans/history
 * Mendapatkan riwayat scan pengguna
 * Query params: limit?, offset?, savedOnly?
 */
router.get('/history', asyncHandler(scanController.getScanHistory));

/**
 * GET /scans/saved
 * Shortcut untuk mendapatkan scan yang disimpan
 */
router.get('/saved', asyncHandler(scanController.getSavedScans));

export default router;


