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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const cloudinary_helper_1 = require("../../common/config/cloudinary.helper");
let EmployeeService = class EmployeeService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getFullProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
                company: {
                    select: {
                        id: true,
                        name: true,
                        domain: true,
                        status: true,
                    },
                },
                employeeProfile: {
                    select: {
                        userId: true,
                        companyId: true,
                        employeeCode: true,
                        fullName: true,
                        phone: true,
                        department: true,
                        dateOfJoining: true,
                        profilePhoto: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!user.employeeProfile) {
            throw new common_1.NotFoundException('Employee profile not found');
        }
        const accountStats = await this.prisma.account.groupBy({
            by: ['userId'],
            where: { userId },
            _count: true,
        });
        const totalBalance = await this.prisma.$queryRaw `SELECT COALESCE(SUM(balance), 0)::float as total FROM "Account" WHERE "userId" = ${userId}`;
        const goalStats = await this.prisma.financialGoal.aggregate({
            where: { userId },
            _count: true,
            _sum: {
                goalAmount: true,
                saving: true,
            },
        });
        const activeGoals = await this.prisma.financialGoal.count({
            where: {
                userId,
            },
        });
        const completedGoals = await this.prisma.financialGoal.count({
            where: {
                userId,
            },
        });
        const consultationStats = await this.prisma.consultationBooking.aggregate({
            where: { employeeId: userId },
            _count: true,
        });
        const upcomingConsultations = await this.prisma.consultationBooking.count({
            where: {
                employeeId: userId,
                status: 'CONFIRMED',
                slot: {
                    startTime: {
                        gte: new Date(),
                    },
                },
            },
        });
        const completedConsultations = await this.prisma.consultationBooking.count({
            where: {
                employeeId: userId,
                slot: {
                    startTime: {
                        lt: new Date(),
                    },
                },
            },
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                lastLoginAt: user.lastLoginAt,
                createdAt: user.createdAt,
            },
            company: user.company,
            profile: user.employeeProfile,
            statistics: {
                accounts: {
                    total: accountStats.length > 0 ? accountStats[0]._count : 0,
                    totalBalance: totalBalance[0]?.total || 0,
                },
                goals: {
                    total: goalStats._count || 0,
                    active: activeGoals,
                    completed: completedGoals,
                    totalTarget: Number(goalStats._sum.goalAmount) || 0,
                    totalSaved: Number(goalStats._sum.saving) || 0,
                    progress: goalStats._sum.goalAmount && Number(goalStats._sum.goalAmount) > 0
                        ? Math.round(((Number(goalStats._sum.saving) || 0) /
                            Number(goalStats._sum.goalAmount)) *
                            100)
                        : 0,
                },
                consultations: {
                    total: consultationStats._count || 0,
                    upcoming: upcomingConsultations,
                    completed: completedConsultations,
                },
            },
        };
    }
    async updateOwnProfile(userId, body, imageUrl, imagePublicId) {
        try {
            console.log('=== SERVICE: updateOwnProfile START ===');
            console.log('Input Parameters:', {
                userId,
                body,
                hasImageUrl: !!imageUrl,
                imageUrl: imageUrl || 'None',
                hasImagePublicId: !!imagePublicId,
                imagePublicId: imagePublicId || 'None'
            });
            const profile = await this.prisma.employeeProfile.findUnique({
                where: { userId },
            });
            if (!profile) {
                console.error('Employee profile not found for userId:', userId);
                throw new Error('Employee profile not found');
            }
            console.log('Existing Profile:', {
                userId: profile.userId,
                fullName: profile.fullName,
                phone: profile.phone,
                hasCurrentPhoto: !!profile.profilePhoto,
                currentPhotoUrl: profile.profilePhoto || 'None',
                currentPhotoId: profile.profilePhotoId || 'None'
            });
            if (imagePublicId && profile.profilePhotoId) {
                try {
                    console.log('Attempting to delete old Cloudinary image:', profile.profilePhotoId);
                    await (0, cloudinary_helper_1.deleteFromCloudinary)(profile.profilePhotoId);
                    console.log('Old image deleted successfully');
                }
                catch (error) {
                    console.error('Failed to delete old image from Cloudinary:', error);
                }
            }
            else {
                console.log('No old image to delete or no new image provided');
            }
            const updateData = {};
            if (body.name !== undefined) {
                updateData.fullName = body.name;
                console.log('Updating fullName to:', body.name);
            }
            if (body.phone !== undefined) {
                updateData.phone = body.phone;
                console.log('Updating phone to:', body.phone);
            }
            if (imageUrl && imagePublicId) {
                updateData.profilePhoto = imageUrl;
                updateData.profilePhotoId = imagePublicId;
                console.log('Updating profile photo:', { imageUrl, imagePublicId });
            }
            console.log('Final update data:', updateData);
            const updatedProfile = await this.prisma.employeeProfile.update({
                where: { userId },
                data: updateData,
            });
            console.log('Profile updated successfully in database:', {
                userId: updatedProfile.userId,
                fullName: updatedProfile.fullName,
                phone: updatedProfile.phone,
                profilePhoto: updatedProfile.profilePhoto || 'None',
                profilePhotoId: updatedProfile.profilePhotoId || 'None'
            });
            console.log('=== SERVICE: updateOwnProfile END ===');
            return {
                message: 'Profile updated successfully',
                profile: updatedProfile,
            };
        }
        catch (error) {
            console.error('=== SERVICE ERROR in updateOwnProfile ===');
            console.error('Error details:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('=== SERVICE ERROR END ===');
            throw error;
        }
    }
    async getMyProfile(userId) {
        const profile = await this.prisma.employeeProfile.findUnique({
            where: { userId },
            select: {
                fullName: true,
                phone: true,
                department: true,
                profilePhoto: true,
                user: {
                    select: {
                        email: true,
                    },
                },
            },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        return {
            name: profile.fullName,
            email: profile.user.email,
            phone: profile.phone,
            profilePhoto: profile.profilePhoto,
            department: profile.department,
        };
    }
};
exports.EmployeeService = EmployeeService;
exports.EmployeeService = EmployeeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmployeeService);
//# sourceMappingURL=employee.service.js.map