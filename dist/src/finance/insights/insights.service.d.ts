import { ScopedPrismaService } from '../../common/services/scoped-prisma.service';
export declare class InsightsService {
    private readonly prisma;
    constructor(prisma: ScopedPrismaService);
    getMonthlySummaries(_userId: string, year?: number, month?: number): Promise<any>;
    getLatestMonthlySummary(_userId: string): Promise<any>;
    getYearlySummary(_userId: string, year: number): Promise<{
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
    getCategoryBreakdown(_userId: string, year?: number, month?: number): Promise<{
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
    getSpendingTrends(_userId: string, months?: number): Promise<{
        period: string;
        trends: any;
        averages: {
            income: number;
            expense: number;
            savings: number;
            savingsRate: number;
        };
    }>;
    generateMonthlySummary(userId: string, companyId: string, month: number, year: number): Promise<any>;
    updateBudget(userId: string, companyId: string, month: number, year: number, budget: number): Promise<any>;
    getBudget(userId: string, month: number, year: number): Promise<{
        month: any;
        year: any;
        budget: any;
    }>;
    private calculateSavingsRate;
}
