import { PrismaService } from '../../../prisma/prisma.service';
export declare class EmployeeService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getFullProfile(userId: string): Promise<{
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
            profilePhoto: string | null;
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
    updateOwnProfile(userId: string, body: {
        name?: string;
        phone?: string;
    }, imageUrl?: string, imagePublicId?: string): Promise<{
        message: string;
        profile: {
            companyId: string;
            userId: string;
            employeeCode: string | null;
            fullName: string;
            phone: string | null;
            department: string | null;
            dateOfJoining: Date | null;
            profilePhoto: string | null;
            profilePhotoId: string | null;
        };
    }>;
    getMyProfile(userId: string): Promise<{
        name: string;
        email: string;
        phone: string | null;
        profilePhoto: string | null;
        department: string | null;
    }>;
}
