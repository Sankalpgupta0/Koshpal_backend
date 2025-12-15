import { Worker, Job } from 'bullmq';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcrypt';
import { PrismaClient, Role, UploadStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Redis configuration
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

console.log('='.repeat(60));
console.log('[WORKER] Employee Upload Worker Starting...');
console.log(`[WORKER] Redis: ${REDIS_HOST}:${REDIS_PORT}`);
console.log(`[WORKER] Environment: ${process.env.NODE_ENV || 'development'}`);
console.log('='.repeat(60));

/**
 * Shape of data coming from the queue
 */
interface EmployeeUploadJob {
  batchId: string;
  companyId: string;
  fileBase64: string;
}

/**
 * Shape of each Excel row
 */
interface EmployeeRow {
  email?: string;
  full_name?: string;
  employee_code?: string;
  phone?: string;
}

const worker = new Worker<EmployeeUploadJob>(
  'employee-upload',
  async (job: Job<EmployeeUploadJob>): Promise<void> => {
    const startTime = Date.now();
    const { batchId, companyId, fileBase64 } = job.data;

    console.log('\n' + '='.repeat(60));
    console.log(`[JOB-${job.id}] 🚀 Starting employee upload processing`);
    console.log(`[JOB-${job.id}] BatchId: ${batchId}`);
    console.log(`[JOB-${job.id}] CompanyId: ${companyId}`);
    console.log(`[JOB-${job.id}] Attempt: ${job.attemptsMade + 1}`);
    console.log('='.repeat(60));

    let success = 0;
    let failed = 0;
    const failedRows: { row: number; email?: string; reason: string }[] = [];

    try {
      // Update batch status to PROCESSING
      await prisma.employeeUploadBatch.update({
        where: { id: batchId },
        data: { status: UploadStatus.PROCESSING },
      });
      console.log(`[JOB-${job.id}] ✓ Batch status updated to PROCESSING`);

      // Convert base64 to buffer
      console.log(`[JOB-${job.id}] 📄 Decoding file from base64...`);
      const buffer = Buffer.from(fileBase64, 'base64');
      console.log(`[JOB-${job.id}] ✓ File decoded (${buffer.length} bytes)`);

      // Read workbook
      console.log(`[JOB-${job.id}] 📊 Parsing Excel file...`);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const rows = XLSX.utils.sheet_to_json<EmployeeRow>(sheet, {
        defval: null,
        raw: false,
      });

      console.log(
        `[JOB-${job.id}] ✓ Parsed ${rows.length} rows from sheet "${sheetName}"`,
      );

      if (rows.length === 0) {
        throw new Error('Excel file is empty or has no valid data');
      }

      // Default password (later you should mail reset link)
      console.log(`[JOB-${job.id}] 🔐 Generating default password hash...`);
      const passwordHash = await bcrypt.hash('password123', 10);
      console.log(`[JOB-${job.id}] ✓ Password hash generated`);

      console.log(
        `[JOB-${job.id}] 👥 Processing ${rows.length} employee records...`,
      );
      console.log('');

      for (const [index, row] of rows.entries()) {
        const rowNum = index + 1;
        try {
          // Validation
          if (!row.email || !row.full_name) {
            const reason = !row.email ? 'missing email' : 'missing full_name';
            console.warn(
              `[JOB-${job.id}] ⚠️  Row ${rowNum}: Skipped (${reason})`,
            );
            failedRows.push({ row: rowNum, email: row.email, reason });
            failed++;
            continue;
          }

          // Check for duplicate email
          const existingUser = await prisma.user.findUnique({
            where: { email: row.email.toLowerCase() },
          });

          if (existingUser) {
            const reason = 'email already exists';
            console.warn(
              `[JOB-${job.id}] ⚠️  Row ${rowNum}: Skipped (${reason}) - ${row.email}`,
            );
            failedRows.push({ row: rowNum, email: row.email, reason });
            failed++;
            continue;
          }

          // Create employee
          await prisma.user.create({
            data: {
              email: row.email.toLowerCase(),
              passwordHash,
              role: Role.EMPLOYEE,
              companyId: companyId,
              employeeProfile: {
                create: {
                  fullName: row.full_name,
                  employeeCode: row.employee_code ?? null,
                  phone: row.phone ?? null,
                  companyId: companyId,
                },
              },
            },
          });

          success++;
          if (success % 10 === 0 || success === rows.length) {
            console.log(
              `[JOB-${job.id}] ✓ Progress: ${success}/${rows.length} employees created`,
            );
          }
        } catch (err) {
          failed++;
          const reason = err instanceof Error ? err.message : String(err);
          console.error(
            `[JOB-${job.id}] ❌ Row ${rowNum}: Failed - ${row.email || 'no-email'}`,
          );
          console.error(`[JOB-${job.id}]    Error: ${reason}`);
          failedRows.push({ row: rowNum, email: row.email, reason });
        }
      }

      console.log('');

      // Update batch summary
      console.log(`[JOB-${job.id}] 💾 Updating batch summary...`);
      await prisma.employeeUploadBatch.update({
        where: { id: batchId },
        data: {
          totalRecords: rows.length,
          successRecords: success,
          failedRecords: failed,
          status:
            failed === rows.length
              ? UploadStatus.FAILED
              : UploadStatus.COMPLETED,
        },
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const successRate = ((success / rows.length) * 100).toFixed(1);

      console.log('='.repeat(60));
      console.log(`[JOB-${job.id}] ✅ Job completed successfully`);
      console.log(`[JOB-${job.id}] Duration: ${duration}s`);
      console.log(
        `[JOB-${job.id}] Total: ${rows.length} | Success: ${success} | Failed: ${failed}`,
      );
      console.log(`[JOB-${job.id}] Success Rate: ${successRate}%`);

      if (failedRows.length > 0) {
        console.log(`[JOB-${job.id}] Failed rows summary:`);
        failedRows.slice(0, 5).forEach((fr) => {
          console.log(
            `[JOB-${job.id}]   - Row ${fr.row}: ${fr.email || 'no-email'} (${fr.reason})`,
          );
        });
        if (failedRows.length > 5) {
          console.log(
            `[JOB-${job.id}]   ... and ${failedRows.length - 5} more`,
          );
        }
      }

      console.log('='.repeat(60) + '\n');
    } catch (err) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;

      console.error('='.repeat(60));
      console.error(`[JOB-${job.id}] ❌ Job failed after ${duration}s`);
      console.error(`[JOB-${job.id}] Error: ${errorMessage}`);
      if (errorStack) {
        console.error(`[JOB-${job.id}] Stack trace:`);
        console.error(errorStack);
      }
      console.error('='.repeat(60) + '\n');

      // Update batch status to FAILED
      try {
        await prisma.employeeUploadBatch.update({
          where: { id: batchId },
          data: {
            status: UploadStatus.FAILED,
            totalRecords: 0,
            successRecords: 0,
            failedRecords: 0,
          },
        });
      } catch (updateErr) {
        console.error(
          `[JOB-${job.id}] Failed to update batch status:`,
          updateErr,
        );
      }

      throw err; // important so BullMQ marks job as failed
    }
  },
  {
    connection: {
      host: REDIS_HOST,
      port: REDIS_PORT,
    },
    concurrency: 1,
    limiter: {
      max: 5,
      duration: 60000, // 5 jobs per minute
    },
  },
);

/**
 * Worker-level lifecycle logs
 */
worker.on('completed', (job) => {
  console.log(`[WORKER] ✅ Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  const errorMsg = err instanceof Error ? err.message : String(err);
  console.error(`[WORKER] ❌ Job ${job?.id} failed: ${errorMsg}`);
});

worker.on('error', (err) => {
  console.error('[WORKER] ⚠️  Worker error:', err);
});

worker.on('active', (job) => {
  console.log(`[WORKER] 🔄 Job ${job.id} is now active`);
});

worker.on('stalled', (jobId) => {
  console.warn(`[WORKER] ⏸️  Job ${jobId} has stalled`);
});

worker.on('progress', (job, progress) => {
  console.log(
    `[WORKER] 📊 Job ${job.id} progress: ${JSON.stringify(progress)}`,
  );
});

worker.on('ready', () => {
  console.log('[WORKER] 🟢 Worker ready to process jobs');
});

worker.on('paused', () => {
  console.log('[WORKER] ⏸️  Worker paused');
});

worker.on('resumed', () => {
  console.log('[WORKER] ▶️  Worker resumed');
});

void worker
  .waitUntilReady()
  .then(() => {
    console.log('[WORKER] ✓ Worker initialized and listening for jobs...');
    console.log('[WORKER] Press Ctrl+C to stop\n');
  })
  .catch((err) => {
    console.error('[WORKER] ❌ Failed to initialize worker:', err);
    process.exit(1);
  });

/**
 * Graceful shutdown
 */
const shutdown = async (signal: string) => {
  console.log(`\n[WORKER] ${signal} received. Shutting down gracefully...`);
  try {
    await worker.close();
    console.log('[WORKER] ✓ Worker closed');

    await prisma.$disconnect();
    console.log('[WORKER] ✓ Database disconnected');

    console.log('[WORKER] ✓ Shutdown complete');
    process.exit(0);
  } catch (err) {
    console.error('[WORKER] ❌ Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
