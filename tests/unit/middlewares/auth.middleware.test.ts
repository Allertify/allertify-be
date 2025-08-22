import { Request, Response, NextFunction } from 'express';
import { authenticateToken, requireRole, requireAdmin } from '../../../src/middlewares/auth.middleware';
import { isJsonWebTokenError, isTokenExpiredError, verifyAccessTokenRaw } from '../../../src/utils/jwt.util';

//mock jwt utils to full control behavior
jest.mock('../../../src/utils/jwt.util', () => ({
    verifyAccessTokenRaw: jest.fn(),
    isTokenExpiredError: (err: unknown) => (err as any)?.name === 'TokenExpiredError',
    isJsonWebTokenError: (err: unknown) => (err as any)?.name === 'JsonWebTokenError',
    
}));

const mkRes = () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    return { status, json } as any as Response;
};
const mkNext = () => jest.fn() as NextFunction;

describe('auth.middleware - authenticateToken', () => {
    it('401 when no Authorization header', () => {
        const req = { headers: {} } as any as Request;
        const res = mkRes();
        const next = mkNext;
        authenticateToken(req,res, next);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('401 when scheme not Bearer or token missing', () => {
        const req = { headers: {authorization: 'Basic abc' } } as any as Request;
        const res = mkRes();
        const next = mkNext;
        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
    });
    it('401 when verify returns string (invalid token)', () => {
        (verifyAccessTokenRaw as jest.Mock).mockReturnValue('garbage');
        const req = { headers: {authorization: 'Bearer token' } } as any as Request;
        const res = mkRes();
        const next = mkNext;
        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('401 when payload missing userId/role', () => {
        (verifyAccessTokenRaw as jest.Mock).mockReturnValue({ email: 'a@a.com'});
        const req = { headers: {authorization: 'Bearer token' } } as any as Request;
        const res = mkRes();
        const next = mkNext;
        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('next() when payload valid (userId via sub)', () => {
        (verifyAccessTokenRaw as jest.Mock).mockReturnValue({ sub: 123, email: 'a@a.com', role: 0 });
        const req = { headers: {authorization: 'Bearer token' } } as any as Request;
        const res = mkRes();
        const next = jest.fn();
        authenticateToken(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(req.user).toEqual({ userId: '123', email: 'a@a.com', role: "0" });
    });

    it('401 on expired token', () => {
        (verifyAccessTokenRaw as jest.Mock).mockImplementation(() => { const e:any=new Error('expired'); e.name='TokenExpiredError'; throw e; });
        const req = { headers: {authorization: 'Bearer token' } } as any as Request;
        const res = mkRes();
        const next = mkNext;
        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('401 on jsonwebtoken error', () => {
        (verifyAccessTokenRaw as jest.Mock).mockImplementation(() => { const e:any=new Error('bad'); e.name='JsonWebTokenError'; throw e; });
        const req = { headers: {authorization: 'Bearer token' } } as any as Request;
        const res = mkRes();
        const next = mkNext;
        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
    });
});

describe('auth.middleware – requireRole & requireAdmin', () => {
  it('requireRole 403 when role not allowed', () => {
    const mw = requireRole([1]);
    const req = { user: { role: '0' } } as any as Request;
    const res = mkRes(); const next = mkNext();

    mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('requireRole passes when role allowed', () => {
    const mw = requireRole([0, 1]);
    const req = { user: { role: '1' } } as any as Request;
    const res = mkRes(); 
    const next = jest.fn();

    mw(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('requireAdmin denies non-admin', () => {
    const req = { user: { role: '0' } } as any as Request;
    const res = mkRes(); const next = mkNext();

    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('requireAdmin passes admin', () => {
    const req = { user: { role: '1' } } as any as Request;
    const res = mkRes(); 
    const next = jest.fn();

    requireAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});