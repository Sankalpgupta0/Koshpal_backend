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
exports.EmployeeCoachService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let EmployeeCoachService = class EmployeeCoachService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSlotsGroupedByCoach(dateStr) {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const slots = await this.prisma.coachSlot.findMany({
            where: {
                date: date,
                status: client_1.SlotStatus.AVAILABLE,
                coach: {
                    user: {
                        isActive: true,
                    },
                },
            },
            include: {
                coach: {
                    select: {
                        userId: true,
                        fullName: true,
                        expertise: true,
                    },
                },
            },
            orderBy: {
                startTime: 'asc',
            },
        });
        const coachMap = new Map();
        for (const slot of slots) {
            const coachId = slot.coach.userId;
            if (!coachMap.has(coachId)) {
                coachMap.set(coachId, {
                    coachId,
                    coachName: slot.coach.fullName,
                    expertise: slot.coach.expertise,
                    slots: [],
                });
            }
            coachMap.get(coachId).slots.push({
                slotId: slot.id,
                startTime: slot.startTime.toISOString(),
                endTime: slot.endTime.toISOString(),
            });
        }
        return Array.from(coachMap.values());
    }
    async getSlotAvailabilityForDateRange(startDateStr, endDateStr, coachId) {
        const startDate = new Date(startDateStr);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(endDateStr);
        endDate.setHours(23, 59, 59, 999);
        const where = {
            date: {
                gte: startDate,
                lte: endDate,
            },
            status: client_1.SlotStatus.AVAILABLE,
            coach: {
                user: {
                    isActive: true,
                },
            },
        };
        if (coachId) {
            where.coachId = coachId;
        }
        const slots = await this.prisma.coachSlot.findMany({
            where,
            select: {
                date: true,
            },
        });
        const dateMap = new Map();
        for (const slot of slots) {
            const dateStr = slot.date.toISOString().split('T')[0];
            if (!dateMap.has(dateStr)) {
                dateMap.set(dateStr, { hasSlots: true, slotCount: 0 });
            }
            dateMap.get(dateStr).slotCount++;
        }
        return Object.fromEntries(dateMap);
    }
};
exports.EmployeeCoachService = EmployeeCoachService;
exports.EmployeeCoachService = EmployeeCoachService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmployeeCoachService);
//# sourceMappingURL=employee-coach.service.js.map