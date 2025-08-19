import { PrismaClient } from '@prisma/client';
import { getDefaultTimeZone, startOfDayUTCForTimeZone } from '../utils/time.util';

const prisma = new PrismaClient();

export interface DailyScanLimit {
  userId: number;
  currentUsage: number;
  dailyLimit: number;
  remainingScans: number;
  isLimitExceeded: boolean;
}

export class ScanLimitService {
  /**
   * Mendapatkan daily scan limit untuk user berdasarkan tier plan
   */
  async getUserDailyScanLimit(userId: number): Promise<DailyScanLimit> {
    try {
      // Ambil subscription aktif user
      const activeSubscription = await prisma.subscription.findFirst({
        where: {
          user_id: userId,
          status: 'active',
          end_date: {
            gte: new Date()
          }
        },
        include: {
          tier_plan: true
        }
      });

      // Default limit untuk user tanpa subscription (basic plan)
      let dailyLimit = 100; // Basic plan: 5 scans per day
      
      if (activeSubscription) {
        dailyLimit = activeSubscription.tier_plan.scan_count_limit;
      }

      // Ambil usage hari ini
      const tz = getDefaultTimeZone();
      const today = startOfDayUTCForTimeZone(new Date(), tz);
      
      const dailyUsage = await prisma.daily_scan_usage.findUnique({
        where: {
          user_id_usage_date: {
            user_id: userId,
            usage_date: today
          }
        }
      });

      const currentUsage = dailyUsage?.scan_count || 0;
      const remainingScans = Math.max(0, dailyLimit - currentUsage);
      const isLimitExceeded = currentUsage >= dailyLimit;

      return {
        userId,
        currentUsage,
        dailyLimit,
        remainingScans,
        isLimitExceeded
      };

    } catch (error) {
      console.error('Error getting user daily scan limit:', error);
      throw new Error('Failed to get daily scan limit');
    }
  }

  /**
   * Increment daily scan usage untuk user
   */
  async incrementDailyScanUsage(userId: number): Promise<void> {
    try {
      const tz = getDefaultTimeZone();
      const today = startOfDayUTCForTimeZone(new Date(), tz);

      // Upsert daily usage record
      await prisma.daily_scan_usage.upsert({
        where: {
          user_id_usage_date: {
            user_id: userId,
            usage_date: today
          }
        },
        update: {
          scan_count: {
            increment: 1
          }
        },
        create: {
          user_id: userId,
          usage_date: today,
          scan_count: 1
        }
      });

    } catch (error) {
      console.error('Error incrementing daily scan usage:', error);
      throw new Error('Failed to increment daily scan usage');
    }
  }

  /**
   * Check apakah user masih bisa scan hari ini
   */
  async canUserScanToday(userId: number): Promise<{ canScan: boolean; remainingScans: number; dailyLimit: number }> {
    try {
      const limitInfo = await this.getUserDailyScanLimit(userId);
      
      return {
        canScan: !limitInfo.isLimitExceeded,
        remainingScans: limitInfo.remainingScans,
        dailyLimit: limitInfo.dailyLimit
      };
    } catch (error) {
      console.error('Error checking if user can scan:', error);
      // Default: allow scan jika ada error
      return {
        canScan: true,
        remainingScans: 5,
        dailyLimit: 5
      };
    }
  }

  /**
   * Reset daily usage untuk testing/development
   */
  async resetDailyUsage(userId: number): Promise<void> {
    try {
      const tz = getDefaultTimeZone();
      const today = startOfDayUTCForTimeZone(new Date(), tz);

      await prisma.daily_scan_usage.deleteMany({
        where: {
          user_id: userId,
          usage_date: today
        }
      });

      console.log(`✅ Daily usage reset for user ${userId}`);
    } catch (error) {
      console.error('Error resetting daily usage:', error);
    }
  }

  /**
   * Get usage history untuk user (7 hari terakhir)
   */
  async getUserUsageHistory(userId: number, days: number = 7): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const usageHistory = await prisma.daily_scan_usage.findMany({
        where: {
          user_id: userId,
          usage_date: {
            gte: startDate
          }
        },
        orderBy: {
          usage_date: 'desc'
        }
      });

      return usageHistory;
    } catch (error) {
      console.error('Error getting usage history:', error);
      return [];
    }
  }
}

export default new ScanLimitService();
