import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
 * TODO: Ini adalah implementasi sementara, akan diganti oleh Rafif dengan implementasi lengkap
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

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


