import jwt from 'jsonwebtoken';

export type UserRole = '0' | '1' | 'USER' | 'ADMIN';

export interface JwtPayload {
	userId: string;
	email?: string;
	role: UserRole | string | number;
}

const accessSecretEnv = process.env.JWT_ACCESS_SECRET;
const refreshSecretEnv = process.env.JWT_REFRESH_SECRET;

if (!accessSecretEnv || !refreshSecretEnv) {

	throw new Error('JWT secrets are not configured');
}

const ACCESS_SECRET: jwt.Secret = accessSecretEnv;
const REFRESH_SECRET: jwt.Secret = refreshSecretEnv;

export function signAccessToken(payload: JwtPayload): string {
	return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m', algorithm: 'HS256' });
}

export function verifyAccessToken(token: string): JwtPayload {
	return jwt.verify(token, ACCESS_SECRET) as unknown as JwtPayload;
}

export function signRefreshToken(payload: JwtPayload): string {
	return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
}

export function verifyRefreshToken(token: string): JwtPayload {
	return jwt.verify(token, REFRESH_SECRET) as unknown as JwtPayload;
}

export const isTokenExpiredError = (err: unknown): boolean => err instanceof jwt.TokenExpiredError;
export const isJsonWebTokenError = (err: unknown): boolean => err instanceof jwt.JsonWebTokenError;


export function verifyAccessTokenRaw(token: string): jwt.JwtPayload | string {
	return jwt.verify(token, ACCESS_SECRET);
}


