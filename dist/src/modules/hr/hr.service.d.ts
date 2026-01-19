import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
interface CurrentUser {
    userId: string;
    companyId: string;
    role: string;
}
export declare class HrService {
    private readonly prisma;
    private readonly configService;
    private readonly uploadQueue;
    constructor(prisma: PrismaService, configService: ConfigService);
    handleUpload(file: Express.Multer.File, user: CurrentUser): Promise<{
        message: string;
        batchId: string;
    }>;
    getBatchStatus(batchId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.UploadStatus;
        fileName: string;
        totalRecords: number;
        successRecords: number;
        failedRecords: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getBatchesForCompany(companyId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.UploadStatus;
        fileName: string;
        totalRecords: number;
        successRecords: number;
        failedRecords: number;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getEmployees(companyId: string): Promise<{
        id: string;
        name: string;
        email: string;
        department: string;
        role: string;
        status: string;
        engagement: string;
        lastActivity: string;
        sessionsAttended: number;
        isActive: boolean;
        phone: string | null | undefined;
        dateOfJoining: Date | null | undefined;
    }[]>;
    getDepartments(companyId: string): Promise<string[]>;
    getEmployee(id: string, companyId: string): Promise<{
        id: string;
        email: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateEmployeeStatus(id: string, companyId: string, status: boolean): Promise<{
        id: string;
        email: string;
        isActive: boolean;
        updatedAt: Date;
    }>;
    getCompanyInsightsSummary(companyId: string): Promise<{
        totalEmployees: number;
        aggregatedIncome: number;
        aggregatedExpense: number;
        aggregatedSavings: number;
        monthlySummaries: unknown[];
    }>;
    getDashboardStats(companyId: string): Promise<{
        employeeMonitored: number;
        employeeMonitoredChange: string;
        avgFinancialHealth: number;
        avgFinancialHealthPeriod: string;
        participationRate: number;
        participationRateChange: string;
        sessionsThisPeriod: number;
        sessionsRate: string;
    }>;
    getFinancialHealthDistribution(companyId: string): Promise<{
        distribution: {
            category: string;
            value: number;
            range: string;
        }[];
        total: number;
    }>;
    getParticipationByDepartment(companyId: string): Promise<{
        department: any;
        total: any;
        participating: any;
        participationRate: number;
    }[]>;
    getDashboardAlerts(companyId: string): Promise<{
        type: string;
        title: string;
        message: string;
        severity: string;
    }[]>;
    getHrProfile(userId: string): Promise<{
        id: string;
        email: string;
        fullName: string;
        phone: string | null;
        designation: string | null;
        companyId: string | null;
        profilePhoto: string | null;
    }>;
    updateHrProfile(userId: string, updateData: {
        fullName?: string;
        phone?: string;
        designation?: string;
    }, image?: Express.Multer.File): Promise<{
        message: string;
        profile: {
            companyId: string;
            userId: string;
            fullName: string;
            phone: string | null;
            profilePhoto: string | null;
            profilePhotoId: string | null;
            designation: string | null;
        };
    }>;
}
export {};
