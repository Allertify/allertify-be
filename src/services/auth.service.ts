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