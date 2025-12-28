import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Employee Service
 *
 * Handles employee-specific business logic including profile management
 */
@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive employee profile with all related data
   *
   * Returns complete employee information including:
   * - Basic user data (email, role, status)
   * - Full employee profile (demographics, contact info)
   * - Company information
   * - Account summary statistics
   * - Goal progress summary
   * - Consultation history summary
   *
   * @param userId - User UUID
   * @returns Complete employee profile with aggregated data
   * @throws NotFoundException if employee profile doesn't exist
   */
  async getFullProfile(userId: string) {
    // Fetch user with all related profile data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            domain: true,
            status: true,
          },
        },
        employeeProfile: {
          select: {
            userId: true,
            companyId: true,
            employeeCode: true,
            fullName: true,
            phone: true,
            department: true,
            dateOfJoining: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.employeeProfile) {
      throw new NotFoundException('Employee profile not found');
    }

    // Fetch account statistics
    const accountStats = await this.prisma.account.groupBy({
      by: ['userId'],
      where: { userId },
      _count: true,
    });

    const totalBalance = await this.prisma.$queryRaw<
      Array<{ total: number }>
    >`SELECT COALESCE(SUM(balance), 0)::float as total FROM "Account" WHERE "userId" = ${userId}`;

    // Fetch goal statistics
    const goalStats = await this.prisma.financialGoal.aggregate({
      where: { userId },
      _count: true,
      _sum: {
        goalAmount: true,
        saving: true,
      },
    });

    const activeGoals = await this.prisma.financialGoal.count({
      where: {
        userId,
      },
    });

    const completedGoals = await this.prisma.financialGoal.count({
      where: {
        userId,
      },
    });

    // Fetch consultation statistics
    const consultationStats = await this.prisma.consultationBooking.aggregate({
      where: { employeeId: userId },
      _count: true,
    });

    const upcomingConsultations = await this.prisma.consultationBooking.count({
      where: {
        employeeId: userId,
        status: 'CONFIRMED',
        slot: {
          startTime: {
            gte: new Date(),
          },
        },
      },
    });

    const completedConsultations = await this.prisma.consultationBooking.count({
      where: {
        employeeId: userId,
        slot: {
          startTime: {
            lt: new Date(),
          },
        },
      },
    });

    // Return comprehensive profile
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      company: user.company,
      profile: user.employeeProfile,
      statistics: {
        accounts: {
          total: accountStats.length > 0 ? accountStats[0]._count : 0,
          totalBalance: totalBalance[0]?.total || 0,
        },
        goals: {
          total: goalStats._count || 0,
          active: activeGoals,
          completed: completedGoals,
          totalTarget: Number(goalStats._sum.goalAmount) || 0,
          totalSaved: Number(goalStats._sum.saving) || 0,
          progress:
            goalStats._sum.goalAmount && Number(goalStats._sum.goalAmount) > 0
              ? Math.round(
                  ((Number(goalStats._sum.saving) || 0) /
                    Number(goalStats._sum.goalAmount)) *
                    100,
                )
              : 0,
        },
        consultations: {
          total: consultationStats._count || 0,
          upcoming: upcomingConsultations,
          completed: completedConsultations,
        },
      },
    };
  }
}
