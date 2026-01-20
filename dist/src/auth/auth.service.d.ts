import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
interface LoginContext {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
}
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(email: string, password: string, context?: LoginContext, requestedRole?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            _id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            companyId: string | null;
            name: string;
            phone: string;
            isActive: true;
        };
    }>;
    private generateRefreshToken;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    logout(userId: string, refreshToken: string): Promise<{
        message: string;
    }>;
    revokeAllSessions(userId: string): Promise<{
        message: string;
    }>;
    getActiveSessions(userId: string): Promise<{
        id: string;
        createdAt: Date;
        expiresAt: Date;
        deviceId: string | null;
        ipAddress: string | null;
        userAgent: string | null;
    }[]>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
}
export {};
