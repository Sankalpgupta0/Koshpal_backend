import { PrismaService } from '../../../prisma/prisma.service';
import { Queue } from 'bullmq';
import { MeetingService } from './meeting.service';
import { BookConsultationDto } from './dto/book-consultation.dto';
import { ValidatedUser } from '../../common/types/user.types';
export declare class ConsultationService {
    private readonly prisma;
    private readonly meetingService;
    private readonly emailQueue;
    private readonly logger;
    constructor(prisma: PrismaService, meetingService: MeetingService, emailQueue: Queue);
    getCoaches(): Promise<{
        id: string;
        email: string;
        fullName: string | undefined;
        expertise: string[];
        bio: string | null | undefined;
        rating: number;
        successRate: number;
        clientsHelped: number;
        location: string | null | undefined;
        languages: string[];
        profilePhoto: string | null | undefined;
    }[]>;
    getCoachSlots(coachId: string, dateStr: string): Promise<{
        date: Date;
        startTime: Date;
        endTime: Date;
        id: string;
        coachId: string;
        status: import("@prisma/client").$Enums.SlotStatus;
        createdAt: Date;
    }[]>;
    bookConsultation(user: ValidatedUser, dto: BookConsultationDto): Promise<{
        message: string;
        booking: {
            id: string;
            meetingLink: string;
            calendarEventId: string | null;
            date: Date;
            startTime: Date;
            endTime: Date;
        };
    }>;
    getEmployeeConsultations(employeeId: string, filter?: string, startDate?: string, endDate?: string): Promise<{
        id: string;
        meetingLink: string;
        status: import("@prisma/client").$Enums.BookingStatus;
        bookedAt: Date;
        notes: string | null;
        slot: {
            id: string;
            date: Date;
            startTime: Date;
            endTime: Date;
            slotDate: string;
            status: import("@prisma/client").$Enums.SlotStatus;
        };
        coach: {
            id: string;
            email: string;
            fullName: string;
            expertise: string[];
            rating: number;
            location: string | null;
            profilePhoto: string | null;
        };
    }[]>;
    getEmployeeConsultationStats(employeeId: string): Promise<{
        total: number;
        past: number;
        upcoming: number;
        thisWeek: number;
        thisMonth: number;
        minutesBooked: number;
        confirmed: number;
        cancelled: number;
    }>;
    getLatestConsultation(employeeId: string): Promise<{
        id: string;
        meetingLink: string;
        status: import("@prisma/client").$Enums.BookingStatus;
        bookedAt: Date;
        slot: {
            id: string;
            date: Date;
            startTime: Date;
            endTime: Date;
            status: import("@prisma/client").$Enums.SlotStatus;
        };
        coach: {
            id: string;
            name: string;
            email: string;
            expertise: string[];
            fullName?: undefined;
            rating?: undefined;
            location?: undefined;
            profilePhoto?: undefined;
        };
        notes?: undefined;
    } | {
        id: string;
        meetingLink: string;
        status: import("@prisma/client").$Enums.BookingStatus;
        bookedAt: Date;
        notes: string | null;
        slot: {
            id: string;
            date: Date;
            startTime: Date;
            endTime: Date;
            status: import("@prisma/client").$Enums.SlotStatus;
        };
        coach: {
            id: string;
            email: string;
            fullName: string;
            expertise: string[];
            rating: number;
            location: string | null;
            profilePhoto: string | null;
            name?: undefined;
        };
    } | null>;
    getConsultationDetails(employeeUserId: string, consultationId: string): Promise<{
        id: string;
        meetingLink: string;
        notes: string | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        bookedAt: Date;
        slot: {
            id: string;
            date: Date;
            startTime: Date;
            endTime: Date;
            slotDate: string;
            status: import("@prisma/client").$Enums.SlotStatus;
        };
        coach: {
            id: string;
            email: string;
            fullName: string;
            expertise: string[];
            bio: string | null;
            rating: number;
            successRate: number;
            clientsHelped: number;
            location: string | null;
            languages: string[];
            profilePhoto: string | null;
        };
    }>;
    cancelConsultationByEmployee(employeeId: string, consultationId: string, reason?: string): Promise<{
        message: string;
        consultationId: string;
        status: import("@prisma/client").$Enums.BookingStatus;
    }>;
    cancelConsultationByCoach(coachId: string, consultationId: string, reason?: string): Promise<{
        message: string;
        consultationId: string;
        status: import("@prisma/client").$Enums.BookingStatus;
    }>;
    completeConsultationByCoach(coachId: string, consultationId: string): Promise<{
        message: string;
        consultationId: string;
        status: import("@prisma/client").$Enums.BookingStatus;
    }>;
}
