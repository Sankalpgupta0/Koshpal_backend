"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bullmq_1 = require("bullmq");
const library_1 = require("@prisma/client/runtime/library");
const shared_prisma_1 = require("./shared-prisma");
const prisma = (0, shared_prisma_1.getSharedPrisma)();
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
console.log('='.repeat(60));
console.log('[WORKER] Monthly Insights Worker Starting...');
console.log(`[WORKER] Redis: ${REDIS_HOST}:${REDIS_PORT}`);
console.log(`[WORKER] Environment: ${process.env.NODE_ENV || 'development'}`);
console.log('='.repeat(60));
const worker = new bullmq_1.Worker('insight-queue', async (job) => {
    const startTime = Date.now();
    const { userId, companyId, transactionDate } = job.data;
    console.log('\n' + '='.repeat(60));
    console.log(`[JOB-${job.id}] 📊 Starting monthly insights generation`);
    console.log(`[JOB-${job.id}] UserId: ${userId}`);
    console.log(`[JOB-${job.id}] CompanyId: ${companyId}`);
    console.log(`[JOB-${job.id}] Transaction Date: ${transactionDate}`);
    console.log(`[JOB-${job.id}] Attempt: ${job.attemptsMade + 1}`);
    console.log('='.repeat(60));
    try {
        const date = new Date(transactionDate);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        console.log(`[JOB-${job.id}] 📅 Processing period: ${year}-${month.toString().padStart(2, '0')}`);
        const periodStart = new Date(year, month - 1, 1);
        const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);
        console.log(`[JOB-${job.id}] 🔍 Fetching transactions...`);
        console.log(`[JOB-${job.id}]    From: ${periodStart.toISOString()}`);
        console.log(`[JOB-${job.id}]    To: ${periodEnd.toISOString()}`);
        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                transactionDate: {
                    gte: periodStart,
                    lte: periodEnd,
                },
            },
        });
        console.log(`[JOB-${job.id}] ✓ Found ${transactions.length} transactions`);
        if (transactions.length === 0) {
            console.log(`[JOB-${job.id}] ⚠️  No transactions found for this period, skipping summary generation`);
            console.log(`[JOB-${job.id}] ✅ Completed in ${Date.now() - startTime}ms`);
            return;
        }
        const incomeTransactions = transactions.filter((t) => t.type === 'INCOME');
        const expenseTransactions = transactions.filter((t) => t.type === 'EXPENSE');
        const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount.toNumber(), 0);
        const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount.toNumber(), 0);
        const savings = totalIncome - totalExpense;
        console.log(`[JOB-${job.id}] 💰 Calculations:`);
        console.log(`[JOB-${job.id}]    Income: ₹${totalIncome.toFixed(2)} (${incomeTransactions.length} txns)`);
        console.log(`[JOB-${job.id}]    Expense: ₹${totalExpense.toFixed(2)} (${expenseTransactions.length} txns)`);
        console.log(`[JOB-${job.id}]    Savings: ₹${savings.toFixed(2)}`);
        console.log(`[JOB-${job.id}] 📈 Calculating category breakdown...`);
        const categoryMap = new Map();
        expenseTransactions.forEach((t) => {
            const category = t.category || 'Uncategorized';
            const current = categoryMap.get(category) || { amount: 0, count: 0 };
            categoryMap.set(category, {
                amount: current.amount + t.amount.toNumber(),
                count: current.count + 1,
            });
        });
        const categoryBreakdown = Array.from(categoryMap.entries())
            .map(([category, data]) => ({
            category,
            amount: data.amount,
            transactionCount: data.count,
            percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
        }))
            .sort((a, b) => b.amount - a.amount);
        console.log(`[JOB-${job.id}] ✓ Category breakdown: ${categoryBreakdown.length} categories`);
        categoryBreakdown.forEach((cat) => {
            console.log(`[JOB-${job.id}]    - ${cat.category}: ₹${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)`);
        });
        console.log(`[JOB-${job.id}] 💾 Saving monthly summary to database...`);
        const summary = await prisma.monthlySummary.upsert({
            where: {
                userId_month_year: {
                    userId,
                    month,
                    year,
                },
            },
            update: {
                periodStart,
                periodEnd,
                totalIncome: new library_1.Decimal(totalIncome),
                totalExpense: new library_1.Decimal(totalExpense),
                savings: new library_1.Decimal(savings),
                categoryBreakdown: JSON.parse(JSON.stringify(categoryBreakdown)),
            },
            create: {
                userId,
                companyId,
                month,
                year,
                periodStart,
                periodEnd,
                totalIncome: new library_1.Decimal(totalIncome),
                totalExpense: new library_1.Decimal(totalExpense),
                savings: new library_1.Decimal(savings),
                categoryBreakdown: JSON.parse(JSON.stringify(categoryBreakdown)),
            },
        });
        const duration = Date.now() - startTime;
        console.log(`[JOB-${job.id}] ✅ Monthly summary saved successfully!`);
        console.log(`[JOB-${job.id}] 📊 Summary ID: ${summary.id}`);
        console.log(`[JOB-${job.id}] ⏱️  Completed in ${duration}ms`);
        console.log('='.repeat(60) + '\n');
    }
    catch (error) {
        console.error(`[JOB-${job.id}] ❌ Error processing monthly insights:`, error);
        console.log('='.repeat(60) + '\n');
        throw error;
    }
}, {
    connection: {
        host: REDIS_HOST,
        port: REDIS_PORT,
    },
    concurrency: 3,
    limiter: {
        max: 10,
        duration: 1000,
    },
});
worker.on('completed', (job) => {
    console.log(`✅ [WORKER] Job ${job.id} completed successfully`);
});
worker.on('failed', (job, err) => {
    console.error(`❌ [WORKER] Job ${job?.id} failed:`, err.message);
});
worker.on('error', (err) => {
    console.error('❌ [WORKER] Worker error:', err);
});
process.on('SIGINT', async () => {
    console.log('\n🛑 [WORKER] Shutting down gracefully...');
    await worker.close();
    await prisma.$disconnect();
    console.log('👋 [WORKER] Shutdown complete');
    process.exit(0);
});
console.log('✅ [WORKER] Monthly Insights Worker is ready and listening for jobs');
//# sourceMappingURL=monthly-insights.worker.js.map