import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/auth.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import type { ValidatedUser } from '../common/types/user.types';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    private getCookieDomain;
    login(dto: LoginDto, req: Request, res: Response): Promise<{
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            companyId: string | null;
            name: string;
            isActive: true;
        };
    }>;
    getMe(user: ValidatedUser): ValidatedUser;
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
