import { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyAccessToken } from "../utils/jwt.util";
import { UnauthorizedError, ForbiddenError } from "../utils/errors"
import { JwtPayload } from "jsonwebtoken";

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
    const decoded = verifyAccessToken(token) as AuthPayload;
    if(
      typeof decoded !== "object" ||
      !decoded.userId ||
      !decoded.email ||
      !decoded.role
    ) {
      throw new UnauthorizedError("Invalid token payload");
    }
    req.user = decoded as AuthPayload;
    next();
  } catch (err){
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
