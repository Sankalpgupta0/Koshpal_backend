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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const role_enum_1 = require("../../common/enums/role.enum");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCompany(dto) {
        const company = await this.prisma.company.create({
            data: {
                name: dto.name,
                employeeLimit: dto.employeeLimit || 100,
                status: 'ACTIVE',
            },
        });
        return company;
    }
    async getCompanies() {
        return this.prisma.company.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getCompany(id) {
        const company = await this.prisma.company.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
        });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        return company;
    }
    async updateCompanyStatus(id, dto) {
        const company = await this.prisma.company.update({
            where: { id },
            data: { status: dto.status },
        });
        return company;
    }
    async updateCompanyLimits(id, dto) {
        const company = await this.prisma.company.update({
            where: { id },
            data: { employeeLimit: dto.employeeLimit },
        });
        return company;
    }
    async createHr(dto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('Email already exists');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const hr = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash: hashedPassword,
                role: role_enum_1.Role.HR,
                companyId: dto.companyId,
                isActive: true,
                hrProfile: {
                    create: {
                        companyId: dto.companyId,
                        fullName: dto.fullName,
                        phone: dto.phone ?? undefined,
                        designation: dto.designation ?? undefined,
                    },
                },
            },
            include: {
                hrProfile: true,
            },
        });
        const { passwordHash, ...result } = hr;
        return result;
    }
    async getHrs() {
        return this.prisma.user.findMany({
            where: { role: role_enum_1.Role.HR },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                companyId: true,
                createdAt: true,
                company: {
                    select: {
                        name: true,
                    },
                },
                hrProfile: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getHr(id) {
        const hr = await this.prisma.user.findUnique({
            where: { id, role: role_enum_1.Role.HR },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                companyId: true,
                createdAt: true,
                company: {
                    select: {
                        name: true,
                    },
                },
                hrProfile: true,
            },
        });
        if (!hr) {
            throw new common_1.NotFoundException('HR not found');
        }
        return hr;
    }
    async updateHrStatus(id, dto) {
        const hr = await this.prisma.user.update({
            where: { id, role: role_enum_1.Role.HR },
            data: { isActive: dto.status === 'ACTIVE' },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                companyId: true,
            },
        });
        return hr;
    }
    async getCoaches() {
        const coaches = await this.prisma.user.findMany({
            where: { role: role_enum_1.Role.COACH },
            select: {
                id: true,
                email: true,
                isActive: true,
                createdAt: true,
                lastLoginAt: true,
                coachProfile: {
                    select: {
                        fullName: true,
                        expertise: true,
                        bio: true,
                        rating: true,
                        successRate: true,
                        clientsHelped: true,
                        location: true,
                        languages: true,
                        profilePhoto: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const coachesWithStats = await Promise.all(coaches.map(async (coach) => {
            const [totalSlots, totalConsultations, upcomingConsultations] = await Promise.all([
                this.prisma.coachSlot.count({
                    where: { coachId: coach.id },
                }),
                this.prisma.consultationBooking.count({
                    where: {
                        slot: {
                            coachId: coach.id,
                        },
                    },
                }),
                this.prisma.consultationBooking.count({
                    where: {
                        slot: {
                            coachId: coach.id,
                            startTime: {
                                gte: new Date(),
                            },
                        },
                        status: 'CONFIRMED',
                    },
                }),
            ]);
            return {
                ...coach,
                statistics: {
                    totalSlots,
                    totalConsultations,
                    upcomingConsultations,
                },
            };
        }));
        return coachesWithStats;
    }
    async getCoach(id) {
        const coach = await this.prisma.user.findUnique({
            where: { id, role: role_enum_1.Role.COACH },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                lastLoginAt: true,
                coachProfile: true,
            },
        });
        if (!coach) {
            throw new common_1.NotFoundException('Coach not found');
        }
        const [totalSlots, totalConsultations, upcomingConsultations] = await Promise.all([
            this.prisma.coachSlot.count({
                where: { coachId: coach.id },
            }),
            this.prisma.consultationBooking.count({
                where: {
                    slot: {
                        coachId: coach.id,
                    },
                },
            }),
            this.prisma.consultationBooking.count({
                where: {
                    slot: {
                        coachId: coach.id,
                        startTime: {
                            gte: new Date(),
                        },
                    },
                    status: 'CONFIRMED',
                },
            }),
        ]);
        return {
            ...coach,
            statistics: {
                totalSlots,
                totalConsultations,
                upcomingConsultations,
            },
        };
    }
    async deactivateCoach(id, reason) {
        const coach = await this.prisma.user.findUnique({
            where: { id, role: role_enum_1.Role.COACH },
            select: {
                id: true,
                isActive: true,
                coachProfile: {
                    select: {
                        fullName: true,
                    },
                },
            },
        });
        if (!coach) {
            throw new common_1.NotFoundException('Coach not found');
        }
        if (!coach.isActive) {
            throw new common_1.BadRequestException('Coach is already inactive');
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: { isActive: false },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                coachProfile: true,
            },
        });
        console.log(`[ADMIN] Coach deactivated: ${coach.coachProfile?.fullName} (${id})${reason ? ` - Reason: ${reason}` : ''}`);
        return {
            ...updated,
            message: 'Coach deactivated successfully',
            reason,
        };
    }
    async reactivateCoach(id) {
        const coach = await this.prisma.user.findUnique({
            where: { id, role: role_enum_1.Role.COACH },
            select: {
                id: true,
                isActive: true,
                coachProfile: {
                    select: {
                        fullName: true,
                    },
                },
            },
        });
        if (!coach) {
            throw new common_1.NotFoundException('Coach not found');
        }
        if (coach.isActive) {
            throw new common_1.BadRequestException('Coach is already active');
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: { isActive: true },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                coachProfile: true,
            },
        });
        console.log(`[ADMIN] Coach reactivated: ${coach.coachProfile?.fullName} (${id})`);
        return {
            ...updated,
            message: 'Coach reactivated successfully',
        };
    }
    async getStats() {
        const [totalCompanies, activeCompanies, totalHrs, totalEmployees] = await Promise.all([
            this.prisma.company.count(),
            this.prisma.company.count({ where: { status: 'ACTIVE' } }),
            this.prisma.user.count({ where: { role: role_enum_1.Role.HR } }),
            this.prisma.user.count({ where: { role: role_enum_1.Role.EMPLOYEE } }),
        ]);
        return {
            totalCompanies,
            activeCompanies,
            totalHrs,
            totalEmployees,
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map