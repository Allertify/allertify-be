import { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyAccessToken } from "../utils/jwt.util";
import { UnauthorizedError, ForbiddenError } from "../utils/errors"

export interface AuthPayload{
  userId: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request{
  user?: AuthPayload;
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if(!token){
    return next(new UnauthorizedError("Token missing"));
  }

  try{
    const payload = verifyAccessToken(token) as unknown as AuthPayload;
    req.user = payload;
    next();
  } catch{
    return next(new UnauthorizedError("Invalid or expired token"));
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if(!req.user){
      return next(new UnauthorizedError());
    }
    if(!roles.includes(req.user.role)){
      return next(new ForbiddenError());
    }
    next();
  };
}
