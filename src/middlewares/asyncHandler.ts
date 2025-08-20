
import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Async handler wrapper untuk menangkap error dalam fungsi async
 * dan meneruskannya ke middleware error handling Express
 */
const asyncHandler = (fn: RequestHandler) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;
