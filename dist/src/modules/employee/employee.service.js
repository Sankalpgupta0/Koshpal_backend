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
};
exports.EmployeeService = EmployeeService;
exports.EmployeeService = EmployeeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmployeeService);
//# sourceMappingURL=employee.service.js.map