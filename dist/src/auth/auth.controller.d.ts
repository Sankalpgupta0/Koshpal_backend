import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/auth.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import type { ValidatedUser } from '../common/types/user.types';
import { PrismaService } from '../../prisma/prisma.service';
export declare class AuthController {
    private authService;
    private prisma;
    constructor(authService: AuthService, prisma: PrismaService);
    private getCookieDomain;
    login(dto: LoginDto, req: Request, res: Response): Promise<{
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
        role: import("@prisma/client").$Enums.Role;
        redirectUrl: string;
    }>;
    getMe(user: ValidatedUser): Promise<{
        userId: string;
        _id: string;
        role: import("@prisma/client").$Enums.Role;
        companyId: string | null;
        email: string;
        name: string;
        phone: string;
        isActive: boolean;
    }>;
    refresh(req: Request, res: Response): Promise<{
        message: string;
    }>;
    logout(user: ValidatedUser, req: Request, res: Response): Promise<{
        message: string;
    }>;
    getSessions(user: ValidatedUser): Promise<{
        id: string;
        createdAt: Date;
        expiresAt: Date;
        deviceId: string | null;
        ipAddress: string | null;
        userAgent: string | null;
    }[]>;
    revokeAllSessions(user: ValidatedUser): Promise<{
        message: string;
    }>;
    changePassword(user: ValidatedUser, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
