import dotenv from 'dotenv';

// Load test environment variables if available
try {
  dotenv.config({ path: '.env.test' });
} catch (error) {
  // Fallback to default .env if test env doesn't exist
  dotenv.config();
}

// Ensure JWT secrets exist for tests
if (!process.env.JWT_ACCESS_SECRET) {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret';
}
if (!process.env.JWT_REFRESH_SECRET) {
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
}

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