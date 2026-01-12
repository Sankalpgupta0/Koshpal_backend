import { ConsultationService } from './consultation.service';
import { BookConsultationDto } from './dto/book-consultation.dto';
import { CancelConsultationDto } from './dto/cancel-consultation.dto';
import type { ValidatedUser } from '../../common/types/user.types';
export declare class ConsultationController {
    private readonly consultationService;
    constructor(consultationService: ConsultationService);
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
    getCoachSlots(coachId: string, date: string): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.SlotStatus;
        date: Date;
        startTime: Date;
        endTime: Date;
        coachId: string;
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
    getMyConsultations(user: ValidatedUser, filter?: string, startDate?: string, endDate?: string): Promise<{
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
    getMyConsultationStats(user: ValidatedUser): Promise<{
        total: number;
        past: number;
        upcoming: number;
        thisWeek: number;
        thisMonth: number;
        minutesBooked: number;
        confirmed: number;
        cancelled: number;
    }>;
    getMyLatestConsultation(user: ValidatedUser): Promise<{
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
    getConsultationDetails(user: ValidatedUser, id: string): Promise<{
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
    cancelConsultation(user: ValidatedUser, id: string, dto: CancelConsultationDto): Promise<{
        message: string;
        consultationId: string;
        status: import("@prisma/client").$Enums.BookingStatus;
    }>;
}
