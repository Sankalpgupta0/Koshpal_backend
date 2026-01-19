import { CoachService } from './coach.service';
import { ConsultationService } from '../consultation/consultation.service';
import { CreateCoachSlotDto, SaveCoachSlotsDto } from './dto/create-coach-slot.dto';
import { CancelConsultationDto } from '../consultation/dto/cancel-consultation.dto';
import type { ValidatedUser } from '../../common/types/user.types';
export declare class CoachController {
    private readonly coachService;
    private readonly consultationService;
    constructor(coachService: CoachService, consultationService: ConsultationService);
    createSlots(user: ValidatedUser, dto: CreateCoachSlotDto): Promise<{
        message: string;
        count: number;
    }>;
    getSlots(user: ValidatedUser, date?: string): Promise<{
        date: Date;
        startTime: Date;
        endTime: Date;
        id: string;
        coachId: string;
        status: import("@prisma/client").$Enums.SlotStatus;
        createdAt: Date;
    }[]>;
    saveWeeklyAvailability(user: ValidatedUser, dto: SaveCoachSlotsDto): Promise<{
        message: string;
        slotsGenerated: number;
        weeksGenerated: number;
    }>;
    getWeeklySchedule(user: ValidatedUser, weeks?: string): Promise<{
        MONDAY: never[];
        TUESDAY: never[];
        WEDNESDAY: never[];
        THURSDAY: never[];
        FRIDAY: never[];
        SATURDAY: never[];
        SUNDAY: never[];
    }>;
    deleteSlot(user: ValidatedUser, slotId: string): Promise<{
        message: string;
        slotId: string;
    }>;
    getConsultations(user: ValidatedUser, filter?: string): Promise<{
        id: string;
        date: Date;
        startTime: Date;
        endTime: Date;
        status: import("@prisma/client").$Enums.SlotStatus;
        booking: {
            id: string;
            status: import("@prisma/client").$Enums.BookingStatus;
            meetingLink: string;
            bookedAt: Date;
            employee: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null | undefined;
                company: string;
            } | undefined;
        } | null;
    }[]>;
    getConsultationStats(user: ValidatedUser): Promise<{
        total: number;
        past: number;
        upcoming: number;
        thisMonth: number;
    }>;
    cancelConsultation(user: ValidatedUser, id: string, dto: CancelConsultationDto): Promise<{
        message: string;
        consultationId: string;
        status: import("@prisma/client").$Enums.BookingStatus;
    }>;
    completeConsultation(user: ValidatedUser, id: string): Promise<{
        message: string;
        consultationId: string;
        status: import("@prisma/client").$Enums.BookingStatus;
    }>;
    getProfile(user: ValidatedUser): Promise<{
        userId: string;
        fullName: string;
        phone: string | null;
        expertise: string[];
        bio: string | null;
        rating: import("@prisma/client/runtime/library").Decimal;
        successRate: number;
        clientsHelped: number;
        location: string | null;
        languages: string[];
        profilePhoto: string | null;
        profilePhotoId: string | null;
        timezone: string;
    }>;
    updateTimezone(user: ValidatedUser, timezone: string): Promise<{
        userId: string;
        fullName: string;
        phone: string | null;
        expertise: string[];
        bio: string | null;
        rating: import("@prisma/client/runtime/library").Decimal;
        successRate: number;
        clientsHelped: number;
        location: string | null;
        languages: string[];
        profilePhoto: string | null;
        profilePhotoId: string | null;
        timezone: string;
    }>;
    updateProfile(user: ValidatedUser, body: {
        fullName?: string;
        phone?: string;
    }, image?: Express.Multer.File): Promise<{
        message: string;
        profile: {
            userId: string;
            fullName: string;
            phone: string | null;
            expertise: string[];
            bio: string | null;
            rating: import("@prisma/client/runtime/library").Decimal;
            successRate: number;
            clientsHelped: number;
            location: string | null;
            languages: string[];
            profilePhoto: string | null;
            profilePhotoId: string | null;
            timezone: string;
        };
    }>;
}
