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
exports.CoachService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let CoachService = class CoachService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createSlots(coachId, dto) {
        const date = new Date(dto.date);
        date.setHours(0, 0, 0, 0);
        const slots = dto.timeSlots.map((timeSlot) => {
            const startTime = new Date(`${dto.date}T${timeSlot.startTime}`);
            const endTime = new Date(`${dto.date}T${timeSlot.endTime}`);
            const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
            if (duration !== 60) {
                throw new common_1.BadRequestException('Each slot must be exactly 1 hour');
            }
            return {
                coachId,
                date,
                startTime,
                endTime,
            };
        });
        const existingSlots = await this.prisma.coachSlot.findMany({
            where: {
                coachId,
                date,
                OR: slots.map((slot) => ({
                    AND: [
                        { startTime: { lte: slot.endTime } },
                        { endTime: { gte: slot.startTime } },
                    ],
                })),
            },
        });
        if (existingSlots.length > 0) {
            throw new common_1.BadRequestException('Overlapping slots detected');
        }
        const created = await this.prisma.coachSlot.createMany({
            data: slots,
        });
        return {
            message: 'Slots created successfully',
            count: created.count,
        };
    }
    async getSlots(coachId, dateStr) {
        const where = { coachId };
        if (dateStr) {
            const date = new Date(dateStr);
            date.setHours(0, 0, 0, 0);
            where.date = date;
        }
        return this.prisma.coachSlot.findMany({
            where,
            orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        });
    }
    async getConsultations(coachId, filter) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        let dateFilter = {};
        switch (filter) {
            case 'past':
                dateFilter = { endTime: { lt: now } };
                break;
            case 'upcoming':
                dateFilter = { startTime: { gte: now } };
                break;
            case 'thisMonth':
                dateFilter = {
                    date: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                };
                break;
        }
        const consultations = await this.prisma.coachSlot.findMany({
            where: {
                coachId,
                status: 'BOOKED',
                ...dateFilter,
            },
            include: {
                booking: {
                    select: {
                        id: true,
                        employeeId: true,
                        meetingLink: true,
                        status: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: [
                { date: filter === 'past' ? 'desc' : 'asc' },
                { startTime: filter === 'past' ? 'desc' : 'asc' },
            ],
        });
        const employeeIds = consultations
            .map((c) => c.booking?.employeeId)
            .filter(Boolean);
        const employees = await this.prisma.user.findMany({
            where: { id: { in: employeeIds } },
            include: {
                employeeProfile: {
                    select: {
                        fullName: true,
                        phone: true,
                    },
                },
                company: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        const employeeMap = new Map(employees.map((emp) => [
            emp.id,
            {
                id: emp.id,
                email: emp.email,
                fullName: emp.employeeProfile?.fullName || emp.email,
                phone: emp.employeeProfile?.phone,
                company: emp.company?.name || 'N/A',
            },
        ]));
        console.log('Employee data with company info:', employeeMap);
        return consultations.map((slot) => ({
            id: slot.id,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: slot.status,
            booking: slot.booking
                ? {
                    id: slot.booking.id,
                    status: slot.booking.status,
                    meetingLink: slot.booking.meetingLink,
                    bookedAt: slot.booking.createdAt,
                    employee: employeeMap.get(slot.booking.employeeId),
                }
                : null,
        }));
    }
    async getConsultationStats(coachId) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const [total, past, upcoming, thisMonth] = await Promise.all([
            this.prisma.coachSlot.count({
                where: {
                    coachId,
                    status: 'BOOKED',
                },
            }),
            this.prisma.coachSlot.count({
                where: {
                    coachId,
                    status: 'BOOKED',
                    endTime: { lt: now },
                },
            }),
            this.prisma.coachSlot.count({
                where: {
                    coachId,
                    status: 'BOOKED',
                    startTime: { gte: now },
                },
            }),
            this.prisma.coachSlot.count({
                where: {
                    coachId,
                    status: 'BOOKED',
                    date: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
            }),
        ]);
        return {
            total,
            past,
            upcoming,
            thisMonth,
        };
    }
    async saveWeeklyAvailability(coachId, dto) {
        await this.prisma.coachSlot.deleteMany({
            where: {
                coachId,
                status: 'AVAILABLE',
                startTime: { gt: new Date() },
            },
        });
        const slots = [];
        const now = new Date();
        for (let week = 0; week < dto.weeksToGenerate; week++) {
            for (const [weekday, timeRanges] of Object.entries(dto.weeklySchedule)) {
                if (!timeRanges || timeRanges.length === 0)
                    continue;
                for (const timeRange of timeRanges) {
                    const targetDate = this.getDateForWeekday(weekday, week);
                    if (targetDate < now)
                        continue;
                    const startTime = this.buildDateTime(targetDate, timeRange.start, 'Asia/Kolkata');
                    const endTime = this.buildDateTime(targetDate, timeRange.end, 'Asia/Kolkata');
                    const slotDate = new Date(targetDate);
                    slotDate.setHours(0, 0, 0, 0);
                    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
                    if (duration !== dto.slotDurationMinutes) {
                        throw new common_1.BadRequestException(`Slot duration must be exactly ${dto.slotDurationMinutes} minutes`);
                    }
                    const existingSlot = await this.prisma.coachSlot.findFirst({
                        where: {
                            coachId,
                            date: slotDate,
                            OR: [
                                {
                                    AND: [
                                        { startTime: { lte: startTime } },
                                        { endTime: { gt: startTime } },
                                    ],
                                },
                                {
                                    AND: [
                                        { startTime: { lt: endTime } },
                                        { endTime: { gte: endTime } },
                                    ],
                                },
                                {
                                    AND: [
                                        { startTime: { gte: startTime } },
                                        { endTime: { lte: endTime } },
                                    ],
                                },
                            ],
                        },
                    });
                    if (existingSlot) {
                        throw new common_1.BadRequestException(`Overlapping slot detected for ${weekday} at ${timeRange.start}-${timeRange.end}`);
                    }
                    slots.push({
                        coachId,
                        date: slotDate,
                        startTime,
                        endTime,
                        status: 'AVAILABLE',
                    });
                }
            }
        }
        const created = await this.prisma.coachSlot.createMany({
            data: slots,
        });
        return {
            message: 'Weekly availability saved successfully',
            slotsGenerated: created.count,
            weeksGenerated: dto.weeksToGenerate,
        };
    }
    async getWeeklySchedule(coachId, weeksCount = 1) {
        const now = new Date();
        const endDate = new Date(now);
        endDate.setDate(now.getDate() + (weeksCount * 7));
        const slots = await this.prisma.coachSlot.findMany({
            where: {
                coachId,
                date: {
                    gte: now,
                    lte: endDate,
                },
            },
            orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        });
        const weeklySchedule = {
            MONDAY: [],
            TUESDAY: [],
            WEDNESDAY: [],
            THURSDAY: [],
            FRIDAY: [],
            SATURDAY: [],
            SUNDAY: [],
        };
        slots.forEach((slot) => {
            const weekday = this.getWeekdayName(slot.date.getDay());
            const startTime = slot.startTime.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            const endTime = slot.endTime.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            weeklySchedule[weekday].push({
                id: slot.id,
                start: startTime,
                end: endTime,
                status: slot.status,
                date: slot.date.toISOString().split('T')[0],
            });
        });
        return weeklySchedule;
    }
    async deleteSlot(coachId, slotId) {
        const slot = await this.prisma.coachSlot.findFirst({
            where: {
                id: slotId,
                coachId,
            },
        });
        if (!slot) {
            throw new common_1.NotFoundException('Slot not found');
        }
        if (slot.status === 'BOOKED') {
            throw new common_1.ForbiddenException('Cannot delete a booked slot');
        }
        if (slot.startTime < new Date()) {
            throw new common_1.BadRequestException('Cannot delete past slots');
        }
        await this.prisma.coachSlot.delete({
            where: { id: slotId },
        });
        return {
            message: 'Slot deleted successfully',
            slotId,
        };
    }
    getDateForWeekday(weekday, weekOffset) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekdayMap = {
            SUNDAY: 0,
            MONDAY: 1,
            TUESDAY: 2,
            WEDNESDAY: 3,
            THURSDAY: 4,
            FRIDAY: 5,
            SATURDAY: 6,
        };
        const targetWeekday = weekdayMap[weekday.toUpperCase()];
        if (targetWeekday === undefined) {
            throw new common_1.BadRequestException(`Invalid weekday: ${weekday}`);
        }
        const currentWeekday = today.getDay();
        let daysToAdd = targetWeekday - currentWeekday;
        if (daysToAdd <= 0) {
            daysToAdd += 7;
        }
        daysToAdd += weekOffset * 7;
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysToAdd);
        return targetDate;
    }
    buildDateTime(date, time, _timezone) {
        const [hours, minutes] = time.split(':').map(Number);
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const dateTime = new Date(year, month, day, hours, minutes, 0, 0);
        return dateTime;
    }
    getWeekdayName(dayIndex) {
        const weekdays = [
            'SUNDAY',
            'MONDAY',
            'TUESDAY',
            'WEDNESDAY',
            'THURSDAY',
            'FRIDAY',
            'SATURDAY',
        ];
        return weekdays[dayIndex];
    }
    async getCoachProfile(coachId) {
        const profile = await this.prisma.coachProfile.findUnique({
            where: { userId: coachId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Coach profile not found');
        }
        return profile;
    }
    async updateCoachTimezone(coachId, timezone) {
        if (!timezone || typeof timezone !== 'string' || timezone.length < 3) {
            throw new common_1.BadRequestException('Invalid timezone format');
        }
        const updatedProfile = await this.prisma.coachProfile.update({
            where: { userId: coachId },
            data: { timezone },
        });
        return updatedProfile;
    }
};
exports.CoachService = CoachService;
exports.CoachService = CoachService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CoachService);
//# sourceMappingURL=coach.service.js.map