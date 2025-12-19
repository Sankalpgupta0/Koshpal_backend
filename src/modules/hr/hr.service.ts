import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { UploadStatus } from '@prisma/client';

interface CurrentUser {
  userId: string;
  companyId: string;
  role: string;
}

@Injectable()
export class HrService {
  private readonly uploadQueue: Queue;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.uploadQueue = new Queue('employee-upload', {
      connection: {
        host: this.configService.get<string>('REDIS_HOST', 'localhost'),
        port: this.configService.get<number>('REDIS_PORT', 6379),
      },
    });
  }

  async handleUpload(
    file: Express.Multer.File,
    user: CurrentUser,
  ): Promise<{ message: string; batchId: string }> {
    console.log(
      `[HR-SERVICE] 📤 New upload request from HR user: ${user.userId}`,
    );
    console.log(`[HR-SERVICE] Company: ${user.companyId}`);

    // 1️⃣ Validate file
    if (!file) {
      console.warn(`[HR-SERVICE] ❌ Upload rejected: No file provided`);
      throw new BadRequestException('File is required');
    }

    console.log(
      `[HR-SERVICE] File: ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`,
    );

    if (!file.originalname.toLowerCase().endsWith('.xlsx')) {
      console.warn(
        `[HR-SERVICE] ❌ Upload rejected: Invalid file type - ${file.originalname}`,
      );
      throw new BadRequestException('Only .xlsx files are allowed');
    }

    // 5MB limit (important for Redis)
    if (file.size > 5 * 1024 * 1024) {
      console.warn(
        `[HR-SERVICE] ❌ Upload rejected: File too large (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      );
      throw new BadRequestException('File size must be under 5MB');
    }

    // 2️⃣ Prevent parallel uploads for same company
    console.log(`[HR-SERVICE] 🔍 Checking for active uploads...`);
    const activeBatch = await this.prisma.employeeUploadBatch.findFirst({
      where: {
        companyId: user.companyId,
        status: {
          in: [UploadStatus.PENDING, UploadStatus.PROCESSING],
        },
      },
    });

    if (activeBatch) {
      console.warn(
        `[HR-SERVICE] ❌ Upload rejected: Active batch found (${activeBatch.id})`,
      );
      throw new BadRequestException(
        'Another employee upload is already in progress',
      );
    }

    // 3️⃣ Create upload batch
    console.log(`[HR-SERVICE] 💾 Creating upload batch record...`);
    const batch = await this.prisma.employeeUploadBatch.create({
      data: {
        hrUserId: user.userId,
        companyId: user.companyId,
        fileName: file.originalname,
        status: UploadStatus.PENDING,
      },
    });
    console.log(`[HR-SERVICE] ✓ Batch created: ${batch.id}`);

    // 4️⃣ Push job to queue
    console.log(`[HR-SERVICE] 📮 Adding job to queue...`);
    const job = await this.uploadQueue.add(
      'employee-upload',
      {
        batchId: batch.id,
        companyId: user.companyId,
        fileBase64: file.buffer.toString('base64'),
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    console.log(`[HR-SERVICE] ✅ Job queued successfully: ${job.id}`);
    console.log(`[HR-SERVICE] BatchId: ${batch.id} | JobId: ${job.id}\n`);

    return {
      message: 'Upload started. Processing in background.',
      batchId: batch.id,
    };
  }

  async getBatchStatus(batchId: string) {
    console.log(`[HR-SERVICE] 📋 Getting batch status for ${batchId}`);
    const batch = await this.prisma.employeeUploadBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new BadRequestException('Batch not found');
    }

    return {
      id: batch.id,
      status: batch.status,
      fileName: batch.fileName,
      totalRecords: batch.totalRecords,
      successRecords: batch.successRecords,
      failedRecords: batch.failedRecords,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
    };
  }

  async getBatchesForCompany(companyId: string) {
    console.log(`[HR-SERVICE] 📋 Getting batches for company ${companyId}`);
    const batches = await this.prisma.employeeUploadBatch.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return batches.map((batch) => ({
      id: batch.id,
      status: batch.status,
      fileName: batch.fileName,
      totalRecords: batch.totalRecords,
      successRecords: batch.successRecords,
      failedRecords: batch.failedRecords,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
    }));
  }

  async getEmployees(companyId: string) {
    const employees = await this.prisma.user.findMany({
      where: {
        companyId,
        role: 'EMPLOYEE',
      },
      include: {
        employeeProfile: {
          select: {
            fullName: true,
            department: true,
            phone: true,
            dateOfJoining: true,
          },
        },
        monthlySummaries: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            totalIncome: true,
            totalExpense: true,
            savings: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get consultation booking counts for each employee
    const employeeIds = employees.map((emp) => emp.id);
    const bookingCounts = await this.prisma.consultationBooking.groupBy({
      by: ['employeeId'],
      where: {
        employeeId: { in: employeeIds },
        status: 'CONFIRMED',
      },
      _count: true,
    });

    const bookingMap = new Map(
      bookingCounts.map((b) => [b.employeeId, b._count]),
    );

    // Calculate engagement and status for each employee
    return employees.map((emp) => {
      const hasFinancialData = emp.monthlySummaries.length > 0;
      const sessionsAttended = bookingMap.get(emp.id) || 0;

      // Determine onboarding status (only Invited or Onboarded)
      let status = 'Invited';
      if (hasFinancialData) {
        status = 'Onboarded';
      }

      // Determine engagement level (only Active or Inactive)
      let engagement = 'Inactive';
      if (hasFinancialData && emp.isActive) {
        const lastActivity = emp.monthlySummaries[0]?.createdAt;
        if (lastActivity) {
          const daysSinceActivity = Math.floor(
            (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24),
          );
          if (daysSinceActivity < 60) {
            engagement = 'Active';
          }
        }
      }

      // Calculate last activity
      let lastActivity = 'Never';
      if (emp.monthlySummaries.length > 0) {
        const lastDate = emp.monthlySummaries[0].createdAt;
        const daysAgo = Math.floor(
          (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysAgo < 1) {
          lastActivity = 'Today';
        } else if (daysAgo < 30) {
          lastActivity = `${daysAgo}d ago`;
        } else if (daysAgo < 60) {
          lastActivity = `${Math.floor(daysAgo / 30)}mo ago`;
        } else {
          lastActivity = `${Math.floor(daysAgo / 30)}mo ago`;
        }
      }

      return {
        id: emp.id,
        name: emp.employeeProfile?.fullName || emp.email,
        email: emp.email,
        department: emp.employeeProfile?.department || 'Unknown',
        role: 'Financial Analyst', // Default role
        status,
        engagement,
        lastActivity,
        sessionsAttended,
        isActive: emp.isActive,
        phone: emp.employeeProfile?.phone,
        dateOfJoining: emp.employeeProfile?.dateOfJoining,
      };
    });
  }

  async getDepartments(companyId: string) {
    const employeeProfiles = await this.prisma.employeeProfile.findMany({
      where: {
        companyId,
      },
      select: {
        department: true,
      },
      distinct: ['department'],
    });

    // Extract unique departments and filter out null/undefined
    const departments = employeeProfiles
      .map((profile) => profile.department)
      .filter((dept) => dept !== null && dept !== undefined)
      .sort();

    return departments;
  }

  async getEmployee(id: string, companyId: string) {
    const employee = await this.prisma.user.findFirst({
      where: {
        id,
        companyId,
        role: 'EMPLOYEE',
      },
      select: {
        id: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!employee) {
      throw new BadRequestException('Employee not found');
    }

    return employee;
  }

  async updateEmployeeStatus(id: string, companyId: string, status: boolean) {
    const employee = await this.prisma.user.findFirst({
      where: {
        id,
        companyId,
        role: 'EMPLOYEE',
      },
    });

    if (!employee) {
      throw new BadRequestException('Employee not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: status },
      select: {
        id: true,
        email: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async getCompanyInsightsSummary(companyId: string) {
    // Get aggregated insights for all employees in the company
    const summaries = await this.prisma.monthlySummary.findMany({
      where: {
        user: {
          companyId,
          role: 'EMPLOYEE',
        },
      },
      select: {
        month: true,
        year: true,
        totalIncome: true,
        totalExpense: true,
        savings: true,
      },
    });

    if (summaries.length === 0) {
      return {
        totalEmployees: 0,
        aggregatedIncome: 0,
        aggregatedExpense: 0,
        aggregatedSavings: 0,
        monthlySummaries: [],
      };
    }

    // Count total employees with financial data
    const employeeCount = await this.prisma.user.count({
      where: {
        companyId,
        role: 'EMPLOYEE',
        transactions: {
          some: {},
        },
      },
    });

    // Aggregate by month/year
    const monthlyAggregates = summaries.reduce((acc, summary) => {
      const key = `${summary.year}-${summary.month}`;
      if (!acc[key]) {
        acc[key] = {
          month: summary.month,
          year: summary.year,
          totalIncome: 0,
          totalExpense: 0,
          netSavings: 0,
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      acc[key].totalIncome += Number(summary.totalIncome);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      acc[key].totalExpense += Number(summary.totalExpense);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      acc[key].netSavings += Number(summary.savings);
      return acc;
    }, {});

    const monthlySummaries = Object.values(monthlyAggregates).sort(
      (a: any, b: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (a.year !== b.year) return b.year - a.year;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return b.month - a.month;
      },
    );

    interface MonthlyTotal {
      totalIncome: number;
      totalExpense: number;
      totalSavings: number;
    }

    const totals = monthlySummaries.reduce<MonthlyTotal>(
      (acc, month: any) => ({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        totalIncome: acc.totalIncome + month.totalIncome,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        totalExpense: acc.totalExpense + month.totalExpense,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        totalSavings: acc.totalSavings + month.netSavings,
      }),
      { totalIncome: 0, totalExpense: 0, totalSavings: 0 },
    );

    return {
      totalEmployees: employeeCount,
      aggregatedIncome: totals.totalIncome,
      aggregatedExpense: totals.totalExpense,
      aggregatedSavings: totals.totalSavings,
      monthlySummaries: monthlySummaries.slice(0, 12), // Last 12 months
    };
  }

  async getDashboardStats(companyId: string) {
    // Get total active employees
    const totalEmployees = await this.prisma.user.count({
      where: {
        companyId,
        role: 'EMPLOYEE',
        isActive: true,
      },
    });

    // Get employees with financial data (monitored)
    const monitoredEmployees = await this.prisma.user.count({
      where: {
        companyId,
        role: 'EMPLOYEE',
        isActive: true,
        employeeProfile: {
          accounts: {
            some: {},
          },
        },
      },
    });

    // Calculate average financial health score
    const employeesWithTransactions = await this.prisma.user.findMany({
      where: {
        companyId,
        role: 'EMPLOYEE',
        isActive: true,
      },
      include: {
        monthlySummaries: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    let totalHealthScore = 0;
    let employeesWithHealth = 0;

    employeesWithTransactions.forEach((emp) => {
      if (emp.monthlySummaries.length > 0) {
        const summary = emp.monthlySummaries[0];
        const income = Number(summary.totalIncome);
        const expense = Number(summary.totalExpense);
        const savings = Number(summary.savings);

        // Calculate health score (0-100)
        let healthScore = 50;
        if (income > 0) {
          const savingsRate = (savings / income) * 100;
          const expenseRatio = (expense / income) * 100;
          healthScore = Math.min(
            100,
            Math.max(0, savingsRate * 0.7 + (100 - expenseRatio) * 0.3),
          );
        }

        totalHealthScore += healthScore;
        employeesWithHealth++;
      }
    });

    const avgFinancialHealth =
      employeesWithHealth > 0
        ? Math.round(totalHealthScore / employeesWithHealth)
        : 0;

    // Get consultation bookings for this period
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessionsThisPeriod = await this.prisma.consultationBooking.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Calculate participation rate
    const participationRate =
      totalEmployees > 0
        ? Math.round((monitoredEmployees / totalEmployees) * 100)
        : 0;

    return {
      employeeMonitored: monitoredEmployees,
      employeeMonitoredChange: '+12%',
      avgFinancialHealth,
      avgFinancialHealthPeriod: 'This Month',
      participationRate,
      participationRateChange: '-5%',
      sessionsThisPeriod,
      sessionsRate: `${Math.round((sessionsThisPeriod / (totalEmployees || 1)) * 100)}%`,
    };
  }

  async getFinancialHealthDistribution(companyId: string) {
    const employees = await this.prisma.user.findMany({
      where: {
        companyId,
        role: 'EMPLOYEE',
        isActive: true,
      },
      include: {
        monthlySummaries: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    let low = 0;
    let medium = 0;
    let high = 0;

    employees.forEach((emp) => {
      if (emp.monthlySummaries.length > 0) {
        const summary = emp.monthlySummaries[0];
        const income = Number(summary.totalIncome);
        const expense = Number(summary.totalExpense);
        const savings = Number(summary.savings);

        let healthScore = 50;
        if (income > 0) {
          const savingsRate = (savings / income) * 100;
          const expenseRatio = (expense / income) * 100;
          healthScore = Math.min(
            100,
            Math.max(0, savingsRate * 0.7 + (100 - expenseRatio) * 0.3),
          );
        }

        if (healthScore < 40) {
          low++;
        } else if (healthScore < 70) {
          medium++;
        } else {
          high++;
        }
      }
    });

    return {
      distribution: [
        { category: 'Low (0-39)', value: low, range: '0-39' },
        { category: 'Medium (40-69)', value: medium, range: '40-69' },
        { category: 'High (70-100)', value: high, range: '70-100' },
      ],
      total: low + medium + high,
    };
  }

  async getParticipationByDepartment(companyId: string) {
    // Get all employees with their departments
    const allEmployees = await this.prisma.user.findMany({
      where: {
        companyId,
        role: 'EMPLOYEE',
        isActive: true,
      },
      include: {
        employeeProfile: {
          include: {
            accounts: true,
          },
        },
      },
    });

    // Group by department
    const deptMap = new Map();

    allEmployees.forEach((emp) => {
      const dept = emp.employeeProfile?.department || 'Unknown';

      if (!deptMap.has(dept)) {
        deptMap.set(dept, { total: 0, participating: 0 });
      }

      const data = deptMap.get(dept);
      data.total++;

      // Check if employee is participating (has financial accounts)
      if (emp.employeeProfile?.accounts && emp.employeeProfile.accounts.length > 0) {
        data.participating++;
      }
    });

    // Convert to array and calculate rates
    const departments = Array.from(deptMap.entries()).map(([dept, data]) => {
      const rate = data.total > 0 ? (data.participating / data.total) * 100 : 0;

      return {
        department: dept,
        total: data.total,
        participating: data.participating,
        participationRate: Math.round(rate),
      };
    });

    return departments.sort((a, b) => b.participationRate - a.participationRate);
  }

  async getDashboardAlerts(companyId: string) {
    const alerts: Array<{
      type: string;
      title: string;
      message: string;
      severity: string;
    }> = [];

    // Check for low participation by department
    const deptParticipation = await this.getParticipationByDepartment(companyId);
    deptParticipation.forEach((dept) => {
      if (dept.participationRate < 30 && dept.total > 5) {
        alerts.push({
          type: 'warning',
          title: `Low participation in ${dept.department} dept`,
          message: `Only ${dept.participationRate}% participated in last 30 days`,
          severity: 'medium',
        });
      }
    });

    // Check for failed upload batches
    const failedBatches = await this.prisma.employeeUploadBatch.count({
      where: {
        companyId,
        status: 'FAILED',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    if (failedBatches > 0) {
      alerts.push({
        type: 'error',
        title: `${failedBatches} failed invite deliveries`,
        message: 'Review email addresses and resend',
        severity: 'high',
      });
    }

    // Check for recent successful data sync
    const recentBatch = await this.prisma.employeeUploadBatch.findFirst({
      where: {
        companyId,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (
      recentBatch &&
      recentBatch.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ) {
      alerts.push({
        type: 'success',
        title: 'Data sync completed',
        message: 'All metrics updated',
        severity: 'low',
      });
    }

    return alerts;
  }

  async getHrProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        hrProfile: true,
      },
    });

    if (!user || !user.hrProfile) {
      throw new BadRequestException('HR profile not found');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.hrProfile.fullName,
      phone: user.hrProfile.phone,
      designation: user.hrProfile.designation,
      companyId: user.companyId,
    };
  }

  async updateHrProfile(
    userId: string,
    updateData: { fullName?: string; phone?: string; designation?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { hrProfile: true },
    });

    if (!user || !user.hrProfile) {
      throw new BadRequestException('HR profile not found');
    }

    const updatedProfile = await this.prisma.hRProfile.update({
      where: { userId: userId },
      data: {
        ...(updateData.fullName && { fullName: updateData.fullName }),
        ...(updateData.phone !== undefined && { phone: updateData.phone }),
        ...(updateData.designation && { designation: updateData.designation }),
      },
    });

    return {
      message: 'Profile updated successfully',
      profile: {
        id: user.id,
        email: user.email,
        fullName: updatedProfile.fullName,
        phone: updatedProfile.phone,
        designation: updatedProfile.designation,
      },
    };
  }
}
