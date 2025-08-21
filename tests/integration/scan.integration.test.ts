import request from 'supertest';
import  app  from '../../src/index';
import { cleanDatabase, createTestUser, createTestProduct, generateTestToken, prisma } from '../helpers/testUtils';

describe('Scan Integration Tests', () => {
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUser();
    authToken = generateTestToken(testUser.id);
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/scans/barcode/:barcode', () => {
    it('should scan barcode successfully', async () => {
      const testProduct = await createTestProduct({
        barcode: '1234567890123'
      });

      const response = await request(app)
        .post('/api/v1/scans/barcode/1234567890123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Barcode scan completed successfully',
        data: expect.any(Object),
        timestamp: expect.any(String)
      });
    });

    it('should return validation error for invalid barcode', async () => {
      const response = await request(app)
        .post('/api/v1/scans/barcode/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'barcode',
            message: expect.stringContaining('8-14 digits')
          })
        ]),
        timestamp: expect.any(String)
      });
    });

    it('should return authentication error without token', async () => {
      const response = await request(app)
        .post('/api/v1/scans/barcode/1234567890123')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Access token is required',
        timestamp: expect.any(String)
      });
    });

    it('should return authentication error with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/scans/barcode/1234567890123')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid'),
        timestamp: expect.any(String)
      });
    });
  });

  describe('POST /api/v1/scans/image', () => {
    it('should scan image successfully', async () => {
      const imageData = {
        imageUrl: 'https://example.com/test-image.jpg',
        productId: 1
      };

      const response = await request(app)
        .post('/api/v1/scans/image')
        .set('Authorization', `Bearer ${authToken}`)
        .send(imageData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Image scan completed successfully',
        data: expect.any(Object),
        timestamp: expect.any(String)
      });
    });

    it('should return validation error for invalid image URL', async () => {
      const imageData = {
        imageUrl: 'invalid-url'
      };

      const response = await request(app)
        .post('/api/v1/scans/image')
        .set('Authorization', `Bearer ${authToken}`)
        .send(imageData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'imageUrl',
            message: expect.stringContaining('valid URL')
          })
        ]),
        timestamp: expect.any(String)
      });
    });
  });

  describe('GET /api/v1/scans/history', () => {
    beforeEach(async () => {
      // Create some test scan data
      const testProduct = await createTestProduct();
      await prisma.product_scan.createMany({
        data: [
          {
            user_id: testUser.id,
            product_id: testProduct.id,
            risk_level: 'LOW',
            risk_explanation: 'Safe for consumption',
            scan_date: new Date(),
            is_saved: true
          },
          {
            user_id: testUser.id,
            product_id: testProduct.id,
            risk_level: 'HIGH',
            risk_explanation: 'Contains allergens',
            scan_date: new Date(),
            is_saved: false
          }
        ]
      });
    });

    it('should return scan history successfully', async () => {
      const response = await request(app)
        .get('/api/v1/scans/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Scan history retrieved successfully',
        data: {
          scans: expect.arrayContaining([
            expect.objectContaining({
              riskLevel: expect.any(String),
              riskExplanation: expect.any(String),
              scanDate: expect.any(String),
              isSaved: expect.any(Boolean)
            })
          ]),
          pagination: {
            limit: expect.any(Number),
            offset: expect.any(Number),
            total: expect.any(Number)
          }
        },
        timestamp: expect.any(String)
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/scans/history?limit=1&offset=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.pagination).toMatchObject({
        limit: 1,
        offset: 0,
        total: expect.any(Number)
      });
      expect(response.body.data.scans).toHaveLength(1);
    });

    it('should filter saved scans only', async () => {
      const response = await request(app)
        .get('/api/v1/scans/history?savedOnly=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.scans).toHaveLength(1);
      expect(response.body.data.scans[0].isSaved).toBe(true);
    });

    it('should return validation error for invalid query params', async () => {
      const response = await request(app)
        .get('/api/v1/scans/history?limit=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'limit',
            message: expect.any(String)
          })
        ]),
        timestamp: expect.any(String)
      });
    });
  });

  describe('GET /api/v1/scans/limit', () => {
    it('should return scan limit information', async () => {
      const response = await request(app)
        .get('/api/v1/scans/limit')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Scan limit information retrieved successfully',
        data: {
          userId: testUser.id,
          currentUsage: expect.any(Number),
          dailyLimit: expect.any(Number),
          remainingScans: expect.any(Number),
          isLimitExceeded: expect.any(Boolean),
          canScan: expect.any(Boolean)
        },
        timestamp: expect.any(String)
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/scans/limit')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Access token is required',
        timestamp: expect.any(String)
      });
    });
  });

  describe('PUT /api/v1/scans/:scanId/save', () => {
    let testScan: any;

    beforeEach(async () => {
      const testProduct = await createTestProduct();
      testScan = await prisma.product_scan.create({
        data: {
          user_id: testUser.id,
          product_id: testProduct.id,
          risk_level: 'LOW',
          risk_explanation: 'Safe for consumption',
          scan_date: new Date(),
          is_saved: false
        }
      });
    });

    it('should toggle save status successfully', async () => {
      const response = await request(app)
        .put(`/api/v1/scans/${testScan.id}/save`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('saved successfully'),
        data: expect.objectContaining({
          isSaved: true
        }),
        timestamp: expect.any(String)
      });
    });

    it('should return error for invalid scan ID', async () => {
      const response = await request(app)
        .put('/api/v1/scans/invalid/save')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid scan ID',
        timestamp: expect.any(String)
      });
    });

    it('should return error for missing scan ID', async () => {
      const response = await request(app)
        .put('/api/v1/scans//save')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/scans/list', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await createTestProduct();
    });

    it('should set product list preference successfully', async () => {
      const listData = {
        productId: testProduct.id,
        listType: 'RED'
      };

      const response = await request(app)
        .post('/api/v1/scans/list')
        .set('Authorization', `Bearer ${authToken}`)
        .send(listData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Preference updated',
        data: {
          productId: testProduct.id,
          listType: 'RED'
        },
        timestamp: expect.any(String)
      });
    });

    it('should remove product list preference', async () => {
      // First set a preference
      await prisma.user_product_preference.create({
        data: {
          user_id: testUser.id,
          product_id: testProduct.id,
          list_type: 'RED'
        }
      });

      const listData = {
        productId: testProduct.id
      };

      const response = await request(app)
        .post('/api/v1/scans/list')
        .set('Authorization', `Bearer ${authToken}`)
        .send(listData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Preference removed',
        data: null,
        timestamp: expect.any(String)
      });
    });

    it('should return validation error for invalid list type', async () => {
      const listData = {
        productId: testProduct.id,
        listType: 'INVALID'
      };

      const response = await request(app)
        .post('/api/v1/scans/list')
        .set('Authorization', `Bearer ${authToken}`)
        .send(listData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'listType must be RED or GREEN',
        timestamp: expect.any(String)
      });
    });

    it('should return validation error for missing product ID', async () => {
      const listData = {
        listType: 'RED'
      };

      const response = await request(app)
        .post('/api/v1/scans/list')
        .set('Authorization', `Bearer ${authToken}`)
        .send(listData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'productId is required and must be a number',
        timestamp: expect.any(String)
      });
    });
  });
});
