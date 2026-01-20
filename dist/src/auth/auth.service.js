"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
const mail_service_1 = require("../mail/mail.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async login(email, password, context, requestedRole) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                employeeProfile: true,
                hrProfile: true,
                adminProfile: true,
                coachProfile: true,
            },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (requestedRole && user.role !== requestedRole) {
            throw new common_1.UnauthorizedException(`You do not have ${requestedRole} role access. Your role is ${user.role}.`);
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const payload = {
            sub: user.id,
            role: user.role,
            companyId: user.companyId,
        };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.generateRefreshToken();
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await this.prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshTokenHash,
                expiresAt,
                deviceId: context?.deviceId,
                ipAddress: context?.ipAddress,
                userAgent: context?.userAgent,
            },
        });
        let fullName = email;
        if (user.employeeProfile) {
            fullName = user.employeeProfile.fullName;
        }
        else if (user.hrProfile) {
            fullName = user.hrProfile.fullName;
        }
        else if (user.adminProfile) {
            fullName = user.adminProfile.fullName;
        }
        else if (user.coachProfile) {
            fullName = user.coachProfile.fullName;
        }
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                companyId: user.companyId,
                name: fullName,
                isActive: user.isActive,
            },
        };
    }
    generateRefreshToken() {
        return crypto.randomBytes(64).toString('hex');
    }
    async refresh(refreshToken) {
        try {
            const storedTokens = await this.prisma.refreshToken.findMany({
                where: {
                    isRevoked: false,
                    expiresAt: { gte: new Date() },
                },
                include: {
                    user: true,
                },
            });
            let matchedToken = null;
            for (const storedToken of storedTokens) {
                const isMatch = await bcrypt.compare(refreshToken, storedToken.token);
                if (isMatch) {
                    matchedToken = storedToken;
                    break;
                }
            }
            if (!matchedToken) {
                throw new common_1.UnauthorizedException('Invalid or expired refresh token');
            }
            const user = matchedToken.user;
            if (!user || !user.isActive) {
                throw new common_1.UnauthorizedException('User not found or inactive');
            }
            const payload = {
                sub: user.id,
                role: user.role,
                companyId: user.companyId,
            };
            const accessToken = this.jwtService.sign(payload);
            return {
                accessToken,
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async logout(userId, refreshToken) {
        try {
            const storedTokens = await this.prisma.refreshToken.findMany({
                where: {
                    userId,
                    isRevoked: false,
                },
            });
            for (const storedToken of storedTokens) {
                const isMatch = await bcrypt.compare(refreshToken, storedToken.token);
                if (isMatch) {
                    await this.prisma.refreshToken.update({
                        where: { id: storedToken.id },
                        data: {
                            isRevoked: true,
                            revokedAt: new Date(),
                        },
                    });
                    break;
                }
            }
            return { message: 'Logged out successfully' };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Logout failed');
        }
    }
    async revokeAllSessions(userId) {
        await this.prisma.refreshToken.updateMany({
            where: {
                userId,
                isRevoked: false,
            },
            data: {
                isRevoked: true,
                revokedAt: new Date(),
            },
        });
        return { message: 'All sessions revoked successfully' };
    }
    async getActiveSessions(userId) {
        const sessions = await this.prisma.refreshToken.findMany({
            where: {
                userId,
                isRevoked: false,
                expiresAt: { gte: new Date() },
            },
            select: {
                id: true,
                deviceId: true,
                ipAddress: true,
                userAgent: true,
                createdAt: true,
                expiresAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return sessions;
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: hashedPassword },
        });
        await this.revokeAllSessions(userId);
        return {
            message: 'Password changed successfully. All sessions have been revoked. Please log in again.',
        };
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                employeeProfile: true,
                hrProfile: true,
                coachProfile: true,
            },
        });
        const successMessage = 'If an account exists with this email, you will receive a password reset link shortly.';
        if (!user) {
            return { message: successMessage };
        }
        if (!user.isActive) {
            return { message: successMessage };
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = await bcrypt.hash(resetToken, 10);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        await this.prisma.passwordResetToken.updateMany({
            where: {
                userId: user.id,
                isUsed: false,
                expiresAt: { gte: new Date() },
            },
            data: {
                isUsed: true,
                usedAt: new Date(),
            },
        });
        await this.prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt,
            },
        });
        let fullName = email;
        if (user.employeeProfile) {
            fullName = user.employeeProfile.fullName;
        }
        else if (user.hrProfile) {
            fullName = user.hrProfile.fullName;
        }
        else if (user.coachProfile) {
            fullName = user.coachProfile.fullName;
        }
        (0, mail_service_1.sendPasswordResetEmail)(email, fullName, resetToken).catch((error) => {
            console.error('Failed to send password reset email:', error);
        });
        return { message: successMessage };
    }
    async resetPassword(token, newPassword) {
        const storedTokens = await this.prisma.passwordResetToken.findMany({
            where: {
                isUsed: false,
                expiresAt: { gte: new Date() },
            },
            include: {
                user: true,
            },
        });
        let matchedToken = null;
        for (const storedToken of storedTokens) {
            const isMatch = await bcrypt.compare(token, storedToken.tokenHash);
            if (isMatch) {
                matchedToken = storedToken;
                break;
            }
        }
        if (!matchedToken) {
            throw new common_1.UnauthorizedException('Invalid or expired reset token');
        }
        const user = matchedToken.user;
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('User not found or inactive');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: user.id },
                data: { passwordHash: hashedPassword },
            }),
            this.prisma.passwordResetToken.update({
                where: { id: matchedToken.id },
                data: {
                    isUsed: true,
                    usedAt: new Date(),
                },
            }),
            this.prisma.refreshToken.updateMany({
                where: {
                    userId: user.id,
                    isRevoked: false,
                },
                data: {
                    isRevoked: true,
                    revokedAt: new Date(),
                },
            }),
        ]);
        return {
            message: 'Password reset successfully. All sessions have been revoked. Please log in with your new password.',
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map