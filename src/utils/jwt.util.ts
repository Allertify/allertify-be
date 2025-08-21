import jwt from "jsonwebtoken";
import { AuthPayload } from "../middlewares/auth.middleware"

const ACCESS_SECRET = process.env.JWT__ACCESS_SECRET || "supersecret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "superrefresh";


export function signAccessToken(payload: AuthPayload): string{
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

export function verifyAccessToken(token: string): AuthPayload{
  return jwt.verify(token, ACCESS_SECRET) as AuthPayload;
}

export function signRefreshToken(payload: AuthPayload): string{
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyRefreshToken(token: string): AuthPayload{
  return jwt.verify(token, REFRESH_SECRET) as AuthPayload;
}
