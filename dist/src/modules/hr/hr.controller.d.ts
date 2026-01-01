import { HrService } from './hr.service';
interface CurrentUserDto {
    userId: string;
    companyId: string;
    role: string;
}
export declare class HrController {
    private hrService;
    constructor(hrService: HrService);
    uploadEmployees(file: Express.Multer.File, user: CurrentUserDto): Promise<{
        message: string;
        batchId: string;
    }>;
    getUploads(user: CurrentUserDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.UploadStatus;
        fileName: string;
        totalRecords: number;
        successRecords: number;
        failedRecords: number;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getUploadStatus(batchId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.UploadStatus;
        fileName: string;
        totalRecords: number;
        successRecords: number;
        failedRecords: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getEmployees(user: CurrentUserDto): Promise<{
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
    getDepartments(user: CurrentUserDto): Promise<string[]>;
    getEmployee(id: string, user: CurrentUserDto): Promise<{
        id: string;
        email: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateEmployeeStatus(id: string, user: CurrentUserDto, isActive: boolean): Promise<{
        id: string;
        email: string;
        isActive: boolean;
        updatedAt: Date;
    }>;
    getInsightsSummary(user: CurrentUserDto): Promise<{
        totalEmployees: number;
        aggregatedIncome: number;
        aggregatedExpense: number;
        aggregatedSavings: number;
        monthlySummaries: unknown[];
    }>;
    getDashboardStats(user: CurrentUserDto): Promise<{
        employeeMonitored: number;
        employeeMonitoredChange: string;
        avgFinancialHealth: number;
        avgFinancialHealthPeriod: string;
        participationRate: number;
        participationRateChange: string;
        sessionsThisPeriod: number;
        sessionsRate: string;
    }>;
    getFinancialHealthDistribution(user: CurrentUserDto): Promise<{
        distribution: {
            category: string;
            value: number;
            range: string;
        }[];
        total: number;
    }>;
    getParticipationByDepartment(user: CurrentUserDto): Promise<{
        department: any;
        total: any;
        participating: any;
        participationRate: number;
    }[]>;
    getDashboardAlerts(user: CurrentUserDto): Promise<{
        type: string;
        title: string;
        message: string;
        severity: string;
    }[]>;
    getProfile(user: CurrentUserDto): Promise<{
        id: string;
        email: string;
        fullName: string;
        phone: string | null;
        designation: string | null;
        companyId: string | null;
    }>;
    updateProfile(user: CurrentUserDto, updateData: {
        fullName?: string;
        phone?: string;
        designation?: string;
    }): Promise<{
        message: string;
        profile: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
            designation: string | null;
        };
    }>;
}
export {};
