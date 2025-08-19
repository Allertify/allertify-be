import { Router } from "express";
import { registerController, verifyOtpController, loginController } from "../controllers/auth.controller";

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
router.post("/register", registerController);

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
router.post("/otp", verifyOtpController);

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
router.post("/login", loginController);

export default router;