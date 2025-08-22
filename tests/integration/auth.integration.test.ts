import request from 'supertest';
import app from '../../src/index';
import { prisma, cleanDatabase } from '../helpers/testUtils';

//mock mailer
jest.mock('../../src/utils/mailer', () => ({
  sendOTPEmail: jest.fn(async () => undefined),
  sendResetPasswordEmail: jest.fn(async () => undefined),
}));

describe('Auth Integration', () => {
  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret';
  });

  beforeEach(async () => {
    await cleanDatabase();
    await prisma.tier_plan.create({
      data: { plan_type: 'FREE', scan_count_limit: 10, saved_product_limit: 20 },
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('registers user and sends OTP (201)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          full_name: 'Alice',
          email: 'alice@example.com',
          password: 'Passw0rd!',
          phone_number: '+628111111111'
        })
        .expect(201);

      expect(res.body).toMatchObject({
        success: true,
        message: expect.stringContaining('OTP'),
        data: null
      });

      const user = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
      expect(user).toBeTruthy();

      const otp = await prisma.email_verification.findFirst({ where: { user_id: user!.id } });
      expect(otp).toBeTruthy();
    });

    it('resends OTP when same email not verified (200)', async () => {
      //first time
      await request(app).post('/api/v1/auth/register').send({
        full_name: 'Bob',
        email: 'bob@example.com',
        password: 'Passw0rd!',
        phone_number: '+628222222222'
      }).expect(201);

      //second time
      const res2 = await request(app).post('/api/v1/auth/register').send({
        full_name: 'Bob',
        email: 'bob@example.com',
        password: 'Passw0rd!',
        phone_number: '+628222222222'
      }).expect(200);

      expect(res2.body.message).toMatch(/OTP has been resent/i);
    });
  });

  describe('POST /api/v1/auth/otp', () => {
    it('fails with invalid OTP', async () => {
      //register
      await request(app).post('/api/v1/auth/register').send({
        full_name: 'C',
        email: 'c@example.com',
        password: 'Passw0rd!',
        phone_number: '+6283'
      }).expect(201);

      const res = await request(app).post('/api/v1/auth/otp').send({
        email: 'c@example.com',
        otp: '000000'
      }).expect(400);

      expect(res.body.message).toMatch(/Invalid OTP|OTP not found/i);
    });

    it('verifies with correct OTP and returns token', async () => {
      await request(app).post('/api/v1/auth/register').send({
        full_name: 'D',
        email: 'd@example.com',
        password: 'Passw0rd!',
        phone_number: '+6284'
      }).expect(201);

      const user = await prisma.user.findUnique({ where: { email: 'd@example.com' } });
      const lastOtp = await prisma.email_verification.findFirst({
        where: { user_id: user!.id },
        orderBy: { createdAt: 'desc' }
      });

      const res = await request(app).post('/api/v1/auth/otp').send({
        email: 'd@example.com',
        otp: lastOtp!.otp_code
      }).expect(200);

      expect(res.body.data).toMatchObject({
        accessToken: expect.any(String),
        user: expect.objectContaining({
          id: user!.id,
          email: 'd@example.com',
          isVerified: true
        })
      });
    });

    it('fails when OTP expired', async () => {
      await request(app).post('/api/v1/auth/register').send({
        full_name: 'E',
        email: 'e@example.com',
        password: 'Passw0rd!',
        phone_number: '+6285'
      }).expect(201);

      const user = await prisma.user.findUnique({ where: { email: 'e@example.com' } });
      const otp = await prisma.email_verification.findFirst({ where: { user_id: user!.id } });

      //make it expired
      await prisma.email_verification.update({
        where: { id: otp!.id },
        data: { otp_code_expired: new Date(Date.now() - 1000) }
      });

      const res = await request(app).post('/api/v1/auth/otp').send({
        email: 'e@example.com',
        otp: otp!.otp_code
      }).expect(400);

      expect(res.body.message).toMatch(/expired/i);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('denies unverified account', async () => {
      await request(app).post('/api/v1/auth/register').send({
        full_name: 'F',
        email: 'f@example.com',
        password: 'Passw0rd!',
        phone_number: '+6286'
      }).expect(201);

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'f@example.com',
        password: 'Passw0rd!'
      }).expect(403);

      expect(res.body.message).toMatch(/not verified/i);
    });

    it('fails with wrong password', async () => {
      //register + verify
      await request(app).post('/api/v1/auth/register').send({
        full_name: 'G',
        email: 'g@example.com',
        password: 'Passw0rd!',
        phone_number: '+6287'
      }).expect(201);

      const user = await prisma.user.findUnique({ where: { email: 'g@example.com' } });
      const otp = await prisma.email_verification.findFirst({ where: { user_id: user!.id } });
      await request(app).post('/api/v1/auth/otp').send({ email: 'g@example.com', otp: otp!.otp_code }).expect(200);

      //wrong pass
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'g@example.com',
        password: 'WRONGpass1!'
      }).expect(401);

      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it('success login', async () => {
      await request(app).post('/api/v1/auth/register').send({
        full_name: 'H',
        email: 'h@example.com',
        password: 'Passw0rd!',
        phone_number: '+6288'
      }).expect(201);

      const user = await prisma.user.findUnique({ where: { email: 'h@example.com' } });
      const otp = await prisma.email_verification.findFirst({ where: { user_id: user!.id } });
      await request(app).post('/api/v1/auth/otp').send({ email: 'h@example.com', otp: otp!.otp_code }).expect(200);

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'h@example.com',
        password: 'Passw0rd!'
      }).expect(200);

      expect(res.body.data).toMatchObject({
        accessToken: expect.any(String),
        user: expect.objectContaining({ email: 'h@example.com', isVerified: true })
      });
    });
  });
});
