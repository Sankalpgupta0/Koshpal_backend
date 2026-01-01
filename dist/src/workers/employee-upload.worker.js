"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bullmq_1 = require("bullmq");
const sync_1 = require("csv-parse/sync");
const bcrypt = __importStar(require("bcrypt"));
const client_1 = require("@prisma/client");
const password_util_1 = require("../utils/password.util");
const mail_service_1 = require("../mail/mail.service");
const shared_prisma_1 = require("./shared-prisma");
const prisma = (0, shared_prisma_1.getSharedPrisma)();
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
console.log('='.repeat(60));
console.log('[WORKER] Employee Upload Worker Starting...');
console.log(`[WORKER] Redis: ${REDIS_HOST}:${REDIS_PORT}`);
console.log(`[WORKER] Environment: ${process.env.NODE_ENV || 'development'}`);
console.log('='.repeat(60));
const worker = new bullmq_1.Worker('employee-upload', async (job) => {
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
    const failedRows = [];
    try {
        await prisma.employeeUploadBatch.update({
            where: { id: batchId },
            data: { status: client_1.UploadStatus.PROCESSING },
        });
        console.log(`[JOB-${job.id}] ✓ Batch status updated to PROCESSING`);
        console.log(`[JOB-${job.id}] 📄 Decoding file from base64...`);
        const buffer = Buffer.from(fileBase64, 'base64');
        console.log(`[JOB-${job.id}] ✓ File decoded (${buffer.length} bytes)`);
        console.log(`[JOB-${job.id}] 📊 Parsing CSV file...`);
        const rows = (0, sync_1.parse)(buffer, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true,
        });
        console.log(`[JOB-${job.id}] ✓ Parsed ${rows.length} rows from CSV`);
        if (rows.length === 0) {
            throw new Error('CSV file is empty or has no valid data');
        }
        console.log(`[JOB-${job.id}] 👥 Processing ${rows.length} employee records...`);
        console.log('');
        for (const [index, row] of rows.entries()) {
            const rowNum = index + 1;
            try {
                if (!row.email || !row.full_name) {
                    const reason = !row.email ? 'missing email' : 'missing full_name';
                    console.warn(`[JOB-${job.id}] ⚠️  Row ${rowNum}: Skipped (${reason})`);
                    failedRows.push({ row: rowNum, email: row.email, reason });
                    failed++;
                    continue;
                }
                const existingUser = await prisma.user.findUnique({
                    where: { email: row.email.toLowerCase() },
                });
                if (existingUser) {
                    const reason = 'email already exists';
                    console.warn(`[JOB-${job.id}] ⚠️  Row ${rowNum}: Skipped (${reason}) - ${row.email}`);
                    failedRows.push({ row: rowNum, email: row.email, reason });
                    failed++;
                    continue;
                }
                const plainPassword = (0, password_util_1.generateRandomPassword)();
                const passwordHash = await bcrypt.hash(plainPassword, 10);
                await prisma.user.create({
                    data: {
                        email: row.email.toLowerCase(),
                        passwordHash,
                        role: client_1.Role.EMPLOYEE,
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
                try {
                    await (0, mail_service_1.sendCredentialsEmail)(row.email, row.full_name, plainPassword);
                    console.log(`[JOB-${job.id}] ✉️  Email sent to ${row.email}`);
                }
                catch (emailErr) {
                    console.warn(`[JOB-${job.id}] ⚠️  Email failed for ${row.email}: ${emailErr instanceof Error ? emailErr.message : String(emailErr)}`);
                }
                success++;
                if (success % 10 === 0 || success === rows.length) {
                    console.log(`[JOB-${job.id}] ✓ Progress: ${success}/${rows.length} employees created`);
                }
            }
            catch (err) {
                failed++;
                const reason = err instanceof Error ? err.message : String(err);
                console.error(`[JOB-${job.id}] ❌ Row ${rowNum}: Failed - ${row.email || 'no-email'}`);
                console.error(`[JOB-${job.id}]    Error: ${reason}`);
                failedRows.push({ row: rowNum, email: row.email, reason });
            }
        }
        console.log('');
        console.log(`[JOB-${job.id}] 💾 Updating batch summary...`);
        await prisma.employeeUploadBatch.update({
            where: { id: batchId },
            data: {
                totalRecords: rows.length,
                successRecords: success,
                failedRecords: failed,
                status: failed === rows.length
                    ? client_1.UploadStatus.FAILED
                    : client_1.UploadStatus.COMPLETED,
            },
        });
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        const successRate = ((success / rows.length) * 100).toFixed(1);
        console.log('='.repeat(60));
        console.log(`[JOB-${job.id}] ✅ Job completed successfully`);
        console.log(`[JOB-${job.id}] Duration: ${duration}s`);
        console.log(`[JOB-${job.id}] Total: ${rows.length} | Success: ${success} | Failed: ${failed}`);
        console.log(`[JOB-${job.id}] Success Rate: ${successRate}%`);
        if (failedRows.length > 0) {
            console.log(`[JOB-${job.id}] Failed rows summary:`);
            failedRows.slice(0, 5).forEach((fr) => {
                console.log(`[JOB-${job.id}]   - Row ${fr.row}: ${fr.email || 'no-email'} (${fr.reason})`);
            });
            if (failedRows.length > 5) {
                console.log(`[JOB-${job.id}]   ... and ${failedRows.length - 5} more`);
            }
        }
        console.log('='.repeat(60) + '\n');
    }
    catch (err) {
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
        try {
            await prisma.employeeUploadBatch.update({
                where: { id: batchId },
                data: {
                    status: client_1.UploadStatus.FAILED,
                    totalRecords: 0,
                    successRecords: 0,
                    failedRecords: 0,
                },
            });
        }
        catch (updateErr) {
            console.error(`[JOB-${job.id}] Failed to update batch status:`, updateErr);
        }
        throw err;
    }
}, {
    connection: {
        host: REDIS_HOST,
        port: REDIS_PORT,
    },
    concurrency: 1,
    limiter: {
        max: 5,
        duration: 60000,
    },
});
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
    console.log(`[WORKER] 📊 Job ${job.id} progress: ${JSON.stringify(progress)}`);
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
const shutdown = async (signal) => {
    console.log(`\n[WORKER] ${signal} received. Shutting down gracefully...`);
    try {
        await worker.close();
        console.log('[WORKER] ✓ Worker closed');
        await prisma.$disconnect();
        console.log('[WORKER] ✓ Database disconnected');
        console.log('[WORKER] ✓ Shutdown complete');
        process.exit(0);
    }
    catch (err) {
        console.error('[WORKER] ❌ Error during shutdown:', err);
        process.exit(1);
    }
};
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
//# sourceMappingURL=employee-upload.worker.js.map