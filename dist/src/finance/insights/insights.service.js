"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsightsService = void 0;
const common_1 = require("@nestjs/common");
const scoped_prisma_service_1 = require("../../common/services/scoped-prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let InsightsService = class InsightsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMonthlySummaries(_userId, year, month) {
        const where = {
            userId: _userId,
        };
        if (year !== undefined) {
            where.year = year;
        }
        if (month !== undefined) {
            where.month = month;
        }
        const summaries = await this.prisma.monthlySummary.findMany({
            where,
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
        });
        return summaries.map((summary) => ({
            ...summary,
            totalIncome: summary.totalIncome.toNumber(),
            totalExpense: summary.totalExpense.toNumber(),
            savings: summary.savings.toNumber(),
            budget: summary.budget.toNumber(),
            savingsRate: this.calculateSavingsRate(summary.totalIncome, summary.savings),
        }));
    }
    async getLatestMonthlySummary(_userId) {
        const summary = await this.prisma.monthlySummary.findFirst({
            where: {
                userId: _userId,
            },
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
        });
        if (!summary) {
            throw new common_1.NotFoundException('No monthly summaries found');
        }
        return {
            ...summary,
            totalIncome: summary.totalIncome.toNumber(),
            totalExpense: summary.totalExpense.toNumber(),
            savings: summary.savings.toNumber(),
            budget: summary.budget.toNumber(),
            savingsRate: this.calculateSavingsRate(summary.totalIncome, summary.savings),
        };
    }
    async getYearlySummary(_userId, year) {
        const summaries = await this.prisma.monthlySummary.findMany({
            where: {
                year,
                userId: _userId,
            },
            orderBy: { month: 'asc' },
            take: 12,
        });
        if (summaries.length === 0) {
            throw new common_1.NotFoundException(`No data found for year ${year}`);
        }
        const totalIncome = summaries.reduce((sum, s) => sum + s.totalIncome.toNumber(), 0);
        const totalExpense = summaries.reduce((sum, s) => sum + s.totalExpense.toNumber(), 0);
        const savings = totalIncome - totalExpense;
        const categoryMap = new Map();
        summaries.forEach((summary) => {
            const breakdown = summary.categoryBreakdown;
            breakdown.forEach((cat) => {
                const current = categoryMap.get(cat.category) || 0;
                categoryMap.set(cat.category, current + cat.amount);
            });
        });
        const categoryBreakdown = Array.from(categoryMap.entries())
            .map(([category, amount]) => ({
            category,
            amount,
            percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        }))
            .sort((a, b) => b.amount - a.amount);
        return {
            year,
            totalIncome,
            totalExpense,
            savings,
            savingsRate: totalIncome > 0 ? (savings / totalIncome) * 100 : 0,
            monthsWithData: summaries.length,
            monthlyBreakdown: summaries.map((s) => ({
                month: s.month,
                totalIncome: s.totalIncome.toNumber(),
                totalExpense: s.totalExpense.toNumber(),
                savings: s.savings.toNumber(),
            })),
            categoryBreakdown,
        };
    }
    async getCategoryBreakdown(_userId, year, month) {
        const where = {
            userId: _userId,
        };
        if (year !== undefined)
            where.year = year;
        if (month !== undefined)
            where.month = month;
        const summaries = await this.prisma.monthlySummary.findMany({
            where,
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
            take: 12,
        });
        if (summaries.length === 0) {
            throw new common_1.NotFoundException('No data found for the specified period');
        }
        const categoryMap = new Map();
        let totalExpense = 0;
        summaries.forEach((summary) => {
            const breakdown = summary.categoryBreakdown;
            breakdown.forEach((cat) => {
                const current = categoryMap.get(cat.category) || {
                    amount: 0,
                    count: 0,
                };
                categoryMap.set(cat.category, {
                    amount: current.amount + cat.amount,
                    count: current.count + cat.transactionCount,
                });
                totalExpense += cat.amount;
            });
        });
        const categories = Array.from(categoryMap.entries())
            .map(([category, data]) => ({
            category,
            amount: data.amount,
            transactionCount: data.count,
            percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
        }))
            .sort((a, b) => b.amount - a.amount);
        return {
            period: year && month
                ? `${year}-${month.toString().padStart(2, '0')}`
                : year
                    ? `${year}`
                    : 'All Time',
            totalExpense,
            categoryCount: categories.length,
            categories,
        };
    }
    async getSpendingTrends(_userId, months = 6) {
        const summaries = await this.prisma.monthlySummary.findMany({
            where: {
                userId: _userId,
            },
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
            take: months,
        });
        if (summaries.length === 0) {
            throw new common_1.NotFoundException('No historical data available');
        }
        const trends = summaries.reverse().map((summary) => ({
            period: `${summary.year}-${summary.month.toString().padStart(2, '0')}`,
            year: summary.year,
            month: summary.month,
            totalIncome: summary.totalIncome.toNumber(),
            totalExpense: summary.totalExpense.toNumber(),
            savings: summary.savings.toNumber(),
            savingsRate: this.calculateSavingsRate(summary.totalIncome, summary.savings),
        }));
        const avgIncome = trends.reduce((sum, t) => sum + t.totalIncome, 0) / trends.length;
        const avgExpense = trends.reduce((sum, t) => sum + t.totalExpense, 0) / trends.length;
        const avgSavings = trends.reduce((sum, t) => sum + t.savings, 0) / trends.length;
        return {
            period: `Last ${months} months`,
            trends,
            averages: {
                income: avgIncome,
                expense: avgExpense,
                savings: avgSavings,
                savingsRate: avgIncome > 0 ? (avgSavings / avgIncome) * 100 : 0,
            },
        };
    }
    async generateMonthlySummary(userId, companyId, month, year) {
        const periodStart = new Date(year, month - 1, 1);
        const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);
        const transactions = await this.prisma.transaction.findMany({
            where: {
                transactionDate: {
                    gte: periodStart,
                    lte: periodEnd,
                },
            },
        });
        const totalIncome = transactions
            .filter((t) => t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amount.toNumber(), 0);
        const totalExpense = transactions
            .filter((t) => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount.toNumber(), 0);
        const savings = totalIncome - totalExpense;
        const categoryMap = new Map();
        transactions
            .filter((t) => t.type === 'EXPENSE')
            .forEach((t) => {
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
        const summary = await this.prisma.monthlySummary.upsert({
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
        return {
            ...summary,
            totalIncome: summary.totalIncome.toNumber(),
            totalExpense: summary.totalExpense.toNumber(),
            savings: summary.savings.toNumber(),
            savingsRate: this.calculateSavingsRate(summary.totalIncome, summary.savings),
        };
    }
    async updateBudget(userId, companyId, month, year, budget) {
        const existingSummary = await this.prisma.monthlySummary.findUnique({
            where: {
                userId_month_year: {
                    userId,
                    month,
                    year,
                },
            },
        });
        if (existingSummary) {
            const updated = await this.prisma.monthlySummary.update({
                where: {
                    userId_month_year: {
                        userId,
                        month,
                        year,
                    },
                },
                data: {
                    budget: new library_1.Decimal(budget),
                },
            });
            return {
                ...updated,
                totalIncome: updated.totalIncome.toNumber(),
                totalExpense: updated.totalExpense.toNumber(),
                savings: updated.savings.toNumber(),
                budget: updated.budget.toNumber(),
            };
        }
        else {
            const periodStart = new Date(year, month - 1, 1);
            const periodEnd = new Date(year, month, 0, 23, 59, 59);
            const created = await this.prisma.monthlySummary.create({
                data: {
                    companyId,
                    month,
                    year,
                    periodStart,
                    periodEnd,
                    totalIncome: new library_1.Decimal(0),
                    totalExpense: new library_1.Decimal(0),
                    savings: new library_1.Decimal(0),
                    budget: new library_1.Decimal(budget),
                    categoryBreakdown: {},
                },
            });
            return {
                ...created,
                totalIncome: created.totalIncome.toNumber(),
                totalExpense: created.totalExpense.toNumber(),
                savings: created.savings.toNumber(),
                budget: created.budget.toNumber(),
            };
        }
    }
    async getBudget(userId, month, year) {
        const summary = await this.prisma.monthlySummary.findUnique({
            where: {
                userId_month_year: {
                    userId,
                    month,
                    year,
                },
            },
            select: {
                budget: true,
                month: true,
                year: true,
            },
        });
        if (!summary) {
            return {
                month,
                year,
                budget: 0,
            };
        }
        return {
            month: summary.month,
            year: summary.year,
            budget: summary.budget.toNumber(),
        };
    }
    calculateSavingsRate(income, savings) {
        const incomeNum = typeof income === 'number' ? income : income.toNumber();
        const savingsNum = typeof savings === 'number' ? savings : savings.toNumber();
        if (incomeNum === 0)
            return 0;
        return (savingsNum / incomeNum) * 100;
    }
};
exports.InsightsService = InsightsService;
exports.InsightsService = InsightsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [scoped_prisma_service_1.ScopedPrismaService])
], InsightsService);
//# sourceMappingURL=insights.service.js.map