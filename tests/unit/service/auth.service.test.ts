import { PrismaClient } from "@prisma/client";
import  argon2  from "argon2";
import {sendOTPEmail } from '../../../src/utils/mailer';
import { createUser, verifyOtpAndIssueToken, loginUser } from '../../../src/services/auth.service';
import  jwt  from "jsonwebtoken";

// mocks
const mockPrisma = {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    email_verification: { deleteMany: jest.fn(), create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    tier_plan: { findUnique: jest.fn() },
    $transaction: jest.fn(),
};

jest.mock('@prisma/client', () => {
    return { PrismaClient: jest.fn(() => mockPrisma) };
});

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'signed.jwt.token'),
  verify: jest.fn(),
}));

jest.mock('argon2', () => ({
    hash: jest.fn(async () => 'hashed-pass'),
    verify: jest.fn(async () => true),
}));

jest.mock('../../../src/utils/mailer', () => ({
    sendOTPEmail: jest.fn(async () => undefined),
    sendResetPasswordEmail: jest.fn(async () => undefined),
}));

jest.mock('../../../src/services/subscription.service', () => ({
    _esModule: true,
    default: { createOrUpgradeSubscription: jest.fn(async () => undefined) },
}));

describe('auth.service - createUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  });

  it('returns ALREADY_VERIFIED when user exists & verified', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, is_verified: true });
    const res = await createUser({ full_name:'A', email:'a@a.com', password:'Passw0rd!', phone_number:'+62' });
    expect(res).toEqual({ status: 'ALREADY_VERIFIED' });
    expect(mockPrisma.email_verification.create).not.toHaveBeenCalled();
  });

  it('creates user, generates OTP, sends email (REGISTERED)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: 42 });
    mockPrisma.email_verification.deleteMany.mockResolvedValue({});
    mockPrisma.email_verification.create.mockResolvedValue({});
    const res = await createUser({ full_name:'A', email:'a@a.com', password:'Passw0rd!', phone_number:'+62' });

    expect(argon2.hash).toHaveBeenCalled();
    expect(mockPrisma.user.create).toHaveBeenCalled();
    expect(mockPrisma.email_verification.create).toHaveBeenCalled();
    expect(sendOTPEmail).toHaveBeenCalled();
    expect(res).toEqual({ status: 'REGISTERED' });
  });

  it('resends OTP when user exists but not verified (OTP_RESENT)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 5, is_verified: false });
    const res = await createUser({ full_name:'A', email:'a@a.com', password:'Passw0rd!', phone_number:'+62' });
    expect(mockPrisma.email_verification.create).toHaveBeenCalled();
    expect(res).toEqual({ status: 'OTP_RESENT' });
  });
});

describe('auth.service – verifyOtpAndIssueToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  });

  it('USER_NOT_FOUND when email not exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const res = await verifyOtpAndIssueToken({ email:'x@x.com', otp:'123456' });
    expect(res).toEqual({ ok: false, reason: 'USER_NOT_FOUND' });
  });

  it('OTP_NOT_FOUND_OR_EXPIRED when no record', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 10, is_verified: false, email:'x@x.com', role: 0 });
    mockPrisma.email_verification.findFirst.mockResolvedValue(null);
    const res = await verifyOtpAndIssueToken({ email:'x@x.com', otp:'123456' });
    expect(res).toEqual({ ok: false, reason: 'OTP_NOT_FOUND_OR_EXPIRED' });
  });

  it('OTP_EXPIRED when expired', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 10, is_verified: false, email:'x@x.com', role: 0 });
    mockPrisma.email_verification.findFirst.mockResolvedValue({
      id: 1, otp_code: '123456', otp_code_expired: new Date(Date.now() - 1000), usedAt: null,
    });
    const res = await verifyOtpAndIssueToken({ email:'x@x.com', otp:'123456' });
    expect(res).toEqual({ ok: false, reason: 'OTP_EXPIRED' });
    expect(mockPrisma.email_verification.update).toHaveBeenCalled();
  });

  it('OTP_INVALID when mismatch', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 10, is_verified: false, email:'x@x.com', role: 0 });
    mockPrisma.email_verification.findFirst.mockResolvedValue({
      id: 1, otp_code: '654321', otp_code_expired: new Date(Date.now() + 10000), usedAt: null,
    });
    const res = await verifyOtpAndIssueToken({ email:'x@x.com', otp:'123456' });
    expect(res).toEqual({ ok: false, reason: 'OTP_INVALID' });
  });

  it('success issues token & verifies user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 10, is_verified: false, email:'x@x.com', role: 0, full_name: 'X' });
    mockPrisma.email_verification.findFirst.mockResolvedValue({
      id: 1, otp_code: '123456', otp_code_expired: new Date(Date.now() + 10000), usedAt: null,
    });
    mockPrisma.tier_plan.findUnique.mockResolvedValue({ id: 99 });
    const res = await verifyOtpAndIssueToken({ email:'x@x.com', otp:'123456' });

    expect(jwt.sign).toHaveBeenCalled();
    expect(res.ok).toBe(true);
    expect(res).toHaveProperty('accessToken', 'signed.jwt.token');
    expect((res.user as any).is_verified).toBe(true);
  });
});

describe('auth.service – loginUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  });

  it('INVALID_CREDENTIALS when user not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const res = await loginUser({ email:'a@a.com', password:'x' });
    expect(res).toEqual({ ok: false, reason: 'INVALID_CREDENTIALS' });
  });

  it('USER_NOT_VERIFIED when not verified', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, is_verified: false });
    const res = await loginUser({ email:'a@a.com', password:'x' });
    expect(res).toEqual({ ok: false, reason: 'USER_NOT_VERIFIED' });
  });

  it('INVALID_CREDENTIALS when password wrong', async () => {
    (argon2.verify as jest.Mock).mockResolvedValueOnce(false);
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, is_verified: true, password: 'hashed', email:'a@a.com', role: 0, full_name:'A' });
    const res = await loginUser({ email:'a@a.com', password:'bad' });
    expect(res).toEqual({ ok: false, reason: 'INVALID_CREDENTIALS' });
  });

  it('success returns token & user', async () => {
    (argon2.verify as jest.Mock).mockResolvedValueOnce(true);
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, is_verified: true, password: 'hashed', email:'a@a.com', role: 0, full_name:'A' });
    const res = await loginUser({ email:'a@a.com', password:'good' });
    expect(res.ok).toBe(true);
    expect(res).toHaveProperty('accessToken', 'signed.jwt.token');
  });
});