import { string } from "joi";
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from "nodemailer";
export async function sendOTPEmail(to: string, otp: string){
    let transporter = nodemailer.createTransport({
        service: "gmail",
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    let info = await transporter.sendMail({
        from: process.env.SMTP_FROM, //sender
        to: to, //reciever
        subject: "OTP Verification Code",
        text: `Hi there,
Your verification code for Allertify is:${otp}
This code is valid for 5 minutes. 
Please do not share this code with anyone to keep your account secure.
Thanks,
The Allertify Team`,
    });
    console.log("Code has been sent: %s", info.response);
}


// Interface untuk JWT payload
interface JwtPayload {
    userId: string;
    email: string;
    role: string;
  }
  
  // Extend Express Request interface
  declare global {
    namespace Express {
      interface Request {
        user?: JwtPayload;
      }
    }
  }
  
  /**
   * Middleware untuk autentikasi JWT
   * TODO: implementasi sementara
   */
  export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    try {
      // Bypass authentication jika environment variable BYPASS_AUTH = true
      if (process.env.BYPASS_AUTH === 'true') {
       
        req.user = {
          userId: process.env.HARDCODED_USER_ID || '1',
          email: process.env.HARDCODED_USER_EMAIL || 'test@example.com',
          role: process.env.HARDCODED_USER_ROLE || 'user'
        };
        console.log('🔓 AUTH BYPASSED - Using hardcoded user:', req.user);
        return next();
      }
  
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
  
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access token is required',
        });
      }
  
      // Verifikasi JWT token
      const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      
      req.user = decoded;
      next();
  
    } catch (error) {
      console.error('Token verification error:', error);
      
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          success: false,
          message: 'Access token has expired',
          code: 'TOKEN_EXPIRED',
        });
      }
      
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          success: false,
          message: 'Invalid access token',
          code: 'INVALID_TOKEN',
        });
      }
  
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
      });
    }
  };
  
  /**
   * Middleware untuk otorisasi berdasarkan role
   */
  export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }
  
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
      }
  
      next();
    };
  };
  
  
  
  
  
  
  
