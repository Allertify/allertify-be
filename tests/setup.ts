import { PrismaClient } from '@prisma/client';

// Jest globals are available without import in test files
declare const beforeAll: (fn: () => void | Promise<void>) => void;
declare const afterAll: (fn: () => void | Promise<void>) => void;

// Global test setup
beforeAll(async () => {
  // Setup test database connection
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/allertify_test',
      },
    },
  });

  // Connect to test database
  await prisma.$connect();
  
  // Clean up test database
  await prisma.user.deleteMany();
  await prisma.allergen.deleteMany();
  
  await prisma.$disconnect();
});

// Global test teardown
afterAll(async () => {
    //if needed
});