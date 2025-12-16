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
    return this.prisma.user.findMany({
      where: {
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
      orderBy: { createdAt: 'desc' },
    });
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
}
