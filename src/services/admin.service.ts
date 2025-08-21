import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminService {
  /**
   * Allergen management (list, create, update, delete)
   */
  async listAllergens(filters: { search?: string; limit?: number; offset?: number } = {}) {
    const { search, limit = 20, offset = 0 } = filters;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.allergen.findMany({ where, orderBy: { id: 'asc' }, take: limit, skip: offset }),
      prisma.allergen.count({ where }),
    ]);

    return { items, total };
  }

  async createAllergen(input: { name: string; description?: string; is_custom?: boolean }) {
    const created = await prisma.allergen.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        is_custom: input.is_custom ?? false,
      },
    });
    return created;
  }

  async updateAllergen(id: number, input: { name?: string; description?: string; is_custom?: boolean }) {
    const updated = await prisma.allergen.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.is_custom !== undefined ? { is_custom: input.is_custom } : {}),
      },
    });
    return updated;
  }

  async deleteAllergen(id: number) {
    // Optional: prevent delete if referenced by user_allergen
    const references = await prisma.user_allergen.count({ where: { allergen_id: id } });
    if (references > 0) {
      throw new Error('Cannot delete allergen that is referenced by users');
    }
    await prisma.allergen.delete({ where: { id } });
    return { id };
  }
  /**
   * Get all users with pagination and filters
   */
  async getAllUsers(filters: {
    limit?: number;
    offset?: number;
    search?: string;
    role?: number;
    is_verified?: boolean;
  }) {
    try {
      const { limit = 20, offset = 0, search, role, is_verified } = filters;

      const whereClause: any = {};

      if (search) {
        whereClause.OR = [
          {
            full_name: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ];
      }

      if (role !== undefined) {
        whereClause.role = role;
      }

      if (is_verified !== undefined) {
        whereClause.is_verified = is_verified;
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          full_name: true,
          email: true,
          phone_number: true,
          is_verified: true,
          role: true,
          profile_picture_url: true,
          createdAt: true,
          last_login: true,
          _count: {
            select: {
              product_scans: true,
              subscriptions: true,
              product_reports: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await prisma.user.count({
        where: whereClause
      });

      return { users, total };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while fetching users');
    }
  }

  /**
   * Get user details by ID
   */
  async getUserById(userId: number) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscriptions: {
            include: {
              tier_plan: true
            },
            orderBy: { start_date: 'desc' },
            take: 5
          },
          user_allegens: {
            include: {
              allergen: true
            }
          },
          emergency_contacts: true,
          _count: {
            select: {
              product_scans: true,
              product_reports: true,
              daily_scan_usages: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while fetching user details');
    }
  }

  /**
   * Update user role or verification status
   */
  async updateUser(userId: number, updates: {
    role?: number;
    is_verified?: boolean;
  }) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: updates,
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
          is_verified: true,
          updatedAt: true
        }
      });

      return user;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while updating user');
    }
  }

  /**
   * Delete user (soft delete by deactivating)
   */
  async deleteUser(userId: number) {
    try {
      // Instead of hard delete, we deactivate the user
      const user = await prisma.user.update({
        where: { id: userId },
        data: { 
          is_verified: false,
          email: `deleted_${Date.now()}_${userId}@deleted.com` // Prevent email conflicts
        },
        select: {
          id: true,
          full_name: true,
          email: true
        }
      });

      return user;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while deleting user');
    }
  }

  /**
   * Get all product reports with filters
   */
  async getAllProductReports(filters: {
    limit?: number;
    offset?: number;
    status?: string;
  }) {
    try {
      const { limit = 20, offset = 0, status } = filters;

      const whereClause: any = {};

      if (status) {
        whereClause.status = status;
      }

      const reports = await prisma.product_report.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              barcode: true,
              image_url: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await prisma.product_report.count({
        where: whereClause
      });

      return { reports, total };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while fetching product reports');
    }
  }

  /**
   * Update product report status
   */
  async updateProductReportStatus(reportId: number, status: string) {
    try {
      const report = await prisma.product_report.update({
        where: { id: reportId },
        data: { status },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              barcode: true
            }
          }
        }
      });

      return report;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while updating report status');
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    try {
      const totalUsers = await prisma.user.count();
      const verifiedUsers = await prisma.user.count({
        where: { is_verified: true }
      });
      const totalProducts = await prisma.product.count();
      const totalScans = await prisma.product_scan.count();
      const activeSubscriptions = await prisma.subscription.count({
        where: { status: 'ACTIVE' }
      });
      const pendingReports = await prisma.product_report.count({
        where: { status: 'PENDING' }
      });

      // Get scan trends for last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const scanTrends = await prisma.product_scan.groupBy({
        by: ['scan_date'],
        where: {
          scan_date: {
            gte: sevenDaysAgo
          }
        },
        _count: { id: true },
        orderBy: { scan_date: 'asc' }
      });

      // Get most scanned products
      const popularProducts = await prisma.product.findMany({
        include: {
          _count: {
            select: {
              product_scans: true
            }
          }
        },
        orderBy: {
          product_scans: {
            _count: 'desc'
          }
        },
        take: 5
      });

      return {
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          unverified: totalUsers - verifiedUsers
        },
        products: {
          total: totalProducts
        },
        scans: {
          total: totalScans,
          trends: scanTrends.map(trend => ({
            date: trend.scan_date,
            count: trend._count.id
          }))
        },
        subscriptions: {
          active: activeSubscriptions
        },
        reports: {
          pending: pendingReports
        },
        popular_products: popularProducts.map(product => ({
          id: product.id,
          name: product.name,
          barcode: product.barcode,
          scan_count: product._count.product_scans
        }))
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while fetching dashboard statistics');
    }
  }

  /**
   * Get system analytics
   */
  async getSystemAnalytics() {
    try {
      // User registration trends (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const userRegistrations = await prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        _count: { id: true },
        orderBy: { createdAt: 'asc' }
      });

      // Risk level distribution
      const riskDistribution = await prisma.product_scan.groupBy({
        by: ['risk_level'],
        _count: { id: true }
      });

      // Subscription distribution
      const subscriptionDistribution = await prisma.subscription.groupBy({
        by: ['tier_plan_id'],
        where: { status: 'ACTIVE' },
        _count: { id: true }
      });

      return {
        user_registrations: userRegistrations.map(reg => ({
          date: reg.createdAt,
          count: reg._count.id
        })),
        risk_distribution: riskDistribution.map(risk => ({
          risk_level: risk.risk_level,
          count: risk._count.id
        })),
        subscription_distribution: subscriptionDistribution
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while fetching system analytics');
    }
  }
}

export default new AdminService();
