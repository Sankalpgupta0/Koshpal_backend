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
}
