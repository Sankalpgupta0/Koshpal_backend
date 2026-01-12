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
var ConsultationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const meeting_service_1 = require("./meeting.service");
const client_1 = require("@prisma/client");
const timezone_util_1 = require("../../common/utils/timezone.util");
let ConsultationService = ConsultationService_1 = class ConsultationService {
    prisma;
    meetingService;
    emailQueue;
    logger = new common_1.Logger(ConsultationService_1.name);
    constructor(prisma, meetingService, emailQueue) {
        this.prisma = prisma;
        this.meetingService = meetingService;
        this.emailQueue = emailQueue;
    }
    async getCoaches() {
        const coaches = await this.prisma.user.findMany({
            where: {
                role: 'COACH',
                isActive: true,
            },
            select: {
                id: true,
                email: true,
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
        });
        return coaches.map((coach) => ({
            id: coach.id,
            email: coach.email,
            fullName: coach.coachProfile?.fullName,
            expertise: coach.coachProfile?.expertise || [],
            bio: coach.coachProfile?.bio,
            rating: coach.coachProfile?.rating
                ? parseFloat(coach.coachProfile.rating.toString())
                : 0,
            successRate: coach.coachProfile?.successRate || 0,
            clientsHelped: coach.coachProfile?.clientsHelped || 0,
            location: coach.coachProfile?.location,
            languages: coach.coachProfile?.languages || [],
            profilePhoto: coach.coachProfile?.profilePhoto,
        }));
    }
    async getCoachSlots(coachId, dateStr) {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        const slots = await this.prisma.coachSlot.findMany({
            where: {
                coachId,
                date,
                status: client_1.SlotStatus.AVAILABLE,
            },
            orderBy: { startTime: 'asc' },
        });
        return slots;
    }
    async bookConsultation(user, dto) {
        return this.prisma.$transaction(async (tx) => {
            const slotRaw = await tx.$queryRaw(client_1.Prisma.sql `
            SELECT * FROM "CoachSlot"
            WHERE id = ${dto.slotId}
            FOR UPDATE
          `);
            if (!slotRaw || slotRaw.length === 0) {
                throw new common_1.NotFoundException('Slot not found');
            }
            const lockedSlot = slotRaw[0];
            if (lockedSlot.status !== client_1.SlotStatus.AVAILABLE) {
                throw new common_1.BadRequestException('This slot has already been booked. Please select another time slot.');
            }
            const slotStartTime = new Date(lockedSlot.startTime);
            const now = new Date();
            if (slotStartTime < now) {
                throw new common_1.BadRequestException('Cannot book a slot in the past. Please select a future time slot.');
            }
            const slot = await tx.coachSlot.findUnique({
                where: { id: dto.slotId },
                include: {
                    coach: {
                        include: {
                            user: {
                                select: { email: true },
                            },
                        },
                    },
                },
            });
            if (!slot) {
                throw new common_1.NotFoundException('Slot not found');
            }
            const employee = await tx.user.findUnique({
                where: { id: user.userId },
                select: {
                    email: true,
                    employeeProfile: {
                        select: {
                            fullName: true,
                        },
                    },
                },
            });
            if (!employee) {
                throw new common_1.NotFoundException('Employee not found');
            }
            const { meetingLink, calendarEventId } = await this.meetingService.createGoogleMeet(slot.coach.user.email, employee.email, slot.startTime, slot.endTime);
            const booking = await tx.consultationBooking.create({
                data: {
                    slotId: dto.slotId,
                    coachId: slot.coachId,
                    employeeId: user.userId,
                    meetingLink,
                    calendarEventId,
                    status: client_1.BookingStatus.CONFIRMED,
                },
            });
            await tx.coachSlot.update({
                where: { id: dto.slotId },
                data: { status: client_1.SlotStatus.BOOKED },
            });
            const year = slot.date.getFullYear();
            const month = String(slot.date.getMonth() + 1).padStart(2, '0');
            const day = String(slot.date.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
            await this.emailQueue.add('send-booking-confirmation', {
                coachEmail: slot.coach.user.email,
                employeeEmail: employee.email,
                coachName: slot.coach.fullName,
                employeeName: employee.employeeProfile?.fullName || employee.email,
                date: dateString,
                startTime: slot.startTime.toISOString(),
                endTime: slot.endTime.toISOString(),
                meetingLink,
                notes: dto.notes,
            });
            this.logger.log(`✅ Consultation booked: Employee ${user.userId} with Coach ${slot.coachId} on ${slot.startTime.toISOString()}`);
            return {
                message: 'Consultation booked successfully',
                booking: {
                    id: booking.id,
                    meetingLink: booking.meetingLink,
                    calendarEventId: booking.calendarEventId,
                    date: slot.date,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                },
            };
        }, {
            isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 5000,
            timeout: 10000,
        });
    }
    async getEmployeeConsultations(employeeId, filter, startDate, endDate) {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        let slotWhere = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            slotWhere = {
                date: {
                    gte: start,
                    lte: end,
                },
            };
        }
        else {
            switch (filter) {
                case 'past':
                    slotWhere = { endTime: { lt: now } };
                    break;
                case 'upcoming':
                    slotWhere = { startTime: { gte: now } };
                    break;
                case 'thisWeek':
                    slotWhere = {
                        date: {
                            gte: startOfWeek,
                            lte: endOfWeek,
                        },
                    };
                    break;
                case 'thisMonth':
                    slotWhere = {
                        date: {
                            gte: startOfMonth,
                            lte: endOfMonth,
                        },
                    };
                    break;
            }
        }
        const bookings = await this.prisma.consultationBooking.findMany({
            where: {
                employeeId,
                slot: slotWhere,
            },
            include: {
                slot: {
                    include: {
                        coach: {
                            include: {
                                user: {
                                    select: {
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return bookings.map((booking) => ({
            id: booking.id,
            meetingLink: booking.meetingLink,
            status: booking.status,
            bookedAt: booking.createdAt,
            notes: booking.notes,
            slot: {
                id: booking.slot.id,
                date: booking.slot.date,
                startTime: booking.slot.startTime,
                endTime: booking.slot.endTime,
                slotDate: (0, timezone_util_1.getSlotDateInIST)(booking.slot.startTime),
                status: booking.slot.status,
            },
            coach: {
                id: booking.coachId,
                email: booking.slot.coach.user.email,
                fullName: booking.slot.coach.fullName,
                expertise: booking.slot.coach.expertise,
                rating: booking.slot.coach.rating
                    ? parseFloat(booking.slot.coach.rating.toString())
                    : 0,
                location: booking.slot.coach.location,
                profilePhoto: booking.slot.coach.profilePhoto,
            },
        }));
    }
    async getEmployeeConsultationStats(employeeId) {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const bookings = await this.prisma.consultationBooking.findMany({
            where: {
                employeeId,
            },
            include: {
                slot: true,
            },
        });
        const total = bookings.length;
        const past = bookings.filter((b) => b.slot.endTime < now).length;
        const upcoming = bookings.filter((b) => b.slot.startTime >= now).length;
        const thisWeek = bookings.filter((b) => b.slot.date >= startOfWeek && b.slot.date <= endOfWeek).length;
        const thisMonth = bookings.filter((b) => b.slot.date >= startOfMonth && b.slot.date <= endOfMonth).length;
        const minutesBooked = bookings.reduce((acc, b) => {
            const duration = (b.slot.endTime.getTime() - b.slot.startTime.getTime()) / (1000 * 60);
            return acc + duration;
        }, 0);
        const confirmedCount = bookings.filter((b) => b.status === client_1.BookingStatus.CONFIRMED).length;
        const cancelledCount = bookings.filter((b) => b.status === client_1.BookingStatus.CANCELLED).length;
        return {
            total,
            past,
            upcoming,
            thisWeek,
            thisMonth,
            minutesBooked,
            confirmed: confirmedCount,
            cancelled: cancelledCount,
        };
    }
    async getLatestConsultation(employeeId) {
        const now = new Date();
        const upcomingBooking = await this.prisma.consultationBooking.findFirst({
            where: {
                employeeId,
                slot: {
                    startTime: {
                        gte: now,
                    },
                },
            },
            include: {
                slot: {
                    include: {
                        coach: {
                            include: {
                                user: {
                                    select: {
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                slot: {
                    startTime: 'asc',
                },
            },
        });
        if (!upcomingBooking) {
            const pastBooking = await this.prisma.consultationBooking.findFirst({
                where: {
                    employeeId,
                },
                include: {
                    slot: {
                        include: {
                            coach: {
                                include: {
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    slot: {
                        startTime: 'desc',
                    },
                },
            });
            if (!pastBooking) {
                return null;
            }
            return {
                id: pastBooking.id,
                meetingLink: pastBooking.meetingLink,
                status: pastBooking.status,
                bookedAt: pastBooking.createdAt,
                slot: {
                    id: pastBooking.slot.id,
                    date: pastBooking.slot.date,
                    startTime: pastBooking.slot.startTime,
                    endTime: pastBooking.slot.endTime,
                    status: pastBooking.slot.status,
                },
                coach: {
                    id: pastBooking.slot.coach.userId,
                    name: pastBooking.slot.coach.fullName,
                    email: pastBooking.slot.coach.user.email,
                    expertise: pastBooking.slot.coach.expertise,
                },
            };
        }
        return {
            id: upcomingBooking.id,
            meetingLink: upcomingBooking.meetingLink,
            status: upcomingBooking.status,
            bookedAt: upcomingBooking.createdAt,
            notes: upcomingBooking.notes,
            slot: {
                id: upcomingBooking.slot.id,
                date: upcomingBooking.slot.date,
                startTime: upcomingBooking.slot.startTime,
                endTime: upcomingBooking.slot.endTime,
                status: upcomingBooking.slot.status,
            },
            coach: {
                id: upcomingBooking.coachId,
                email: upcomingBooking.slot.coach.user.email,
                fullName: upcomingBooking.slot.coach.fullName,
                expertise: upcomingBooking.slot.coach.expertise,
                rating: upcomingBooking.slot.coach.rating
                    ? parseFloat(upcomingBooking.slot.coach.rating.toString())
                    : 0,
                location: upcomingBooking.slot.coach.location,
                profilePhoto: upcomingBooking.slot.coach.profilePhoto,
            },
        };
    }
    async getConsultationDetails(employeeUserId, consultationId) {
        const employee = await this.prisma.employeeProfile.findUnique({
            where: { userId: employeeUserId },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee profile not found');
        }
        const booking = await this.prisma.consultationBooking.findFirst({
            where: {
                id: consultationId,
                employeeId: employee.userId,
            },
            include: {
                slot: {
                    include: {
                        coach: {
                            include: {
                                user: {
                                    select: {
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Consultation not found or does not belong to you');
        }
        return {
            id: booking.id,
            meetingLink: booking.meetingLink,
            notes: booking.notes,
            status: booking.status,
            bookedAt: booking.createdAt,
            slot: {
                id: booking.slot.id,
                date: booking.slot.date,
                startTime: booking.slot.startTime,
                endTime: booking.slot.endTime,
                slotDate: (0, timezone_util_1.getSlotDateInIST)(booking.slot.startTime),
                status: booking.slot.status,
            },
            coach: {
                id: booking.slot.coach.userId,
                email: booking.slot.coach.user.email,
                fullName: booking.slot.coach.fullName,
                expertise: booking.slot.coach.expertise,
                bio: booking.slot.coach.bio,
                rating: booking.slot.coach.rating
                    ? parseFloat(booking.slot.coach.rating.toString())
                    : 0,
                successRate: booking.slot.coach.successRate || 0,
                clientsHelped: booking.slot.coach.clientsHelped || 0,
                location: booking.slot.coach.location,
                languages: booking.slot.coach.languages || [],
                profilePhoto: booking.slot.coach.profilePhoto,
            },
        };
    }
    async cancelConsultationByEmployee(employeeId, consultationId, reason) {
        return this.prisma.$transaction(async (tx) => {
            const booking = await tx.consultationBooking.findFirst({
                where: {
                    id: consultationId,
                    employeeId,
                },
                include: {
                    slot: {
                        include: {
                            coach: {
                                include: {
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            if (!booking) {
                throw new common_1.NotFoundException('Consultation not found or does not belong to you');
            }
            if (booking.status === client_1.BookingStatus.CANCELLED) {
                throw new common_1.BadRequestException('Consultation is already cancelled');
            }
            const now = new Date();
            if (booking.slot.startTime <= now) {
                throw new common_1.BadRequestException('Cannot cancel past or ongoing consultations');
            }
            const updatedBooking = await tx.consultationBooking.update({
                where: { id: consultationId },
                data: {
                    status: client_1.BookingStatus.CANCELLED,
                    cancellationReason: reason,
                    cancelledBy: 'EMPLOYEE',
                    cancelledAt: new Date(),
                },
            });
            await tx.coachSlot.update({
                where: { id: booking.slotId },
                data: {
                    status: client_1.SlotStatus.AVAILABLE,
                },
            });
            const employee = await tx.user.findUnique({
                where: { id: employeeId },
                select: { email: true },
            });
            await this.emailQueue.add('send-cancellation-email', {
                employeeEmail: employee?.email,
                coachEmail: booking.slot.coach.user.email,
                date: booking.slot.date.toISOString().split('T')[0],
                startTime: booking.slot.startTime,
                cancelledBy: 'EMPLOYEE',
                reason,
            });
            this.logger.log(`Consultation ${consultationId} cancelled by employee ${employeeId}`);
            return {
                message: 'Consultation cancelled successfully',
                consultationId: updatedBooking.id,
                status: updatedBooking.status,
            };
        });
    }
    async cancelConsultationByCoach(coachId, consultationId, reason) {
        return this.prisma.$transaction(async (tx) => {
            const booking = await tx.consultationBooking.findFirst({
                where: {
                    id: consultationId,
                    coachId,
                },
                include: {
                    slot: {
                        include: {
                            coach: {
                                include: {
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            if (!booking) {
                throw new common_1.NotFoundException('Consultation not found or does not belong to you');
            }
            if (booking.status === client_1.BookingStatus.CANCELLED) {
                throw new common_1.BadRequestException('Consultation is already cancelled');
            }
            const now = new Date();
            if (booking.slot.startTime <= now) {
                throw new common_1.BadRequestException('Cannot cancel past or ongoing consultations');
            }
            const updatedBooking = await tx.consultationBooking.update({
                where: { id: consultationId },
                data: {
                    status: client_1.BookingStatus.CANCELLED,
                    cancellationReason: reason,
                    cancelledBy: 'COACH',
                    cancelledAt: new Date(),
                },
            });
            await tx.coachSlot.update({
                where: { id: booking.slotId },
                data: {
                    status: client_1.SlotStatus.AVAILABLE,
                },
            });
            const employee = await tx.user.findUnique({
                where: { id: booking.employeeId },
                select: { email: true },
            });
            await this.emailQueue.add('send-cancellation-email', {
                employeeEmail: employee?.email,
                coachEmail: booking.slot.coach.user.email,
                date: booking.slot.date.toISOString().split('T')[0],
                startTime: booking.slot.startTime,
                cancelledBy: 'COACH',
                reason,
            });
            this.logger.log(`Consultation ${consultationId} cancelled by coach ${coachId}`);
            return {
                message: 'Consultation cancelled successfully',
                consultationId: updatedBooking.id,
                status: updatedBooking.status,
            };
        });
    }
    async completeConsultationByCoach(coachId, consultationId) {
        return this.prisma.$transaction(async (tx) => {
            const booking = await tx.consultationBooking.findFirst({
                where: {
                    id: consultationId,
                    coachId,
                },
                include: {
                    slot: true,
                },
            });
            if (!booking) {
                throw new common_1.NotFoundException('Consultation not found or does not belong to you');
            }
            if (booking.status === client_1.BookingStatus.CANCELLED) {
                throw new common_1.BadRequestException('Cannot complete a cancelled consultation');
            }
            if (booking.status === client_1.BookingStatus.COMPLETED) {
                throw new common_1.BadRequestException('Consultation is already marked as completed');
            }
            const now = new Date();
            if (booking.slot.endTime > now) {
                throw new common_1.BadRequestException("Cannot complete consultation that hasn't ended yet");
            }
            const updatedBooking = await tx.consultationBooking.update({
                where: { id: consultationId },
                data: {
                    status: client_1.BookingStatus.COMPLETED,
                },
            });
            this.logger.log(`Consultation ${consultationId} marked as completed by coach ${coachId}`);
            return {
                message: 'Consultation marked as completed successfully',
                consultationId: updatedBooking.id,
                status: updatedBooking.status,
            };
        });
    }
};
exports.ConsultationService = ConsultationService;
exports.ConsultationService = ConsultationService = ConsultationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)('consultation-email')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        meeting_service_1.MeetingService,
        bullmq_2.Queue])
], ConsultationService);
//# sourceMappingURL=consultation.service.js.map