import { Request, Response } from "express";
import { createUser, verifyOtpAndIssueToken, loginUser, forgotPassword, resetPassword, getPublicAllergens } from "../services/auth.service";
import { SubscriptionService } from '../services/subscription.service';
import { registerSchema, otpSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../middlewares/auth.validation";
import asyncHandler from "../middlewares/asyncHandler";
import { logger } from "../utils/logger";
import { sendSuccess, sendError } from "../utils/response";
import { validateRequest } from "../utils/validation";

export const registerController = asyncHandler(async (req: Request, res: Response) => {
    const validation = validateRequest(registerSchema, req.body);
    if (!validation.isValid) {
        return sendError(res, "Validation error", 400, { errors: validation.errors ?? [] });
    }

    const result = await createUser(validation.value!);

    if (result.status === "ALREADY_VERIFIED") {
        return sendError(res, "Email already registered", 409);
    }

    const statusCode = result.status === "REGISTERED" ? 201 : 200;
    const message = result.status === "REGISTERED" 
        ? "User registered. OTP sent to your email."
        : "OTP has been resent to your email.";
    
    return sendSuccess(res, null, message, statusCode);
});

export const verifyOtpController = asyncHandler(async (req: Request, res: Response) => {
    const validation = validateRequest(otpSchema, req.body);
    if (!validation.isValid) {
        return sendError(res, "Validation error", 400, { errors: validation.errors ?? [] });
    }

    const result = await verifyOtpAndIssueToken(validation.value!);

    if (!result.ok) {
        if (result.reason === "USER_NOT_FOUND") {
            return sendError(res, "User not found", 400);
        }
        if (result.reason === "OTP_NOT_FOUND_OR_EXPIRED" || result.reason === "OTP_EXPIRED") {
            return sendError(res, "OTP not found or expired", 400);
        }
        if (result.reason === "OTP_INVALID") {
            return sendError(res, "Invalid OTP", 400);
        }
        return sendError(res, "OTP verification failed", 400);
    }

    const subscriptionService = new SubscriptionService();
    const subscription = await subscriptionService.getUserSubscription(result.user.id);

    return sendSuccess(res, {
        accessToken: result.accessToken,
        user: {
            id: result.user.id,
            email: result.user.email,
            fullName: result.user.full_name,
            isVerified: result.user.is_verified,
            role: result.user.role,
        },
        subscription: subscription
    }, "Account verified");
});

export const loginController = asyncHandler(async (req, res) => {
    const validation = validateRequest(loginSchema, req.body);
    if (!validation.isValid) {
        return sendError(res, "Validation error", 400, { errors: validation.errors  ?? []});
    }

    const result = await loginUser(validation.value!);
    if (!result.ok) {
        if (result.reason === "USER_NOT_VERIFIED") {
            return sendError(res, "Account is not verified", 403);
        }
        if (result.reason === "INVALID_CREDENTIALS") {
            return sendError(res, "Invalid email or password", 401);
        }
        return sendError(res, "Login failed", 401);
    }

    return sendSuccess(res, {
        accessToken: result.accessToken,
        user: {
            id: result.user.id,
            email: result.user.email,
            fullName: result.user.full_name,
            isVerified: result.user.is_verified,
            role: result.user.role,
        }
    }, "Login successful");
});

/**
 * POST /api/v1/auth/forgot-password
 * Meminta token untuk reset password
 */
export const forgotPasswordController = asyncHandler(async (req: Request, res: Response) => {
    const validation = validateRequest(forgotPasswordSchema, req.body);
    if (!validation.isValid) {
        return sendError(res, "Validation error", 400, { errors: validation.errors ?? [] });
    }

    const result = await forgotPassword(validation.value!.email);
    
    // For security, don't reveal if email exists
    const message = result.status === "USER_NOT_FOUND" 
        ? "If this email exists, a reset link has been sent to your email."
        : "Password reset link has been sent to your email.";

    return sendSuccess(res, null, message);
});

/**
 * POST /api/v1/auth/reset-password
 * Mengatur ulang password dengan token yang valid
 */
export const resetPasswordController = asyncHandler(async (req: Request, res: Response) => {
    const validation = validateRequest(resetPasswordSchema, req.body);
    if (!validation.isValid) {
        return sendError(res, "Validation error", 400, { errors: validation.errors ?? [] });
    }

    const result = await resetPassword(validation.value!.token, validation.value!.newPassword);
    
    if (!result.success) {
        if (result.reason === "TOKEN_NOT_FOUND" || result.reason === "TOKEN_EXPIRED") {
            return sendError(res, "Reset token is invalid or has expired", 400);
        }
        if (result.reason === "USER_NOT_FOUND") {
            return sendError(res, "User not found", 400);
        }
        return sendError(res, "Password reset failed", 400);
    }

    return sendSuccess(res, null, "Password has been reset successfully. You can now login with your new password.");
});

/**
 * GET /api/v1/auth/allergens
 * Mendapatkan daftar allergens yang tersedia untuk user selection
 */
export const getPublicAllergensController = asyncHandler(async (req: Request, res: Response) => {
    const { search, limit, offset } = req.query;
    
    const result = await getPublicAllergens({
        search: search as string,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0
    });
    
    return sendSuccess(res, {
        items: result.items,
        pagination: {
            limit: limit ? parseInt(limit as string) : 50,
            offset: offset ? parseInt(offset as string) : 0,
            total: result.total
        }
    }, "Allergens retrieved successfully");
});