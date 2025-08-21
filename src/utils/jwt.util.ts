import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT__ACCESS_SECRET || "supersecret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "superrefresh";

export interface JwtPayload{
  userId: number;
  role: string;
}

export function signAccessToken(payload: JwtPayload): string{
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

export function verifyAccessToken(token: string): JwtPayload{
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function signRefreshToken(payload: JwtPayload): string{
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyRefreshToken(token: string): JwtPayload{
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}
