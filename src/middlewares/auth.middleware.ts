import { Request, Response, NextFunction } from 'express';
import { isTokenExpiredError, isJsonWebTokenError, verifyAccessTokenRaw } from '../utils/jwt.util';

// Interface untuk JWT payload yang kita gunakan di request
interface RequestUserPayload {
  userId: string;
  email: string;
  role: string | number;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware untuk autentikasi JWT
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = (() => {
      if (!authHeader) return undefined;
      const [scheme, value] = authHeader.split(' ');
      if ((scheme || '').toLowerCase() !== 'bearer' || !value) return undefined;
      return value;
    })();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
        timestamp: new Date().toISOString(),
      });
    }

    // Verifikasi dan map payload ke req.user (sederhana)
    const decoded = verifyAccessTokenRaw(token);
    if (typeof decoded === 'string') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token',
        code: 'INVALID_TOKEN',
        timestamp: new Date().toISOString(),
      });
    }
    const payload = decoded as Record<string, unknown>;
    const userId = (payload['userId'] as string | number | undefined) ?? (payload['sub'] as string | number | undefined) ?? '';
    const email = (payload['email'] as string | undefined) ?? '';
    const role = (payload['role'] as string | number | undefined) ?? '';
    if (!userId || role === '') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token',
        code: 'INVALID_TOKEN',
        timestamp: new Date().toISOString(),
      });
    }
    req.user = {
      userId: String(userId),
      email: email ? String(email) : '',
      role: String(role),
    };
    next();
  } catch (error) {
    console.error('Token verification error:', error);

    if (isTokenExpiredError(error)) {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired',
        code: 'TOKEN_EXPIRED',
        timestamp: new Date().toISOString(),
      });
    }

    if (isJsonWebTokenError(error)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token',
        code: 'INVALID_TOKEN',
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      timestamp: new Date().toISOString(),
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
        timestamp: new Date().toISOString(),
      });
    }

    if (!roles.includes(Number(req.user.role))) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};

/**
 * Middleware untuk memastikan user adalah admin (role = 1)
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  if (Number(req.user.role) !== 1) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      timestamp: new Date().toISOString(),
    });
  }

  next();
};
