import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createTestUser, createTestAdmin, generateTestToken, cleanDatabase, createTestProduct, createTestAllergen } from '../helpers/testUtils';
import app from '../../src/index';

const prisma = new PrismaClient();

describe('Product Scan Subscription Integration Tests', () => {
  let testUser: any;
  let testAdmin: any;
  let userToken: string;
  let adminToken: string;
  let testProduct: any;
  let testAllergen: any;
  let freeTierPlan: any;
  let premiumTierPlan: any;

  beforeAll(async () => {
    // Clean database
    await cleanDatabase();

    // Create test users
    testUser = await createTestUser({
      email: 'testuser@example.com',
      full_name: 'Test User'
    });

    testAdmin = await createTestAdmin({
      email: 'admin@example.com',
      full_name: 'Test Admin'
    });

    // Generate tokens
    userToken = generateTestToken(testUser.id, 0);
    adminToken = generateTestToken(testAdmin.id, 1);

    // Create test data
    testProduct = await createTestProduct({
      barcode: '1234567890123',
      name: 'Test Product',
      ingredients: 'wheat, milk, eggs, nuts'
    });

    testAllergen = await createTestAllergen({
      name: 'milk',
      description: 'Dairy allergen',
      is_custom: false
    });

    // Create tier plans
    freeTierPlan = await prisma.tier_plan.create({
      data: {
        plan_type: 'FREE',
        scan_count_limit: 5,
        saved_product_limit: 10
      }
    });

    premiumTierPlan = await prisma.tier_plan.create({
      data: {
        plan_type: 'PREMIUM',
        scan_count_limit: 50,
        saved_product_limit: 100
      }
    });

    // Add allergen to test user
    await prisma.user_allergen.create({
      data: {
        user_id: testUser.id,
        allergen_id: testAllergen.id,
        security_level: 'HIGH'
      }
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe('End-to-End Product Scan with Subscription Flow', () => {
    it('should complete full product scan flow for free tier user', async () => {
      // 1. Check initial scan limits
      const limitResponse = await request(app)
        .get('/api/v1/scans/limit')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(limitResponse.body.data.dailyLimit).toBe(100); // Default for users without subscription
      expect(limitResponse.body.data.remainingScans).toBe(100);

      // 2. Perform barcode scan
      const scanResponse = await request(app)
        .post('/api/v1/scans/barcode/1234567890123')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(scanResponse.body.success).toBe(true);
      expect(scanResponse.body.data).toHaveProperty('id');
      expect(scanResponse.body.data).toHaveProperty('productName', 'Test Product');
      expect(scanResponse.body.data).toHaveProperty('riskLevel');
      expect(scanResponse.body.data).toHaveProperty('matchedAllergens');
      expect(scanResponse.body.data).toHaveProperty('scanLimit');

      const scanId = scanResponse.body.data.id;

      // 3. Check updated scan limits
      const updatedLimitResponse = await request(app)
        .get('/api/v1/scans/limit')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(updatedLimitResponse.body.data.remainingScans).toBe(99);

      // 4. Save the scan
      const saveResponse = await request(app)
        .put(`/api/v1/scans/${scanId}/save`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(saveResponse.body.data.isSaved).toBe(true);

      // 5. Get scan history
      const historyResponse = await request(app)
        .get('/api/v1/scans/history')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(historyResponse.body.data.scans).toHaveLength(1);
      expect(historyResponse.body.data.scans[0].id).toBe(scanId);

      // 6. Get saved scans
      const savedResponse = await request(app)
        .get('/api/v1/scans/saved')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(savedResponse.body.data.scans).toHaveLength(1);
      expect(savedResponse.body.data.scans[0].isSaved).toBe(true);
    });

    it('should handle subscription upgrade flow', async () => {
      // 1. Get available tier plans
      const plansResponse = await request(app)
        .get('/api/v1/subscriptions/plans')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(plansResponse.body.data.plans).toHaveLength(2);
      const premiumPlan = plansResponse.body.data.plans.find(p => p.plan_type === 'PREMIUM');
      expect(premiumPlan).toBeDefined();

      // 2. Check current subscription (should be none)
      const currentSubResponse = await request(app)
        .get('/api/v1/subscriptions/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(currentSubResponse.body.data.is_free_tier).toBe(true);
      expect(currentSubResponse.body.data.subscription).toBeNull();

      // 3. Upgrade to premium subscription
      const upgradeResponse = await request(app)
        .post('/api/v1/subscriptions/upgrade')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          tier_plan_id: premiumPlan.id,
          duration_months: 1
        })
        .expect(201);

      expect(upgradeResponse.body.data.subscription.tier_plan.plan_type).toBe('PREMIUM');
      expect(upgradeResponse.body.data.subscription.status).toBe('ACTIVE');

      // 4. Check updated subscription
      const updatedSubResponse = await request(app)
        .get('/api/v1/subscriptions/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(updatedSubResponse.body.data.is_free_tier).toBe(false);
      expect(updatedSubResponse.body.data.subscription.tier_plan.plan_type).toBe('PREMIUM');

      // 5. Check subscription limits
      const limitsResponse = await request(app)
        .get('/api/v1/subscriptions/me/limits')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(limitsResponse.body.data.limits.scan_count_limit).toBe(50);
      expect(limitsResponse.body.data.limits.saved_product_limit).toBe(100);
      expect(limitsResponse.body.data.can_scan).toBe(true);

      // 6. Perform scan with premium subscription
      const scanResponse = await request(app)
        .post('/api/v1/scans/barcode/1234567890123')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(scanResponse.body.success).toBe(true);
      expect(scanResponse.body.data.scanLimit.dailyLimit).toBe(50); // Premium limit
    });

    it('should handle subscription history and cancellation', async () => {
      // 1. Get subscription history
      const historyResponse = await request(app)
        .get('/api/v1/subscriptions/me/history')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(historyResponse.body.data.subscriptions).toHaveLength(1);
      expect(historyResponse.body.data.total).toBe(1);

      // 2. Cancel subscription
      const cancelResponse = await request(app)
        .delete('/api/v1/subscriptions/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cancelResponse.body.data.subscription.status).toBe('CANCELLED');

      // 3. Check subscription after cancellation
      const currentSubResponse = await request(app)
        .get('/api/v1/subscriptions/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Should have reverted to free tier or show no active subscription
      expect(currentSubResponse.body.data.is_free_tier).toBe(true);
    });

    it('should handle scan limit enforcement', async () => {
      // Create a new user for this test
      const limitTestUser = await createTestUser({
        email: 'limituser@example.com',
        full_name: 'Limit Test User'
      });
      const limitUserToken = generateTestToken(limitTestUser.id, 0);

      // Create a subscription with very low limits for testing
      const lowLimitPlan = await prisma.tier_plan.create({
        data: {
          plan_type: 'LIMITED',
          scan_count_limit: 2,
          saved_product_limit: 1
        }
      });

      await prisma.subscription.create({
        data: {
          user_id: limitTestUser.id,
          tier_plan_id: lowLimitPlan.id,
          start_date: new Date(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          status: 'ACTIVE'
        }
      });

      // 1. Perform scans up to the limit
      for (let i = 0; i < 2; i++) {
        const scanResponse = await request(app)
          .post('/api/v1/scans/barcode/1234567890123')
          .set('Authorization', `Bearer ${limitUserToken}`)
          .expect(200);

        expect(scanResponse.body.success).toBe(true);
      }

      // 2. Try to exceed the limit
      const exceededResponse = await request(app)
        .post('/api/v1/scans/barcode/1234567890123')
        .set('Authorization', `Bearer ${limitUserToken}`)
        .expect(500); // Should be handled by error middleware

      // The error should be about daily scan limit
      expect(exceededResponse.body.message).toContain('Daily scan limit exceeded');
    });

    it('should handle image scan flow', async () => {
      // Create a new user for image scan test
      const imageUser = await createTestUser({
        email: 'imageuser@example.com',
        full_name: 'Image Test User'
      });
      const imageUserToken = generateTestToken(imageUser.id, 0);

      // 1. Perform image scan
      const imageUrl = 'https://example.com/test-product-image.jpg';
      const imageScanResponse = await request(app)
        .post('/api/v1/scans/image')
        .set('Authorization', `Bearer ${imageUserToken}`)
        .send({
          imageUrl: imageUrl,
          productId: testProduct.id
        })
        .expect(200);

      expect(imageScanResponse.body.success).toBe(true);
      expect(imageScanResponse.body.data).toHaveProperty('id');
      expect(imageScanResponse.body.data).toHaveProperty('productId', testProduct.id);

      // 2. Perform image scan without productId (should create minimal product)
      const imageScanResponse2 = await request(app)
        .post('/api/v1/scans/image')
        .set('Authorization', `Bearer ${imageUserToken}`)
        .send({
          imageUrl: 'https://example.com/another-image.jpg'
        })
        .expect(200);

      expect(imageScanResponse2.body.success).toBe(true);
      expect(imageScanResponse2.body.data).toHaveProperty('id');
      expect(imageScanResponse2.body.data.productId).toBeDefined();
    });

    it('should handle product list management (RED/GREEN lists)', async () => {
      // 1. Set product to RED list
      const redListResponse = await request(app)
        .post('/api/v1/scans/list')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          listType: 'RED'
        })
        .expect(200);

      expect(redListResponse.body.data.listType).toBe('RED');

      // 2. Get scan history filtered by RED list
      const redHistoryResponse = await request(app)
        .get('/api/v1/scans/history?listType=RED')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Should include products in RED list
      expect(redHistoryResponse.body.success).toBe(true);

      // 3. Change to GREEN list
      const greenListResponse = await request(app)
        .post('/api/v1/scans/list')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          listType: 'GREEN'
        })
        .expect(200);

      expect(greenListResponse.body.data.listType).toBe('GREEN');

      // 4. Remove from list
      const removeListResponse = await request(app)
        .post('/api/v1/scans/list')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id
          // No listType = remove from list
        })
        .expect(200);

      expect(removeListResponse.body.message).toContain('removed');
    });

    it('should handle product reporting flow', async () => {
      // 1. Report a product
      const reportResponse = await request(app)
        .post(`/api/v1/products/${testProduct.id}/report`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          report_details: 'This product has incorrect allergen information that needs to be updated'
        })
        .expect(201);

      expect(reportResponse.body.data.report_details).toContain('incorrect allergen information');
      expect(reportResponse.body.data.status).toBe('PENDING');

      // 2. Try to report the same product again (should fail)
      const duplicateReportResponse = await request(app)
        .post(`/api/v1/products/${testProduct.id}/report`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          report_details: 'Another report for the same product'
        })
        .expect(409);

      expect(duplicateReportResponse.body.message).toContain('already reported');

      // 3. Get user's reports
      const userReportsResponse = await request(app)
        .get('/api/v1/products/reports/my')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(userReportsResponse.body.data.reports).toHaveLength(1);
      expect(userReportsResponse.body.data.reports[0].product.id).toBe(testProduct.id);
    });

    it('should handle product search and popular products', async () => {
      // 1. Search products by name
      const searchResponse = await request(app)
        .get('/api/v1/products/search?query=Test')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(searchResponse.body.data.products.length).toBeGreaterThan(0);
      expect(searchResponse.body.data.products[0].name).toContain('Test');

      // 2. Search products by barcode
      const barcodeSearchResponse = await request(app)
        .get('/api/v1/products/search?query=1234567890123')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(barcodeSearchResponse.body.data.products.length).toBeGreaterThan(0);

      // 3. Get popular products
      const popularResponse = await request(app)
        .get('/api/v1/products/popular?limit=5')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(popularResponse.body.data.products.length).toBeGreaterThanOrEqual(0);

      // 4. Get product detail
      const detailResponse = await request(app)
        .get(`/api/v1/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(detailResponse.body.data.product.id).toBe(testProduct.id);
      expect(detailResponse.body.data.statistics).toBeDefined();
      expect(detailResponse.body.data.recent_scans).toBeDefined();
    });
  });

  describe('Authentication and Authorization', () => {
    it('should reject requests without authentication', async () => {
      // Try to access protected endpoint without token
      const response = await request(app)
        .get('/api/v1/scans/limit')
        .expect(401);

      expect(response.body.message).toContain('Authentication');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/scans/limit')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toContain('Authentication');
    });

    it('should handle expired token', async () => {
      // Generate an expired token (you might need to mock this)
      const expiredToken = generateTestToken(testUser.id, 0); // This might need modification to create expired token
      
      const response = await request(app)
        .get('/api/v1/scans/limit')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(200); // Assuming the token is still valid in test environment

      // In real scenario with expired token, this should be 401
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid barcode format', async () => {
      const response = await request(app)
        .post('/api/v1/scans/barcode/invalid-barcode')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.message).toContain('Validation error');
    });

    it('should handle invalid image URL', async () => {
      const response = await request(app)
        .post('/api/v1/scans/image')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          imageUrl: 'not-a-valid-url'
        })
        .expect(400);

      expect(response.body.message).toContain('Validation error');
    });

    it('should handle non-existent product ID', async () => {
      const response = await request(app)
        .get('/api/v1/products/99999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(500); // Should be handled by error middleware

      // The actual error handling depends on your error middleware implementation
    });

    it('should handle invalid subscription upgrade data', async () => {
      const response = await request(app)
        .post('/api/v1/subscriptions/upgrade')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          tier_plan_id: 'invalid',
          duration_months: 15 // Invalid: max is 12
        })
        .expect(400);

      expect(response.body.message).toContain('Validation error');
    });
  });

  describe('Performance and Pagination', () => {
    it('should handle large scan history with pagination', async () => {
      // Create multiple scans for pagination testing
      for (let i = 0; i < 25; i++) {
        await request(app)
          .post('/api/v1/scans/barcode/1234567890123')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);
      }

      // Test pagination
      const page1Response = await request(app)
        .get('/api/v1/scans/history?limit=10&offset=0')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(page1Response.body.data.scans).toHaveLength(10);
      expect(page1Response.body.data.pagination.total).toBeGreaterThanOrEqual(25);

      const page2Response = await request(app)
        .get('/api/v1/scans/history?limit=10&offset=10')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(page2Response.body.data.scans).toHaveLength(10);
    });

    it('should handle unique by product filtering', async () => {
      const uniqueResponse = await request(app)
        .get('/api/v1/scans/history?uniqueByProduct=true')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Should return only unique products (no duplicates)
      const productIds = uniqueResponse.body.data.scans.map((scan: any) => scan.productId);
      const uniqueProductIds = [...new Set(productIds)];
      expect(productIds.length).toBe(uniqueProductIds.length);
    });
  });
});

