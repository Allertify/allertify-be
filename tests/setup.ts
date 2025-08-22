import dotenv from 'dotenv';

// Load test environment variables if available
try {
  dotenv.config({ path: '.env.test' });
} catch (error) {
  // Fallback to default .env if test env doesn't exist
  dotenv.config();
}

// env for auth
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

process.env.SMTP_USER = process.env.SMTP_USER || 'dummy@gmail.com';
process.env.SMTP_PASS = process.env.SMTP_PASS || 'dummy-pass';
process.env.SMTP_FROM = process.env.SMTP_FROM || 'Allertify Test <test@gmail.com>';

// Jest globals are available without import in test files
declare const beforeAll: (fn: () => void | Promise<void>) => void;
declare const afterAll: (fn: () => void | Promise<void>) => void;

// Global test setup
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Mock console methods for cleaner test output
  const originalError = console.error;
  console.error = (...args) => {
    // Only show actual test errors, not expected ones
    if (!args[0]?.toString().includes('Token verification error')) {
      originalError(...args);
    }
  };
  
  console.log('✅ Test environment ready');
});

// Global test teardown
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  console.log('✅ Test cleanup complete');
});