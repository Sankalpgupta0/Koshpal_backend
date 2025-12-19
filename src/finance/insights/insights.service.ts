import { Injectable, NotFoundException } from '@nestjs/common';
import { ScopedPrismaService } from '../../common/services/scoped-prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

@Injectable()
export class InsightsService {
  constructor(private readonly prisma: ScopedPrismaService) {}

  /**
   * Get monthly summaries for a user
   * Can filter by year and month
   */
  async getMonthlySummaries(_userId: string, year?: number, month?: number) {
    const where: any = {};

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
      savingsRate: this.calculateSavingsRate(
        summary.totalIncome,
        summary.savings,
      ),
    }));
  }

  /**
   * Get the most recent monthly summary
   */
  async getLatestMonthlySummary(_userId: string) {
    const summary = await this.prisma.monthlySummary.findFirst({
      where: {},
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    if (!summary) {
      throw new NotFoundException('No monthly summaries found');
    }

    return {
      ...summary,
      totalIncome: summary.totalIncome.toNumber(),
      totalExpense: summary.totalExpense.toNumber(),
      savings: summary.savings.toNumber(),
      budget: summary.budget.toNumber(),
      savingsRate: this.calculateSavingsRate(
        summary.totalIncome,
        summary.savings,
      ),
    };
  }

  /**
   * Get yearly summary aggregating all months
   */
  async getYearlySummary(_userId: string, year: number) {
    const summaries = await this.prisma.monthlySummary.findMany({
      where: { year },
      orderBy: { month: 'asc' },
      take: 12, // Limit to 12 months max
    });

    if (summaries.length === 0) {
      throw new NotFoundException(`No data found for year ${year}`);
    }

    const totalIncome = summaries.reduce(
      (sum, s) => sum + s.totalIncome.toNumber(),
      0,
    );
    const totalExpense = summaries.reduce(
      (sum, s) => sum + s.totalExpense.toNumber(),
      0,
    );
    const savings = totalIncome - totalExpense;

    // Aggregate category breakdown across all months
    const categoryMap = new Map<string, number>();
    summaries.forEach((summary) => {
      const breakdown = summary.categoryBreakdown as CategoryBreakdown[];
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

  /**
   * Get detailed category breakdown
   */
  async getCategoryBreakdown(_userId: string, year?: number, month?: number) {
    const where: any = {};
    if (year !== undefined) where.year = year;
    if (month !== undefined) where.month = month;

    const summaries = await this.prisma.monthlySummary.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 12, // Limit to 12 months to prevent unbounded queries
    });

    if (summaries.length === 0) {
      throw new NotFoundException('No data found for the specified period');
    }

    // Aggregate categories across all matching summaries
    const categoryMap = new Map<string, { amount: number; count: number }>();
    let totalExpense = 0;

    summaries.forEach((summary) => {
      const breakdown = summary.categoryBreakdown as CategoryBreakdown[];
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
      period:
        year && month
          ? `${year}-${month.toString().padStart(2, '0')}`
          : year
            ? `${year}`
            : 'All Time',
      totalExpense,
      categoryCount: categories.length,
      categories,
    };
  }

  /**
   * Get spending trends over time
   */
  async getSpendingTrends(_userId: string, months: number = 6) {
    const summaries = await this.prisma.monthlySummary.findMany({
      where: {},
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: months,
    });

    if (summaries.length === 0) {
      throw new NotFoundException('No historical data available');
    }

    const trends = summaries.reverse().map((summary) => ({
      period: `${summary.year}-${summary.month.toString().padStart(2, '0')}`,
      year: summary.year,
      month: summary.month,
      totalIncome: summary.totalIncome.toNumber(),
      totalExpense: summary.totalExpense.toNumber(),
      savings: summary.savings.toNumber(),
      savingsRate: this.calculateSavingsRate(
        summary.totalIncome,
        summary.savings,
      ),
    }));

    // Calculate averages
    const avgIncome =
      trends.reduce((sum, t) => sum + t.totalIncome, 0) / trends.length;
    const avgExpense =
      trends.reduce((sum, t) => sum + t.totalExpense, 0) / trends.length;
    const avgSavings =
      trends.reduce((sum, t) => sum + t.savings, 0) / trends.length;

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

  /**
   * Generate or regenerate monthly summary for a specific month/year
   */
  async generateMonthlySummary(
    userId: string,
    companyId: string,
    month: number,
    year: number,
  ) {
    // Calculate period boundaries
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all transactions for the period
    const transactions = await this.prisma.transaction.findMany({
      where: {
        transactionDate: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    // Calculate totals
    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount.toNumber(), 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount.toNumber(), 0);

    const savings = totalIncome - totalExpense;

    // Calculate category breakdown (expenses only)
    const categoryMap = new Map<string, { amount: number; count: number }>();

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

    const categoryBreakdown: CategoryBreakdown[] = Array.from(
      categoryMap.entries(),
    )
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        transactionCount: data.count,
        percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Upsert monthly summary
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
        totalIncome: new Decimal(totalIncome),
        totalExpense: new Decimal(totalExpense),
        savings: new Decimal(savings),
        categoryBreakdown: JSON.parse(JSON.stringify(categoryBreakdown)),
      },
      create: {
        // userId will be injected by scoped-prisma.service.ts
        companyId,
        month,
        year,
        periodStart,
        periodEnd,
        totalIncome: new Decimal(totalIncome),
        totalExpense: new Decimal(totalExpense),
        savings: new Decimal(savings),
        categoryBreakdown: JSON.parse(JSON.stringify(categoryBreakdown)),
      },
    });

    return {
      ...summary,
      totalIncome: summary.totalIncome.toNumber(),
      totalExpense: summary.totalExpense.toNumber(),
      savings: summary.savings.toNumber(),
      savingsRate: this.calculateSavingsRate(
        summary.totalIncome,
        summary.savings,
      ),
    };
  }

  /**
   * Update budget for a specific month
   */
  async updateBudget(
    userId: string,
    companyId: string,
    month: number,
    year: number,
    budget: number,
  ) {
    // Check if monthly summary exists, if not create it
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
      // Update existing summary
      const updated = await this.prisma.monthlySummary.update({
        where: {
          userId_month_year: {
            userId,
            month,
            year,
          },
        },
        data: {
          budget: new Decimal(budget),
        },
      });

      return {
        ...updated,
        totalIncome: updated.totalIncome.toNumber(),
        totalExpense: updated.totalExpense.toNumber(),
        savings: updated.savings.toNumber(),
        budget: updated.budget.toNumber(),
      };
    } else {
      // Create new summary with budget
      const periodStart = new Date(year, month - 1, 1);
      const periodEnd = new Date(year, month, 0, 23, 59, 59);

      const created = await this.prisma.monthlySummary.create({
        data: {
          // userId will be injected by scoped-prisma.service.ts
          companyId,
          month,
          year,
          periodStart,
          periodEnd,
          totalIncome: new Decimal(0),
          totalExpense: new Decimal(0),
          savings: new Decimal(0),
          budget: new Decimal(budget),
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

  /**
   * Get budget for a specific month
   */
  async getBudget(userId: string, month: number, year: number) {
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

  /**
   * Helper to calculate savings rate
   */
  private calculateSavingsRate(
    income: Decimal | number,
    savings: Decimal | number,
  ): number {
    const incomeNum = typeof income === 'number' ? income : income.toNumber();
    const savingsNum =
      typeof savings === 'number' ? savings : savings.toNumber();

    if (incomeNum === 0) return 0;
    return (savingsNum / incomeNum) * 100;
  }
}
