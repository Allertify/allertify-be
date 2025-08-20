import { Request, Response } from "express";
import { createUser, verifyOtpAndIssueToken, loginUser, forgotPassword, resetPassword, getPublicAllergens } from "../services/auth.service";
import { registerSchema, otpSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../middlewares/auth.validation";
import asyncHandler from "../middlewares/asyncHandler";
import { logger } from "../utils/logger";

export const registerController = async (req: Request, res: Response) => {
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if(error){
        return res.status(400).json({ success: false, message: "Validation error", detail: error.details.map(d => d.message) });
    }

    try{
        const result = await createUser(value);

        if(result.status === "ALREADY_VERIFIED"){
            return res.status(409).json({ success: false, message: "Email already registered."});
        }

        const status = result.status === "REGISTERED" ? 201 : 200;
        const message = result.status === "REGISTERED" 
            ? "User registered. OTP sent to your email."
            : "OTP has been resent to your email."
        return res.status(status).json({ success: true, message });
    } catch(err: any){
        //eslint disable
        console.error("registerController error:", err);
        logger.error("Register controller error:", { 
            error: err.message, 
            stack: err.stack,
            input: value 
        });
        
        // Return detailed error in development
        if (process.env.NODE_ENV === 'development') {
            return res.status(500).json({ 
                success: false, 
                message: "Internal server error",
                error: err.message,
                stack: err.stack
            });
        }
        
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export async function verifyOtpController(req: Request, res: Response) {
    const { error, value } = otpSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if(error){
        return res.status(400).json({ success: false, message: "Validation error", details: error.details.map(d => d.message) });
    }

    try {
        const result = await verifyOtpAndIssueToken(value);

        if(!result.ok){
            if(result.reason === "USER_NOT_FOUND") return res.status(400).json({ success: false, message: "User not found" });
            if (result.reason === "OTP_NOT_FOUND_OR_EXPIRED" || result.reason === "OTP_EXPIRED")
                return res.status(400).json({ success: false, message: "OTP not found or expired" });
            if (result.reason === "OTP_INVALID") return res.status(400).json({ success: false, message: "Invalid OTP" });
            return res.status(400).json({ success: false, message: "OTP verification failed" });
        }

        return res.status(200).json({
            success: true,
            message: "Account verified",
            accessToken: result.accessToken,
            user: result.user,
        });
    } catch (err: any) {
        //eslint disable
        console.error("verifyOtpController error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const loginController = asyncHandler(async (req, res) => {
    const { error, value } = loginSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });
    if(error){
        return res.status(400).json({
            success: false,
            message: "Validation error",
            detail: error.details.map( d => d.message ),
        });
    }

    const result = await loginUser(value);
    if(!result.ok){
        if(result.reason === "USER_NOT_VERIFIED"){
            return res.status(403).json({
                success: false,
                message: "Account is not verified",
            });
        }
        if(result.reason === "INVALID_CREDENTIALS"){
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }
        return res.status(401).json({ success: false, message: "Login failed"});
    }
    return res.status(200).json({
        success: true,
        message: "Login successful",
        accessToken: result.accessToken,
        user: result.user,
    });
});

/**
 * POST /api/v1/auth/forgot-password
 * Meminta token untuk reset password
 */
export const forgotPasswordController = async (req: Request, res: Response) => {
    const { error, value } = forgotPasswordSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
        return res.status(400).json({ 
            success: false, 
            message: "Validation error", 
            details: error.details.map(d => d.message) 
        });
    }

    try {
        const result = await forgotPassword(value.email);
        
        if (result.status === "USER_NOT_FOUND") {
            // For security, don't reveal if email exists
            return res.status(200).json({ 
                success: true, 
                message: "If this email exists, a reset link has been sent to your email." 
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: "Password reset link has been sent to your email." 
        });
    } catch (err: any) {
        console.error("forgotPasswordController error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

/**
 * POST /api/v1/auth/reset-password
 * Mengatur ulang password dengan token yang valid
 */
export const resetPasswordController = async (req: Request, res: Response) => {
    const { error, value } = resetPasswordSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
        return res.status(400).json({ 
            success: false, 
            message: "Validation error", 
            details: error.details.map(d => d.message) 
        });
    }

    try {
        const result = await resetPassword(value.token, value.newPassword);
        
        if (!result.success) {
            if (result.reason === "TOKEN_NOT_FOUND" || result.reason === "TOKEN_EXPIRED") {
                return res.status(400).json({ 
                    success: false, 
                    message: "Reset token is invalid or has expired." 
                });
            }
            if (result.reason === "USER_NOT_FOUND") {
                return res.status(400).json({ 
                    success: false, 
                    message: "User not found." 
                });
            }
            return res.status(400).json({ 
                success: false, 
                message: "Password reset failed." 
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: "Password has been reset successfully. You can now login with your new password." 
        });
    } catch (err: any) {
        console.error("resetPasswordController error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

/**
 * GET /api/v1/auth/allergens
 * Mendapatkan daftar allergens yang tersedia untuk user selection
 */
export const getPublicAllergensController = async (req: Request, res: Response) => {
    const { search, limit, offset } = req.query;
    
    try {
        const result = await getPublicAllergens({
            search: search as string,
            limit: limit ? parseInt(limit as string) : 50,
            offset: offset ? parseInt(offset as string) : 0
        });
        
        return res.status(200).json({
            success: true,
            message: "Allergens retrieved successfully",
            data: {
                items: result.items,
                pagination: {
                    limit: limit ? parseInt(limit as string) : 50,
                    offset: offset ? parseInt(offset as string) : 0,
                    total: result.total
                }
            }
        });
    } catch (err: any) {
        console.error("getPublicAllergensController error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};