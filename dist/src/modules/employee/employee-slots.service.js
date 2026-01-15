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
exports.EmployeeSlotsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const timezone_util_1 = require("../../common/utils/timezone.util");
let EmployeeSlotsService = class EmployeeSlotsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSlotsByDate(dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const startUTC = new Date(Date.UTC(year, month - 1, day - 1, 18, 30, 0, 0));
        const endUTC = new Date(Date.UTC(year, month - 1, day, 18, 29, 59, 999));
        const slots = await this.prisma.coachSlot.findMany({
            where: {
                startTime: {
                    gte: startUTC,
                    lte: endUTC,
                },
                status: client_1.SlotStatus.AVAILABLE,
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
                slotDate: (0, timezone_util_1.getSlotDateInIST)(slot.startTime),
                status: slot.status,
            });
        }
        return Array.from(coachMap.values());
    }
    async getSlotsByCoachAndDate(coachId, dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const startUTC = new Date(Date.UTC(year, month - 1, day - 1, 18, 30, 0, 0));
        const endUTC = new Date(Date.UTC(year, month - 1, day, 18, 29, 59, 999));
        const slots = await this.prisma.coachSlot.findMany({
            where: {
                coachId,
                startTime: {
                    gte: startUTC,
                    lte: endUTC,
                },
                status: client_1.SlotStatus.AVAILABLE,
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
        if (slots.length === 0) {
            return {
                coachId,
                coachName: null,
                expertise: [],
                slots: [],
            };
        }
        return {
            coachId: slots[0].coach.userId,
            coachName: slots[0].coach.fullName,
            expertise: slots[0].coach.expertise,
            slots: slots.map(slot => ({
                slotId: slot.id,
                startTime: slot.startTime.toISOString(),
                endTime: slot.endTime.toISOString(),
                slotDate: (0, timezone_util_1.getSlotDateInIST)(slot.startTime),
                status: slot.status,
            })),
        };
    }
    async getAvailableDates(startDateStr, endDateStr, coachId) {
        const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
        const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
        const startUTC = new Date(Date.UTC(startYear, startMonth - 1, startDay - 1, 18, 30, 0, 0));
        const endUTC = new Date(Date.UTC(endYear, endMonth - 1, endDay, 18, 29, 59, 999));
        const where = {
            startTime: {
                gte: startUTC,
                lte: endUTC,
            },
            status: client_1.SlotStatus.AVAILABLE,
        };
        if (coachId) {
            where.coachId = coachId;
        }
        const slots = await this.prisma.coachSlot.findMany({
            where,
            select: {
                startTime: true,
            },
        });
        const dateMap = new Map();
        for (const slot of slots) {
            const istDate = (0, timezone_util_1.getSlotDateInIST)(slot.startTime);
            dateMap.set(istDate, (dateMap.get(istDate) || 0) + 1);
        }
        const result = {};
        dateMap.forEach((count, date) => {
            result[date] = {
                hasSlots: true,
                slotCount: count,
            };
        });
        return result;
    }
};
exports.EmployeeSlotsService = EmployeeSlotsService;
exports.EmployeeSlotsService = EmployeeSlotsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmployeeSlotsService);
//# sourceMappingURL=employee-slots.service.js.map