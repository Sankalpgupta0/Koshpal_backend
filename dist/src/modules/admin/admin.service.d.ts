import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyStatusDto, UpdateCompanyLimitsDto, CreateHrDto, UpdateHrStatusDto } from './dto/admin.dto';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createCompany(dto: CreateCompanyDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        domain: string | null;
        employeeLimit: number;
        status: import("@prisma/client").$Enums.CompanyStatus;
    }>;
    getCompanies(): Promise<({
        _count: {
            users: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        domain: string | null;
        employeeLimit: number;
        status: import("@prisma/client").$Enums.CompanyStatus;
    })[]>;
    getCompany(id: string): Promise<{
        _count: {
            users: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        domain: string | null;
        employeeLimit: number;
        status: import("@prisma/client").$Enums.CompanyStatus;
    }>;
    updateCompanyStatus(id: string, dto: UpdateCompanyStatusDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        domain: string | null;
        employeeLimit: number;
        status: import("@prisma/client").$Enums.CompanyStatus;
    }>;
    updateCompanyLimits(id: string, dto: UpdateCompanyLimitsDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        domain: string | null;
        employeeLimit: number;
        status: import("@prisma/client").$Enums.CompanyStatus;
    }>;
    createHr(dto: CreateHrDto): Promise<{
        hrProfile: {
            companyId: string;
            userId: string;
            fullName: string;
            phone: string | null;
            designation: string | null;
        } | null;
        id: string;
        companyId: string | null;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getHrs(): Promise<{
        id: string;
        companyId: string | null;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        createdAt: Date;
        hrProfile: {
            companyId: string;
            userId: string;
            fullName: string;
            phone: string | null;
            designation: string | null;
        } | null;
        company: {
            name: string;
        } | null;
    }[]>;
    getHr(id: string): Promise<{
        id: string;
        companyId: string | null;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        createdAt: Date;
        hrProfile: {
            companyId: string;
            userId: string;
            fullName: string;
            phone: string | null;
            designation: string | null;
        } | null;
        company: {
            name: string;
        } | null;
    }>;
    updateHrStatus(id: string, dto: UpdateHrStatusDto): Promise<{
        id: string;
        companyId: string | null;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
    }>;
    getCoaches(): Promise<{
        statistics: {
            totalSlots: number;
            totalConsultations: number;
            upcomingConsultations: number;
        };
        id: string;
        email: string;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        coachProfile: {
            fullName: string;
            expertise: string[];
            bio: string | null;
            rating: import("@prisma/client/runtime/library").Decimal;
            successRate: number;
            clientsHelped: number;
            location: string | null;
            languages: string[];
            profilePhoto: string | null;
        } | null;
    }[]>;
    getCoach(id: string): Promise<{
        statistics: {
            totalSlots: number;
            totalConsultations: number;
            upcomingConsultations: number;
        };
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        coachProfile: {
            userId: string;
            fullName: string;
            expertise: string[];
            bio: string | null;
            rating: import("@prisma/client/runtime/library").Decimal;
            successRate: number;
            clientsHelped: number;
            location: string | null;
            languages: string[];
            profilePhoto: string | null;
            timezone: string;
        } | null;
    }>;
    deactivateCoach(id: string, reason?: string): Promise<{
        message: string;
        reason: string | undefined;
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        coachProfile: {
            userId: string;
            fullName: string;
            expertise: string[];
            bio: string | null;
            rating: import("@prisma/client/runtime/library").Decimal;
            successRate: number;
            clientsHelped: number;
            location: string | null;
            languages: string[];
            profilePhoto: string | null;
            timezone: string;
        } | null;
    }>;
    reactivateCoach(id: string): Promise<{
        message: string;
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        coachProfile: {
            userId: string;
            fullName: string;
            expertise: string[];
            bio: string | null;
            rating: import("@prisma/client/runtime/library").Decimal;
            successRate: number;
            clientsHelped: number;
            location: string | null;
            languages: string[];
            profilePhoto: string | null;
            timezone: string;
        } | null;
    }>;
    getStats(): Promise<{
        totalCompanies: number;
        activeCompanies: number;
        totalHrs: number;
        totalEmployees: number;
    }>;
}
