import { Request, Response } from "express";
import { createUser, verifyOtpAndIssueToken } from "../services/auth.service";
import { registerSchema, otpSchema } from "../middlewares/auth.validation";

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