import { NextFunction, Request, Response } from 'express';
import * as subscriptionController from '../../../src/controllers/subscription.controller';
import subscriptionService from '../../../src/services/subscription.service';
import { sendSuccess, sendError } from '../../../src/utils/response';

// Prevent server bootstrap triggered by modules that import src/index
jest.mock('../../../src/index', () => ({ prisma: {} }));

// Mocks
jest.mock('../../../src/services/subscription.service');
jest.mock('../../../src/utils/response');

describe('SubscriptionController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;
  let mockSendSuccess: jest.MockedFunction<typeof sendSuccess>;
  let mockSendError: jest.MockedFunction<typeof sendError>;
  let mockService: jest.Mocked<typeof subscriptionService>;
  let mockNext: jest.Mock;
  beforeEach(() => {
    jest.clearAllMocks();

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockRes = {
      status: mockStatus,
      json: mockJson
    } as any;

    mockReq = {
      user: { userId: '1', email: 'test@example.com', role: 'user' } as any,
      body: {},
      params: {},
      query: {}
    } as any;

    mockNext = jest.fn();

    mockService = subscriptionService as jest.Mocked<typeof subscriptionService>;
    mockSendSuccess = sendSuccess as jest.MockedFunction<typeof sendSuccess>;
    mockSendError = sendError as jest.MockedFunction<typeof sendError>;
  });

  describe('getTierPlans', () => {
    it('should return all tier plans successfully', async () => {
      const mockPlans = [
        { id: 1, plan_type: 'FREE', scan_count_limit: 5, saved_product_limit: 10 },
        { id: 2, plan_type: 'PREMIUM', scan_count_limit: 50, saved_product_limit: 100 }
      ];
      (mockService.getAllTierPlans as jest.Mock).mockResolvedValue(mockPlans as any);

      await subscriptionController.getTierPlans(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockService.getAllTierPlans).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Tier plans retrieved successfully',
        data: {
          plans: mockPlans.map(plan => ({
            id: plan.id,
            plan_type: plan.plan_type,
            scan_count_limit: plan.scan_count_limit,
            saved_product_limit: plan.saved_product_limit
          }))
        }
      });
    });
  });

  describe('getUserSubscription', () => {
    it('should return user subscription when it exists', async () => {
      const mockSubscription = {
        id: 1,
        tier_plan: {
          id: 2,
          plan_type: 'PREMIUM',
          scan_count_limit: 50,
          saved_product_limit: 100
        },
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-02-01'),
        status: 'ACTIVE'
      } as any;
      (mockService.getUserSubscription as jest.Mock).mockResolvedValue(mockSubscription);

      await subscriptionController.getUserSubscription(mockReq as Request, mockRes as Response,mockNext as NextFunction);

      expect(mockService.getUserSubscription).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'User subscription retrieved successfully',
        data: {
          subscription: {
            id: mockSubscription.id,
            tier_plan: {
              id: mockSubscription.tier_plan.id,
              plan_type: mockSubscription.tier_plan.plan_type,
              scan_count_limit: mockSubscription.tier_plan.scan_count_limit,
              saved_product_limit: mockSubscription.tier_plan.saved_product_limit
            },
            start_date: mockSubscription.start_date,
            end_date: mockSubscription.end_date,
            status: mockSubscription.status
          },
          is_free_tier: false
        }
      });
    });

    it('should return null when no subscription exists', async () => {
      (mockService.getUserSubscription as jest.Mock).mockResolvedValue(null);

      await subscriptionController.getUserSubscription(mockReq as Request, mockRes as Response,mockNext as NextFunction);

      expect(mockService.getUserSubscription).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'No active subscription found',
        data: {
          subscription: null,
          is_free_tier: true
        }
      });
    });
  });

  describe('getUserSubscriptionHistory', () => {
    it('should return subscription history with default pagination', async () => {
      const mockHistory = {
        subscriptions: [
          {
            id: 1,
            tier_plan: { id: 2, plan_type: 'PREMIUM', scan_count_limit: 50, saved_product_limit: 100 },
            start_date: new Date(),
            end_date: new Date(),
            status: 'EXPIRED'
          }
        ],
        total: 5
      } as any;
      (mockService.getUserSubscriptionHistory as jest.Mock).mockResolvedValue(mockHistory);

      await subscriptionController.getUserSubscriptionHistory(mockReq as Request, mockRes as Response,mockNext as NextFunction);

      expect(mockService.getUserSubscriptionHistory).toHaveBeenCalledWith(1, 10, 0);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Subscription history retrieved successfully',
        data: {
          subscriptions: mockHistory.subscriptions.map((sub: any) => ({
            id: sub.id,
            tier_plan: sub.tier_plan,
            start_date: sub.start_date,
            end_date: sub.end_date,
            status: sub.status
          })),
          pagination: {
            limit: 10,
            offset: 0,
            total: mockHistory.total
          }
        }
      });
    });
  });

  describe('upgradeSubscription', () => {
    it('should upgrade subscription successfully', async () => {
      mockReq.body = {
        tier_plan_id: 2,
        duration_months: 3
      } as any;
      const mockNewSubscription = {
        id: 2,
        tier_plan: {
          id: 2,
          plan_type: 'PREMIUM',
          scan_count_limit: 50,
          saved_product_limit: 100
        },
        start_date: new Date(),
        end_date: new Date(),
        status: 'ACTIVE'
      } as any;
      (mockService.createOrUpgradeSubscription as jest.Mock).mockResolvedValue(mockNewSubscription);

      await subscriptionController.upgradeSubscription(mockReq as Request, mockRes as Response,mockNext as NextFunction);

      expect(mockService.createOrUpgradeSubscription).toHaveBeenCalledWith(1, 2, 3);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Subscription upgraded successfully',
        data: {
          subscription: {
            id: mockNewSubscription.id,
            tier_plan: {
              id: mockNewSubscription.tier_plan.id,
              plan_type: mockNewSubscription.tier_plan.plan_type,
              scan_count_limit: mockNewSubscription.tier_plan.scan_count_limit,
              saved_product_limit: mockNewSubscription.tier_plan.saved_product_limit
            },
            start_date: mockNewSubscription.start_date,
            end_date: mockNewSubscription.end_date,
            status: mockNewSubscription.status
          }
        }
      });
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      const mockCancelledSubscription = {
        id: 1,
        tier_plan: { id: 2, plan_type: 'PREMIUM' },
        start_date: new Date(),
        end_date: new Date(),
        status: 'CANCELLED'
      } as any;
      (mockService.cancelSubscription as jest.Mock).mockResolvedValue(mockCancelledSubscription);

      await subscriptionController.cancelSubscription(mockReq as Request, mockRes as Response,mockNext as NextFunction);

      expect(mockService.cancelSubscription).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Subscription cancelled successfully',
        data: {
          subscription: {
            id: mockCancelledSubscription.id,
            tier_plan: {
              id: mockCancelledSubscription.tier_plan.id,
              plan_type: mockCancelledSubscription.tier_plan.plan_type
            },
            start_date: mockCancelledSubscription.start_date,
            end_date: mockCancelledSubscription.end_date,
            status: mockCancelledSubscription.status
          }
        }
      });
    });
  });

  describe('getSubscriptionLimits', () => {
    it('should return subscription limits successfully', async () => {
      const mockLimitsInfo = {
        dailyScanLimit: 50,
        dailyScanUsed: 10,
        dailyScanRemaining: 40,
        savedProductLimit: 100,
        savedProductCount: 25,
        savedProductRemaining: 75
      } as any;
      (mockService.checkSubscriptionLimits as jest.Mock).mockResolvedValue(mockLimitsInfo);

      await subscriptionController.getSubscriptionLimits(mockReq as Request, mockRes as Response,mockNext as NextFunction);

      expect(mockService.checkSubscriptionLimits).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Subscription limits retrieved successfully',
        data: mockLimitsInfo
      });
    });
  });
});

