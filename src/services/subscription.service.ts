import { PrismaClient } from '@prisma/client';
import subscriptionService from './subscription.service';

const prisma = new PrismaClient();

export class SubscriptionService {
  /**
   * Get all available tier plans
   */
  async getAllTierPlans() {
    try {
      const plans = await prisma.tier_plan.findMany({
        orderBy: { scan_count_limit: 'asc' }
      });
      
      return plans;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while fetching tier plans');
    }
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: number) {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: { 
          user_id: userId,
          status: 'ACTIVE'
        },
        include: {
          tier_plan: true
        },
        orderBy: { start_date: 'desc' }
      });

      return subscription;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while fetching user subscription');
    }
  }

  /**
   * Get user's subscription history
   */
  async getUserSubscriptionHistory(userId: number, limit: number = 10, offset: number = 0) {
    try {
      const subscriptions = await prisma.subscription.findMany({
        where: { user_id: userId },
        include: {
          tier_plan: true
        },
        orderBy: { start_date: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await prisma.subscription.count({
        where: { user_id: userId }
      });

      return { subscriptions, total };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while fetching subscription history');
    }
  }

  /**
   * Create or upgrade subscription
   */
  async createOrUpgradeSubscription(userId: number, tierPlanId: number, durationMonths: number = 1) {
    try {
      // Check if tier plan exists
      const tierPlan = await prisma.tier_plan.findUnique({
        where: { id: tierPlanId }
      });

      if (!tierPlan) {
        throw new Error('Tier plan not found');
      }

      // Check if user has active subscription
      const activeSubscription = await this.getUserSubscription(userId);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + durationMonths);

      return await prisma.$transaction(async (tx) => {
        // Deactivate current subscription if exists
        if (activeSubscription) {
          await tx.subscription.update({
            where: { id: activeSubscription.id },
            data: { 
              status: 'EXPIRED',
              end_date: new Date() // End current subscription now
            }
          });
        }

        // Create new subscription
        const newSubscription = await tx.subscription.create({
          data: {
            user_id: userId,
            tier_plan_id: tierPlanId,
            start_date: startDate,
            end_date: endDate,
            status: 'ACTIVE'
          },
          include: {
            tier_plan: true
          }
        });

        return newSubscription;
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while creating subscription');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: number) {
    try {
      const activeSubscription = await this.getUserSubscription(userId);

      if (!activeSubscription) {
        throw new Error('No active subscription found');
      }

      const updatedSubscription = await prisma.subscription.update({
        where: { id: activeSubscription.id },
        data: { 
          status: 'CANCELLED',
          end_date: new Date() // End subscription immediately
        },
        include: {
          tier_plan: true
        }
      });

      try {
        const freePlan = await prisma.tier_plan.findUnique({ where: { plan_type: 'FREE' } });
        if (freePlan) {
          await this.createOrUpgradeSubscription(userId, freePlan.id, 1);
        }
      } catch (e) {
        console.warn('ensure FREE subscription failed:', e);
      }

      return updatedSubscription;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while cancelling subscription');
    }
  }

  /**
   * Check if user can perform action based on subscription limits
   */
  async checkSubscriptionLimits(userId: number) {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      // If no subscription, use default FREE tier limits
      const limits = subscription ? {
        scan_count_limit: subscription.tier_plan.scan_count_limit,
        saved_product_limit: subscription.tier_plan.saved_product_limit,
        plan_type: subscription.tier_plan.plan_type
      } : {
        scan_count_limit: 10, // Default free tier
        saved_product_limit: 5,
        plan_type: 'FREE'
      };

      // Get current usage
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dailyUsage = await prisma.daily_scan_usage.findFirst({
        where: {
          user_id: userId,
          usage_date: {
            gte: today
          }
        }
      });

      const savedProductsCount = await prisma.product_scan.count({
        where: {
          user_id: userId,
          is_saved: true
        }
      });

      return {
        limits,
        current_usage: {
          daily_scans: dailyUsage?.scan_count || 0,
          saved_products: savedProductsCount
        },
        can_scan: (dailyUsage?.scan_count || 0) < limits.scan_count_limit,
        can_save_product: savedProductsCount < limits.saved_product_limit
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while checking subscription limits');
    }
  }

  /**
   * Get subscription statistics for admin
   */
  async getSubscriptionStats() {
    try {
      const totalActiveSubscriptions = await prisma.subscription.count({
        where: { status: 'ACTIVE' }
      });

      const subscriptionsByTier = await prisma.subscription.groupBy({
        by: ['tier_plan_id'],
        where: { status: 'ACTIVE' },
        _count: { id: true }
      });

      const monthlyRevenue = await prisma.subscription.findMany({
        where: {
          start_date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        include: {
          tier_plan: true
        }
      });

      return {
        total_active: totalActiveSubscriptions,
        by_tier: subscriptionsByTier,
        monthly_new_subscriptions: monthlyRevenue.length
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while fetching subscription statistics');
    }
  }
}

export default new SubscriptionService();
