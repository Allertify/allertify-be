import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

export const prisma = new PrismaClient();

export const createTestUser = async (overrides: any = {}) => {
  return await prisma.user.create({
    data: {
      full_name: 'Test User',
      email: 'test@example.com',
      password: '$2b$10$hashedpassword',
      phone_number: '+6281234567890',
      is_verified: true,
      role: 0,
      ...overrides
    }
  });
};

export const createTestAdmin = async (overrides: any = {}) => {
  return await prisma.user.create({
    data: {
      full_name: 'Test Admin',
      email: 'admin@example.com',
      password: '$2b$10$hashedpassword',
      phone_number: '+6281234567891',
      is_verified: true,
      role: 1,
      ...overrides
    }
  });
};

export const generateTestToken = (userId: number, role: number = 0) => {
  return jwt.sign(
    { 
      sub: userId, 
      email: 'test@example.com', 
      role 
    },
    process.env.JWT_ACCESS_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

export const cleanDatabase = async () => {
  // Clean up in reverse order of dependencies
  await prisma.product_scan.deleteMany();
  await prisma.user_allergen.deleteMany();
  await prisma.emergency_contact.deleteMany();
  await prisma.product_report.deleteMany();
  await prisma.user_product_preference.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.daily_scan_usage.deleteMany();
  await prisma.email_verification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();
  await prisma.allergen.deleteMany();
  await prisma.tier_plan.deleteMany();
};

export const createTestProduct = async (overrides: any = {}) => {
  return await prisma.product.create({
    data: {
      barcode: '1234567890123',
      name: 'Test Product',
      image_url: 'https://example.com/image.jpg',
      nutritional_score: 'A',
      ...overrides
    }
  });
};

export const createTestAllergen = async (overrides: any = {}) => {
  return await prisma.allergen.create({
    data: {
      name: 'Test Allergen',
      description: 'Test allergen description',
      is_custom: false,
      ...overrides
    }
  });
};
