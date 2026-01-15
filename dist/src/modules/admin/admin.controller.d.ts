import { AdminService } from './admin.service';
import { CreateCompanyDto, UpdateCompanyStatusDto, UpdateCompanyLimitsDto, CreateHrDto, UpdateHrStatusDto } from './dto/admin.dto';
import { DeactivateCoachDto } from './dto/deactivate-coach.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
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
            profilePhoto: string | null;
            profilePhotoId: string | null;
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
        company: {
            name: string;
        } | null;
        hrProfile: {
            companyId: string;
            userId: string;
            fullName: string;
            phone: string | null;
            profilePhoto: string | null;
            profilePhotoId: string | null;
            designation: string | null;
        } | null;
    }[]>;
    getHr(id: string): Promise<{
        id: string;
        companyId: string | null;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        createdAt: Date;
        company: {
            name: string;
        } | null;
        hrProfile: {
            companyId: string;
            userId: string;
            fullName: string;
            phone: string | null;
            profilePhoto: string | null;
            profilePhotoId: string | null;
            designation: string | null;
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
            profilePhoto: string | null;
            expertise: string[];
            bio: string | null;
            rating: import("@prisma/client/runtime/library").Decimal;
            successRate: number;
            clientsHelped: number;
            location: string | null;
            languages: string[];
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
            phone: string | null;
            profilePhoto: string | null;
            profilePhotoId: string | null;
            expertise: string[];
            bio: string | null;
            rating: import("@prisma/client/runtime/library").Decimal;
            successRate: number;
            clientsHelped: number;
            location: string | null;
            languages: string[];
            timezone: string;
        } | null;
    }>;
    deactivateCoach(id: string, dto: DeactivateCoachDto): Promise<{
        message: string;
        reason: string | undefined;
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        coachProfile: {
            userId: string;
            fullName: string;
            phone: string | null;
            profilePhoto: string | null;
            profilePhotoId: string | null;
            expertise: string[];
            bio: string | null;
            rating: import("@prisma/client/runtime/library").Decimal;
            successRate: number;
            clientsHelped: number;
            location: string | null;
            languages: string[];
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
            phone: string | null;
            profilePhoto: string | null;
            profilePhotoId: string | null;
            expertise: string[];
            bio: string | null;
            rating: import("@prisma/client/runtime/library").Decimal;
            successRate: number;
            clientsHelped: number;
            location: string | null;
            languages: string[];
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
