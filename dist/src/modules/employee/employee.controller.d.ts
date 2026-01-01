import { AccountsService } from '../../finance/accounts/accounts.service';
import { TransactionsService } from '../../finance/transactions/transactions.service';
import { InsightsService } from '../../finance/insights/insights.service';
import { EmployeeService } from './employee.service';
import { CreateAccountDto } from '../../finance/accounts/dto/create-account.dto';
import { CreateTransactionDto } from '../../finance/transactions/dto/create-transaction.dto';
interface CurrentUserDto {
    userId: string;
    email: string;
    role: string;
}
export declare class EmployeeController {
    private readonly employeeService;
    private readonly accountsService;
    private readonly transactionsService;
    private readonly insightsService;
    constructor(employeeService: EmployeeService, accountsService: AccountsService, transactionsService: TransactionsService, insightsService: InsightsService);
    getProfile(user: CurrentUserDto): Promise<{
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            isActive: boolean;
            lastLoginAt: Date | null;
            createdAt: Date;
        };
        company: {
            id: string;
            name: string;
            domain: string | null;
            status: import("@prisma/client").$Enums.CompanyStatus;
        } | null;
        profile: {
            companyId: string;
            userId: string;
            employeeCode: string | null;
            fullName: string;
            phone: string | null;
            department: string | null;
            dateOfJoining: Date | null;
        };
        statistics: {
            accounts: {
                total: number;
                totalBalance: number;
            };
            goals: {
                total: number;
                active: number;
                completed: number;
                totalTarget: number;
                totalSaved: number;
                progress: number;
            };
            consultations: {
                total: number;
                upcoming: number;
                completed: number;
            };
        };
    }>;
    createAccount(createAccountDto: CreateAccountDto, user: CurrentUserDto): Promise<any>;
    getAccounts(user: CurrentUserDto): Promise<any>;
    updateAccount(id: string, updateAccountDto: CreateAccountDto, user: CurrentUserDto): Promise<any>;
    deleteAccount(id: string, user: CurrentUserDto): Promise<{
        message: string;
    }>;
    createTransaction(createTransactionDto: CreateTransactionDto, user: CurrentUserDto): Promise<any>;
    getTransactions(user: CurrentUserDto, accountId?: string, type?: string, category?: string): Promise<any>;
    getTransaction(id: string, user: CurrentUserDto): Promise<any>;
    deleteTransaction(id: string, user: CurrentUserDto): Promise<{
        message: string;
    }>;
    getLatestSummary(user: CurrentUserDto): Promise<any>;
    getCategoryBreakdown(user: CurrentUserDto, month?: string, year?: string): Promise<{
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
    getSpendingTrends(user: CurrentUserDto, months?: string): Promise<{
        period: string;
        trends: any;
        averages: {
            income: number;
            expense: number;
            savings: number;
            savingsRate: number;
        };
    }>;
}
export {};
