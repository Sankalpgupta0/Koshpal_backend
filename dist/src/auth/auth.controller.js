"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const auth_dto_1 = require("./dto/auth.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuthController = class AuthController {
    authService;
    prisma;
    constructor(authService, prisma) {
        this.authService = authService;
        this.prisma = prisma;
    }
    getCookieDomain(req) {
        const origin = req.headers.origin || req.headers.referer;
        if (!origin)
            return undefined;
        try {
            const url = new URL(origin);
            if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
                return undefined;
            }
            if (url.hostname.endsWith('.localhost')) {
                return url.hostname;
            }
            if (url.hostname.endsWith('.koshpal.com')) {
                return '.koshpal.com';
            }
            return undefined;
        }
        catch {
            return undefined;
        }
    }
    async login(dto, req, res) {
        const context = {
            ipAddress: req.ip || req.headers['x-forwarded-for'],
            userAgent: req.headers['user-agent'],
            deviceId: req.headers['x-device-id'],
        };
        const result = await this.authService.login(dto.email, dto.password, context, dto.role);
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieDomain = this.getCookieDomain(req);
        const isLocalhost = req.headers.origin?.includes('localhost') || req.headers.referer?.includes('localhost');
        res.cookie('accessToken', result.accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isLocalhost ? 'lax' : 'none',
            maxAge: 15 * 60 * 1000,
            path: '/',
            domain: cookieDomain,
        });
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isLocalhost ? 'lax' : 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
            domain: cookieDomain,
        });
        const redirectMap = {
            EMPLOYEE: process.env.EMPLOYEE_PORTAL_URL || 'https://employee.koshpal.com',
            HR: process.env.HR_PORTAL_URL || 'https://hr.koshpal.com',
            COACH: process.env.COACH_PORTAL_URL || 'https://coach.koshpal.com',
            ADMIN: process.env.ADMIN_PORTAL_URL || 'https://admin.koshpal.com',
        };
        return {
            user: result.user,
            role: result.user.role,
            redirectUrl: redirectMap[result.user.role] || 'https://koshpal.com',
        };
    }
    async getMe(user) {
        const userData = await this.prisma.user.findUnique({
            where: { id: user.userId },
            include: {
                employeeProfile: true,
                hrProfile: true,
                adminProfile: true,
                coachProfile: true,
            },
        });
        if (!userData) {
            throw new common_1.UnauthorizedException('User not found');
        }
        let fullName = userData.email;
        let phone = '';
        let profileId = '';
        if (userData.employeeProfile) {
            fullName = userData.employeeProfile.fullName;
            phone = userData.employeeProfile.phone || '';
            profileId = userData.employeeProfile.userId;
        }
        else if (userData.hrProfile) {
            fullName = userData.hrProfile.fullName;
            phone = userData.hrProfile.phone || '';
            profileId = userData.hrProfile.userId;
        }
        else if (userData.adminProfile) {
            fullName = userData.adminProfile.fullName;
            phone = '';
            profileId = userData.adminProfile.userId;
        }
        else if (userData.coachProfile) {
            fullName = userData.coachProfile.fullName;
            phone = userData.coachProfile.phone || '';
            profileId = userData.coachProfile.userId;
        }
        return {
            userId: userData.id,
            _id: profileId,
            role: userData.role,
            companyId: userData.companyId,
            email: userData.email,
            name: fullName,
            phone: phone,
            isActive: userData.isActive,
        };
    }
    async refresh(req, res) {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('No refresh token provided');
        }
        const result = await this.authService.refresh(refreshToken);
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieDomain = this.getCookieDomain(req);
        const isLocalhost = req.headers.origin?.includes('localhost') || req.headers.referer?.includes('localhost');
        res.cookie('accessToken', result.accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isLocalhost ? 'lax' : 'none',
            maxAge: 15 * 60 * 1000,
            path: '/',
            domain: cookieDomain,
        });
        return { message: 'Token refreshed successfully' };
    }
    async logout(user, req, res) {
        const refreshToken = req.cookies?.refreshToken;
        if (refreshToken) {
            await this.authService.logout(user.userId, refreshToken);
        }
        const cookieDomain = this.getCookieDomain(req);
        res.clearCookie('accessToken', { path: '/', domain: cookieDomain });
        res.clearCookie('refreshToken', { path: '/', domain: cookieDomain });
        return { message: 'Logged out successfully' };
    }
    async getSessions(user) {
        return this.authService.getActiveSessions(user.userId);
    }
    async revokeAllSessions(user) {
        return this.authService.revokeAllSessions(user.userId);
    }
    async changePassword(user, dto) {
        return this.authService.changePassword(user.userId, dto.currentPassword, dto.newPassword);
    }
    async forgotPassword(dto) {
        return this.authService.forgotPassword(dto.email);
    }
    async resetPassword(dto) {
        return this.authService.resetPassword(dto.token, dto.newPassword);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    (0, throttler_1.Throttle)({ strict: { limit: 50, ttl: 60000 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('logout'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('sessions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getSessions", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('sessions/revoke-all'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "revokeAllSessions", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('me/password'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, throttler_1.Throttle)({ strict: { limit: 5, ttl: 900000 } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, throttler_1.Throttle)({ strict: { limit: 10, ttl: 900000 } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('api/v1/auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        prisma_service_1.PrismaService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map