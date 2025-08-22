import subscriptionService from '../../../src/services/subscription.service';

// Mock PrismaClient constructor
const mockPrismaClient = {
  tier_plan: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  subscription: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    groupBy: jest.fn(),
  },
  daily_scan_usage: {
    findFirst: jest.fn(),
  },
  product_scan: {
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient)
}));

describe('SubscriptionService', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('getAllTierPlans', () => {
    it('should return all tier plans', async () => {
      // Arrange
      const mockTierPlans = [
        { id: 1, plan_type: 'FREE', scan_count_limit: 5, saved_product_limit: 10 },
        { id: 2, plan_type: 'PREMIUM', scan_count_limit: 50, saved_product_limit: 100 },
        { id: 3, plan_type: 'ENTERPRISE', scan_count_limit: 500, saved_product_limit: 1000 }
      ];
      mockPrismaClient.tier_plan.findMany.mockResolvedValue(mockTierPlans);

      // Act
      const result = await subscriptionService.getAllTierPlans();

      // Assert
      expect(mockPrismaClient.tier_plan.findMany).toHaveBeenCalledWith({
        orderBy: { scan_count_limit: 'asc' }
      });
      expect(result).toEqual(mockTierPlans);
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockPrismaClient.tier_plan.findMany.mockRejectedValue(dbError);

      // Act & Assert
      await expect(subscriptionService.getAllTierPlans()).rejects.toThrow('Database connection failed');
    });
  });

  describe('getUserSubscription', () => {
    it('should return active subscription for user', async () => {
      // Arrange
      const userId = 1;
      const mockSubscription = {
        id: 1,
        user_id: userId,
        tier_plan_id: 2,
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        status: 'active',
        tier_plan: {
          id: 2,
          plan_type: 'PREMIUM',
          scan_count_limit: 50,
          saved_product_limit: 100
        }
      };
      mockPrismaClient.subscription.findFirst.mockResolvedValue(mockSubscription);

      // Act
      const result = await subscriptionService.getUserSubscription(userId);

      // Assert
      expect(mockPrismaClient.subscription.findFirst).toHaveBeenCalledWith({
        where: {
          user_id: userId,
          status: 'active',
          end_date: { gte: expect.any(Date) }
        },
        include: { tier_plan: true }
      });
      expect(result).toEqual(mockSubscription);
    });

    it('should return null when no active subscription found', async () => {
      // Arrange
      const userId = 1;
      mockPrismaClient.subscription.findFirst.mockResolvedValue(null);

      // Act
      const result = await subscriptionService.getUserSubscription(userId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('createOrUpgradeSubscription', () => {
    it('should create new subscription when user has no active subscription', async () => {
      // Arrange
      const userId = 1;
      const tierPlanId = 2;
      const durationMonths = 3;
      
      const mockTierPlan = {
        id: 2,
        plan_type: 'PREMIUM',
        scan_count_limit: 50,
        saved_product_limit: 100
      };
      
      const mockNewSubscription = {
        id: 1,
        user_id: userId,
        tier_plan_id: tierPlanId,
        start_date: expect.any(Date),
        end_date: expect.any(Date),
        status: 'active'
      };

      mockPrismaClient.tier_plan.findUnique.mockResolvedValue(mockTierPlan);
      mockPrismaClient.subscription.findFirst.mockResolvedValue(null);
      mockPrismaClient.subscription.create.mockResolvedValue(mockNewSubscription);

      // Act
      const result = await subscriptionService.createOrUpgradeSubscription(userId, tierPlanId, durationMonths);

      // Assert
      expect(mockPrismaClient.tier_plan.findUnique).toHaveBeenCalledWith({
        where: { id: tierPlanId }
      });
      expect(mockPrismaClient.subscription.create).toHaveBeenCalledWith({
        data: {
          user_id: userId,
          tier_plan_id: tierPlanId,
          start_date: expect.any(Date),
          end_date: expect.any(Date),
          status: 'active'
        }
      });
      expect(result).toEqual(mockNewSubscription);
    });

    it('should upgrade existing subscription', async () => {
      // Arrange
      const userId = 1;
      const tierPlanId = 3;
      const durationMonths = 6;
      
      const mockTierPlan = {
        id: 3,
        plan_type: 'ENTERPRISE',
        scan_count_limit: 500,
        saved_product_limit: 1000
      };
      
      const mockExistingSubscription = {
        id: 1,
        user_id: userId,
        tier_plan_id: 2,
        status: 'active'
      };

      const mockUpdatedSubscription = {
        ...mockExistingSubscription,
        tier_plan_id: tierPlanId,
        end_date: expect.any(Date)
      };

      mockPrismaClient.tier_plan.findUnique.mockResolvedValue(mockTierPlan);
      mockPrismaClient.subscription.findFirst.mockResolvedValue(mockExistingSubscription);
      mockPrismaClient.subscription.update.mockResolvedValue(mockUpdatedSubscription);

      // Act
      const result = await subscriptionService.createOrUpgradeSubscription(userId, tierPlanId, durationMonths);

      // Assert
      expect(mockPrismaClient.subscription.update).toHaveBeenCalledWith({
        where: { id: mockExistingSubscription.id },
        data: {
          tier_plan_id: tierPlanId,
          end_date: expect.any(Date)
        }
      });
      expect(result).toEqual(mockUpdatedSubscription);
    });

    it('should throw error when tier plan not found', async () => {
      // Arrange
      const userId = 1;
      const tierPlanId = 999;
      mockPrismaClient.tier_plan.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(subscriptionService.createOrUpgradeSubscription(userId, tierPlanId))
        .rejects.toThrow('Tier plan not found');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel active subscription', async () => {
      // Arrange
      const userId = 1;
      const mockSubscription = {
        id: 1,
        user_id: userId,
        status: 'active'
      };

      const mockCancelledSubscription = {
        ...mockSubscription,
        status: 'cancelled'
      };

      mockPrismaClient.subscription.findFirst.mockResolvedValue(mockSubscription);
      mockPrismaClient.subscription.update.mockResolvedValue(mockCancelledSubscription);

      // Act
      const result = await subscriptionService.cancelSubscription(userId);

      // Assert
      expect(mockPrismaClient.subscription.update).toHaveBeenCalledWith({
        where: { id: mockSubscription.id },
        data: { status: 'cancelled' }
      });
      expect(result).toEqual(mockCancelledSubscription);
    });

    it('should throw error when no active subscription found', async () => {
      // Arrange
      const userId = 1;
      mockPrismaClient.subscription.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(subscriptionService.cancelSubscription(userId))
        .rejects.toThrow('No active subscription found');
    });
  });

  describe('checkSubscriptionLimits', () => {
    it('should return limits for user with active subscription', async () => {
      // Arrange
      const userId = 1;
      const mockSubscription = {
        tier_plan: {
          scan_count_limit: 50,
          saved_product_limit: 100
        }
      };

      const mockDailyUsage = {
        scan_count: 25
      };

      const mockSavedProducts = 30;

      mockPrismaClient.subscription.findFirst.mockResolvedValue(mockSubscription);
      mockPrismaClient.daily_scan_usage.findFirst.mockResolvedValue(mockDailyUsage);
      mockPrismaClient.product_scan.count.mockResolvedValue(mockSavedProducts);

      // Act
      const result = await subscriptionService.checkSubscriptionLimits(userId);

      // Assert
      expect(result).toEqual({
        dailyScanLimit: 50,
        dailyScanUsed: 25,
        dailyScanRemaining: 25,
        savedProductLimit: 100,
        savedProductCount: 30,
        savedProductRemaining: 70
      });
    });

    it('should return default limits for user without subscription', async () => {
      // Arrange
      const userId = 1;
      mockPrismaClient.subscription.findFirst.mockResolvedValue(null);
      mockPrismaClient.daily_scan_usage.findFirst.mockResolvedValue({ scan_count: 3 });
      mockPrismaClient.product_scan.count.mockResolvedValue(5);

      // Act
      const result = await subscriptionService.checkSubscriptionLimits(userId);

      // Assert
      expect(result).toEqual({
        dailyScanLimit: 5,
        dailyScanUsed: 3,
        dailyScanRemaining: 2,
        savedProductLimit: 10,
        savedProductCount: 5,
        savedProductRemaining: 5
      });
    });
  });
});
