import { PrismaClient } from "@prisma/client";
import argon2 from "argon2"
import { date } from "joi";
import jwt from "jsonwebtoken"
import { sendOTPEmail } from "../utils/mailer";

const prisma = new PrismaClient();

function generateOTP(): string {
    const num = Math.floor(Math.random()*1_000_000); //0-999999
    return num.toString().padStart(6,"0"); 
}

export async function createUser(input: {
   full_name: string;
   email: string;
   password: string;
   phone_number: string;
}) {
    const email = input.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if(existing && existing.is_verified) {
        return { status: "ALREADY_VERIFIED" as const};
    }
    let userId: number;
    if(!existing) {
        const hashed = await argon2.hash(input.password, { type: argon2.argon2id });
        const created = await prisma.user.create({
            data: {
                full_name: input.full_name, 
                email,
                password: hashed,
                phone_number: input.phone_number,
                is_verified: false,
                role: 0, // default
                profile_picture_url: null,
            },
            select: { id: true },
        });
        userId = created.id;
    } else {
        userId = existing.id;
    }

    //clean up otp when it's unused
    await prisma.email_verification.deleteMany({
        where: { user_id: userId, usedAt: null}
    });

    //generate otp and expired in 5 min
    const otp = generateOTP();
    const otpExpired = new Date(Date.now() + 5 * 60 *1000);

    await prisma.email_verification.create({
        data: {
            user_id: userId,
            otp_code: otp,
            otp_code_expired: otpExpired,
        },
    });

    //send otp to email
    await sendOTPEmail(email, otp);

    console.log(`[OTP] send to ${email}: ${otp} (valid until ${otpExpired.toISOString()})`);

    return { status: existing? "OTP_RESENT" as const : "REGISTERED" as const};

}

// verif otp for an email and issue an access token
export async function verifyOtpAndIssueToken(input: {
    email: string;
    otp: string;
}) {
    const email = input.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });
    if(!user){
        return { ok: false as const, reason: "USER_NOT_FOUND" as const };        
    }

    const record = await prisma.email_verification.findFirst({
        where: { user_id: user.id, usedAt: null },
        orderBy: { createdAt: "desc"},
    });

    if(!record){
        return { ok: false as const, reason: "OTP_NOT_FOUND_OR_EXPIRED" as const };
    }

    //check expired
    if(record.otp_code_expired < new Date()){
        //mark used or exp
        await prisma.email_verification.update({
            where: { id: record.id },
            data: { usedAt: new Date() },
        });
        return { ok: false as const, reason: "OTP_EXPIRED" as const }
    }
    if(record.otp_code !== input.otp){
        return { ok: false as const, reason: "OTP_INVALID"}
    }

    // mark used
    await prisma.email_verification.update({
        where: { id: record.id },
        data: { usedAt: new Date()},
    });

    if(!user.is_verified){
        await prisma.user.update({
            where: { id: user.id },
            data: { is_verified: true},
        });
    }

    //set issue accesToken for 7 days
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    if(!accessSecret){
        throw new Error("JWT_ACCESS_SECRET not set in env");
    }
    
    const accessToken = jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        accessSecret,
        { expiresIn: "7d" }
    );

    return{
        ok: true as const,
        accessToken,
        user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            is_verified: true,
            role: user.role,
        },
    };
}

export async function loginUser(input: { email: string; password: string }) {
    const email = input.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });

    //avoid user enumeration
    if(!user){
        return { ok: false as const, reason: "INVALID_CREDENTIALS" as const};
    }
    if(!user.is_verified){
        return { ok: false as const, reason: "USER_NOT_VERIFIED" as const};
    }
    
    const passwordOk = await argon2.verify(user.password, input.password);
    if(!passwordOk){
        return { ok: false as const, reason: "INVALID_CREDENTIALS" as const};
    }
    
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    if(!accessSecret){
        throw Error("JWT_ACCESS_SECRET not set in env");
    }
    
    const accessToken = jwt.sign(
        { sub: user.id, email: user.email, role: user.role},
        accessSecret,
        { expiresIn: "7d"}
    );

    //update last_login
    try{
        await prisma.user.update({
            where: { id: user.id },
            data: { last_login: new Date()},
        });
    }catch{}
    return {
        ok: true as const,
        accessToken,
        user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            is_verified: user.is_verified,
            role: user.role,
        },
    };
}

/**
 * Forgot password - send reset token to email
 */
export async function forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
        return { status: "USER_NOT_FOUND" as const };
    }

    // Generate reset token (UUID-like)
    const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Clean up existing reset tokens
    await prisma.password_reset.deleteMany({
        where: { user_id: user.id }
    });

    // Create new reset token
    await prisma.password_reset.create({
        data: {
            user_id: user.id,
            token: resetToken,
            expires_at: expiresAt
        }
    });

    // Send reset email
    try {
        await sendResetPasswordEmail(user.email, resetToken);
    } catch (error) {
        console.error("Failed to send reset password email:", error);
        // Don't fail the request if email fails
    }

    return { status: "RESET_TOKEN_SENT" as const };
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string) {
    const resetRecord = await prisma.password_reset.findUnique({
        where: { token },
        include: { user: true }
    });

    if (!resetRecord) {
        return { success: false, reason: "TOKEN_NOT_FOUND" as const };
    }

    if (resetRecord.expires_at < new Date()) {
        // Clean up expired token
        await prisma.password_reset.delete({
            where: { token }
        });
        return { success: false, reason: "TOKEN_EXPIRED" as const };
    }

    if (!resetRecord.user) {
        return { success: false, reason: "USER_NOT_FOUND" as const };
    }

    // Hash new password
    const hashedPassword = await argon2.hash(newPassword, { type: argon2.argon2id });

    // Update password and clean up reset token
    await prisma.$transaction([
        prisma.user.update({
            where: { id: resetRecord.user_id },
            data: { password: hashedPassword }
        }),
        prisma.password_reset.delete({
            where: { token }
        })
    ]);

    return { success: true };
}

/**
 * Send reset password email
 */
async function sendResetPasswordEmail(to: string, token: string) {
    // This would be implemented similar to sendOTPEmail
    // For now, just log the token
    console.log(`Reset password token for ${to}: ${token}`);
    
    // TODO: Implement actual email sending with reset link
    // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
}