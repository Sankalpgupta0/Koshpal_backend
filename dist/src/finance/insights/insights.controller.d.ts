import { InsightsService } from './insights.service';
import type { ValidatedUser } from '../../common/types/user.types';
import { GenerateSummaryDto } from './dto/generate-summary.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
export declare class InsightsController {
    private readonly insightsService;
    constructor(insightsService: InsightsService);
    getMonthlySummaries(user: ValidatedUser, year?: string, month?: string): Promise<any>;
    getLatestMonthlySummary(user: ValidatedUser): Promise<any>;
    getYearlySummary(user: ValidatedUser, year: string): Promise<{
        year: number;
        totalIncome: any;
        totalExpense: any;
        savings: number;
        savingsRate: number;
        monthsWithData: any;
        monthlyBreakdown: any;
        categoryBreakdown: {
            category: string;
            amount: number;
            percentage: number;
        }[];
    }>;
    getCategoryBreakdown(user: ValidatedUser, year?: string, month?: string): Promise<{
        period: string;
        totalExpense: number;
        categoryCount: number;
        categories: {
            category: string;
            amount: number;
            transactionCount: number;
            percentage: number;
        }[];
    }>;
    getSpendingTrends(user: ValidatedUser, months?: string): Promise<{
        period: string;
        trends: any;
        averages: {
            income: number;
            expense: number;
            savings: number;
            savingsRate: number;
        };
    }>;
    generateMonthlySummary(user: ValidatedUser, dto: GenerateSummaryDto): Promise<any>;
    updateBudget(user: ValidatedUser, dto: UpdateBudgetDto): Promise<any>;
    getBudget(user: ValidatedUser, month: string, year: string): Promise<{
        month: any;
        year: any;
        budget: any;
    }>;
}
