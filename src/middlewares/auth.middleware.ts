import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Interface untuk JWT payload yang kita gunakan di request
interface RequestUserPayload {
  userId: string; // disimpan sebagai string di req.user agar konsisten dengan pemakaian
  email: string;
  role: string;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: RequestUserPayload;
    }
  }
}

/**
 * Middleware untuk autentikasi JWT
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }

    // Verifikasi JWT token
    const JWT_SECRET = process.env.JWT_ACCESS_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_ACCESS_SECRET is not defined');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }

    // Token yang kita sign berisi: { sub: user.id, email, role }
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & {
      sub?: number | string;
      email?: string;
      role?: number | string;
    };

    // Map payload token ke shape req.user yang digunakan di seluruh app
    req.user = {
      userId: String(decoded.sub ?? ''),
      email: String(decoded.email ?? ''),
      role: String(decoded.role ?? ''),
    };
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
 * Role: 0 = user, 1 = admin
 */
export const requireRole = (roles: number[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(Number(req.user.role))) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Middleware untuk memastikan user adalah admin (role = 1)
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (Number(req.user.role) !== 1) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }

  next();
};

