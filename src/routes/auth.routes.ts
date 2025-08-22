import { Router } from "express";
import { registerController, verifyOtpController, loginController, forgotPasswordController, resetPasswordController, getPublicAllergensController } from "../controllers/auth.controller";
import asyncHandler from '../middlewares/asyncHandler';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register user baru
 *     description: Membuat akun user baru dengan verifikasi email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/UserCreate'
 *     responses:
 *       201:
 *         description: User berhasil dibuat, OTP dikirim ke email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/SuccessResponse'
 *       400:
 *         description: Data tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/ErrorResponse'
 *       409:
 *         description: Email sudah terdaftar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/ErrorResponse'
 */
router.post("/register", asyncHandler(registerController));

/**
 * @swagger
 * /auth/otp:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Verifikasi OTP
 *     description: Verifikasi OTP yang dikirim ke email untuk aktivasi akun
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/UserVerifyOTP'
 *     responses:
 *       200:
 *         description: OTP berhasil diverifikasi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/SuccessResponse'
 *       400:
 *         description: OTP tidak valid atau expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/ErrorResponse'
 */
router.post("/otp", asyncHandler(verifyOtpController));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login user
 *     description: Authenticate user dan dapatkan JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/UserLogin'
 *     responses:
 *       200:
 *         description: Login berhasil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/definitions/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         token: 
 *                           type: string
 *                           description: JWT token untuk autentikasi
 *                         user:
 *                           $ref: '#/definitions/User'
 *       401:
 *         description: Email atau password salah
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/ErrorResponse'
 */
router.post("/login", asyncHandler(loginController));

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Request reset password token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset token sent if email exists
 */
router.post("/forgot-password", asyncHandler(forgotPasswordController));

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password updated
 */
router.post("/reset-password", asyncHandler(resetPasswordController));

/**
 * @swagger
 * /api/v1/auth/allergens:
 *   get:
 *     tags: [Authentication]
 *     summary: Get available allergens for user selection
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search allergens by name
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Number of allergens per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of allergens to skip
 *     responses:
 *       200:
 *         description: Allergens retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           is_custom:
 *                             type: boolean
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *                         total:
 *                           type: integer
 */
router.get("/allergens", asyncHandler(getPublicAllergensController));

export default router;